package com.gameverse.service;

import com.gameverse.entity.GameSession;
import com.gameverse.entity.GameParticipant;
import com.gameverse.entity.User;
import com.gameverse.entity.Profile;
import com.gameverse.repository.GameSessionRepository;
import com.gameverse.repository.GameParticipantRepository;
import com.gameverse.repository.UserRepository;
import com.gameverse.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.stream.Collectors;

@Service
public class MatchmakingService {

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private GameParticipantRepository gameParticipantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // In-memory queue management (in production, use Redis)
    private final Map<String, Queue<MatchmakingRequest>> gameQueues = new ConcurrentHashMap<>();
    private final Map<Long, MatchmakingRequest> userRequests = new ConcurrentHashMap<>();

    public static class MatchmakingRequest {
        private Long userId;
        private String gameType;
        private String skillLevel;
        private LocalDateTime joinTime;
        private int expandedSearchCount;

        public MatchmakingRequest(Long userId, String gameType, String skillLevel) {
            this.userId = userId;
            this.gameType = gameType;
            this.skillLevel = skillLevel;
            this.joinTime = LocalDateTime.now();
            this.expandedSearchCount = 0;
        }

        // Getters and setters
        public Long getUserId() { return userId; }
        public String getGameType() { return gameType; }
        public String getSkillLevel() { return skillLevel; }
        public LocalDateTime getJoinTime() { return joinTime; }
        public int getExpandedSearchCount() { return expandedSearchCount; }
        public void incrementExpandedSearch() { this.expandedSearchCount++; }
    }

    public static class QueueStatus {
        private boolean isInQueue;
        private String gameType;
        private String skillLevel;
        private int queuePosition;
        private int estimatedWaitTime;
        private List<String> alternativeGames;

        public QueueStatus(boolean isInQueue, String gameType, String skillLevel, 
                          int queuePosition, int estimatedWaitTime, List<String> alternativeGames) {
            this.isInQueue = isInQueue;
            this.gameType = gameType;
            this.skillLevel = skillLevel;
            this.queuePosition = queuePosition;
            this.estimatedWaitTime = estimatedWaitTime;
            this.alternativeGames = alternativeGames;
        }

        // Getters
        public boolean isInQueue() { return isInQueue; }
        public String getGameType() { return gameType; }
        public String getSkillLevel() { return skillLevel; }
        public int getQueuePosition() { return queuePosition; }
        public int getEstimatedWaitTime() { return estimatedWaitTime; }
        public List<String> getAlternativeGames() { return alternativeGames; }
    }

    public static class MatchResult {
        private String sessionId;
        private String gameType;
        private List<MatchedPlayer> players;

        public MatchResult(String sessionId, String gameType, List<MatchedPlayer> players) {
            this.sessionId = sessionId;
            this.gameType = gameType;
            this.players = players;
        }

        // Getters
        public String getSessionId() { return sessionId; }
        public String getGameType() { return gameType; }
        public List<MatchedPlayer> getPlayers() { return players; }
    }

    public static class MatchedPlayer {
        private String id;
        private String displayName;
        private String skillLevel;

        public MatchedPlayer(String id, String displayName, String skillLevel) {
            this.id = id;
            this.displayName = displayName;
            this.skillLevel = skillLevel;
        }

        // Getters
        public String getId() { return id; }
        public String getDisplayName() { return displayName; }
        public String getSkillLevel() { return skillLevel; }
    }

    @Transactional
    public QueueStatus joinQueue(Long userId, String gameType, String skillLevel) {
        // Remove user from any existing queue
        leaveQueue(userId);

        // Create new matchmaking request
        MatchmakingRequest request = new MatchmakingRequest(userId, gameType, skillLevel);
        
        // Add to game-specific queue
        gameQueues.computeIfAbsent(gameType, k -> new ConcurrentLinkedQueue<>()).offer(request);
        userRequests.put(userId, request);

        // Try to find immediate match
        tryMatchmaking(gameType);

        // Return queue status
        return getQueueStatus(userId);
    }

