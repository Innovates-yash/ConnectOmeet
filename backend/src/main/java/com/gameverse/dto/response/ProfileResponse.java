package com.gameverse.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.gameverse.entity.Profile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for user profile information
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProfileResponse {

    private Long id;
    private Long userId;
    private String avatarId;
    private String displayName;
    private String bio;
    private List<String> interestTags;
    private List<String> gamesPlayed;
    private Integer totalGamesWon;
    private Integer totalGamesPlayed;
    private Double winRate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public ProfileResponse() {}

    public ProfileResponse(Profile profile) {
        this.id = profile.getId();
        this.userId = profile.getUser().getId();
        this.avatarId = profile.getAvatarId();
        this.displayName = profile.getDisplayName();
        this.bio = profile.getBio();
        this.interestTags = profile.getInterestTags();
        this.gamesPlayed = profile.getGamesPlayed();
        this.totalGamesWon = profile.getTotalGamesWon();
        this.totalGamesPlayed = profile.getTotalGamesPlayed();
        this.winRate = profile.getWinRate();
        this.createdAt = profile.getCreatedAt();
        this.updatedAt = profile.getUpdatedAt();
    }

    // Static factory method
    public static ProfileResponse from(Profile profile) {
        return new ProfileResponse(profile);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getAvatarId() {
        return avatarId;
    }

    public void setAvatarId(String avatarId) {
        this.avatarId = avatarId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public List<String> getInterestTags() {
        return interestTags;
    }

    public void setInterestTags(List<String> interestTags) {
        this.interestTags = interestTags;
    }

    public List<String> getGamesPlayed() {
        return gamesPlayed;
    }

    public void setGamesPlayed(List<String> gamesPlayed) {
        this.gamesPlayed = gamesPlayed;
    }

    public Integer getTotalGamesWon() {
        return totalGamesWon;
    }

    public void setTotalGamesWon(Integer totalGamesWon) {
        this.totalGamesWon = totalGamesWon;
    }

    public Integer getTotalGamesPlayed() {
        return totalGamesPlayed;
    }

    public void setTotalGamesPlayed(Integer totalGamesPlayed) {
        this.totalGamesPlayed = totalGamesPlayed;
    }

    public Double getWinRate() {
        return winRate;
    }

    public void setWinRate(Double winRate) {
        this.winRate = winRate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return "ProfileResponse{" +
                "id=" + id +
                ", userId=" + userId +
                ", avatarId='" + avatarId + '\'' +
                ", displayName='" + displayName + '\'' +
                ", totalGamesWon=" + totalGamesWon +
                ", totalGamesPlayed=" + totalGamesPlayed +
                ", winRate=" + winRate +
                '}';
    }
}