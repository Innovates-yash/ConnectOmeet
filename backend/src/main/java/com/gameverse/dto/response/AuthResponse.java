package com.gameverse.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Authentication response containing JWT tokens and user information
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {
    
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private Long expiresIn; // Token expiration time in seconds
    private UserInfo user;
    private boolean isNewUser; // True if this is the first login (needs profile setup)

    // Constructors
    public AuthResponse() {}

    public AuthResponse(String accessToken, String refreshToken, Long expiresIn, UserInfo user, boolean isNewUser) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
        this.user = user;
        this.isNewUser = isNewUser;
    }

    // Getters and Setters
    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public Long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(Long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public UserInfo getUser() {
        return user;
    }

    public void setUser(UserInfo user) {
        this.user = user;
    }

    public boolean isNewUser() {
        return isNewUser;
    }

    public void setNewUser(boolean newUser) {
        isNewUser = newUser;
    }

    /**
     * Nested class for user information in auth response
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserInfo {
        private Long id;
        private String phoneNumber;
        private Double gameCoins;
        private boolean hasProfile;
        private String displayName;
        private String avatarId;

        // Constructors
        public UserInfo() {}

        public UserInfo(Long id, String phoneNumber, Double gameCoins, boolean hasProfile) {
            this.id = id;
            this.phoneNumber = phoneNumber;
            this.gameCoins = gameCoins;
            this.hasProfile = hasProfile;
        }

        // Getters and Setters
        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getPhoneNumber() {
            return phoneNumber;
        }

        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }

        public Double getGameCoins() {
            return gameCoins;
        }

        public void setGameCoins(Double gameCoins) {
            this.gameCoins = gameCoins;
        }

        public boolean isHasProfile() {
            return hasProfile;
        }

        public void setHasProfile(boolean hasProfile) {
            this.hasProfile = hasProfile;
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
    }

    @Override
    public String toString() {
        return "AuthResponse{" +
                "tokenType='" + tokenType + '\'' +
                ", expiresIn=" + expiresIn +
                ", user=" + user +
                ", isNewUser=" + isNewUser +
                '}';
    }
}