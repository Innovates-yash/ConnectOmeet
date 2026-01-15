package com.gameverse.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity representing GameCoin transactions for virtual currency management
 */
@Entity
@Table(name = "gamecoin_transactions")
public class GameCoinTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "balance_before", nullable = false, precision = 10, scale = 2)
    private BigDecimal balanceBefore;

    @Column(name = "balance_after", nullable = false, precision = 10, scale = 2)
    private BigDecimal balanceAfter;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "reference_id", length = 100)
    private String referenceId; // Game session ID, achievement ID, etc.

    @Column(name = "reference_type", length = 50)
    private String referenceType; // "GAME_WIN", "DAILY_BONUS", "PURCHASE", etc.

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Constructors
    public GameCoinTransaction() {
        this.createdAt = LocalDateTime.now();
    }

    public GameCoinTransaction(User user, TransactionType transactionType, BigDecimal amount,
                              BigDecimal balanceBefore, BigDecimal balanceAfter, String description) {
        this();
        this.user = user;
        this.transactionType = transactionType;
        this.amount = amount;
        this.balanceBefore = balanceBefore;
        this.balanceAfter = balanceAfter;
        this.description = description;
    }

    public GameCoinTransaction(User user, TransactionType transactionType, BigDecimal amount,
                              BigDecimal balanceBefore, BigDecimal balanceAfter, String description,
                              String referenceId, String referenceType) {
        this(user, transactionType, amount, balanceBefore, balanceAfter, description);
        this.referenceId = referenceId;
        this.referenceType = referenceType;
    }

    // Enums
    public enum TransactionType {
        CREDIT,     // Adding coins (game wins, bonuses, etc.)
        DEBIT,      // Spending coins (game entry fees, purchases, etc.)
        INITIAL,    // Initial registration bonus
        BONUS,      // Daily/weekly bonuses
        REFUND      // Refunds for cancelled games, etc.
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public TransactionType getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(TransactionType transactionType) {
        this.transactionType = transactionType;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
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

    @Override
    public String toString() {
        return "GameCoinTransaction{" +
                "id=" + id +
                ", transactionType=" + transactionType +
                ", amount=" + amount +
                ", balanceBefore=" + balanceBefore +
                ", balanceAfter=" + balanceAfter +
                ", description='" + description + '\'' +
                ", referenceType='" + referenceType + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof GameCoinTransaction)) return false;
        GameCoinTransaction that = (GameCoinTransaction) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}