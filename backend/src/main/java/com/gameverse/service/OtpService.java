package com.gameverse.service;

import com.gameverse.entity.OtpVerification;
import com.gameverse.repository.OtpVerificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * OTP Service for handling One-Time Password operations
 * 
 * Features:
 * - Generate secure OTP codes
 * - Send OTP via SMS (mocked for development)
 * - Verify OTP codes with attempt limiting
 * - Rate limiting for OTP requests
 * - Automatic cleanup of expired OTPs
 */
@Service
@Transactional
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);
    private static final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    private OtpVerificationRepository otpRepository;

    @Value("${gameverse.otp.expiration:300000}") // 5 minutes default
    private long otpExpirationMs;

    @Value("${gameverse.otp.max-attempts:3}")
    private int maxAttempts;

    @Value("${gameverse.otp.default-code:1234}")
    private String defaultOtpCode;

    // Rate limiting: max 3 OTP requests per phone number per hour
    private static final int MAX_OTP_REQUESTS_PER_HOUR = 3;

    /**
     * Send OTP to phone number
     */
    public void sendOtp(String phoneNumber) {
        logger.info("Sending OTP to phone number: {}", phoneNumber);

        // Check rate limiting
        if (isRateLimited(phoneNumber)) {
            throw new IllegalStateException("Too many OTP requests. Please try again later.");
        }

        // Generate OTP code
        String otpCode = generateOtpCode();
        
        // Calculate expiration time
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(otpExpirationMs / 1000);

        // Save OTP verification record
        OtpVerification otpVerification = new OtpVerification(phoneNumber, otpCode, expiresAt);
        otpRepository.save(otpVerification);

        // Send OTP via SMS (mocked for development)
        sendSms(phoneNumber, otpCode);

        logger.info("OTP sent successfully to phone number: {}", phoneNumber);
    }

    /**
     * Verify OTP code
     */
    public boolean verifyOtp(String phoneNumber, String otpCode) {
        logger.info("Verifying OTP for phone number: {}", phoneNumber);

        // Find active OTP verification
        Optional<OtpVerification> otpOpt = otpRepository.findActiveOtpByPhoneNumber(
            phoneNumber, LocalDateTime.now()
        );

        if (otpOpt.isEmpty()) {
            logger.warn("No active OTP found for phone number: {}", phoneNumber);
            return false;
        }

        OtpVerification otp = otpOpt.get();

        // Check if max attempts reached
        if (otp.isMaxAttemptsReached(maxAttempts)) {
            logger.warn("Max OTP attempts reached for phone number: {}", phoneNumber);
            return false;
        }

        // Increment attempt count
        otp.incrementAttempts();
        otpRepository.save(otp);

        // Verify OTP code
        if (otp.getOtpCode().equals(otpCode)) {
            otp.markAsVerified();
            otpRepository.save(otp);
            logger.info("OTP verified successfully for phone number: {}", phoneNumber);
            return true;
        } else {
            logger.warn("Invalid OTP code for phone number: {}", phoneNumber);
            return false;
        }
    }

    /**
     * Check if phone number is rate limited for OTP requests
     */
    private boolean isRateLimited(String phoneNumber) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        return otpRepository.hasExceededOtpRequestLimit(
            phoneNumber, oneHourAgo, (long) MAX_OTP_REQUESTS_PER_HOUR
        );
    }

    /**
     * Generate secure OTP code
     */
    private String generateOtpCode() {
        // In development, use default OTP if configured
        if (defaultOtpCode != null && !defaultOtpCode.trim().isEmpty()) {
            logger.debug("Using default OTP code for development");
            return defaultOtpCode;
        }

        // Generate random 4-digit OTP
        int otp = 1000 + secureRandom.nextInt(9000);
        return String.valueOf(otp);
    }

    /**
     * Send SMS with OTP code (mocked for development)
     */
    private void sendSms(String phoneNumber, String otpCode) {
        // In a real implementation, this would integrate with an SMS service
        // like Twilio, AWS SNS, or similar
        
        logger.info("=== SMS SERVICE (MOCKED) ===");
        logger.info("To: {}", phoneNumber);
        logger.info("Message: Your GameVerse verification code is: {}", otpCode);
        logger.info("This code expires in {} minutes.", otpExpirationMs / 60000);
        logger.info("===========================");

        // TODO: Integrate with real SMS service in production
        // Example integration points:
        // - Twilio SMS API
        // - AWS SNS
        // - Firebase Cloud Messaging
        // - Custom SMS gateway
    }

    /**
     * Cleanup expired OTP verifications (scheduled job)
     */
    @Transactional
    public int cleanupExpiredOtps() {
        logger.info("Cleaning up expired OTP verifications");
        int deletedCount = otpRepository.deleteExpiredOtps(LocalDateTime.now());
        logger.info("Deleted {} expired OTP verifications", deletedCount);
        return deletedCount;
    }

    /**
     * Get remaining attempts for a phone number
     */
    public int getRemainingAttempts(String phoneNumber) {
        Optional<OtpVerification> otpOpt = otpRepository.findActiveOtpByPhoneNumber(
            phoneNumber, LocalDateTime.now()
        );

        if (otpOpt.isEmpty()) {
            return maxAttempts;
        }

        OtpVerification otp = otpOpt.get();
        return Math.max(0, maxAttempts - otp.getAttempts());
    }

    /**
     * Check if OTP is still valid for a phone number
     */
    public boolean hasValidOtp(String phoneNumber) {
        Optional<OtpVerification> otpOpt = otpRepository.findActiveOtpByPhoneNumber(
            phoneNumber, LocalDateTime.now()
        );
        return otpOpt.isPresent() && otpOpt.get().canAttemptVerification(maxAttempts);
    }

    /**
     * Invalidate all OTPs for a phone number (useful after successful verification)
     */
    @Transactional
    public void invalidateOtpsForPhoneNumber(String phoneNumber) {
        logger.info("Invalidating all OTPs for phone number: {}", phoneNumber);
        otpRepository.deleteByPhoneNumber(phoneNumber);
    }
}