    public QueueStatus leaveQueue(Long userId) {
        MatchmakingRequest request = userRequests.remove(userId);
        if (request != null) {
            Queue<MatchmakingRequest> queue = gameQueues.get(request.getGameType());
            if (queue != null) {
                queue.remove(request);
            }
        }
        return new QueueStatus(false, null, null, 0, 0, Collections.emptyList());
    }

    public QueueStatus getQueueStatus(Long userId) {
        MatchmakingRequest request = userRequests.get(userId);
        if (request == null) {
            return new QueueStatus(false, null, null, 0, 0, getAlternativeGames());
        }

        Queue<MatchmakingRequest> queue = gameQueues.get(request.getGameType());
        int position = queue != null ? getQueuePosition(queue, userId) : 0;
        int estimatedWait = calculateEstimatedWaitTime(request.getGameType(), position);
        
        return new QueueStatus(true, request.getGameType(), request.getSkillLevel(), 
                              position, estimatedWait, getAlternativeGames());
    }

    private void tryMatchmaking(String gameType) {
        Queue<MatchmakingRequest> queue = gameQueues.get(gameType);
        if (queue == null || queue.size() < getMinPlayersForGame(gameType)) {
            return;
        }

        List<MatchmakingRequest> potentialMatch = new ArrayList<>();
        int maxPlayers = getMaxPlayersForGame(gameType);
        
        // Try to match players with similar skill levels first
        for (MatchmakingRequest request : queue) {
            if (potentialMatch.isEmpty() || 
                canMatchPlayers(potentialMatch.get(0), request)) {
                potentialMatch.add(request);
                if (potentialMatch.size() >= maxPlayers) {
                    break;
                }
            }
        }

        // If we have enough players for a match
        if (potentialMatch.size() >= getMinPlayersForGame(gameType)) {
            createMatch(potentialMatch);
        }
    }

    @Transactional
    private void createMatch(List<MatchmakingRequest> matchedRequests) {
        if (matchedRequests.isEmpty()) return;

        String gameType = matchedRequests.get(0).getGameType();
        
        // Create game session
        GameSession session = new GameSession();
        session.setGameType(GameSession.GameType.valueOf(gameType));
        session.setStatus(GameSession.Status.WAITING);
        session.setMaxPlayers(getMaxPlayersForGame(gameType));
        session.setCurrentPlayers(matchedRequests.size());
        session.setSessionCode(generateSessionCode());
        session.setEntryFee(BigDecimal.ZERO); // Free matchmaking games
        session.setPrizePool(BigDecimal.ZERO);
        session.setCreatedAt(LocalDateTime.now());
        
        session = gameSessionRepository.save(session);

        // Create participants
        List<MatchedPlayer> players = new ArrayList<>();
        for (int i = 0; i < matchedRequests.size(); i++) {
            MatchmakingRequest request = matchedRequests.get(i);
            User user = userRepository.findById(request.getUserId()).orElse(null);
            Profile profile = user != null ? profileRepository.findByUserId(user.getId()).orElse(null) : null;
            
            if (user != null && profile != null) {
                // Create game participant
                GameParticipant participant = new GameParticipant();
                participant.setSessionId(session.getId());
                participant.setUserId(user.getId());
                participant.setPlayerPosition(i + 1);
                participant.setJoinedAt(LocalDateTime.now());
                gameParticipantRepository.save(participant);

                // Add to matched players list
                players.add(new MatchedPlayer(
                    user.getId().toString(),
                    profile.getDisplayName(),
                    request.getSkillLevel()
                ));

                // Remove from queue
                userRequests.remove(request.getUserId());
            }
        }

        // Remove matched requests from queue
        Queue<MatchmakingRequest> queue = gameQueues.get(gameType);
        if (queue != null) {
            matchedRequests.forEach(queue::remove);
        }

        // Notify all matched players
        MatchResult matchResult = new MatchResult(session.getId().toString(), gameType, players);
        for (MatchedPlayer player : players) {
            messagingTemplate.convertAndSendToUser(
                player.getId(),
                "/queue/matchmaking/match-found",
                matchResult
            );
        }

        // Update session status to in progress
        session.setStatus(GameSession.Status.IN_PROGRESS);
        session.setStartedAt(LocalDateTime.now());
        gameSessionRepository.save(session);
    }

