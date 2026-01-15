package com.gameverse.dto.request;

import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request DTO for updating user profile
 */
public class UpdateProfileRequest {

    @Size(max = 50, message = "Avatar ID must not exceed 50 characters")
    private String avatarId;

    @Size(min = 3, max = 50, message = "Display name must be between 3 and 50 characters")
    private String displayName;

    @Size(max = 500, message = "Bio must not exceed 500 characters")
    private String bio;

    @Size(min = 1, message = "At least 1 interest tag is required")
    private List<String> interestTags;

    // Constructors
    public UpdateProfileRequest() {}

    public UpdateProfileRequest(String avatarId, String displayName, String bio, List<String> interestTags) {
        this.avatarId = avatarId;
        this.displayName = displayName;
        this.bio = bio;
        this.interestTags = interestTags;
    }

    // Getters and Setters
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

    @Override
    public String toString() {
        return "UpdateProfileRequest{" +
                "avatarId='" + avatarId + '\'' +
                ", displayName='" + displayName + '\'' +
                ", bio='" + bio + '\'' +
                ", interestTags=" + interestTags +
                '}';
    }
}