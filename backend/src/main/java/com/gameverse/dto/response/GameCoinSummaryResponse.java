package com.gameverse.dto.response;

import com.gameverse.service.GameCoinService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for GameCoin transaction summary and history
 */
public class GameCoinSummaryResponse {
    
    private BigDecimal currentBalance;
    private String formattedBalance;
    private TransactionSummaryData summary;
    private List<GameCoinTransactionResponse> recentTransactions;
    private LocalDateTime summaryPeriodStart;
    
    public GameCoinSummaryResponse() {}
    
    public GameCoinSummaryResponse(BigDecimal currentBalance, 
                                 GameCoinService.TransactionSummary summary,
                                 List<GameCoinTransactionResponse> recentTransactions,
                                 LocalDateTime summaryPeriodStart) {
        this.currentBalance = currentBalance;
        this.formattedBalance = formatBalance(currentBalance);
        this.summary = new TransactionSummaryData(summary);
        this.recentTransactions = recentTransactions;
        this.summaryPeriodStart = summaryPeriodStart;
    }
    
    private String formatBalance(BigDecimal balance) {
        return balance.stripTrailingZeros().toPlainString() + " GameCoins";
    }
    
    // Getters and Setters
    public BigDecimal getCurrentBalance() {
        return currentBalance;
    }
    
    public void setCurrentBalance(BigDecimal currentBalance) {
        this.currentBalance = currentBalance;
        this.formattedBalance = formatBalance(currentBalance);
    }
    
    public String getFormattedBalance() {
        return formattedBalance;
    }
    
    public void setFormattedBalance(String formattedBalance) {
        this.formattedBalance = formattedBalance;
    }
    
    public TransactionSummaryData getSummary() {
        return summary;
    }
    
    public void setSummary(TransactionSummaryData summary) {
        this.summary = summary;
    }
    
    public List<GameCoinTransactionResponse> getRecentTransactions() {
        return recentTransactions;
    }
    
    public void setRecentTransactions(List<GameCoinTransactionResponse> recentTransactions) {
        this.recentTransactions = recentTransactions;
    }
    
    public LocalDateTime getSummaryPeriodStart() {
        return summaryPeriodStart;
    }
    
    public void setSummaryPeriodStart(LocalDateTime summaryPeriodStart) {
        this.summaryPeriodStart = summaryPeriodStart;
    }
    
    /**
     * Nested class for transaction summary data
     */
    public static class TransactionSummaryData {
        private BigDecimal totalCredits;
        private BigDecimal totalDebits;
        private BigDecimal netAmount;
        private int creditCount;
        private int debitCount;
        private int totalTransactions;
        
        public TransactionSummaryData() {}
        
        public TransactionSummaryData(GameCoinService.TransactionSummary summary) {
            this.totalCredits = summary.getTotalCredits();
            this.totalDebits = summary.getTotalDebits();
            this.netAmount = summary.getNetAmount();
            this.creditCount = summary.getCreditCount();
            this.debitCount = summary.getDebitCount();
            this.totalTransactions = summary.getTotalTransactions();
        }
        
        // Getters and Setters
        public BigDecimal getTotalCredits() {
            return totalCredits;
        }
        
        public void setTotalCredits(BigDecimal totalCredits) {
            this.totalCredits = totalCredits;
        }
        
        public BigDecimal getTotalDebits() {
            return totalDebits;
        }
        
        public void setTotalDebits(BigDecimal totalDebits) {
            this.totalDebits = totalDebits;
        }
        
        public BigDecimal getNetAmount() {
            return netAmount;
        }
        
        public void setNetAmount(BigDecimal netAmount) {
            this.netAmount = netAmount;
        }
        
        public int getCreditCount() {
            return creditCount;
        }
        
        public void setCreditCount(int creditCount) {
            this.creditCount = creditCount;
        }
        
        public int getDebitCount() {
            return debitCount;
        }
        
        public void setDebitCount(int debitCount) {
            this.debitCount = debitCount;
        }
        
        public int getTotalTransactions() {
            return totalTransactions;
        }
        
        public void setTotalTransactions(int totalTransactions) {
            this.totalTransactions = totalTransactions;
        }
    }
}