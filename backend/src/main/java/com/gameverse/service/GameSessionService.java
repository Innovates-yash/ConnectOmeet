package com.gameverse.service;

import com.gameverse.entity.GameSession;
import com.gameverse.entity.GameParticipant;
import com.gameverse.entity.User;
import com.gameverse.entity.Profile;
import com.gameverse.repository.GameSessionRepository;
import com.gameverse.repository.GameParticipantRepository;
import com.gameverse.repository.UserRepository;
import com.gameverse.repository.ProfileRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class GameSessionService {

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

    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Track active connections for disconnection handling
    private final Map<Long, Set<String>> userConnections = new ConcurrentHashMap<>();
    private final Map<Long, LocalDateTime> lastActivity = new ConcurrentHashMap<>();

    public static class GameStateUpdate {
        private String type;
        private Long playerId;
        private Object data;
        private LocalDateTime timestamp;

        public GameStateUpdate(String type, Long playerId, Object data) {
            this.type = type;
            this.playerId = playerId;
            this.data = data;
            this.timestamp = LocalDateTime.now();
        }

        // Getters
        public String getType() { return type; }
        public Long getPlayerId() { return playerId; }
        public Object getData() { return data; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }

    public static class SessionInfo {
        private Long sessionId;
        private String gameType;
        private String status;
        private List<PlayerInfo> players;
        private Object gameState;
        private LocalDateTime createdAt;
        private LocalDateTime startedAt;

        public SessionInfo(Long sessionId, String gameType, String status, 
                          List<PlayerInfo> players, Object gameState,
                          LocalDateTime createdAt, LocalDateTime startedAt) {
            this.sessionId = sessionId;
            this.gameType = gameType;
            this.status = status;
            this.players = players;
            this.gameState = gameState;
            this.createdAt = createdAt;
            this.startedAt = startedAt;
        }

        // Getters
        public Long getSessionId() { return sessionId; }
        public String getGameType() { return gameType; }
        public String getStatus() { return status; }
        public List<PlayerInfo> getPlayers() { return players; }
        public Object getGameState() { return gameState; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public LocalDateTime getStartedAt() { return startedAt; }
    }

    public static class PlayerInfo {
        private Long userId;
        private String displayName;
        private Integer position;
        private Integer score;
        private boolean connected;

        public PlayerInfo(Long userId, String displayName, Integer position, Integer score, boolean connected) {
            this.userId = userId;
            this.displayName = displayName;
            this.position = position;
            this.score = score;
            this.connected = connected;
        }

        // Getters
        public Long getUserId() { return userId; }
        public String getDisplayName() { return displayName; }
        public Integer getPosition() { return position; }
        public Integer getScore() { return score; }
        public boolean isConnected() { return connected; }
    }

    @Transactional
    public SessionInfo getSessionInfo(Long sessionId, Long userId) {
        GameSession session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));

        // Verify user is participant
        List<GameParticipant> participants = gameParticipantRepository.findBySessionId(sessionId);
        boolean isParticipant = participants.stream()
            .anyMatch(p -> p.getUserId().equals(userId));
        
        if (!isParticipant) {
            throw new RuntimeException("User not authorized for this session");
        }

        // Build player info list
        List<PlayerInfo> players = participants.stream()
            .map(p -> {
                User user = userRepository.findById(p.getUserId()).orElse(null);
                Profile profile = user != null ? profileRepository.findByUserId(user.getId()).orElse(null) : null;
                boolean connected = isUserConnected(p.getUserId());
                
                return new PlayerInfo(
                    p.getUserId(),
                    profile != null ? profile.getDisplayName() : "Unknown",
                    p.getPlayerPosition(),
                    p.getFinalScore(),
                    connected
                );
            })
            .sorted(Comparator.comparing(PlayerInfo::getPosition))
            .collect(Collectors.toList());

        // Parse game state
        Object gameState = null;
        if (session.getGameState() != null) {
            try {
                gameState = objectMapper.readTree(session.getGameState());
            } catch (Exception e) {
                gameState = new HashMap<>();
            }
        }

        return new SessionInfo(
            session.getId(),
            session.getGameType().name(),
            session.getStatus().name(),
            players,
            gameState,
            session.getCreatedAt(),
            session.getStartedAt()
        );
    }

    @Transactional
    public void updateGameState(Long sessionId, Long playerId, GameStateUpdate update) {
        GameSession session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));

        // Verify player is participant
        List<GameParticipant> participants = gameParticipantRepository.findBySessionId(sessionId);
        boolean isParticipant = participants.stream()
            .anyMatch(p -> p.getUserId().equals(playerId));
        
        if (!isParticipant) {
            throw new RuntimeException("Player not authorized for this session");
        }

        // Validate move based on game type and current state
        if (!validateMove(session, playerId, update)) {
            throw new RuntimeException("Invalid move");
        }

        // Update game state
        String currentState = session.getGameState();
        Map<String, Object> gameState = parseGameState(currentState);
        
        // Apply the update
        applyGameStateUpdate(gameState, update);
        
        // Check for game end conditions
        checkGameEndConditions(session, gameState, participants);

        // Save updated state
        try {
            session.setGameState(objectMapper.writeValueAsString(gameState));
            gameSessionRepository.save(session);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save game state", e);
        }

        // Update last activity
        lastActivity.put(playerId, LocalDateTime.now());

        // Broadcast update to all participants
        broadcastGameUpdate(sessionId, update, participants);
    }

    public void handlePlayerConnection(Long sessionId, Long userId, String connectionId) {
        // Track connection
        userConnections.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(connectionId);
        lastActivity.put(userId, LocalDateTime.now());

        // Notify other players of connection
        List<GameParticipant> participants = gameParticipantRepository.findBySessionId(sessionId);
        GameStateUpdate connectionUpdate = new GameStateUpdate("PLAYER_CONNECTED", userId, 
            Map.of("userId", userId, "connected", true));
        
        broadcastGameUpdate(sessionId, connectionUpdate, participants);
    }

    public void handlePlayerDisconnection(Long sessionId, Long userId, String connectionId) {
        // Remove connection
        Set<String> connections = userConnections.get(userId);
        if (connections != null) {
            connections.remove(connectionId);
            if (connections.isEmpty()) {
                userConnections.remove(userId);
                
                // Start disconnection timer
                scheduleReconnectionWindow(sessionId, userId);
            }
        }

        // Notify other players of disconnection
        List<GameParticipant> participants = gameParticipantRepository.findBySessionId(sessionId);
        GameStateUpdate disconnectionUpdate = new GameStateUpdate("PLAYER_DISCONNECTED", userId,
            Map.of("userId", userId, "connected", false, "reconnectionWindow", 60)); // 60 seconds
        
        broadcastGameUpdate(sessionId, disconnectionUpdate, participants);
    }

    private boolean validateMove(GameSession session, Long playerId, GameStateUpdate update) {
        // Basic validation - can be extended per game type
        if (session.getStatus() != GameSession.Status.IN_PROGRESS) {
            return false;
        }

        // Game-specific validation would go here
        return switch (session.getGameType()) {
            case CHESS -> validateChessMove(session, playerId, update);
            case UNO -> validateUnoMove(session, playerId, update);
            case CAR_RACING -> validateRacingMove(session, playerId, update);
            default -> true; // Allow all moves for other games for now
        };
    }

    private boolean validateChessMove(GameSession session, Long playerId, GameStateUpdate update) {
        // Chess-specific move validation
        Map<String, Object> gameState = parseGameState(session.getGameState());
        
        // Check if it's player's turn
        Long currentPlayer = (Long) gameState.get("currentPlayer");
        if (!playerId.equals(currentPlayer)) {
            return false;
        }

        // Additional chess rule validation would go here
        return true;
    }

    private boolean validateUnoMove(GameSession session, Long playerId, GameStateUpdate update) {
        // Uno-specific move validation
        Map<String, Object> gameState = parseGameState(session.getGameState());
        
        // Check if it's player's turn
        Long currentPlayer = (Long) gameState.get("currentPlayer");
        return playerId.equals(currentPlayer);
    }

    private boolean validateRacingMove(GameSession session, Long playerId, GameStateUpdate update) {
        // Racing moves are generally always valid (position updates)
        return "POSITION_UPDATE".equals(update.getType()) || "LAP_COMPLETE".equals(update.getType());
    }

    private Map<String, Object> parseGameState(String gameStateJson) {
        if (gameStateJson == null || gameStateJson.trim().isEmpty()) {
            return new HashMap<>();
        }
        
        try {
            JsonNode node = objectMapper.readTree(gameStateJson);
            return objectMapper.convertValue(node, Map.class);
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private void applyGameStateUpdate(Map<String, Object> gameState, GameStateUpdate update) {
        // Apply update based on type
        switch (update.getType()) {
            case "MOVE" -> {
                // Generic move update
                gameState.put("lastMove", update.getData());
                gameState.put("lastMovePlayer", update.getPlayerId());
                gameState.put("lastMoveTime", update.getTimestamp().toString());
            }
            case "POSITION_UPDATE" -> {
                // Racing game position update
                Map<String, Object> positions = (Map<String, Object>) gameState.computeIfAbsent("positions", k -> new HashMap<>());
                positions.put(update.getPlayerId().toString(), update.getData());
            }
            case "CARD_PLAY" -> {
                // Card game move
                gameState.put("lastCard", update.getData());
                gameState.put("currentPlayer", getNextPlayer(gameState, update.getPlayerId()));
            }
            case "SCORE_UPDATE" -> {
                // Score update
                Map<String, Object> scores = (Map<String, Object>) gameState.computeIfAbsent("scores", k -> new HashMap<>());
                scores.put(update.getPlayerId().toString(), update.getData());
            }
        }
        
        gameState.put("lastUpdate", update.getTimestamp().toString());
    }

    private Long getNextPlayer(Map<String, Object> gameState, Long currentPlayer) {
        // Simple round-robin player rotation
        List<Long> playerOrder = (List<Long>) gameState.get("playerOrder");
        if (playerOrder == null) return currentPlayer;
        
        int currentIndex = playerOrder.indexOf(currentPlayer);
        int nextIndex = (currentIndex + 1) % playerOrder.size();
        return playerOrder.get(nextIndex);
    }

    private void checkGameEndConditions(GameSession session, Map<String, Object> gameState, List<GameParticipant> participants) {
        boolean gameEnded = false;
        Long winnerId = null;

        // Game-specific end conditions
        switch (session.getGameType()) {
            case CHESS -> {
                if (gameState.containsKey("checkmate") || gameState.containsKey("stalemate")) {
                    gameEnded = true;
                    winnerId = (Long) gameState.get("winner");
                }
            }
            case UNO -> {
                if (gameState.containsKey("winner")) {
                    gameEnded = true;
                    winnerId = (Long) gameState.get("winner");
                }
            }
            case CAR_RACING -> {
                if (gameState.containsKey("raceFinished")) {
                    gameEnded = true;
                    winnerId = (Long) gameState.get("winner");
                }
            }
        }

        if (gameEnded) {
            session.setStatus(GameSession.Status.COMPLETED);
            session.setEndedAt(LocalDateTime.now());
            session.setWinnerId(winnerId);
            
            // Update participant scores
            updateParticipantScores(participants, gameState);
            
            gameSessionRepository.save(session);
        }
    }

    private void updateParticipantScores(List<GameParticipant> participants, Map<String, Object> gameState) {
        Map<String, Object> scores = (Map<String, Object>) gameState.get("scores");
        if (scores != null) {
            for (GameParticipant participant : participants) {
                Object score = scores.get(participant.getUserId().toString());
                if (score instanceof Number) {
                    participant.setFinalScore(((Number) score).intValue());
                    gameParticipantRepository.save(participant);
                }
            }
        }
    }

    private void broadcastGameUpdate(Long sessionId, GameStateUpdate update, List<GameParticipant> participants) {
        for (GameParticipant participant : participants) {
            messagingTemplate.convertAndSendToUser(
                participant.getUserId().toString(),
                "/queue/game/" + sessionId,
                update
            );
        }
    }

    private boolean isUserConnected(Long userId) {
        Set<String> connections = userConnections.get(userId);
        return connections != null && !connections.isEmpty();
    }

    private void scheduleReconnectionWindow(Long sessionId, Long userId) {
        // In a real implementation, this would use a scheduler
        // For now, we'll just track the disconnection time
        Timer timer = new Timer();
        timer.schedule(new TimerTask() {
            @Override
            public void run() {
                handleReconnectionTimeout(sessionId, userId);
            }
        }, 60000); // 60 second reconnection window
    }

    private void handleReconnectionTimeout(Long sessionId, Long userId) {
        if (!isUserConnected(userId)) {
            // User didn't reconnect, handle as forfeit
            GameSession session = gameSessionRepository.findById(sessionId).orElse(null);
            if (session != null && session.getStatus() == GameSession.Status.IN_PROGRESS) {
                
                // Create forfeit update
                GameStateUpdate forfeitUpdate = new GameStateUpdate("PLAYER_FORFEIT", userId,
                    Map.of("userId", userId, "reason", "disconnection_timeout"));
                
                // Apply forfeit to game state
                Map<String, Object> gameState = parseGameState(session.getGameState());
                gameState.put("forfeit_" + userId, true);
                
                // Check if game should end due to forfeit
                List<GameParticipant> participants = gameParticipantRepository.findBySessionId(sessionId);
                long activePlayers = participants.stream()
                    .filter(p -> !gameState.containsKey("forfeit_" + p.getUserId()))
                    .count();
                
                if (activePlayers <= 1) {
                    // End game, remaining player wins
                    session.setStatus(GameSession.Status.COMPLETED);
                    session.setEndedAt(LocalDateTime.now());
                    
                    // Find winner (last active player)
                    participants.stream()
                        .filter(p -> !gameState.containsKey("forfeit_" + p.getUserId()))
                        .findFirst()
                        .ifPresent(winner -> session.setWinnerId(winner.getUserId()));
                }
                
                try {
                    session.setGameState(objectMapper.writeValueAsString(gameState));
                    gameSessionRepository.save(session);
                } catch (Exception e) {
                    // Log error
                }
                
                // Broadcast forfeit to remaining players
                broadcastGameUpdate(sessionId, forfeitUpdate, participants);
            }
        }
    }

    @Transactional
    public void endSession(Long sessionId, Long winnerId) {
        GameSession session = gameSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));
        
        session.setStatus(GameSession.Status.COMPLETED);
        session.setEndedAt(LocalDateTime.now());
        session.setWinnerId(winnerId);
        
        gameSessionRepository.save(session);
        
        // Notify all participants
        List<GameParticipant> participants = gameParticipantRepository.findBySessionId(sessionId);
        GameStateUpdate endUpdate = new GameStateUpdate("GAME_END", winnerId,
            Map.of("winner", winnerId, "endTime", LocalDateTime.now().toString()));
        
        broadcastGameUpdate(sessionId, endUpdate, participants);
    }
}