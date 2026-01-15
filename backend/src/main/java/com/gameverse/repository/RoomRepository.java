package com.gameverse.repository;

import com.gameverse.entity.Room;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Room operations
 */
@Repository
public interface RoomRepository extends JpaRepository<Room, String> {

    /**
     * Find all active rooms ordered by current count (most active first)
     */
    @Query("SELECT r FROM Room r WHERE r.isActive = true ORDER BY r.currentCount DESC, r.createdAt DESC")
    Page<Room> findActiveRoomsOrderByActivity(Pageable pageable);

    /**
     * Find rooms with available space
     */
    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.currentCount < r.maxCapacity ORDER BY r.currentCount DESC")
    List<Room> findRoomsWithAvailableSpace();

    /**
     * Find rooms by name (case-insensitive search)
     */
    @Query("SELECT r FROM Room r WHERE r.isActive = true AND LOWER(r.name) LIKE LOWER(CONCAT('%', :name, '%')) ORDER BY r.currentCount DESC")
    List<Room> findByNameContainingIgnoreCase(@Param("name") String name);

    /**
     * Find rooms created after a specific date
     */
    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.createdAt >= :since ORDER BY r.createdAt DESC")
    List<Room> findRecentRooms(@Param("since") LocalDateTime since);

    /**
     * Find popular rooms (with high participant count)
     */
    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.currentCount >= :minParticipants ORDER BY r.currentCount DESC")
    List<Room> findPopularRooms(@Param("minParticipants") int minParticipants);

    /**
     * Find empty rooms that can be cleaned up
     */
    @Query("SELECT r FROM Room r WHERE r.currentCount = 0 AND r.updatedAt < :threshold")
    List<Room> findEmptyRoomsForCleanup(@Param("threshold") LocalDateTime threshold);

    /**
     * Get room statistics
     */
    @Query("SELECT COUNT(r), AVG(r.currentCount), MAX(r.currentCount) FROM Room r WHERE r.isActive = true")
    Object[] getRoomStatistics();

    /**
     * Count active rooms
     */
    @Query("SELECT COUNT(r) FROM Room r WHERE r.isActive = true")
    long countActiveRooms();

    /**
     * Count total participants across all rooms
     */
    @Query("SELECT SUM(r.currentCount) FROM Room r WHERE r.isActive = true")
    Long getTotalParticipantsCount();

    /**
     * Find rooms by capacity range
     */
    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.maxCapacity BETWEEN :minCapacity AND :maxCapacity ORDER BY r.currentCount DESC")
    List<Room> findByCapacityRange(@Param("minCapacity") int minCapacity, @Param("maxCapacity") int maxCapacity);

    /**
     * Update room participant count
     */
    @Modifying
    @Query("UPDATE Room r SET r.currentCount = :count, r.updatedAt = CURRENT_TIMESTAMP WHERE r.id = :roomId")
    int updateParticipantCount(@Param("roomId") String roomId, @Param("count") int count);

    /**
     * Increment room participant count
     */
    @Modifying
    @Query("UPDATE Room r SET r.currentCount = r.currentCount + 1, r.updatedAt = CURRENT_TIMESTAMP WHERE r.id = :roomId AND r.currentCount < r.maxCapacity")
    int incrementParticipantCount(@Param("roomId") String roomId);

    /**
     * Decrement room participant count
     */
    @Modifying
    @Query("UPDATE Room r SET r.currentCount = GREATEST(0, r.currentCount - 1), r.updatedAt = CURRENT_TIMESTAMP WHERE r.id = :roomId")
    int decrementParticipantCount(@Param("roomId") String roomId);

    /**
     * Deactivate empty rooms older than threshold
     */
    @Modifying
    @Query("UPDATE Room r SET r.isActive = false, r.updatedAt = CURRENT_TIMESTAMP WHERE r.currentCount = 0 AND r.updatedAt < :threshold")
    int deactivateEmptyRooms(@Param("threshold") LocalDateTime threshold);

    /**
     * Check if room exists and is active
     */
    @Query("SELECT COUNT(r) > 0 FROM Room r WHERE r.id = :roomId AND r.isActive = true")
    boolean existsByIdAndIsActive(@Param("roomId") String roomId);

    /**
     * Find room with participant count validation
     */
    @Query("SELECT r FROM Room r WHERE r.id = :roomId AND r.isActive = true AND r.currentCount < r.maxCapacity")
    Optional<Room> findAvailableRoom(@Param("roomId") String roomId);

    /**
     * Get rooms ordered by creation date for pagination
     */
    @Query("SELECT r FROM Room r WHERE r.isActive = true ORDER BY r.createdAt DESC")
    Page<Room> findActiveRoomsOrderByCreatedAt(Pageable pageable);

    /**
     * Search rooms by name and description
     */
    @Query("SELECT r FROM Room r WHERE r.isActive = true AND " +
           "(LOWER(r.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(r.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "ORDER BY r.currentCount DESC")
    List<Room> searchRooms(@Param("searchTerm") String searchTerm);
}