package com.gameverse.repository;

import com.gameverse.entity.RoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for RoomParticipant operations
 */
@Repository
public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {

    /**
     * Find all active participants in a room
     */
    @Query("SELECT rp FROM RoomParticipant rp WHERE rp.room.id = :roomId AND rp.isActive = true ORDER BY rp.joinedAt ASC")
    List<RoomParticipant> findActiveParticipantsByRoomId(@Param("roomId") String roomId);

    /**
     * Find participant by room and user
     */
    @Query("SELECT rp FROM RoomParticipant rp WHERE rp.room.id = :roomId AND rp.user.id = :userId")
    Optional<RoomParticipant> findByRoomIdAndUserId(@Param("roomId") String roomId, @Param("userId") Long userId);

    /**
     * Find active participant by room and user
     */
    @Query("SELECT rp FROM RoomParticipant rp WHERE rp.room.id = :roomId AND rp.user.id = :userId AND rp.isActive = true")
    Optional<RoomParticipant> findActiveByRoomIdAndUserId(@Param("roomId") String roomId, @Param("userId") Long userId);

    /**
     * Check if user is active participant in room
     */
    @Query("SELECT COUNT(rp) > 0 FROM RoomParticipant rp WHERE rp.room.id = :roomId AND rp.user.id = :userId AND rp.isActive = true")
    boolean isUserActiveInRoom(@Param("roomId") String roomId, @Param("userId") Long userId);

    /**
     * Count active participants in room
     */
    @Query("SELECT COUNT(rp) FROM RoomParticipant rp WHERE rp.room.id = :roomId AND rp.isActive = true")
    long countActiveParticipantsByRoomId(@Param("roomId") String roomId);

    /**
     * Find all rooms where user is active participant
     */
    @Query("SELECT rp FROM RoomParticipant rp WHERE rp.user.id = :userId AND rp.isActive = true ORDER BY rp.lastActivity DESC")
    List<RoomParticipant> findActiveRoomsByUserId(@Param("userId") Long userId);

    /**
     * Find inactive participants (for cleanup)
     */
    @Query("SELECT rp FROM RoomParticipant rp WHERE rp.isActive = true AND rp.lastActivity < :threshold")
    List<RoomParticipant> findInactiveParticipants(@Param("threshold") LocalDateTime threshold);

    /**
     * Find participants who joined recently
     */
    @Query("SELECT rp FROM RoomParticipant rp WHERE rp.room.id = :roomId AND rp.joinedAt >= :since ORDER BY rp.joinedAt DESC")
    List<RoomParticipant> findRecentParticipants(@Param("roomId") String roomId, @Param("since") LocalDateTime since);

    /**
     * Update participant activity timestamp
     */
    @Modifying
    @Query("UPDATE RoomParticipant rp SET rp.lastActivity = CURRENT_TIMESTAMP WHERE rp.room.id = :roomId AND rp.user.id = :userId AND rp.isActive = true")
    int updateParticipantActivity(@Param("roomId") String roomId, @Param("userId") Long userId);

    /**
     * Deactivate participant
     */
    @Modifying
    @Query("UPDATE RoomParticipant rp SET rp.isActive = false, rp.lastActivity = CURRENT_TIMESTAMP WHERE rp.room.id = :roomId AND rp.user.id = :userId")
    int deactivateParticipant(@Param("roomId") String roomId, @Param("userId") Long userId);

    /**
     * Deactivate all participants in room
     */
    @Modifying
    @Query("UPDATE RoomParticipant rp SET rp.isActive = false, rp.lastActivity = CURRENT_TIMESTAMP WHERE rp.room.id = :roomId")
    int deactivateAllParticipantsInRoom(@Param("roomId") String roomId);

    /**
     * Deactivate inactive participants
     */
    @Modifying
    @Query("UPDATE RoomParticipant rp SET rp.isActive = false WHERE rp.isActive = true AND rp.lastActivity < :threshold")
    int deactivateInactiveParticipants(@Param("threshold") LocalDateTime threshold);

    /**
     * Delete old inactive participant records
     */
    @Modifying
    @Query("DELETE FROM RoomParticipant rp WHERE rp.isActive = false AND rp.lastActivity < :threshold")
    int deleteOldInactiveParticipants(@Param("threshold") LocalDateTime threshold);

    /**
     * Get participant statistics for room
     */
    @Query("SELECT COUNT(rp), MIN(rp.joinedAt), MAX(rp.joinedAt), AVG(TIMESTAMPDIFF(MINUTE, rp.joinedAt, COALESCE(rp.lastActivity, CURRENT_TIMESTAMP))) " +
           "FROM RoomParticipant rp WHERE rp.room.id = :roomId")
    Object[] getParticipantStatistics(@Param("roomId") String roomId);

    /**
     * Find participants with longest session in room
     */
    @Query("SELECT rp FROM RoomParticipant rp WHERE rp.room.id = :roomId AND rp.isActive = true " +
           "ORDER BY TIMESTAMPDIFF(MINUTE, rp.joinedAt, CURRENT_TIMESTAMP) DESC")
    List<RoomParticipant> findLongestSessionParticipants(@Param("roomId") String roomId);

    /**
     * Find user's current active room
     */
    @Query("SELECT rp.room.id FROM RoomParticipant rp WHERE rp.user.id = :userId AND rp.isActive = true")
    List<String> findUserActiveRoomIds(@Param("userId") Long userId);

    /**
     * Check if user can join room (not already active in it)
     */
    @Query("SELECT COUNT(rp) = 0 FROM RoomParticipant rp WHERE rp.room.id = :roomId AND rp.user.id = :userId AND rp.isActive = true")
    boolean canUserJoinRoom(@Param("roomId") String roomId, @Param("userId") Long userId);
}