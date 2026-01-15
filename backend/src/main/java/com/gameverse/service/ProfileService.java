package com.gameverse.service;

import com.gameverse.dto.request.CreateProfileRequest;
import com.gameverse.dto.request.UpdateProfileRequest;
import com.gameverse.dto.response.ProfileResponse;
import com.gameverse.entity.Profile;
import com.gameverse.entity.User;
import com.gameverse.repository.ProfileRepository;
import com.gameverse.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Profile Service for managing user profiles and "Vibe Check" functionality
 * 
 * Features:
 * - Create interactive "Vibe Check" profiles
 * - Manage avatar selection and interest tags
 * - Award initial GameCoins on profile completion
 * - Profile validation and uniqueness checks
 */
@Service
@Transactional
public class ProfileService {

    private static final Logger logger = LoggerFactory.getLogger(ProfileService.class);

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Create user profile during "Vibe Check"
     */
    public ProfileResponse createProfile(Long userId, CreateProfileRequest request) {
        logger.info("Creating profile for user: {}", userId);

        // Find user
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found");
        }

        User user = userOpt.get();

        // Check if user already has a profile
        if (user.hasProfile()) {
            throw new IllegalStateException("User already has a profile");
        }

        // Validate display name uniqueness
        if (profileRepository.existsByDisplayName(request.getDisplayName())) {
            throw new IllegalArgumentException("Display name already exists. Please choose a different name.");
        }

        // Validate avatar ID
        validateAvatarId(request.getAvatarId());

        // Validate interest tags
        validateInterestTags(request.getInterestTags());

        // Create profile
        Profile profile = new Profile(
            user,
            request.getAvatarId(),
            request.getDisplayName(),
            new ArrayList<>(request.getInterestTags())
        );

        if (request.getBio() != null && !request.getBio().trim().isEmpty()) {
            profile.setBio(request.getBio().trim());
        }

        // Initialize empty games played list
        profile.setGamesPlayed(new ArrayList<>());

        // Save profile
        profile = profileRepository.save(profile);

        // Award initial GameCoins (1000 coins are already set in User entity)
        // This is just to ensure the user has the coins
        if (user.getGameCoins().compareTo(BigDecimal.valueOf(1000)) < 0) {
            user.setGameCoins(BigDecimal.valueOf(1000));
            userRepository.save(user);
        }

        logger.info("Profile created successfully for user: {} with display name: {}", 
                   userId, request.getDisplayName());

