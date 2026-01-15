package com.gameverse.service;

import com.gameverse.entity.GameCoinTransaction;
import com.gameverse.entity.User;
import com.gameverse.repository.GameCoinTransactionRepository;
import com.gameverse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for managing GameCoin virtual currency transactions
 * Handles earning, spending, and transaction history for the GameVerse platform
 */
@Service
@Transactional
public class GameCoinService {

    @Autowired
    private GameCoinTransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    // Game reward configurations
    private static final Map<String, BigDecimal> GAME_REWARDS = Map.of(
        "CHESS", BigDecimal.valueOf(50),
        "UNO", BigDecimal.valueOf(30),
        "RACING", BigDecimal.valueOf(40),
        "FIGHTING", BigDecimal.valueOf(45),
        "MATH_MASTER", BigDecimal.valueOf(35),
        "LUDO", BigDecimal.valueOf(25),
        "TRUTH_OR_DARE", BigDecimal.valueOf(20),
        "BUBBLE_BLAST", BigDecimal.valueOf(60),
        "RUMMY", BigDecimal.valueOf(100) // Higher reward for skill-based game
    );

    private static final Map<String, BigDecimal> GAME_ENTRY_FEES = Map.of(
        "RUMMY", BigDecimal.valueOf(50),
        "MEME_BATTLE", BigDecimal.valueOf(25),
        "TOURNAMENT", BigDecimal.valueOf(100)
    );

    /**
     * Award GameCoins to a user for winning a game
     * 
     * @param userId User ID
     * @param gameType Type of game won
     * @param gameSessionId Game session reference
     * @return Transaction record
     */
    public GameCoinTransaction awardGameWinCoins(Long userId, String gameType, String gameSessionId) {
        User user = getUserById(userId);
        BigDecimal rewardAmount = GAME_REWARDS.getOrDefault(gameType, BigDecimal.valueOf(25));
        
        return creditCoins(user, rewardAmount, 
            "Game win reward for " + gameType, 
            gameSessionId, "GAME_WIN");
    }

    /**
     * Deduct GameCoins for game entry fee
     * 
     * @param userId User ID
     * @param gameType Type of game
     * @param gameSessionId Game session reference
     * @return Transaction record
     * @throws IllegalArgumentException if insufficient balance
     */
    public GameCoinTransaction deductGameEntryFee(Long userId, String gameType, String gameSessionId) {
        User user = getUserById(userId);
        BigDecimal entryFee = GAME_ENTRY_FEES.getOrDefault(gameType, BigDecimal.ZERO);
        
        if (entryFee.compareTo(BigDecimal.ZERO) == 0) {
            return null; // No entry fee required
        }
        
        return debitCoins(user, entryFee, 
            "Entry fee for " + gameType, 
            gameSessionId, "GAME_ENTRY");
    }

    /**
     * Award daily bonus coins to a user
     * 
     * @param userId User ID
     * @return Transaction record
     */
    public GameCoinTransaction awardDailyBonus(Long userId) {
        User user = getUserById(userId);
        BigDecimal bonusAmount = BigDecimal.valueOf(50); // Daily bonus amount
        
        return creditCoins(user, bonusAmount, 
            "Daily login bonus", 
            "DAILY_" + LocalDateTime.now().toLocalDate(), "DAILY_BONUS");
    }

    /**
     * Award meme battle winner bonus
     * 
     * @param userId User ID
     * @param memeId Meme reference ID
     * @return Transaction record
     */
    public GameCoinTransaction awardMemeWinnerBonus(Long userId, String memeId) {
        User user = getUserById(userId);
        BigDecimal bonusAmount = BigDecimal.valueOf(200); // Meme winner bonus
        
        return creditCoins(user, bonusAmount, 
            "Meme battle winner bonus", 
            memeId, "MEME_WIN");
    }

