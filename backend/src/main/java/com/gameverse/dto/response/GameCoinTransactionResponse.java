package com.gameverse.dto.response;

import com.gameverse.entity.GameCoinTransaction;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for GameCoin transaction information
 */
public class GameCoinTransactionResponse {
    
    private Long id;
    private String transactionType;
    private BigDecimal amount;
    private String formattedAmount;
    private BigDecimal balanceBefore;
    private BigDecimal balanceAfter;
    private String description;
    private String referenceId;
    private String referenceType;
    private LocalDateTime createdAt;
    
    public GameCoinTransactionResponse() {}
    
    public GameCoinTransactionResponse(GameCoinTransaction transaction) {
        this.id = transaction.getId();
        this.transactionType = transaction.getTransactionType().name();
        this.amount = transaction.getAmount();
        this.formattedAmount = formatAmount(transaction.getAmount(), transaction.getTransactionType());
        this.balanceBefore = transaction.getBalanceBefore();
        this.balanceAfter = transaction.getBalanceAfter();
        this.description = transaction.getDescription();
        this.referenceId = transaction.getReferenceId();
        this.referenceType = transaction.getReferenceType();
        this.createdAt = transaction.getCreatedAt();
    }
    
    private String formatAmount(BigDecimal amount, GameCoinTransaction.TransactionType type) {
        String prefix = (type == GameCoinTransaction.TransactionType.DEBIT) ? "-" : "+";
        return prefix + amount.stripTrailingZeros().toPlainString();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getTransactionType() {
        return transactionType;
    }
    
    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }
    
    public BigDecimal getAmount() {
        return amount;
    }
    
    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
    
    public String getFormattedAmount() {
        return formattedAmount;
    }
    
    public void setFormattedAmount(String formattedAmount) {
        this.formattedAmount = formattedAmount;
    }
    
    public BigDecimal getBalanceBefore() {
        return balanceBefore;
    }
    
    public void setBalanceBefore(BigDecimal balanceBefore) {
        this.balanceBefore = balanceBefore;
    }
    
    public BigDecimal getBalanceAfter() {
        return balanceAfter;
    }
    
    public void setBalanceAfter(BigDecimal balanceAfter) {
        this.balanceAfter = balanceAfter;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getReferenceId() {
        return referenceId;
    }
    
    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }
    
    public String getReferenceType() {
        return referenceType;
    }
    
    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}