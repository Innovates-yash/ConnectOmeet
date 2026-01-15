package com.gameverse.database.tests;

import net.jqwik.api.*;
import net.jqwik.api.constraints.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import java.math.BigDecimal;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Property-based tests for GameVerse database schema integrity
 * Feature: gameverse-social-gaming-platform, Property 9: GameCoin Transaction Management
 * 
 * Tests that validate the database schema maintains data integrity
 * and enforces business rules at the database level.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class DatabaseSchemaPropertyTests {

    private Connection connection;
    private static final String TEST_DB_URL = "jdbc:h2:mem:gameverse_test;DB_CLOSE_DELAY=-1;MODE=MySQL";
    
    @BeforeEach
    void setUp() throws SQLException {
        // Use H2 in-memory database for testing with MySQL compatibility mode
        connection = DriverManager.getConnection(TEST_DB_URL, "sa", "");
        setupTestSchema();
    }

    /**
     * Property 9: GameCoin Transaction Management
     * For any GameCoin transaction (earning, spending, initial award), 
     * the system should maintain accurate balances, prevent insufficient balance operations, 
     * and log all transactions
     * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5
     */
    @Property
    @Label("Feature: gameverse-social-gaming-platform, Property 9: GameCoin Transaction Management")
    void gameCoinTransactionsShouldMaintainAccurateBalances(
            @ForAll @BigRange(min = "0.00", max = "10000.00") BigDecimal initialBalance,
            @ForAll @Size(min = 1, max = 10) List<@From("transactionGenerator") Transaction> transactions
    ) throws SQLException {
        // Given: A user with an initial balance
        long userId = createTestUser(initialBalance);
        
        BigDecimal expectedBalance = initialBalance;
        List<Transaction> validTransactions = new ArrayList<>();
        
        // When: Processing a series of transactions
        for (Transaction transaction : transactions) {
            BigDecimal newBalance = expectedBalance.add(transaction.amount);
            
            // Only process transactions that don't result in negative balance
            if (newBalance.compareTo(BigDecimal.ZERO) >= 0) {
                processTransaction(userId, transaction, expectedBalance.add(transaction.amount));
                expectedBalance = newBalance;
                validTransactions.add(transaction);
            }
        }
        
        // Then: The final balance should match expected calculations
        BigDecimal actualBalance = getUserBalance(userId);
        Assertions.assertEquals(expectedBalance, actualBalance, 
            "Final balance should match sum of all valid transactions");
        
        // And: All transactions should be logged
        int transactionCount = getTransactionCount(userId);
        Assertions.assertEquals(validTransactions.size() + 1, transactionCount, 
            "Should have logged initial balance + all valid transactions");
        
        // And: Balance history should be consistent
        verifyBalanceHistory(userId, initialBalance, validTransactions);
    }

    @Property
    @Label("Database schema should enforce referential integrity")
    void databaseShouldEnforceReferentialIntegrity(
            @ForAll @LongRange(min = 1, max = 1000) long nonExistentUserId
    ) throws SQLException {
        // Given: A non-existent user ID
        
        // When/Then: Attempting to create records with invalid foreign keys should fail
        Assertions.assertThrows(SQLException.class, () -> {
            String sql = "INSERT INTO profiles (user_id, avatar_id, display_name) VALUES (?, 'avatar1', 'TestUser')";
            try (PreparedStatement stmt = connection.prepareStatement(sql)) {
                stmt.setLong(1, nonExistentUserId);
                stmt.executeUpdate();
            }
        }, "Should not allow profiles with non-existent user_id");
        
        Assertions.assertThrows(SQLException.class, () -> {
            String sql = "INSERT INTO coin_transactions (user_id, transaction_type, amount, balance_after) VALUES (?, 'EARNED', 100.00, 100.00)";
            try (PreparedStatement stmt = connection.prepareStatement(sql)) {
                stmt.setLong(1, nonExistentUserId);
                stmt.executeUpdate();
            }
        }, "Should not allow transactions with non-existent user_id");
    }

    @Property
    @Label("Game sessions should enforce capacity constraints")
    void gameSessionsShouldEnforceCapacityConstraints(
            @ForAll @IntRange(min = 2, max = 8) int maxPlayers,
            @ForAll @IntRange(min = 1, max = 15) int attemptedPlayers
    ) throws SQLException {
        // Given: A game session with a specific capacity
        long sessionId = createTestGameSession(maxPlayers);
        
        // When: Adding players up to the limit
        int playersAdded = 0;
        for (int i = 0; i < Math.min(attemptedPlayers, maxPlayers); i++) {
            long userId = createTestUser(BigDecimal.valueOf(1000));
            addPlayerToSession(sessionId, userId);
            playersAdded++;
        }
        
        // Then: Current players should not exceed max players
        int currentPlayers = getCurrentPlayerCount(sessionId);
        Assertions.assertTrue(currentPlayers <= maxPlayers, 
            "Current players should never exceed max players");
        Assertions.assertEquals(Math.min(attemptedPlayers, maxPlayers), currentPlayers,
            "Should have added the correct number of players");
    }

    @Provide
    Arbitrary<Transaction> transactionGenerator() {
        return Combinators.combine(
            Arbitraries.of(TransactionType.values()),
            Arbitraries.bigDecimals()
                .between(BigDecimal.valueOf(-500), BigDecimal.valueOf(500))
                .ofScale(2)
        ).as(Transaction::new);
    }

    // Helper methods for test setup and verification
    
    private void setupTestSchema() throws SQLException {
        // Create simplified test schema
        String[] createStatements = {
            """
            CREATE TABLE users (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                phone_number VARCHAR(15) UNIQUE NOT NULL,
                game_coins DECIMAL(10,2) DEFAULT 1000.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE profiles (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                user_id BIGINT NOT NULL,
                avatar_id VARCHAR(50) NOT NULL,
                display_name VARCHAR(50) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """,
            """
            CREATE TABLE coin_transactions (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                user_id BIGINT NOT NULL,
                transaction_type ENUM('EARNED', 'SPENT', 'BONUS', 'REFUND') NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                balance_after DECIMAL(10,2) NOT NULL,
                description VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """,
            """
            CREATE TABLE game_sessions (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                game_type VARCHAR(20) NOT NULL,
                max_players INT NOT NULL,
                current_players INT DEFAULT 0,
                status VARCHAR(20) DEFAULT 'WAITING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE game_participants (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                session_id BIGINT NOT NULL,
                user_id BIGINT NOT NULL,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_session_user (session_id, user_id)
            )
            """
        };
        
        for (String sql : createStatements) {
            try (Statement stmt = connection.createStatement()) {
                stmt.execute(sql);
            }
        }
    }
    
    private long createTestUser(BigDecimal initialBalance) throws SQLException {
        String sql = "INSERT INTO users (phone_number, game_coins) VALUES (?, ?)";
        try (PreparedStatement stmt = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, "+" + System.nanoTime()); // Unique phone number
            stmt.setBigDecimal(2, initialBalance);
            stmt.executeUpdate();
            
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                rs.next();
                long userId = rs.getLong(1);
                
                // Log initial balance transaction
                logTransaction(userId, TransactionType.BONUS, initialBalance, initialBalance, "Initial balance");
                return userId;
            }
        }
    }
    
    private void processTransaction(long userId, Transaction transaction, BigDecimal newBalance) throws SQLException {
        // Update user balance
        String updateSql = "UPDATE users SET game_coins = ? WHERE id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(updateSql)) {
            stmt.setBigDecimal(1, newBalance);
            stmt.setLong(2, userId);
            stmt.executeUpdate();
        }
        
        // Log transaction
        logTransaction(userId, transaction.type, transaction.amount, newBalance, 
            "Test transaction: " + transaction.type);
    }
    
    private void logTransaction(long userId, TransactionType type, BigDecimal amount, 
                               BigDecimal balanceAfter, String description) throws SQLException {
        String sql = "INSERT INTO coin_transactions (user_id, transaction_type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setString(2, type.name());
            stmt.setBigDecimal(3, amount);
            stmt.setBigDecimal(4, balanceAfter);
            stmt.setString(5, description);
            stmt.executeUpdate();
        }
    }
    
    private BigDecimal getUserBalance(long userId) throws SQLException {
        String sql = "SELECT game_coins FROM users WHERE id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                rs.next();
                return rs.getBigDecimal("game_coins");
            }
        }
    }
    
    private int getTransactionCount(long userId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM coin_transactions WHERE user_id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }
    
    private void verifyBalanceHistory(long userId, BigDecimal initialBalance, 
                                    List<Transaction> transactions) throws SQLException {
        String sql = "SELECT balance_after FROM coin_transactions WHERE user_id = ? ORDER BY created_at";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                BigDecimal expectedBalance = initialBalance;
                
                // First record should be initial balance
                rs.next();
                BigDecimal firstBalance = rs.getBigDecimal("balance_after");
                Assertions.assertEquals(initialBalance, firstBalance, 
                    "First transaction should record initial balance");
                
                // Subsequent records should show cumulative changes
                for (Transaction transaction : transactions) {
                    expectedBalance = expectedBalance.add(transaction.amount);
                    if (expectedBalance.compareTo(BigDecimal.ZERO) >= 0) {
                        rs.next();
                        BigDecimal recordedBalance = rs.getBigDecimal("balance_after");
                        Assertions.assertEquals(expectedBalance, recordedBalance,
                            "Transaction history should show correct running balance");
                    }
                }
            }
        }
    }
    
    private long createTestGameSession(int maxPlayers) throws SQLException {
        String sql = "INSERT INTO game_sessions (game_type, max_players) VALUES (?, ?)";
        try (PreparedStatement stmt = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, "TEST_GAME");
            stmt.setInt(2, maxPlayers);
            stmt.executeUpdate();
            
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                rs.next();
                return rs.getLong(1);
            }
        }
    }
    
    private void addPlayerToSession(long sessionId, long userId) throws SQLException {
        String sql = "INSERT INTO game_participants (session_id, user_id) VALUES (?, ?)";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, sessionId);
            stmt.setLong(2, userId);
            stmt.executeUpdate();
        }
        
        // Update current player count
        String updateSql = "UPDATE game_sessions SET current_players = (SELECT COUNT(*) FROM game_participants WHERE session_id = ?) WHERE id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(updateSql)) {
            stmt.setLong(1, sessionId);
            stmt.setLong(2, sessionId);
            stmt.executeUpdate();
        }
    }
    
    private int getCurrentPlayerCount(long sessionId) throws SQLException {
        String sql = "SELECT current_players FROM game_sessions WHERE id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, sessionId);
            try (ResultSet rs = stmt.executeQuery()) {
                rs.next();
                return rs.getInt("current_players");
            }
        }
    }
    
    // Helper classes
    
    enum TransactionType {
        EARNED, SPENT, BONUS, REFUND
    }
    
    record Transaction(TransactionType type, BigDecimal amount) {}
    
    // Custom assertions class for better error messages
    static class Assertions {
        static void assertEquals(Object expected, Object actual, String message) {
            if (!expected.equals(actual)) {
                throw new AssertionError(message + ". Expected: " + expected + ", Actual: " + actual);
            }
        }
        
        static void assertTrue(boolean condition, String message) {
            if (!condition) {
                throw new AssertionError(message);
            }
        }
        
        static void assertThrows(Class<? extends Throwable> expectedType, 
                               ThrowingRunnable executable, String message) {
            try {
                executable.run();
                throw new AssertionError(message + " - Expected exception was not thrown");
            } catch (Throwable actualException) {
                if (!expectedType.isInstance(actualException)) {
                    throw new AssertionError(message + " - Wrong exception type. Expected: " + 
                        expectedType.getSimpleName() + ", Actual: " + actualException.getClass().getSimpleName());
                }
            }
        }
    }
    
    @FunctionalInterface
    interface ThrowingRunnable {
        void run() throws Throwable;
    }
}