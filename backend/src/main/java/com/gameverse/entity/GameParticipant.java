package com.gameverse.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "game_participants")
public class GameParticipant {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "session_id", nullable = false)
    private Long sessionId;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "player_position")
    private Integer playerPosition;
    
    @Column(name = "final_score")
    private Integer finalScore = 0;
    
    @Column(name = "coins_won", precision = 10, scale = 2)
    private BigDecimal coinsWon = BigDecimal.ZERO;
    
    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;
    
    // Constructors
    public GameParticipant() {}
    
    public GameParticipant(Long sessionId, Long userId, Integer playerPosition) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.playerPosition = playerPosition;
        this.joinedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public Integer getPlayerPosition() {
        return playerPosition;
    }
    
    public void setPlayerPosition(Integer playerPosition) {
        this.playerPosition = playerPosition;
    }
    
    public Integer getFinalScore() {
        return finalScore;
    }
    
    public void setFinalScore(Integer finalScore) {
        this.finalScore = finalScore;
    }
    
    public BigDecimal getCoinsWon() {
        return coinsWon;
    }
    
    public void setCoinsWon(BigDecimal coinsWon) {
        this.coinsWon = coinsWon;
    }
    
    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }
    
    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }
}