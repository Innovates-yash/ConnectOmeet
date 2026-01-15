package com.gameverse.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response DTO for compatibility score calculations
 */
public class CompatibilityResponse {
    
    @JsonProperty("user_id")
    private Long userId;
    
    @JsonProperty("display_name")
    private String displayName;
    
    @JsonProperty("avatar_id")
    private String avatarId;
    
    @JsonProperty("compatibility_score")
    private double compatibilityScore;
    
    @JsonProperty("interest_score")
    private double interestScore;
    
    @JsonProperty("game_score")
    private double gameScore;
    
    @JsonProperty("common_interests")
    private String[] commonInterests;
    
    @JsonProperty("total_games_played")
    private int totalGamesPlayed;

    // Default constructor
    public CompatibilityResponse() {}

    // Constructor for basic compatibility result
    public CompatibilityResponse(Long userId, String displayName, String avatarId, 
                               double compatibilityScore, int totalGamesPlayed) {
        this.userId = userId;
        this.displayName = displayName;
        this.avatarId = avatarId;
        this.compatibilityScore = compatibilityScore;
        this.totalGamesPlayed = totalGamesPlayed;
    }

    // Constructor for detailed compatibility analysis
    public CompatibilityResponse(Long userId, String displayName, String avatarId,
                               double compatibilityScore, double interestScore, double gameScore,
                               String[] commonInterests, int totalGamesPlayed) {
        this.userId = userId;
        this.displayName = displayName;
        this.avatarId = avatarId;
        this.compatibilityScore = compatibilityScore;
        this.interestScore = interestScore;
        this.gameScore = gameScore;
        this.commonInterests = commonInterests;
        this.totalGamesPlayed = totalGamesPlayed;
    }

    // Getters and Setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getAvatarId() {
        return avatarId;
    }

    public void setAvatarId(String avatarId) {
        this.avatarId = avatarId;
    }

    public double getCompatibilityScore() {
        return compatibilityScore;
    }

    public void setCompatibilityScore(double compatibilityScore) {
        this.compatibilityScore = compatibilityScore;
    }

    public double getInterestScore() {
        return interestScore;
    }

    public void setInterestScore(double interestScore) {
        this.interestScore = interestScore;
    }

    public double getGameScore() {
        return gameScore;
    }

    public void setGameScore(double gameScore) {
        this.gameScore = gameScore;
    }

    public String[] getCommonInterests() {
        return commonInterests;
    }

    public void setCommonInterests(String[] commonInterests) {
        this.commonInterests = commonInterests;
    }

    public int getTotalGamesPlayed() {
        return totalGamesPlayed;
    }

    public void setTotalGamesPlayed(int totalGamesPlayed) {
        this.totalGamesPlayed = totalGamesPlayed;
    }
}