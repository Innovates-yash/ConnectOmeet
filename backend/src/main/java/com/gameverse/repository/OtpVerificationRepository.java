package com.gameverse.repository;

import com.gameverse.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for OTP Verification entity operations
 */
@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    /**
     * Find the most recent OTP verification for a phone number
     */
    Optional<OtpVerification> findTopByPhoneNumberOrderByCreatedAtDesc(String phoneNumber);

    /**
     * Find all OTP verifications for a phone number
     */
    List<OtpVerification> findByPhoneNumberOrderByCreatedAtDesc(String phoneNumber);

    /**
     * Find active (non-expired, non-verified) OTP for a phone number
     */
    @Query("SELECT o FROM OtpVerification o WHERE o.phoneNumber = :phoneNumber " +
           "AND o.expiresAt > :now AND o.isVerified = false " +
           "ORDER BY o.createdAt DESC")
    Optional<OtpVerification> findActiveOtpByPhoneNumber(
        @Param("phoneNumber") String phoneNumber, 
        @Param("now") LocalDateTime now
    );

    /**
     * Find OTP verification by phone number and OTP code
     */
    Optional<OtpVerification> findByPhoneNumberAndOtpCode(String phoneNumber, String otpCode);

    /**
     * Delete expired OTP verifications (cleanup job)
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM OtpVerification o WHERE o.expiresAt < :now")
    int deleteExpiredOtps(@Param("now") LocalDateTime now);

    /**
     * Delete all OTP verifications for a phone number
     */
    @Modifying
    @Transactional
    void deleteByPhoneNumber(String phoneNumber);

    /**
     * Count active OTP attempts for a phone number in the last hour
     */
    @Query("SELECT COUNT(o) FROM OtpVerification o WHERE o.phoneNumber = :phoneNumber " +
           "AND o.createdAt > :since")
    Long countRecentOtpAttempts(
        @Param("phoneNumber") String phoneNumber, 
        @Param("since") LocalDateTime since
    );

    /**
     * Find all expired OTP verifications
     */
    @Query("SELECT o FROM OtpVerification o WHERE o.expiresAt < :now")
    List<OtpVerification> findExpiredOtps(@Param("now") LocalDateTime now);

    /**
     * Check if phone number has too many recent OTP requests (rate limiting)
     */
    @Query("SELECT COUNT(o) > :maxRequests FROM OtpVerification o " +
           "WHERE o.phoneNumber = :phoneNumber AND o.createdAt > :since")
    boolean hasExceededOtpRequestLimit(
        @Param("phoneNumber") String phoneNumber,
        @Param("since") LocalDateTime since,
        @Param("maxRequests") Long maxRequests
    );
}