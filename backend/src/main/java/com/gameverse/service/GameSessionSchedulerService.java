package com.gameverse.service;

import com.gameverse.entity.GameSession;
import com.gameverse.repository.GameSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class GameSessionSchedulerService {

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private GameSessionService gameSessionService;

    @Autowired
    private MatchmakingService matchmakingService;

    /**
     * Clean up abandoned game sessions every 5 minutes
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    public void cleanupAbandonedSessions() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(2); // 2 hours ago
        
        List<GameSession> abandonedSessions = gameSessionRepository
            .findByStatusAndCreatedAtBefore(GameSession.Status.WAITING, cutoff);
        
        for (GameSession session : abandonedSessions) {
            session.setStatus(GameSession.Status.CANCELLED);
            session.setEndedAt(LocalDateTime.now());
            gameSessionRepository.save(session);
        }
        
        // Also clean up in-progress sessions that have been inactive too long
        List<GameSession> staleSessions = gameSessionRepository
            .findByStatusAndStartedAtBefore(GameSession.Status.IN_PROGRESS, cutoff);
        
        for (GameSession session : staleSessions) {
            // End session without winner (timeout)
            gameSessionService.endSession(session.getId(), null);
        }
    }

    /**
     * Process matchmaking queue timeouts every 30 seconds
     */
    @Scheduled(fixedRate = 30000) // 30 seconds
    public void processMatchmakingTimeouts() {
        matchmakingService.processQueueTimeouts();
    }

    /**
     * Update game session statistics every hour
     */
    @Scheduled(fixedRate = 3600000) // 1 hour
    public void updateGameStatistics() {
        // This could update cached statistics, leaderboards, etc.
        // For now, just log that it's running
        System.out.println("Game statistics update task running at: " + LocalDateTime.now());
    }
}