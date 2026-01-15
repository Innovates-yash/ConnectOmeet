package com.gameverse.service;

import com.gameverse.entity.Profile;
import com.gameverse.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service for calculating compatibility scores between users
 * Implements the "Smart Connect" algorithm for GameVerse platform
 */
@Service
public class CompatibilityService {

    @Autowired
    private ProfileRepository profileRepository;

    /**
     * Calculate compatibility score between two users based on shared interests and games
     * 
     * @param userId1 First user's ID
     * @param userId2 Second user's ID
     * @return Compatibility score as percentage (0-100)
     */
    public double calculateCompatibilityScore(Long userId1, Long userId2) {
        Profile profile1 = profileRepository.findByUserId(userId1)
            .orElseThrow(() -> new RuntimeException("Profile not found for user: " + userId1));
        Profile profile2 = profileRepository.findByUserId(userId2)
            .orElseThrow(() -> new RuntimeException("Profile not found for user: " + userId2));

        return calculateCompatibilityScore(profile1, profile2);
    }

    /**
     * Calculate compatibility score between two profiles
     * 
     * @param profile1 First user's profile
     * @param profile2 Second user's profile
     * @return Compatibility score as percentage (0-100)
     */
    public double calculateCompatibilityScore(Profile profile1, Profile profile2) {
        if (profile1.getId().equals(profile2.getId())) {
            return 0.0; // Same user, no compatibility
        }

        double interestScore = calculateInterestCompatibility(profile1, profile2);
        double gameScore = calculateGameCompatibility(profile1, profile2);
        
        // Weighted average: 60% interests, 40% games
        return (interestScore * 0.6) + (gameScore * 0.4);
    }

    /**
     * Calculate compatibility based on shared interest tags
     * 
     * @param profile1 First user's profile
     * @param profile2 Second user's profile
     * @return Interest compatibility score (0-100)
     */
    private double calculateInterestCompatibility(Profile profile1, Profile profile2) {
        List<String> interests1 = profile1.getInterestTags();
        List<String> interests2 = profile2.getInterestTags();

        if (interests1 == null || interests2 == null || interests1.isEmpty() || interests2.isEmpty()) {
            return 0.0;
        }

        Set<String> set1 = Set.copyOf(interests1);
        Set<String> set2 = Set.copyOf(interests2);

        Set<String> commonInterests = set1.stream()
            .filter(set2::contains)
            .collect(Collectors.toSet());

        Set<String> totalInterests = set1.stream()
            .collect(Collectors.toSet());
        totalInterests.addAll(set2);

        if (totalInterests.isEmpty()) {
            return 0.0;
        }

        // Jaccard similarity coefficient
        return (double) commonInterests.size() / totalInterests.size() * 100;
    }

    /**
     * Calculate compatibility based on game statistics and preferences
     * 
     * @param profile1 First user's profile
     * @param profile2 Second user's profile
     * @return Game compatibility score (0-100)
     */
    private double calculateGameCompatibility(Profile profile1, Profile profile2) {
        // For now, use a simple algorithm based on total games played
        // This can be enhanced later with specific game preferences
        
        int games1 = profile1.getTotalGamesPlayed();
        int games2 = profile2.getTotalGamesPlayed();
        
        if (games1 == 0 && games2 == 0) {
            return 50.0; // Both new users, moderate compatibility
        }
        
        if (games1 == 0 || games2 == 0) {
            return 25.0; // One experienced, one new - lower compatibility
        }

        // Calculate similarity based on gaming experience level
        double ratio = Math.min(games1, games2) / (double) Math.max(games1, games2);
        return ratio * 100;
    }

    /**
     * Find compatible users for a given user
     * 
     * @param userId User ID to find matches for
     * @param minScore Minimum compatibility score threshold
     * @param limit Maximum number of results to return
     * @return List of compatible user profiles with scores
     */
    public List<CompatibilityResult> findCompatibleUsers(Long userId, double minScore, int limit) {
        Profile userProfile = profileRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Profile not found for user: " + userId));

        return profileRepository.findAll().stream()
            .filter(profile -> !profile.getUser().getId().equals(userId)) // Exclude self
            .map(profile -> new CompatibilityResult(
                profile,
                calculateCompatibilityScore(userProfile, profile)
            ))
            .filter(result -> result.getScore() >= minScore)
            .sorted((r1, r2) -> Double.compare(r2.getScore(), r1.getScore())) // Descending order
            .limit(limit)
            .collect(Collectors.toList());
    }

    /**
     * Get compatibility analysis between two users with detailed breakdown
     * 
     * @param userId1 First user's ID
     * @param userId2 Second user's ID
     * @return Detailed compatibility analysis
     */
    public CompatibilityAnalysis getCompatibilityAnalysis(Long userId1, Long userId2) {
        Profile profile1 = profileRepository.findByUserId(userId1)
            .orElseThrow(() -> new RuntimeException("Profile not found for user: " + userId1));
        Profile profile2 = profileRepository.findByUserId(userId2)
            .orElseThrow(() -> new RuntimeException("Profile not found for user: " + userId2));

        double interestScore = calculateInterestCompatibility(profile1, profile2);
        double gameScore = calculateGameCompatibility(profile1, profile2);
        double overallScore = (interestScore * 0.6) + (gameScore * 0.4);

        List<String> interests1 = profile1.getInterestTags();
        List<String> interests2 = profile2.getInterestTags();
        
        Set<String> commonInterests = Set.of();
        if (interests1 != null && interests2 != null) {
            Set<String> set1 = Set.copyOf(interests1);
            Set<String> set2 = Set.copyOf(interests2);
            commonInterests = set1.stream()
                .filter(set2::contains)
                .collect(Collectors.toSet());
        }

        return new CompatibilityAnalysis(
            overallScore,
            interestScore,
            gameScore,
            commonInterests,
            profile1.getTotalGamesPlayed(),
            profile2.getTotalGamesPlayed()
        );
    }

    /**
     * Result class for compatibility calculations
     */
    public static class CompatibilityResult {
        private final Profile profile;
        private final double score;

        public CompatibilityResult(Profile profile, double score) {
            this.profile = profile;
            this.score = score;
        }

        public Profile getProfile() {
            return profile;
        }

        public double getScore() {
            return score;
        }
    }

    /**
     * Detailed compatibility analysis result
     */
    public static class CompatibilityAnalysis {
        private final double overallScore;
        private final double interestScore;
        private final double gameScore;
        private final Set<String> commonInterests;
        private final int user1GamesPlayed;
        private final int user2GamesPlayed;

        public CompatibilityAnalysis(double overallScore, double interestScore, double gameScore,
                                   Set<String> commonInterests, int user1GamesPlayed, int user2GamesPlayed) {
            this.overallScore = overallScore;
            this.interestScore = interestScore;
            this.gameScore = gameScore;
            this.commonInterests = commonInterests;
            this.user1GamesPlayed = user1GamesPlayed;
            this.user2GamesPlayed = user2GamesPlayed;
        }

        public double getOverallScore() {
            return overallScore;
        }

        public double getInterestScore() {
            return interestScore;
        }

        public double getGameScore() {
            return gameScore;
        }

        public Set<String> getCommonInterests() {
            return commonInterests;
        }

        public int getUser1GamesPlayed() {
            return user1GamesPlayed;
        }

        public int getUser2GamesPlayed() {
            return user2GamesPlayed;
        }
    }
}