        return ProfileResponse.from(profile);
    }

    /**
     * Update user profile
     */
    public ProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        logger.info("Updating profile for user: {}", userId);

        // Find user's profile
        Optional<Profile> profileOpt = profileRepository.findByUserId(userId);
        if (profileOpt.isEmpty()) {
            throw new IllegalArgumentException("Profile not found for user");
        }

        Profile profile = profileOpt.get();

        // Update avatar if provided
        if (request.getAvatarId() != null) {
            validateAvatarId(request.getAvatarId());
            profile.setAvatarId(request.getAvatarId());
        }

        // Update display name if provided
        if (request.getDisplayName() != null) {
            // Check uniqueness only if name is different
            if (!request.getDisplayName().equals(profile.getDisplayName()) &&
                profileRepository.existsByDisplayName(request.getDisplayName())) {
                throw new IllegalArgumentException("Display name already exists. Please choose a different name.");
            }
            profile.setDisplayName(request.getDisplayName());
        }

        // Update bio if provided
        if (request.getBio() != null) {
            profile.setBio(request.getBio().trim());
        }

        // Update interest tags if provided
        if (request.getInterestTags() != null) {
            validateInterestTags(request.getInterestTags());
            profile.setInterestTags(new ArrayList<>(request.getInterestTags()));
        }

        // Save updated profile
        profile = profileRepository.save(profile);

        logger.info("Profile updated successfully for user: {}", userId);

        return ProfileResponse.from(profile);
    }

    /**
     * Get user profile by user ID
     */
    public ProfileResponse getProfile(Long userId) {
        Optional<Profile> profileOpt = profileRepository.findByUserId(userId);
        if (profileOpt.isEmpty()) {
            throw new IllegalArgumentException("Profile not found for user");
        }

        return ProfileResponse.from(profileOpt.get());
    }

    /**
     * Get profile by profile ID
     */
    public ProfileResponse getProfileById(Long profileId) {
        Optional<Profile> profileOpt = profileRepository.findById(profileId);
        if (profileOpt.isEmpty()) {
            throw new IllegalArgumentException("Profile not found");
        }

        return ProfileResponse.from(profileOpt.get());
    }

    /**
     * Check if display name is available
     */
    public boolean isDisplayNameAvailable(String displayName) {
        return !profileRepository.existsByDisplayName(displayName);
    }

    /**
     * Get available avatars list
     */
    public List<String> getAvailableAvatars() {
        // In a real implementation, this would come from a configuration or database
        return List.of(
            "cyber_warrior_01", "cyber_warrior_02", "cyber_warrior_03",
            "neon_ninja_01", "neon_ninja_02", "neon_ninja_03",
            "pixel_punk_01", "pixel_punk_02", "pixel_punk_03",
            "digital_samurai_01", "digital_samurai_02", "digital_samurai_03",
            "tech_mage_01", "tech_mage_02", "tech_mage_03",
            "chrome_assassin_01", "chrome_assassin_02", "chrome_assassin_03",
            "quantum_hacker_01", "quantum_hacker_02", "quantum_hacker_03",
            "neon_ghost_01", "neon_ghost_02", "neon_ghost_03"
        );
    }

    /**
     * Get available interest tags
     */
    public List<String> getAvailableInterestTags() {
        return List.of(
            // Gaming Categories
            "FPS", "Strategy", "RPG", "MMORPG", "Battle Royale", "MOBA",
            "Racing", "Sports", "Fighting", "Puzzle", "Arcade", "Simulation",
            "Survival", "Horror", "Adventure", "Platform", "Indie",
            
            // Gaming Styles
            "Competitive", "Casual", "Hardcore", "Speedrun", "Co-op", "Solo",
            "PvP", "PvE", "Esports", "Streaming", "Content Creation",
            
            // Interests
            "Anime", "Manga", "Sci-Fi", "Fantasy", "Cyberpunk", "Retro",
            "Music", "Art", "Technology", "Programming", "Memes", "Social",
            "Creative", "Learning", "Teaching", "Community", "Events"
        );
    }

    /**
     * Record game played for profile
     */
    public void recordGamePlayed(Long userId, String gameType, boolean won) {
        Optional<Profile> profileOpt = profileRepository.findByUserId(userId);
        if (profileOpt.isPresent()) {
            Profile profile = profileOpt.get();
            if (won) {
                profile.recordGameWin(gameType);
            } else {
                profile.addGamePlayed(gameType);
            }
            profileRepository.save(profile);
            
            logger.info("Recorded game {} for user: {} (won: {})", gameType, userId, won);
        }
    }

    /**
     * Get profiles for matching (excluding current user)
     */
    public List<ProfileResponse> getProfilesForMatching(Long userId) {
        List<Profile> profiles = profileRepository.findProfilesForMatching(userId);
        return profiles.stream()
                .map(ProfileResponse::from)
                .toList();
    }

    /**
     * Search profiles by display name
     */
    public List<ProfileResponse> searchProfiles(String searchTerm) {
        List<Profile> profiles = profileRepository.searchByDisplayName(searchTerm);
        return profiles.stream()
                .map(ProfileResponse::from)
                .toList();
    }

    /**
     * Get top players by games won
     */
    public List<ProfileResponse> getTopPlayers(int limit) {
        List<Profile> profiles = profileRepository.findTopPlayersByGamesWon();
        return profiles.stream()
                .limit(limit)
                .map(ProfileResponse::from)
                .toList();
    }

    // Validation methods

    private void validateAvatarId(String avatarId) {
        List<String> availableAvatars = getAvailableAvatars();
        if (!availableAvatars.contains(avatarId)) {
            throw new IllegalArgumentException("Invalid avatar ID. Please select from available avatars.");
        }
    }

    private void validateInterestTags(List<String> interestTags) {
        if (interestTags == null || interestTags.size() < 3) {
            throw new IllegalArgumentException("At least 3 interest tags are required");
        }

        if (interestTags.size() > 10) {
            throw new IllegalArgumentException("Maximum 10 interest tags allowed");
        }

        List<String> availableTags = getAvailableInterestTags();
        for (String tag : interestTags) {
            if (!availableTags.contains(tag)) {
                throw new IllegalArgumentException("Invalid interest tag: " + tag);
            }
        }

        // Check for duplicates
        if (interestTags.size() != interestTags.stream().distinct().count()) {
            throw new IllegalArgumentException("Duplicate interest tags are not allowed");
        }
    }
}