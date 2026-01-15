package com.gameverse.repository;

import com.gameverse.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository interface for ChatMessage operations
 */
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * Find recent messages in a room (not deleted)
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.room.id = :roomId AND cm.isDeleted = false ORDER BY cm.createdAt DESC")
    Page<ChatMessage> findRecentMessagesByRoomId(@Param("roomId") String roomId, Pageable pageable);

    /**
     * Find messages in room since a specific time
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.room.id = :roomId AND cm.isDeleted = false AND cm.createdAt >= :since ORDER BY cm.createdAt ASC")
    List<ChatMessage> findMessagesSince(@Param("roomId") String roomId, @Param("since") LocalDateTime since);

    /**
     * Find messages by user in room
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.room.id = :roomId AND cm.user.id = :userId AND cm.isDeleted = false ORDER BY cm.createdAt DESC")
    List<ChatMessage> findMessagesByUserInRoom(@Param("roomId") String roomId, @Param("userId") Long userId);

    /**
     * Find messages by type in room
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.room.id = :roomId AND cm.messageType = :messageType AND cm.isDeleted = false ORDER BY cm.createdAt DESC")
    List<ChatMessage> findMessagesByTypeInRoom(@Param("roomId") String roomId, @Param("messageType") ChatMessage.MessageType messageType);

    /**
     * Count messages in room
     */
    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.room.id = :roomId AND cm.isDeleted = false")
    long countMessagesByRoomId(@Param("roomId") String roomId);

    /**
     * Count messages by user in room
     */
    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.room.id = :roomId AND cm.user.id = :userId AND cm.isDeleted = false")
    long countMessagesByUserInRoom(@Param("roomId") String roomId, @Param("userId") Long userId);

    /**
     * Find last message in room
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.room.id = :roomId AND cm.isDeleted = false ORDER BY cm.createdAt DESC LIMIT 1")
    ChatMessage findLastMessageInRoom(@Param("roomId") String roomId);

    /**
     * Find system messages in room
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.room.id = :roomId AND cm.messageType = 'SYSTEM' AND cm.isDeleted = false ORDER BY cm.createdAt DESC")
    List<ChatMessage> findSystemMessagesInRoom(@Param("roomId") String roomId);

    /**
     * Find messages containing text (search)
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.room.id = :roomId AND cm.isDeleted = false AND LOWER(cm.message) LIKE LOWER(CONCAT('%', :searchText, '%')) ORDER BY cm.createdAt DESC")
    List<ChatMessage> searchMessagesInRoom(@Param("roomId") String roomId, @Param("searchText") String searchText);

    /**
     * Get message statistics for room
     */
    @Query("SELECT COUNT(cm), COUNT(DISTINCT cm.user.id), MIN(cm.createdAt), MAX(cm.createdAt) FROM ChatMessage cm WHERE cm.room.id = :roomId AND cm.isDeleted = false")
    Object[] getMessageStatistics(@Param("roomId") String roomId);

    /**
     * Find most active users in room (by message count)
     */
    @Query("SELECT cm.user.id, COUNT(cm) FROM ChatMessage cm WHERE cm.room.id = :roomId AND cm.isDeleted = false AND cm.messageType IN ('TEXT', 'EMOJI') GROUP BY cm.user.id ORDER BY COUNT(cm) DESC")
    List<Object[]> findMostActiveUsersInRoom(@Param("roomId") String roomId);

    /**
     * Delete old messages (soft delete)
     */
    @Modifying
    @Query("UPDATE ChatMessage cm SET cm.isDeleted = true WHERE cm.room.id = :roomId AND cm.createdAt < :threshold")
    int deleteOldMessages(@Param("roomId") String roomId, @Param("threshold") LocalDateTime threshold);

    /**
     * Delete all messages in room (soft delete)
     */
    @Modifying
    @Query("UPDATE ChatMessage cm SET cm.isDeleted = true WHERE cm.room.id = :roomId")
    int deleteAllMessagesInRoom(@Param("roomId") String roomId);

    /**
     * Hard delete old soft-deleted messages
     */
    @Modifying
    @Query("DELETE FROM ChatMessage cm WHERE cm.isDeleted = true AND cm.createdAt < :threshold")
    int hardDeleteOldMessages(@Param("threshold") LocalDateTime threshold);

    /**
     * Find recent activity (messages) across all rooms
     */
    @Query("SELECT cm.room.id, COUNT(cm), MAX(cm.createdAt) FROM ChatMessage cm WHERE cm.isDeleted = false AND cm.createdAt >= :since GROUP BY cm.room.id ORDER BY COUNT(cm) DESC")
    List<Object[]> findRecentActivityAcrossRooms(@Param("since") LocalDateTime since);

    /**
     * Get daily message count for room
     */
    @Query("SELECT DATE(cm.createdAt), COUNT(cm) FROM ChatMessage cm WHERE cm.room.id = :roomId AND cm.isDeleted = false AND cm.createdAt >= :since GROUP BY DATE(cm.createdAt) ORDER BY DATE(cm.createdAt)")
    List<Object[]> getDailyMessageCount(@Param("roomId") String roomId, @Param("since") LocalDateTime since);

    /**
     * Find messages that need moderation (long messages, potential spam)
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.room.id = :roomId AND cm.isDeleted = false AND (LENGTH(cm.message) > :maxLength OR cm.messageType = 'TEXT') ORDER BY cm.createdAt DESC")
    List<ChatMessage> findMessagesForModeration(@Param("roomId") String roomId, @Param("maxLength") int maxLength);
}