package com.gameverse.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for GameCoin balance information
 */
public class GameCoinBalanceResponse {
    
    private BigDecimal balance;
    private String formattedBalance;
    private Long userId;
    
    public GameCoinBalanceResponse() {}
    
    public GameCoinBalanceResponse(BigDecimal balance, Long userId) {
        this.balance = balance;
        this.userId = userId;
        this.formattedBalance = formatBalance(balance);
    }
    
    private String formatBalance(BigDecimal balance) {
        return balance.stripTrailingZeros().toPlainString() + " GameCoins";
    }
    
    // Getters and Setters
    public BigDecimal getBalance() {
        return balance;
    }
    
    public void setBalance(BigDecimal balance) {
        this.balance = balance;
        this.formattedBalance = formatBalance(balance);
    }
    
    public String getFormattedBalance() {
        return formattedBalance;
    }
    
    public void setFormattedBalance(String formattedBalance) {
        this.formattedBalance = formattedBalance;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
}