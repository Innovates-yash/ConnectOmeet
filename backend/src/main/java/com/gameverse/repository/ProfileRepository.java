package com.gameverse.repository;

import com.gameverse.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Profile entity operations
 */
@Repository
public interface ProfileRepository extends JpaRepository<Profile, Long> {

    /**
     * Find profile by user ID
     */
    Optional<Profile> findByUserId(Long userId);

    /**
     * Find profile by display name
     */
    Optional<Profile> findByDisplayName(String displayName);

    /**
     * Check if display name exists
     */
    boolean existsByDisplayName(String displayName);

    /**
     * Find profiles by avatar ID
     */
    List<Profile> findByAvatarId(String avatarId);

    /**
     * Find profiles that contain specific interest tag
     */
    @Query(value = "SELECT * FROM profiles p WHERE JSON_CONTAINS(p.interest_tags, JSON_QUOTE(:interest))", nativeQuery = true)
    List<Profile> findByInterestTag(@Param("interest") String interest);

    /**
     * Find profiles that have played a specific game
     */
    @Query(value = "SELECT * FROM profiles p WHERE JSON_CONTAINS(p.games_played, JSON_QUOTE(:gameType))", nativeQuery = true)
    List<Profile> findByGamePlayed(@Param("gameType") String gameType);

    /**
     * Find profiles with win rate above threshold
     */
    @Query("SELECT p FROM Profile p WHERE (p.totalGamesWon * 1.0 / NULLIF(p.totalGamesPlayed, 0)) > :winRate")
    List<Profile> findByWinRateGreaterThan(@Param("winRate") Double winRate);

    /**
     * Find top players by games won
     */
    @Query("SELECT p FROM Profile p ORDER BY p.totalGamesWon DESC")
    List<Profile> findTopPlayersByGamesWon();

    /**
     * Find most active players by games played
     */
    @Query("SELECT p FROM Profile p ORDER BY p.totalGamesPlayed DESC")
    List<Profile> findMostActivePlayersByGamesPlayed();

    /**
     * Find profiles for compatibility matching (excluding specific user)
     */
    @Query("SELECT p FROM Profile p WHERE p.user.id != :userId AND p.user.isVerified = true")
    List<Profile> findProfilesForMatching(@Param("userId") Long userId);

    /**
     * Search profiles by display name pattern
     */
    @Query("SELECT p FROM Profile p WHERE p.displayName LIKE %:pattern%")
    List<Profile> searchByDisplayName(@Param("pattern") String pattern);

    /**
     * Find profiles with shared interests
     */
    @Query(value = "SELECT p.* FROM profiles p WHERE p.user_id != :userId " +
           "AND EXISTS (SELECT 1 FROM profiles p2 WHERE p2.user_id = :userId " +
           "AND JSON_OVERLAPS(p.interest_tags, p2.interest_tags))", nativeQuery = true)
    List<Profile> findProfilesWithSharedInterests(@Param("userId") Long userId);

    /**
     * Count profiles by avatar ID
     */
    @Query("SELECT COUNT(p) FROM Profile p WHERE p.avatarId = :avatarId")
    Long countByAvatarId(@Param("avatarId") String avatarId);

    /**
     * Find recently created profiles
     */
    @Query("SELECT p FROM Profile p WHERE p.createdAt > :since ORDER BY p.createdAt DESC")
    List<Profile> findRecentProfiles(@Param("since") java.time.LocalDateTime since);
}