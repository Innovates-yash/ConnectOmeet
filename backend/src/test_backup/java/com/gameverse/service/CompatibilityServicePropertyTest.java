package com.gameverse.service;

import com.gameverse.entity.Profile;
import com.gameverse.entity.User;
import com.gameverse.repository.ProfileRepository;
import net.jqwik.api.*;
import net.jqwik.api.constraints.IntRange;
import net.jqwik.api.constraints.StringLength;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Property-based tests for CompatibilityService
 * Tests universal properties of the compatibility algorithm
 */
class CompatibilityServicePropertyTest {

    @Mock
    private ProfileRepository profileRepository;

    @InjectMocks
    private CompatibilityService compatibilityService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    /**
     * Property 3: Compatibility Score Calculation
     * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
     * 
     * Universal properties:
     * - Compatibility score is always between 0 and 100
     * - Self-compatibility is always 0
     * - Compatibility is symmetric (A->B == B->A)
     * - Users with identical interests have high compatibility
     * - Users with no common interests have lower compatibility
     */
    @Property(tries = 1000)
    @Label("Feature: gameverse-social-gaming-platform, Property 3: Compatibility Score Calculation")
    void compatibilityScoreShouldFollowUniversalProperties(
            @ForAll("profileGenerator") Profile profile1,
            @ForAll("profileGenerator") Profile profile2) {

        // Mock repository responses
        when(profileRepository.findByUserId(profile1.getUserId())).thenReturn(Optional.of(profile1));
        when(profileRepository.findByUserId(profile2.getUserId())).thenReturn(Optional.of(profile2));

        // Calculate compatibility scores
        double score1to2 = compatibilityService.calculateCompatibilityScore(profile1, profile2);
        double score2to1 = compatibilityService.calculateCompatibilityScore(profile2, profile1);

        // Property 1: Score is always between 0 and 100
        assertTrue(score1to2 >= 0.0 && score1to2 <= 100.0,
            "Compatibility score must be between 0 and 100, got: " + score1to2);
        assertTrue(score2to1 >= 0.0 && score2to1 <= 100.0,
            "Compatibility score must be between 0 and 100, got: " + score2to1);

        // Property 2: Self-compatibility is always 0
        if (profile1.getId().equals(profile2.getId())) {
            assertEquals(0.0, score1to2, 0.001,
                "Self-compatibility must be 0");
        }

        // Property 3: Compatibility is symmetric
        if (!profile1.getId().equals(profile2.getId())) {
            assertEquals(score1to2, score2to1, 0.001,
                "Compatibility must be symmetric: A->B should equal B->A");
        }
    }

    @Property(tries = 500)
    @Label("Identical interests should result in high compatibility")
    void identicalInterestsShouldResultInHighCompatibility(
            @ForAll("validInterestTagsGenerator") String interestTags,
            @ForAll @IntRange(min = 0, max = 100) int gamesPlayed1,
            @ForAll @IntRange(min = 0, max = 100) int gamesPlayed2) {

        Profile profile1 = createTestProfile(1L, "User1", interestTags, gamesPlayed1);
        Profile profile2 = createTestProfile(2L, "User2", interestTags, gamesPlayed2);

        double score = compatibilityService.calculateCompatibilityScore(profile1, profile2);

        // Users with identical interests should have at least 60% compatibility
        // (since interest score would be 100% and gets 60% weight)
        assertTrue(score >= 60.0,
            "Users with identical interests should have high compatibility, got: " + score);
    }

    @Property(tries = 500)
    @Label("No common interests should result in lower compatibility")
    void noCommonInterestsShouldResultInLowerCompatibility(
            @ForAll @IntRange(min = 0, max = 100) int gamesPlayed1,
            @ForAll @IntRange(min = 0, max = 100) int gamesPlayed2) {

        Profile profile1 = createTestProfile(1L, "User1", "Gaming,Strategy,FPS", gamesPlayed1);
        Profile profile2 = createTestProfile(2L, "User2", "Music,Art,Reading", gamesPlayed2);

        double score = compatibilityService.calculateCompatibilityScore(profile1, profile2);

        // Users with no common interests should have lower compatibility
        // Maximum would be game compatibility (40% weight)
        assertTrue(score <= 40.0,
            "Users with no common interests should have lower compatibility, got: " + score);
    }

    @Property(tries = 500)
    @Label("Game experience similarity should affect compatibility")
    void gameExperienceSimilarityShouldAffectCompatibility() {
        // Test with same interests but different game experience
        String commonInterests = "Gaming,Strategy,FPS";
        
        Profile newbie1 = createTestProfile(1L, "Newbie1", commonInterests, 0);
        Profile newbie2 = createTestProfile(2L, "Newbie2", commonInterests, 0);
        Profile expert1 = createTestProfile(3L, "Expert1", commonInterests, 100);
        Profile expert2 = createTestProfile(4L, "Expert2", commonInterests, 95);

        double newbieCompatibility = compatibilityService.calculateCompatibilityScore(newbie1, newbie2);
        double expertCompatibility = compatibilityService.calculateCompatibilityScore(expert1, expert2);
        double mixedCompatibility = compatibilityService.calculateCompatibilityScore(newbie1, expert1);

        // Similar experience levels should have higher compatibility than mixed levels
        assertTrue(newbieCompatibility > mixedCompatibility,
            "Similar experience levels should have higher compatibility than mixed levels");
        assertTrue(expertCompatibility > mixedCompatibility,
            "Similar experience levels should have higher compatibility than mixed levels");
    }

