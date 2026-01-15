package com.gameverse.service;

import com.gameverse.entity.GameCoinTransaction;
import com.gameverse.entity.User;
import com.gameverse.repository.GameCoinTransactionRepository;
import com.gameverse.repository.UserRepository;
import net.jqwik.api.*;
import net.jqwik.api.constraints.BigRange;
import net.jqwik.api.constraints.Positive;
import net.jqwik.api.constraints.StringLength;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for GameCoin transaction management
 * 
 * Property 9: GameCoin Transaction Management
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5
 * 
 * These tests verify universal properties that should hold for all GameCoin transactions:
 * - Balance consistency across all operations
 * - Transaction atomicity and integrity
 * - Proper validation of insufficient funds
 * - Accurate transaction history tracking
 * - Correct calculation of rewards and fees
 */
class GameCoinServicePropertyTest {

    @Mock
    private GameCoinTransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GameCoinService gameCoinService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    /**
     * Property 9.1: Balance Consistency
     * For any sequence of valid transactions, the user's balance should always equal
     * the initial balance plus all credits minus all debits
     */
    @Property
    void balanceConsistencyProperty(
            @ForAll @BigRange(min = "0", max = "10000") BigDecimal initialBalance,
            @ForAll("validTransactionSequence") List<TransactionData> transactions) {
        
        // Given: A user with initial balance
        User user = createTestUser(1L, initialBalance);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(GameCoinTransaction.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // When: Applying sequence of transactions
        BigDecimal expectedBalance = initialBalance;
        for (TransactionData txData : transactions) {
            try {
                if (txData.isCredit) {
                    gameCoinService.creditCoins(user, txData.amount, txData.description, 
                                              txData.referenceId, txData.referenceType);
                    expectedBalance = expectedBalance.add(txData.amount);
                } else {
                    // Only attempt debit if user has sufficient balance
                    if (user.getGameCoins().compareTo(txData.amount) >= 0) {
                        gameCoinService.debitCoins(user, txData.amount, txData.description,
                                                 txData.referenceId, txData.referenceType);
                        expectedBalance = expectedBalance.subtract(txData.amount);
                    }
                }
            } catch (IllegalArgumentException e) {
                // Expected for insufficient funds - balance should remain unchanged
            }
        }

        // Then: Final balance should match calculated expected balance
        assertThat(user.getGameCoins()).isEqualTo(expectedBalance);
    }

    /**
     * Property 9.2: Transaction Atomicity
     * Each transaction should be atomic - either completely successful or leave no trace
     */
    @Property
    void transactionAtomicityProperty(
            @ForAll @BigRange(min = "100", max = "1000") BigDecimal initialBalance,
            @ForAll @BigRange(min = "1", max = "50") BigDecimal transactionAmount,
            @ForAll boolean isCredit) {
        
        // Given: A user with initial balance
        User user = createTestUser(1L, initialBalance);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        
        BigDecimal balanceBefore = user.getGameCoins();

        // When: Performing transaction
        if (isCredit) {
            when(transactionRepository.save(any(GameCoinTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
            
            GameCoinTransaction result = gameCoinService.creditCoins(user, transactionAmount, 
                "Test credit", "TEST_REF", "TEST_TYPE");
            
            // Then: Transaction should be complete and consistent
            assertThat(result).isNotNull();
            assertThat(result.getBalanceBefore()).isEqualTo(balanceBefore);
            assertThat(result.getBalanceAfter()).isEqualTo(balanceBefore.add(transactionAmount));
            assertThat(user.getGameCoins()).isEqualTo(balanceBefore.add(transactionAmount));
        } else {
            // Test debit transaction
            if (initialBalance.compareTo(transactionAmount) >= 0) {
                when(transactionRepository.save(any(GameCoinTransaction.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
                
                GameCoinTransaction result = gameCoinService.debitCoins(user, transactionAmount,
                    "Test debit", "TEST_REF", "TEST_TYPE");
                
                // Then: Transaction should be complete and consistent
                assertThat(result).isNotNull();
                assertThat(result.getBalanceBefore()).isEqualTo(balanceBefore);
                assertThat(result.getBalanceAfter()).isEqualTo(balanceBefore.subtract(transactionAmount));
                assertThat(user.getGameCoins()).isEqualTo(balanceBefore.subtract(transactionAmount));
            } else {
                // Should throw exception for insufficient funds
                assertThatThrownBy(() -> 
                    gameCoinService.debitCoins(user, transactionAmount, "Test debit", "TEST_REF", "TEST_TYPE"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Insufficient GameCoin balance");
                
                // Balance should remain unchanged
                assertThat(user.getGameCoins()).isEqualTo(balanceBefore);
            }
        }
    }

    /**
     * Property 9.3: Game Reward Consistency
     * Game rewards should always be positive and consistent for the same game type
     */
    @Property
    void gameRewardConsistencyProperty(@ForAll("gameTypes") String gameType) {
        // When: Getting game reward for any game type
        BigDecimal reward = gameCoinService.getGameReward(gameType);
        
        // Then: Reward should be positive and consistent
        assertThat(reward).isPositive();
        
        // Multiple calls should return same value
        BigDecimal reward2 = gameCoinService.getGameReward(gameType);
        assertThat(reward).isEqualTo(reward2);
    }

    /**
     * Property 9.4: Entry Fee Validation
     * Entry fees should be non-negative and consistent for the same game type
     */
    @Property
    void entryFeeValidationProperty(@ForAll("gameTypes") String gameType) {
        // When: Getting entry fee for any game type
        BigDecimal entryFee = gameCoinService.getGameEntryFee(gameType);
        
        // Then: Entry fee should be non-negative and consistent
        assertThat(entryFee).isNotNegative();
        
        // Multiple calls should return same value
        BigDecimal entryFee2 = gameCoinService.getGameEntryFee(gameType);
        assertThat(entryFee).isEqualTo(entryFee2);
    }

    /**
     * Property 9.5: Balance Verification Integrity
     * Balance verification should always pass for a sequence of valid transactions
     */
    @Property
    void balanceVerificationIntegrityProperty(
            @ForAll @BigRange(min = "1000", max = "2000") BigDecimal initialBalance,
            @ForAll("validCreditSequence") List<TransactionData> transactions) {
        
        // Given: A user with transaction history
        User user = createTestUser(1L, initialBalance);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        
        List<GameCoinTransaction> transactionHistory = new ArrayList<>();
        BigDecimal runningBalance = BigDecimal.valueOf(1000); // Initial registration balance
        
        // Create transaction history
        for (TransactionData txData : transactions) {
            GameCoinTransaction transaction = new GameCoinTransaction();
            transaction.setUser(user);
            transaction.setTransactionType(GameCoinTransaction.TransactionType.CREDIT);
            transaction.setAmount(txData.amount);
            transaction.setBalanceBefore(runningBalance);
            runningBalance = runningBalance.add(txData.amount);
            transaction.setBalanceAfter(runningBalance);
            transaction.setCreatedAt(LocalDateTime.now());
            transactionHistory.add(transaction);
        }
        
        // Set final balance to match calculated balance
        user.setGameCoins(runningBalance);
        
        when(transactionRepository.findAllTransactionsByUserIdOrderByDate(1L))
            .thenReturn(transactionHistory);

        // When: Verifying balance integrity
        boolean isValid = gameCoinService.verifyBalanceIntegrity(1L);

        // Then: Verification should pass
        assertThat(isValid).isTrue();
    }

    /**
     * Property 9.6: Insufficient Balance Protection
     * Debit operations should never succeed when balance is insufficient
     */
    @Property
    void insufficientBalanceProtectionProperty(
            @ForAll @BigRange(min = "0", max = "100") BigDecimal currentBalance,
            @ForAll @BigRange(min = "101", max = "1000") BigDecimal requestedAmount) {
        
        // Given: A user with insufficient balance
        User user = createTestUser(1L, currentBalance);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // When & Then: Attempting to debit more than available should fail
        assertThatThrownBy(() -> 
            gameCoinService.debitCoins(user, requestedAmount, "Test debit", "TEST_REF", "TEST_TYPE"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Insufficient GameCoin balance");
        
        // Balance should remain unchanged
        assertThat(user.getGameCoins()).isEqualTo(currentBalance);
    }

    // Arbitraries for test data generation

    @Provide
    Arbitrary<List<TransactionData>> validTransactionSequence() {
        return Arbitraries.create(() -> new TransactionData(
                Arbitraries.bigDecimals().between(BigDecimal.ONE, BigDecimal.valueOf(100)).sample(),
                Arbitraries.of(true, false).sample(),
                "Test transaction",
                "TEST_REF_" + System.nanoTime(),
                "TEST_TYPE"
            )).list().ofMaxSize(10);
    }

    @Provide
    Arbitrary<List<TransactionData>> validCreditSequence() {
        return Arbitraries.create(() -> new TransactionData(
                Arbitraries.bigDecimals().between(BigDecimal.ONE, BigDecimal.valueOf(50)).sample(),
                true, // Only credits
                "Test credit",
                "TEST_REF_" + System.nanoTime(),
                "TEST_TYPE"
            )).list().ofMaxSize(5);
    }

    @Provide
    Arbitrary<String> gameTypes() {
        return Arbitraries.of(
            "CHESS", "UNO", "RACING", "FIGHTING", "MATH_MASTER", 
            "LUDO", "TRUTH_OR_DARE", "BUBBLE_BLAST", "RUMMY", "MEME_BATTLE"
        );
    }

    // Helper classes and methods

    private User createTestUser(Long id, BigDecimal balance) {
        User user = new User();
        user.setId(id);
        user.setPhoneNumber("+1234567890");
        user.setGameCoins(balance);
        user.setIsVerified(true);
        return user;
    }

    private static class TransactionData {
        final BigDecimal amount;
        final boolean isCredit;
        final String description;
        final String referenceId;
        final String referenceType;

        TransactionData(BigDecimal amount, boolean isCredit, String description, 
                       String referenceId, String referenceType) {
            this.amount = amount;
            this.isCredit = isCredit;
            this.description = description;
            this.referenceId = referenceId;
            this.referenceType = referenceType;
        }
    }
}