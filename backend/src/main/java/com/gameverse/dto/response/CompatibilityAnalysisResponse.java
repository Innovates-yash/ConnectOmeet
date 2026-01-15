package com.gameverse.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response DTO for detailed compatibility analysis
 */
public class CompatibilityAnalysisResponse {
    
    @JsonProperty("overall_score")
    private double overallScore;
    
    @JsonProperty("interest_score")
    private double interestScore;
    
    @JsonProperty("game_score")
    private double gameScore;
    
    @JsonProperty("common_interests")
    private String[] commonInterests;
    
    @JsonProperty("user1_games_played")
    private int user1GamesPlayed;
    
    @JsonProperty("user2_games_played")
    private int user2GamesPlayed;
    
    @JsonProperty("compatibility_level")
    private String compatibilityLevel;
    
    @JsonProperty("recommendation")
    private String recommendation;

    // Default constructor
    public CompatibilityAnalysisResponse() {}

    // Constructor
    public CompatibilityAnalysisResponse(double overallScore, double interestScore, double gameScore,
                                       String[] commonInterests, int user1GamesPlayed, int user2GamesPlayed) {
        this.overallScore = overallScore;
        this.interestScore = interestScore;
        this.gameScore = gameScore;
        this.commonInterests = commonInterests;
        this.user1GamesPlayed = user1GamesPlayed;
        this.user2GamesPlayed = user2GamesPlayed;
        this.compatibilityLevel = determineCompatibilityLevel(overallScore);
        this.recommendation = generateRecommendation(overallScore, commonInterests.length);
    }

    private String determineCompatibilityLevel(double score) {
        if (score >= 80) return "EXCELLENT";
        if (score >= 60) return "GOOD";
        if (score >= 40) return "MODERATE";
        if (score >= 20) return "LOW";
        return "VERY_LOW";
    }

    private String generateRecommendation(double score, int commonInterestsCount) {
        if (score >= 80) {
            return "Perfect match! You have " + commonInterestsCount + " shared interests. Start a game together!";
        } else if (score >= 60) {
            return "Great compatibility! You share " + commonInterestsCount + " interests. Try playing together!";
        } else if (score >= 40) {
            return "Good potential! You have " + commonInterestsCount + " common interests. Consider connecting!";
        } else if (score >= 20) {
            return "Some compatibility found. You might discover new interests together!";
        } else {
            return "Different interests, but gaming can bring people together! Give it a try!";
        }
    }

    // Getters and Setters
    public double getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(double overallScore) {
        this.overallScore = overallScore;
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

    public int getUser1GamesPlayed() {
        return user1GamesPlayed;
    }

    public void setUser1GamesPlayed(int user1GamesPlayed) {
        this.user1GamesPlayed = user1GamesPlayed;
    }

    public int getUser2GamesPlayed() {
        return user2GamesPlayed;
    }

    public void setUser2GamesPlayed(int user2GamesPlayed) {
        this.user2GamesPlayed = user2GamesPlayed;
    }

    public String getCompatibilityLevel() {
        return compatibilityLevel;
    }

    public void setCompatibilityLevel(String compatibilityLevel) {
        this.compatibilityLevel = compatibilityLevel;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }
}