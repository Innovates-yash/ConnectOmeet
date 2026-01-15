package com.gameverse.repository;

import com.gameverse.entity.GameCoinTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository interface for GameCoin transaction operations
 */
@Repository
public interface GameCoinTransactionRepository extends JpaRepository<GameCoinTransaction, Long> {

    /**
     * Find all transactions for a specific user, ordered by creation date (newest first)
     */
    @Query("SELECT t FROM GameCoinTransaction t WHERE t.user.id = :userId ORDER BY t.createdAt DESC")
    Page<GameCoinTransaction> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);

    /**
     * Find transactions by user and transaction type
     */
    @Query("SELECT t FROM GameCoinTransaction t WHERE t.user.id = :userId AND t.transactionType = :type ORDER BY t.createdAt DESC")
    List<GameCoinTransaction> findByUserIdAndTransactionType(@Param("userId") Long userId, 
                                                            @Param("type") GameCoinTransaction.TransactionType type);

    /**
     * Find transactions by user within date range
     */
    @Query("SELECT t FROM GameCoinTransaction t WHERE t.user.id = :userId " +
           "AND t.createdAt BETWEEN :startDate AND :endDate ORDER BY t.createdAt DESC")
    List<GameCoinTransaction> findByUserIdAndDateRange(@Param("userId") Long userId,
                                                      @Param("startDate") LocalDateTime startDate,
                                                      @Param("endDate") LocalDateTime endDate);

    /**
     * Calculate total credits for a user
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM GameCoinTransaction t " +
           "WHERE t.user.id = :userId AND t.transactionType IN ('CREDIT', 'INITIAL', 'BONUS', 'REFUND')")
    BigDecimal getTotalCreditsForUser(@Param("userId") Long userId);

    /**
     * Calculate total debits for a user
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM GameCoinTransaction t " +
           "WHERE t.user.id = :userId AND t.transactionType = 'DEBIT'")
    BigDecimal getTotalDebitsForUser(@Param("userId") Long userId);

    /**
     * Find transactions by reference ID and type
     */
    @Query("SELECT t FROM GameCoinTransaction t WHERE t.referenceId = :referenceId AND t.referenceType = :referenceType")
    List<GameCoinTransaction> findByReferenceIdAndType(@Param("referenceId") String referenceId,
                                                      @Param("referenceType") String referenceType);

    /**
     * Get user's transaction summary for a specific period
     */
    @Query("SELECT t.transactionType, COUNT(t), SUM(t.amount) FROM GameCoinTransaction t " +
           "WHERE t.user.id = :userId AND t.createdAt >= :since " +
           "GROUP BY t.transactionType")
    List<Object[]> getTransactionSummaryForUser(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    /**
     * Find recent transactions for a user (last N transactions)
     */
    @Query("SELECT t FROM GameCoinTransaction t WHERE t.user.id = :userId ORDER BY t.createdAt DESC")
    List<GameCoinTransaction> findRecentTransactionsByUserId(@Param("userId") Long userId, Pageable pageable);

    /**
     * Check if user has any transactions of a specific type with reference
     */
    @Query("SELECT COUNT(t) > 0 FROM GameCoinTransaction t " +
           "WHERE t.user.id = :userId AND t.referenceId = :referenceId AND t.referenceType = :referenceType")
    boolean existsByUserIdAndReference(@Param("userId") Long userId,
                                      @Param("referenceId") String referenceId,
                                      @Param("referenceType") String referenceType);

    /**
     * Find all transactions for a specific game session
     */
    @Query("SELECT t FROM GameCoinTransaction t WHERE t.referenceId = :gameSessionId AND t.referenceType = 'GAME_SESSION'")
    List<GameCoinTransaction> findByGameSessionId(@Param("gameSessionId") String gameSessionId);

    /**
     * Get daily transaction volume
     */
    @Query("SELECT DATE(t.createdAt), COUNT(t), SUM(t.amount) FROM GameCoinTransaction t " +
           "WHERE t.createdAt >= :since GROUP BY DATE(t.createdAt) ORDER BY DATE(t.createdAt)")
    List<Object[]> getDailyTransactionVolume(@Param("since") LocalDateTime since);

    /**
     * Find users with highest transaction volume in period
     */
    @Query("SELECT t.user.id, COUNT(t), SUM(t.amount) FROM GameCoinTransaction t " +
           "WHERE t.createdAt >= :since GROUP BY t.user.id ORDER BY SUM(t.amount) DESC")
    List<Object[]> findTopUsersByTransactionVolume(@Param("since") LocalDateTime since, Pageable pageable);

    /**
     * Get balance verification data for user
     */
    @Query("SELECT t FROM GameCoinTransaction t WHERE t.user.id = :userId ORDER BY t.createdAt ASC")
    List<GameCoinTransaction> findAllTransactionsByUserIdOrderByDate(@Param("userId") Long userId);
}