    @Property(tries = 300)
    @Label("Find compatible users should return results in descending order")
    void findCompatibleUsersShouldReturnResultsInDescendingOrder(
            @ForAll("profileGenerator") Profile userProfile) {

        // Create test profiles with varying compatibility
        List<Profile> allProfiles = List.of(
            createTestProfile(1L, "User1", "Gaming,Strategy", 10),
            createTestProfile(2L, "User2", "Gaming,FPS", 20),
            createTestProfile(3L, "User3", "Music,Art", 5),
            createTestProfile(4L, "User4", "Gaming,Strategy,FPS", 15),
            userProfile
        );

        when(profileRepository.findByUserId(userProfile.getUserId())).thenReturn(Optional.of(userProfile));
        when(profileRepository.findAll()).thenReturn(allProfiles);

        List<CompatibilityService.CompatibilityResult> results = 
            compatibilityService.findCompatibleUsers(userProfile.getUserId(), 0.0, 10);

        // Verify results are in descending order of compatibility score
        for (int i = 0; i < results.size() - 1; i++) {
            assertTrue(results.get(i).getScore() >= results.get(i + 1).getScore(),
                "Results should be in descending order of compatibility score");
        }

        // Verify no self-matches
        assertTrue(results.stream().noneMatch(r -> r.getProfile().getUserId().equals(userProfile.getUserId())),
            "Results should not include the user themselves");
    }

    @Property(tries = 200)
    @Label("Compatibility analysis should provide consistent breakdown")
    void compatibilityAnalysisShouldProvideConsistentBreakdown(
            @ForAll("profileGenerator") Profile profile1,
            @ForAll("profileGenerator") Profile profile2) {

        when(profileRepository.findByUserId(profile1.getUserId())).thenReturn(Optional.of(profile1));
        when(profileRepository.findByUserId(profile2.getUserId())).thenReturn(Optional.of(profile2));

        if (profile1.getId().equals(profile2.getId())) {
            return; // Skip self-comparison
        }

        CompatibilityService.CompatibilityAnalysis analysis = 
            compatibilityService.getCompatibilityAnalysis(profile1.getUserId(), profile2.getUserId());

        // Verify the overall score matches the weighted average
        double expectedOverall = (analysis.getInterestScore() * 0.6) + (analysis.getGameScore() * 0.4);
        assertEquals(expectedOverall, analysis.getOverallScore(), 0.001,
            "Overall score should match weighted average of interest and game scores");

        // Verify all scores are within valid range
        assertTrue(analysis.getOverallScore() >= 0.0 && analysis.getOverallScore() <= 100.0,
            "Overall score must be between 0 and 100");
        assertTrue(analysis.getInterestScore() >= 0.0 && analysis.getInterestScore() <= 100.0,
            "Interest score must be between 0 and 100");
        assertTrue(analysis.getGameScore() >= 0.0 && analysis.getGameScore() <= 100.0,
            "Game score must be between 0 and 100");

        // Verify game counts match profiles
        assertEquals(profile1.getTotalGamesPlayed(), analysis.getUser1GamesPlayed(),
            "User1 games played should match profile");
        assertEquals(profile2.getTotalGamesPlayed(), analysis.getUser2GamesPlayed(),
            "User2 games played should match profile");
    }

    // Data generators

    @Provide
    Arbitrary<Profile> profileGenerator() {
        return Combinators.combine(
            Arbitraries.longs().between(1L, 1000L),
            Arbitraries.strings().alpha().ofLength(8),
            validInterestTagsGenerator(),
            Arbitraries.integers().between(0, 200)
        ).as(this::createTestProfile);
    }

    @Provide
    Arbitrary<String> validInterestTagsGenerator() {
        List<String> validTags = List.of(
            "Gaming", "Strategy", "FPS", "RPG", "Sports", "Racing",
            "Puzzle", "Adventure", "Action", "Simulation", "Music",
            "Art", "Reading", "Movies", "Technology", "Science"
        );
        
        return Arbitraries.of(validTags)
            .list()
            .ofMinSize(3)
            .ofMaxSize(8)
            .map(tags -> String.join(",", tags));
    }

    // Helper methods

    private Profile createTestProfile(Long userId, String displayName, String interestTags, int gamesPlayed) {
        User user = new User();
        user.setId(userId);
        user.setPhoneNumber("+1234567" + String.format("%03d", userId));
        user.setCreatedAt(LocalDateTime.now());
        user.setGameCoins(BigDecimal.valueOf(1000));

        Profile profile = new Profile();
        profile.setId(userId);
        profile.setUserId(userId);
        profile.setUser(user);
        profile.setDisplayName(displayName);
        profile.setAvatarId("cyber_warrior_01");
        profile.setBio("Test bio for " + displayName);
        profile.setInterestTags(interestTags);
        profile.setTotalGamesPlayed(gamesPlayed);
        profile.setGamesWon(gamesPlayed / 2);
        profile.setCurrentWinStreak(0);
        profile.setBestWinStreak(5);
        profile.setCreatedAt(LocalDateTime.now());
        profile.setUpdatedAt(LocalDateTime.now());

        return profile;
    }
}