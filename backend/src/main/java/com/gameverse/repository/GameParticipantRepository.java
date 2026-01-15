package com.gameverse.repository;

import com.gameverse.entity.GameParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameParticipantRepository extends JpaRepository<GameParticipant, Long> {
    
    List<GameParticipant> findBySessionId(Long sessionId);
    
    List<GameParticipant> findByUserId(Long userId);
    
    Optional<GameParticipant> findBySessionIdAndUserId(Long sessionId, Long userId);
    
    @Query("SELECT COUNT(gp) FROM GameParticipant gp WHERE gp.sessionId = :sessionId")
    Long countParticipantsBySession(@Param("sessionId") Long sessionId);
    
    @Query("SELECT gp FROM GameParticipant gp WHERE gp.userId = :userId ORDER BY gp.joinedAt DESC")
    List<GameParticipant> findRecentGamesByUser(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(gp) FROM GameParticipant gp JOIN GameSession gs ON gp.sessionId = gs.id " +
           "WHERE gp.userId = :userId AND gs.winnerId = :userId")
    Long countWinsByUser(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(gp) FROM GameParticipant gp JOIN GameSession gs ON gp.sessionId = gs.id " +
           "WHERE gp.userId = :userId AND gs.status = 'COMPLETED'")
    Long countCompletedGamesByUser(@Param("userId") Long userId);
}