    /**
     * Credit GameCoins to a user's account
     * 
     * @param user User entity
     * @param amount Amount to credit
     * @param description Transaction description
     * @param referenceId Reference ID
     * @param referenceType Reference type
     * @return Transaction record
     */
    public GameCoinTransaction creditCoins(User user, BigDecimal amount, String description, 
                                         String referenceId, String referenceType) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Credit amount must be positive");
        }

        BigDecimal balanceBefore = user.getGameCoins();
        user.addGameCoins(amount);
        BigDecimal balanceAfter = user.getGameCoins();
        
        userRepository.save(user);

        GameCoinTransaction transaction = new GameCoinTransaction(
            user, GameCoinTransaction.TransactionType.CREDIT, amount,
            balanceBefore, balanceAfter, description, referenceId, referenceType
        );

        return transactionRepository.save(transaction);
    }

    /**
     * Debit GameCoins from a user's account
     * 
     * @param user User entity
     * @param amount Amount to debit
     * @param description Transaction description
     * @param referenceId Reference ID
     * @param referenceType Reference type
     * @return Transaction record
     * @throws IllegalArgumentException if insufficient balance
     */
    public GameCoinTransaction debitCoins(User user, BigDecimal amount, String description,
                                        String referenceId, String referenceType) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Debit amount must be positive");
        }

        if (user.getGameCoins().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient GameCoin balance. Required: " + amount + 
                                             ", Available: " + user.getGameCoins());
        }

        BigDecimal balanceBefore = user.getGameCoins();
        user.subtractGameCoins(amount);
        BigDecimal balanceAfter = user.getGameCoins();
        
        userRepository.save(user);

        GameCoinTransaction transaction = new GameCoinTransaction(
            user, GameCoinTransaction.TransactionType.DEBIT, amount,
            balanceBefore, balanceAfter, description, referenceId, referenceType
        );

        return transactionRepository.save(transaction);
    }

    /**
     * Check if user has sufficient balance for a transaction
     * 
     * @param userId User ID
     * @param amount Required amount
     * @return true if sufficient balance
     */
    public boolean hasSufficientBalance(Long userId, BigDecimal amount) {
        User user = getUserById(userId);
        return user.getGameCoins().compareTo(amount) >= 0;
    }

    /**
     * Get user's current GameCoin balance
     * 
     * @param userId User ID
     * @return Current balance
     */
    public BigDecimal getUserBalance(Long userId) {
        User user = getUserById(userId);
        return user.getGameCoins();
    }

    /**
     * Get user's transaction history with pagination
     * 
     * @param userId User ID
     * @param page Page number (0-based)
     * @param size Page size
     * @return Page of transactions
     */
    public Page<GameCoinTransaction> getUserTransactionHistory(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    /**
     * Get recent transactions for a user
     * 
     * @param userId User ID
     * @param limit Number of recent transactions
     * @return List of recent transactions
     */
    public List<GameCoinTransaction> getRecentTransactions(Long userId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return transactionRepository.findRecentTransactionsByUserId(userId, pageable);
    }

    /**
     * Get transaction summary for a user
     * 
     * @param userId User ID
     * @param since Date from which to calculate summary
     * @return Transaction summary
     */
    public TransactionSummary getTransactionSummary(Long userId, LocalDateTime since) {
        List<Object[]> summaryData = transactionRepository.getTransactionSummaryForUser(userId, since);
        
        BigDecimal totalCredits = BigDecimal.ZERO;
        BigDecimal totalDebits = BigDecimal.ZERO;
        int creditCount = 0;
        int debitCount = 0;

        for (Object[] row : summaryData) {
            GameCoinTransaction.TransactionType type = (GameCoinTransaction.TransactionType) row[0];
            Long count = (Long) row[1];
            BigDecimal amount = (BigDecimal) row[2];

            if (type == GameCoinTransaction.TransactionType.CREDIT || 
                type == GameCoinTransaction.TransactionType.INITIAL ||
                type == GameCoinTransaction.TransactionType.BONUS ||
                type == GameCoinTransaction.TransactionType.REFUND) {
                totalCredits = totalCredits.add(amount);
                creditCount += count.intValue();
            } else if (type == GameCoinTransaction.TransactionType.DEBIT) {
                totalDebits = totalDebits.add(amount);
                debitCount += count.intValue();
            }
        }

        return new TransactionSummary(totalCredits, totalDebits, creditCount, debitCount);
    }

    /**
     * Refund GameCoins for a cancelled game or transaction
     * 
     * @param userId User ID
     * @param amount Amount to refund
     * @param originalReferenceId Original transaction reference
     * @param reason Refund reason
     * @return Transaction record
     */
    public GameCoinTransaction refundCoins(Long userId, BigDecimal amount, String originalReferenceId, String reason) {
        User user = getUserById(userId);
        
        return creditCoins(user, amount, 
            "Refund: " + reason, 
            originalReferenceId, "REFUND");
    }

    /**
     * Verify user's balance integrity by checking transaction history
     * 
     * @param userId User ID
     * @return true if balance matches transaction history
     */
    public boolean verifyBalanceIntegrity(Long userId) {
        User user = getUserById(userId);
        List<GameCoinTransaction> allTransactions = 
            transactionRepository.findAllTransactionsByUserIdOrderByDate(userId);

        BigDecimal calculatedBalance = BigDecimal.valueOf(1000); // Initial balance
        
        for (GameCoinTransaction transaction : allTransactions) {
            if (transaction.getTransactionType() == GameCoinTransaction.TransactionType.CREDIT ||
                transaction.getTransactionType() == GameCoinTransaction.TransactionType.INITIAL ||
                transaction.getTransactionType() == GameCoinTransaction.TransactionType.BONUS ||
                transaction.getTransactionType() == GameCoinTransaction.TransactionType.REFUND) {
                calculatedBalance = calculatedBalance.add(transaction.getAmount());
            } else if (transaction.getTransactionType() == GameCoinTransaction.TransactionType.DEBIT) {
                calculatedBalance = calculatedBalance.subtract(transaction.getAmount());
            }
        }

        return calculatedBalance.compareTo(user.getGameCoins()) == 0;
    }

    /**
     * Get game entry fee for a specific game type
     * 
     * @param gameType Game type
     * @return Entry fee amount
     */
    public BigDecimal getGameEntryFee(String gameType) {
        return GAME_ENTRY_FEES.getOrDefault(gameType, BigDecimal.ZERO);
    }

    /**
     * Get game reward amount for a specific game type
     * 
     * @param gameType Game type
     * @return Reward amount
     */
    public BigDecimal getGameReward(String gameType) {
        return GAME_REWARDS.getOrDefault(gameType, BigDecimal.valueOf(25));
    }

    // Helper methods
    private User getUserById(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
    }

    /**
     * Transaction summary data class
     */
    public static class TransactionSummary {
        private final BigDecimal totalCredits;
        private final BigDecimal totalDebits;
        private final int creditCount;
        private final int debitCount;

        public TransactionSummary(BigDecimal totalCredits, BigDecimal totalDebits, 
                                int creditCount, int debitCount) {
            this.totalCredits = totalCredits;
            this.totalDebits = totalDebits;
            this.creditCount = creditCount;
            this.debitCount = debitCount;
        }

        public BigDecimal getTotalCredits() { return totalCredits; }
        public BigDecimal getTotalDebits() { return totalDebits; }
        public int getCreditCount() { return creditCount; }
        public int getDebitCount() { return debitCount; }
        public BigDecimal getNetAmount() { return totalCredits.subtract(totalDebits); }
        public int getTotalTransactions() { return creditCount + debitCount; }
    }
}