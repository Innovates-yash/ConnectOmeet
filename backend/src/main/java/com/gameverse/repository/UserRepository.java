package com.gameverse.repository;

import com.gameverse.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for User entity operations
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by phone number
     */
    Optional<User> findByPhoneNumber(String phoneNumber);

    /**
     * Check if user exists by phone number
     */
    boolean existsByPhoneNumber(String phoneNumber);

    /**
     * Find all verified users
     */
    List<User> findByIsVerifiedTrue();

    /**
     * Find users created after a specific date
     */
    List<User> findByCreatedAtAfter(LocalDateTime date);

    /**
     * Find users with game coins greater than specified amount
     */
    @Query("SELECT u FROM User u WHERE u.gameCoins > :amount")
    List<User> findUsersWithGameCoinsGreaterThan(@Param("amount") Double amount);

    /**
     * Count total verified users
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.isVerified = true")
    Long countVerifiedUsers();

    /**
     * Find users by phone number pattern (for admin searches)
     */
    @Query("SELECT u FROM User u WHERE u.phoneNumber LIKE %:pattern%")
    List<User> findByPhoneNumberContaining(@Param("pattern") String pattern);

    /**
     * Find recently active users (those who updated their info recently)
     */
    @Query("SELECT u FROM User u WHERE u.updatedAt > :since ORDER BY u.updatedAt DESC")
    List<User> findRecentlyActiveUsers(@Param("since") LocalDateTime since);
}