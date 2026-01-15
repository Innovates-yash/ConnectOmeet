package com.gameverse.controller;

import com.gameverse.dto.response.GameCoinBalanceResponse;
import com.gameverse.dto.response.GameCoinSummaryResponse;
import com.gameverse.dto.response.GameCoinTransactionResponse;
import com.gameverse.entity.GameCoinTransaction;
import com.gameverse.service.GameCoinService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST Controller for GameCoin virtual currency operations
 * Provides endpoints for balance checking, transaction history, and currency management
 */
@RestController
@RequestMapping("/gamecoins")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class GameCoinController {

    @Autowired
    private GameCoinService gameCoinService;

    /**
     * Get current user's GameCoin balance
     * 
     * @param authentication Current user authentication
     * @return Balance response
     */
    @GetMapping("/balance")
    public ResponseEntity<GameCoinBalanceResponse> getBalance(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        BigDecimal balance = gameCoinService.getUserBalance(userId);
        
        GameCoinBalanceResponse response = new GameCoinBalanceResponse(balance, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get user's transaction history with pagination
     * 
     * @param authentication Current user authentication
     * @param page Page number (default: 0)
     * @param size Page size (default: 20, max: 100)
     * @return Paginated transaction history
     */
    @GetMapping("/transactions")
    public ResponseEntity<Map<String, Object>> getTransactionHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        // Limit page size to prevent abuse
        size = Math.min(size, 100);
        
        Long userId = getUserIdFromAuth(authentication);
        Page<GameCoinTransaction> transactionPage = gameCoinService.getUserTransactionHistory(userId, page, size);
        
        List<GameCoinTransactionResponse> transactions = transactionPage.getContent()
                .stream()
                .map(GameCoinTransactionResponse::new)
                .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("transactions", transactions);
        response.put("currentPage", transactionPage.getNumber());
        response.put("totalPages", transactionPage.getTotalPages());
        response.put("totalElements", transactionPage.getTotalElements());
        response.put("hasNext", transactionPage.hasNext());
        response.put("hasPrevious", transactionPage.hasPrevious());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get recent transactions (last 10)
     * 
     * @param authentication Current user authentication
     * @return Recent transactions
     */
    @GetMapping("/transactions/recent")
    public ResponseEntity<List<GameCoinTransactionResponse>> getRecentTransactions(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        List<GameCoinTransaction> recentTransactions = gameCoinService.getRecentTransactions(userId, 10);
        
        List<GameCoinTransactionResponse> response = recentTransactions.stream()
                .map(GameCoinTransactionResponse::new)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get comprehensive GameCoin summary including balance, recent transactions, and period summary
     * 
     * @param authentication Current user authentication
     * @param days Number of days for summary period (default: 30)
     * @return Comprehensive summary
     */
    @GetMapping("/summary")
    public ResponseEntity<GameCoinSummaryResponse> getSummary(
            Authentication authentication,
            @RequestParam(defaultValue = "30") int days) {
        
        Long userId = getUserIdFromAuth(authentication);
        
        // Get current balance
        BigDecimal currentBalance = gameCoinService.getUserBalance(userId);
        
        // Get summary for the specified period
        LocalDateTime summaryStart = LocalDateTime.now().minusDays(days);
        GameCoinService.TransactionSummary summary = gameCoinService.getTransactionSummary(userId, summaryStart);
        
        // Get recent transactions
        List<GameCoinTransaction> recentTransactions = gameCoinService.getRecentTransactions(userId, 5);
        List<GameCoinTransactionResponse> recentTransactionResponses = recentTransactions.stream()
                .map(GameCoinTransactionResponse::new)
                .collect(Collectors.toList());
        
        GameCoinSummaryResponse response = new GameCoinSummaryResponse(
                currentBalance, summary, recentTransactionResponses, summaryStart);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Check if user has sufficient balance for a specific amount
     * 
     * @param authentication Current user authentication
     * @param amount Amount to check
     * @return Balance check result
     */
    @GetMapping("/balance/check")
    public ResponseEntity<Map<String, Object>> checkBalance(
            Authentication authentication,
            @RequestParam BigDecimal amount) {
        
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Amount must be positive",
                "hasSufficientBalance", false
            ));
        }
        
        Long userId = getUserIdFromAuth(authentication);
        boolean hasSufficientBalance = gameCoinService.hasSufficientBalance(userId, amount);
        BigDecimal currentBalance = gameCoinService.getUserBalance(userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("hasSufficientBalance", hasSufficientBalance);
        response.put("currentBalance", currentBalance);
        response.put("requiredAmount", amount);
        response.put("shortfall", hasSufficientBalance ? BigDecimal.ZERO : amount.subtract(currentBalance));
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get game entry fees and rewards information
     * 
     * @return Game pricing information
     */
    @GetMapping("/game-pricing")
    public ResponseEntity<Map<String, Object>> getGamePricing() {
        Map<String, Object> response = new HashMap<>();
        
        // Game entry fees
        Map<String, BigDecimal> entryFees = new HashMap<>();
        entryFees.put("RUMMY", gameCoinService.getGameEntryFee("RUMMY"));
        entryFees.put("MEME_BATTLE", gameCoinService.getGameEntryFee("MEME_BATTLE"));
        entryFees.put("TOURNAMENT", gameCoinService.getGameEntryFee("TOURNAMENT"));
        
        // Game rewards
        Map<String, BigDecimal> rewards = new HashMap<>();
        rewards.put("CHESS", gameCoinService.getGameReward("CHESS"));
        rewards.put("UNO", gameCoinService.getGameReward("UNO"));
        rewards.put("RACING", gameCoinService.getGameReward("RACING"));
        rewards.put("FIGHTING", gameCoinService.getGameReward("FIGHTING"));
        rewards.put("MATH_MASTER", gameCoinService.getGameReward("MATH_MASTER"));
        rewards.put("LUDO", gameCoinService.getGameReward("LUDO"));
        rewards.put("TRUTH_OR_DARE", gameCoinService.getGameReward("TRUTH_OR_DARE"));
        rewards.put("BUBBLE_BLAST", gameCoinService.getGameReward("BUBBLE_BLAST"));
        rewards.put("RUMMY", gameCoinService.getGameReward("RUMMY"));
        
        response.put("entryFees", entryFees);
        response.put("rewards", rewards);
        response.put("dailyBonus", BigDecimal.valueOf(50));
        response.put("memeWinnerBonus", BigDecimal.valueOf(200));
        
        return ResponseEntity.ok(response);
    }

    /**
     * Award daily bonus to user (typically called by scheduled task or user action)
     * 
     * @param authentication Current user authentication
     * @return Transaction response
     */
    @PostMapping("/daily-bonus")
    public ResponseEntity<GameCoinTransactionResponse> claimDailyBonus(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        
        try {
            GameCoinTransaction transaction = gameCoinService.awardDailyBonus(userId);
            GameCoinTransactionResponse response = new GameCoinTransactionResponse(transaction);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * Verify user's balance integrity
     * 
     * @param authentication Current user authentication
     * @return Verification result
     */
    @GetMapping("/verify-balance")
    public ResponseEntity<Map<String, Object>> verifyBalance(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        boolean isValid = gameCoinService.verifyBalanceIntegrity(userId);
        BigDecimal currentBalance = gameCoinService.getUserBalance(userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("isValid", isValid);
        response.put("currentBalance", currentBalance);
        response.put("message", isValid ? "Balance verified successfully" : "Balance integrity check failed");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Extract user ID from authentication object
     * 
     * @param authentication Spring Security authentication
     * @return User ID
     */
    private Long getUserIdFromAuth(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        Object principal = authentication.getPrincipal();
        
        // If principal is our User entity (from JWT authentication)
        if (principal instanceof com.gameverse.entity.User) {
            return ((com.gameverse.entity.User) principal).getId();
        }
        
        // If principal is UserDetails with phone number as username
        if (principal instanceof UserDetails) {
            UserDetails userDetails = (UserDetails) principal;
            String phoneNumber = userDetails.getUsername();
            
            // For testing purposes, we'll use a mock user ID
            // In production, this would require UserRepository injection to look up by phone
            // TODO: Inject UserRepository to look up user by phone number
            return 1L; // Mock user ID for development
        }
        
        throw new RuntimeException("Unable to extract user ID from authentication");
    }
}