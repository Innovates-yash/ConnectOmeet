package com.gameverse.repository;

import com.gameverse.entity.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, Long> {
    
    Optional<GameSession> findBySessionCode(String sessionCode);
    
    List<GameSession> findByGameTypeAndStatus(GameSession.GameType gameType, GameSession.Status status);
    
    List<GameSession> findByStatus(GameSession.Status status);
    
    List<GameSession> findByStatusAndCreatedAtBefore(GameSession.Status status, LocalDateTime cutoff);
    
    List<GameSession> findByStatusAndStartedAtBefore(GameSession.Status status, LocalDateTime cutoff);
    
    @Query("SELECT gs FROM GameSession gs WHERE gs.status = :status AND gs.createdAt < :cutoffTime")
    List<GameSession> findStaleSessionsByStatus(@Param("status") GameSession.Status status, 
                                               @Param("cutoffTime") LocalDateTime cutoffTime);
    
    @Query("SELECT COUNT(gs) FROM GameSession gs WHERE gs.gameType = :gameType AND gs.status IN :statuses")
    Long countActiveSessionsByGameType(@Param("gameType") GameSession.GameType gameType, 
                                      @Param("statuses") List<GameSession.Status> statuses);
    
    @Query("SELECT gs FROM GameSession gs WHERE gs.winnerId = :userId ORDER BY gs.endedAt DESC")
    List<GameSession> findWonGamesByUser(@Param("userId") Long userId);
    
    @Query("SELECT gs FROM GameSession gs JOIN GameParticipant gp ON gs.id = gp.sessionId " +
           "WHERE gp.userId = :userId ORDER BY gs.createdAt DESC")
    List<GameSession> findGamesByUser(@Param("userId") Long userId);
}