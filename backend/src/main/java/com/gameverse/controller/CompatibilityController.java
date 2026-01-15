package com.gameverse.controller;

import com.gameverse.dto.response.ApiResponse;
import com.gameverse.dto.response.CompatibilityAnalysisResponse;
import com.gameverse.dto.response.CompatibilityResponse;
import com.gameverse.entity.Profile;
import com.gameverse.service.CompatibilityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * REST Controller for compatibility-related operations
 * Handles "Smart Connect" algorithm endpoints for GameVerse platform
 */
@RestController
@RequestMapping("/compatibility")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class CompatibilityController {

    @Autowired
    private CompatibilityService compatibilityService;

    /**
     * Calculate compatibility score between current user and another user
     * 
     * @param targetUserId ID of the user to check compatibility with
     * @param authentication Current user's authentication
     * @return Compatibility score and basic analysis
     */
    @GetMapping("/score/{targetUserId}")
    public ResponseEntity<ApiResponse> getCompatibilityScore(
            @PathVariable Long targetUserId,
            Authentication authentication) {
        
        try {
            Long currentUserId = Long.parseLong(authentication.getName());
            
            CompatibilityService.CompatibilityAnalysis analysis = 
                compatibilityService.getCompatibilityAnalysis(currentUserId, targetUserId);
            
            String[] commonInterestsArray = analysis.getCommonInterests().toArray(new String[0]);
            
            CompatibilityAnalysisResponse response = new CompatibilityAnalysisResponse(
                analysis.getOverallScore(),
                analysis.getInterestScore(),
                analysis.getGameScore(),
                commonInterestsArray,
                analysis.getUser1GamesPlayed(),
                analysis.getUser2GamesPlayed()
            );
            
            return ResponseEntity.ok(new ApiResponse(
                true,
                "Compatibility analysis completed successfully",
                response
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                false,
                "Failed to calculate compatibility: " + e.getMessage(),
                null
            ));
        }
    }

    /**
     * Find compatible users for the current user
     * 
     * @param minScore Minimum compatibility score threshold (default: 30)
     * @param limit Maximum number of results (default: 10, max: 50)
     * @param authentication Current user's authentication
     * @return List of compatible users with scores
     */
    @GetMapping("/matches")
    public ResponseEntity<ApiResponse> findCompatibleUsers(
            @RequestParam(defaultValue = "30.0") double minScore,
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication) {
        
        try {
            Long currentUserId = Long.parseLong(authentication.getName());
            
            // Limit the maximum number of results to prevent performance issues
            int actualLimit = Math.min(limit, 50);
            
            List<CompatibilityService.CompatibilityResult> results = 
                compatibilityService.findCompatibleUsers(currentUserId, minScore, actualLimit);
            
            List<CompatibilityResponse> responses = results.stream()
                .map(result -> {
                    Profile profile = result.getProfile();
                    return new CompatibilityResponse(
                        profile.getUser().getId(),
                        profile.getDisplayName(),
                        profile.getAvatarId(),
                        result.getScore(),
                        profile.getTotalGamesPlayed()
                    );
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(new ApiResponse(
                true,
                "Found " + responses.size() + " compatible users",
                responses
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                false,
                "Failed to find compatible users: " + e.getMessage(),
                null
            ));
        }
    }

    /**
     * Get detailed compatibility analysis between current user and another user
     * 
     * @param targetUserId ID of the user to analyze compatibility with
     * @param authentication Current user's authentication
     * @return Detailed compatibility breakdown with recommendations
     */
    @GetMapping("/analysis/{targetUserId}")
    public ResponseEntity<ApiResponse> getDetailedAnalysis(
            @PathVariable Long targetUserId,
            Authentication authentication) {
        
        try {
            Long currentUserId = Long.parseLong(authentication.getName());
            
            CompatibilityService.CompatibilityAnalysis analysis = 
                compatibilityService.getCompatibilityAnalysis(currentUserId, targetUserId);
            
            String[] commonInterestsArray = analysis.getCommonInterests().toArray(new String[0]);
            
            CompatibilityAnalysisResponse response = new CompatibilityAnalysisResponse(
                analysis.getOverallScore(),
                analysis.getInterestScore(),
                analysis.getGameScore(),
                commonInterestsArray,
                analysis.getUser1GamesPlayed(),
                analysis.getUser2GamesPlayed()
            );
            
            return ResponseEntity.ok(new ApiResponse(
                true,
                "Detailed compatibility analysis completed",
                response
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                false,
                "Failed to generate detailed analysis: " + e.getMessage(),
                null
            ));
        }
    }

    /**
     * Get compatibility leaderboard - top compatible users for current user
     * 
     * @param authentication Current user's authentication
     * @return Top 20 most compatible users
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<ApiResponse> getCompatibilityLeaderboard(
            Authentication authentication) {
        
        try {
            Long currentUserId = Long.parseLong(authentication.getName());
            
            List<CompatibilityService.CompatibilityResult> results = 
                compatibilityService.findCompatibleUsers(currentUserId, 0.0, 20);
            
            List<CompatibilityResponse> responses = results.stream()
                .map(result -> {
                    Profile profile = result.getProfile();
                    return new CompatibilityResponse(
                        profile.getUser().getId(),
                        profile.getDisplayName(),
                        profile.getAvatarId(),
                        result.getScore(),
                        profile.getTotalGamesPlayed()
                    );
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(new ApiResponse(
                true,
                "Compatibility leaderboard generated successfully",
                responses
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                false,
                "Failed to generate compatibility leaderboard: " + e.getMessage(),
                null
            ));
        }
    }

    /**
     * Calculate quick compatibility score (just the number, no detailed analysis)
     * 
     * @param targetUserId ID of the user to check compatibility with
     * @param authentication Current user's authentication
     * @return Simple compatibility score
     */
    @GetMapping("/quick-score/{targetUserId}")
    public ResponseEntity<ApiResponse> getQuickCompatibilityScore(
            @PathVariable Long targetUserId,
            Authentication authentication) {
        
        try {
            Long currentUserId = Long.parseLong(authentication.getName());
            
            double score = compatibilityService.calculateCompatibilityScore(currentUserId, targetUserId);
            
            return ResponseEntity.ok(new ApiResponse(
                true,
                "Compatibility score calculated successfully",
                score
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                false,
                "Failed to calculate compatibility score: " + e.getMessage(),
                null
            ));
        }
    }
}