    private boolean canMatchPlayers(MatchmakingRequest player1, MatchmakingRequest player2) {
        // Basic skill level matching
        if (player1.getSkillLevel().equals(player2.getSkillLevel())) {
            return true;
        }
        
        // Allow cross-skill matching after some time in queue
        long waitTime1 = java.time.Duration.between(player1.getJoinTime(), LocalDateTime.now()).getSeconds();
        long waitTime2 = java.time.Duration.between(player2.getJoinTime(), LocalDateTime.now()).getSeconds();
        
        return waitTime1 > 30 || waitTime2 > 30; // After 30 seconds, expand criteria
    }

    private int getMinPlayersForGame(String gameType) {
        return switch (gameType) {
            case "CHESS", "FIGHTING" -> 2;
            case "UNO", "LUDO" -> 2;
            case "RUMMY" -> 2;
            case "CAR_RACING" -> 2;
            case "BUBBLE_BLAST", "MATH_MASTER" -> 1;
            default -> 2;
        };
    }

    private int getMaxPlayersForGame(String gameType) {
        return switch (gameType) {
            case "CHESS", "FIGHTING" -> 2;
            case "UNO", "LUDO" -> 4;
            case "RUMMY" -> 6;
            case "CAR_RACING" -> 8;
            case "BUBBLE_BLAST" -> 4;
            case "MATH_MASTER" -> 8;
            default -> 4;
        };
    }

    private int getQueuePosition(Queue<MatchmakingRequest> queue, Long userId) {
        int position = 1;
        for (MatchmakingRequest request : queue) {
            if (request.getUserId().equals(userId)) {
                return position;
            }
            position++;
        }
        return 0;
    }

    private int calculateEstimatedWaitTime(String gameType, int position) {
        // Simple estimation: 15 seconds per position ahead
        int baseWait = position * 15;
        
        // Adjust based on game popularity (mock data)
        return switch (gameType) {
            case "CHESS", "UNO" -> Math.max(10, baseWait - 10); // Popular games
            case "CAR_RACING", "FIGHTING" -> baseWait;
            case "RUMMY", "LUDO" -> baseWait + 15; // Less popular
            default -> baseWait + 30;
        };
    }

    private List<String> getAlternativeGames() {
        // Return games with shorter queue times
        return Arrays.asList("CHESS", "UNO", "CAR_RACING", "BUBBLE_BLAST");
    }

    private String generateSessionCode() {
        return "MATCH" + System.currentTimeMillis() % 100000;
    }

    // Scheduled method to handle queue timeouts and expanded searches
    public void processQueueTimeouts() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(1); // 1 minute timeout
        
        for (Map.Entry<String, Queue<MatchmakingRequest>> entry : gameQueues.entrySet()) {
            String gameType = entry.getKey();
            Queue<MatchmakingRequest> queue = entry.getValue();
            
            // Find timed-out requests
            List<MatchmakingRequest> timedOut = queue.stream()
                .filter(req -> req.getJoinTime().isBefore(cutoff))
                .collect(Collectors.toList());
            
            // Notify users of timeout and suggest alternatives
            for (MatchmakingRequest request : timedOut) {
                messagingTemplate.convertAndSendToUser(
                    request.getUserId().toString(),
                    "/queue/matchmaking/timeout",
                    Map.of(
                        "message", "Queue timeout - try alternative games",
                        "alternatives", getAlternativeGames()
                    )
                );
                
                // Remove from queue
                queue.remove(request);
                userRequests.remove(request.getUserId());
            }
        }
    }
}