package com.gameverse.controller;

import com.gameverse.dto.request.CreateProfileRequest;
import com.gameverse.dto.request.UpdateProfileRequest;
import com.gameverse.dto.response.ApiResponse;
import com.gameverse.dto.response.ProfileResponse;
import com.gameverse.entity.User;
import com.gameverse.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Profile Controller for managing user profiles and "Vibe Check" functionality
 * 
 * Endpoints:
 * - Create profile (Vibe Check)
 * - Update profile
 * - Get profile information
 * - Avatar and interest tag management
 */
@RestController
@RequestMapping("/profile")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    /**
     * Create user profile during "Vibe Check"
     * POST /api/v1/profile/create
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse> createProfile(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody CreateProfileRequest request) {
        try {
            ProfileResponse profile = profileService.createProfile(currentUser.getId(), request);
            
            return ResponseEntity.ok(
                ApiResponse.success("Profile created successfully! Welcome to GameVerse!", profile)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("Failed to create profile: " + e.getMessage())
            );
        }
    }

    /**
     * Update user profile
     * PUT /api/v1/profile/update
     */
    @PutMapping("/update")
    public ResponseEntity<ApiResponse> updateProfile(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        try {
            ProfileResponse profile = profileService.updateProfile(currentUser.getId(), request);
            
            return ResponseEntity.ok(
                ApiResponse.success("Profile updated successfully", profile)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("Failed to update profile: " + e.getMessage())
            );
        }
    }

    /**
     * Get current user's profile
     * GET /api/v1/profile/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse> getMyProfile(@AuthenticationPrincipal User currentUser) {
        try {
            ProfileResponse profile = profileService.getProfile(currentUser.getId());
            
            return ResponseEntity.ok(
                ApiResponse.success("Profile retrieved successfully", profile)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("Failed to get profile: " + e.getMessage())
            );
        }
    }

    /**
     * Get profile by ID
     * GET /api/v1/profile/{profileId}
     */
    @GetMapping("/{profileId}")
    public ResponseEntity<ApiResponse> getProfile(@PathVariable Long profileId) {
        try {
            ProfileResponse profile = profileService.getProfileById(profileId);
            
            return ResponseEntity.ok(
                ApiResponse.success("Profile retrieved successfully", profile)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("Failed to get profile: " + e.getMessage())
            );
        }
    }

    /**
     * Check if display name is available
     * GET /api/v1/profile/check-name/{displayName}
     */
    @GetMapping("/check-name/{displayName}")
    public ResponseEntity<ApiResponse> checkDisplayName(@PathVariable String displayName) {
        try {
            boolean isAvailable = profileService.isDisplayNameAvailable(displayName);
            
            Map<String, Object> result = Map.of(
                "displayName", displayName,
                "available", isAvailable
            );
            
            String message = isAvailable ? 
                "Display name is available" : 
                "Display name is already taken";
            
            return ResponseEntity.ok(
                ApiResponse.success(message, result)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("Failed to check display name: " + e.getMessage())
            );
        }
    }

    /**
     * Get available avatars for selection
     * GET /api/v1/profile/avatars
     */
    @GetMapping("/avatars")
    public ResponseEntity<ApiResponse> getAvailableAvatars() {
        try {
            List<String> avatars = profileService.getAvailableAvatars();
            
            return ResponseEntity.ok(
                ApiResponse.success("Available avatars retrieved successfully", avatars)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("Failed to get avatars: " + e.getMessage())
            );
        }
    }

    /**
     * Get available interest tags for selection
     * GET /api/v1/profile/interest-tags
     */
    @GetMapping("/interest-tags")
    public ResponseEntity<ApiResponse> getAvailableInterestTags() {
        try {
            List<String> interestTags = profileService.getAvailableInterestTags();
            
            return ResponseEntity.ok(
                ApiResponse.success("Available interest tags retrieved successfully", interestTags)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("Failed to get interest tags: " + e.getMessage())
            );
        }
    }

    /**
     * Search profiles by display name
     * GET /api/v1/profile/search?q={searchTerm}
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse> searchProfiles(@RequestParam("q") String searchTerm) {
        try {
            List<ProfileResponse> profiles = profileService.searchProfiles(searchTerm);
            
            return ResponseEntity.ok(
                ApiResponse.success("Search completed successfully", profiles)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("Failed to search profiles: " + e.getMessage())
            );
        }
    }

    /**
     * Get top players leaderboard
     * GET /api/v1/profile/leaderboard?limit={limit}
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<ApiResponse> getLeaderboard(@RequestParam(value = "limit", defaultValue = "10") int limit) {
        try {
            List<ProfileResponse> topPlayers = profileService.getTopPlayers(limit);
            
            return ResponseEntity.ok(
                ApiResponse.success("Leaderboard retrieved successfully", topPlayers)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("Failed to get leaderboard: " + e.getMessage())
            );
        }
    }

    /**
     * Get profiles for matching (discovery)
     * GET /api/v1/profile/discover
     */
    @GetMapping("/discover")
    public ResponseEntity<ApiResponse> getProfilesForMatching(@AuthenticationPrincipal User currentUser) {
        try {
            List<ProfileResponse> profiles = profileService.getProfilesForMatching(currentUser.getId());
            
            return ResponseEntity.ok(
                ApiResponse.success("Discovery profiles retrieved successfully", profiles)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("Failed to get discovery profiles: " + e.getMessage())
            );
        }
    }
}