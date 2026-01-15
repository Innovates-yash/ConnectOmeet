package com.gameverse.dto.response;

import com.gameverse.entity.RoomParticipant;
import java.time.LocalDateTime;

/**
 * Response DTO for RoomParticipant information
 */
public class RoomParticipantResponse {
    
    private Long id;
    private Long userId;
    private String displayName;
    private String avatarId;
    private LocalDateTime joinedAt;
    private LocalDateTime lastActivity;
    private Boolean isActive;
    
    public RoomParticipantResponse() {}
    
    public RoomParticipantResponse(RoomParticipant participant) {
        this.id = participant.getId();
        this.userId = participant.getUser().getId();
        this.displayName = participant.getUser().getProfile() != null ? 
            participant.getUser().getProfile().getDisplayName() : "Anonymous";
        this.avatarId = participant.getUser().getProfile() != null ? 
            participant.getUser().getProfile().getAvatarId() : "default";
        this.joinedAt = participant.getJoinedAt();
        this.lastActivity = participant.getLastActivity();
        this.isActive = participant.getIsActive();
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
    
    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }
    
    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }
    
    public LocalDateTime getLastActivity() {
        return lastActivity;
    }
    
    public void setLastActivity(LocalDateTime lastActivity) {
        this.lastActivity = lastActivity;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}