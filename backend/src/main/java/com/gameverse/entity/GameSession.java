package com.gameverse.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "game_sessions")
public class GameSession {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "game_type", nullable = false)
    private GameType gameType;
    
    @Column(name = "session_code", unique = true, length = 10)
    private String sessionCode;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status = Status.WAITING;
    
    @Column(name = "max_players", nullable = false)
    private Integer maxPlayers;
    
    @Column(name = "current_players", nullable = false)
    private Integer currentPlayers = 0;
    
    @Column(name = "game_state", columnDefinition = "JSON")
    private String gameState;
    
    @Column(name = "winner_id")
    private Long winnerId;
    
    @Column(name = "entry_fee", precision = 10, scale = 2)
    private BigDecimal entryFee = BigDecimal.ZERO;
    
    @Column(name = "prize_pool", precision = 10, scale = 2)
    private BigDecimal prizePool = BigDecimal.ZERO;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "started_at")
    private LocalDateTime startedAt;
    
    @Column(name = "ended_at")
    private LocalDateTime endedAt;
    
    public enum GameType {
        CAR_RACING, CHESS, UNO, RUMMY, LUDO, TRUTH_DARE, 
        MEME_BATTLE, BUBBLE_BLAST, FIGHTING, MATH_MASTER
    }
    
    public enum Status {
        WAITING, IN_PROGRESS, COMPLETED, CANCELLED
    }
    
    // Constructors
    public GameSession() {}
    
    public GameSession(GameType gameType, Integer maxPlayers) {
        this.gameType = gameType;
        this.maxPlayers = maxPlayers;
        this.createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public GameType getGameType() {
        return gameType;
    }
    
    public void setGameType(GameType gameType) {
        this.gameType = gameType;
    }
    
    public String getSessionCode() {
        return sessionCode;
    }
    
    public void setSessionCode(String sessionCode) {
        this.sessionCode = sessionCode;
    }
    
    public Status getStatus() {
        return status;
    }
    
    public void setStatus(Status status) {
        this.status = status;
    }
    
    public Integer getMaxPlayers() {
        return maxPlayers;
    }
    
    public void setMaxPlayers(Integer maxPlayers) {
        this.maxPlayers = maxPlayers;
    }
    
    public Integer getCurrentPlayers() {
        return currentPlayers;
    }
    
    public void setCurrentPlayers(Integer currentPlayers) {
        this.currentPlayers = currentPlayers;
    }
    
    public String getGameState() {
        return gameState;
    }
    
    public void setGameState(String gameState) {
        this.gameState = gameState;
    }
    
    public Long getWinnerId() {
        return winnerId;
    }
    
    public void setWinnerId(Long winnerId) {
        this.winnerId = winnerId;
    }
    
    public BigDecimal getEntryFee() {
        return entryFee;
    }
    
    public void setEntryFee(BigDecimal entryFee) {
        this.entryFee = entryFee;
    }
    
    public BigDecimal getPrizePool() {
        return prizePool;
    }
    
    public void setPrizePool(BigDecimal prizePool) {
        this.prizePool = prizePool;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getStartedAt() {
        return startedAt;
    }
    
    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }
    
    public LocalDateTime getEndedAt() {
        return endedAt;
    }
    
    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }
}