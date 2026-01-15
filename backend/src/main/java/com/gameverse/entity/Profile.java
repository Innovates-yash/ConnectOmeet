package com.gameverse.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Profile entity representing user gaming profiles and preferences
 */
@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "avatar_id", nullable = false, length = 50)
    private String avatarId;

    @Column(name = "display_name", nullable = false, length = 50)
    private String displayName;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "interest_tags", columnDefinition = "JSON")
    private List<String> interestTags;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "games_played", columnDefinition = "JSON")
    private List<String> gamesPlayed;

    @Column(name = "total_games_won")
    private Integer totalGamesWon = 0;

    @Column(name = "total_games_played")
    private Integer totalGamesPlayed = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public Profile() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Profile(User user, String avatarId, String displayName, List<String> interestTags) {
        this();
        this.user = user;
        this.avatarId = avatarId;
        this.displayName = displayName;
        this.interestTags = interestTags;
    }

    // JPA lifecycle callbacks
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Business methods
    public void addGamePlayed(String gameType) {
        if (gamesPlayed != null && !gamesPlayed.contains(gameType)) {
            gamesPlayed.add(gameType);
        }
        totalGamesPlayed++;
    }

    public void recordGameWin(String gameType) {
        addGamePlayed(gameType);
        totalGamesWon++;
    }

    public double getWinRate() {
        if (totalGamesPlayed == 0) {
            return 0.0;
        }
        return (double) totalGamesWon / totalGamesPlayed;
    }

    public boolean hasInterest(String interest) {
        return interestTags != null && interestTags.contains(interest);
    }

    public boolean hasPlayedGame(String gameType) {
        return gamesPlayed != null && gamesPlayed.contains(gameType);
    }

    public int getSharedInterests(Profile otherProfile) {
        if (this.interestTags == null || otherProfile.getInterestTags() == null) {
            return 0;
        }
        
        return (int) this.interestTags.stream()
            .filter(otherProfile.getInterestTags()::contains)
            .count();
    }

    public int getSharedGames(Profile otherProfile) {
        if (this.gamesPlayed == null || otherProfile.getGamesPlayed() == null) {
            return 0;
        }
        
        return (int) this.gamesPlayed.stream()
            .filter(otherProfile.getGamesPlayed()::contains)
            .count();
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
        return "Profile{" +
                "id=" + id +
                ", avatarId='" + avatarId + '\'' +
                ", displayName='" + displayName + '\'' +
                ", interestTags=" + interestTags +
                ", totalGamesWon=" + totalGamesWon +
                ", totalGamesPlayed=" + totalGamesPlayed +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Profile)) return false;
        Profile profile = (Profile) o;
        return id != null && id.equals(profile.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}