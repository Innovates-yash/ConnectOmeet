package com.gameverse.service;

import com.gameverse.dto.response.AuthResponse;
import com.gameverse.entity.User;
import com.gameverse.repository.UserRepository;
import com.gameverse.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Authentication Service
 * 
 * Handles phone number + OTP authentication flow:
 * 1. Send OTP to phone number
 * 2. Verify OTP and create/authenticate user
 * 3. Generate JWT tokens
 * 4. Handle token refresh and logout
 */
@Service
@Transactional
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private OtpService otpService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    /**
     * Send OTP to phone number
     */
    public void sendOtp(String phoneNumber) {
        logger.info("Processing OTP request for phone number: {}", phoneNumber);
        
        // Validate phone number format
        if (!isValidPhoneNumber(phoneNumber)) {
            throw new IllegalArgumentException("Invalid phone number format");
        }

        // Send OTP via OTP service
        otpService.sendOtp(phoneNumber);
        
        logger.info("OTP request processed successfully for phone number: {}", phoneNumber);
    }

    /**
     * Verify OTP and authenticate user
     */
    public AuthResponse verifyOtpAndAuthenticate(String phoneNumber, String otpCode) {
        logger.info("Processing OTP verification for phone number: {}", phoneNumber);

        // Verify OTP
        boolean isOtpValid = otpService.verifyOtp(phoneNumber, otpCode);
        if (!isOtpValid) {
            int remainingAttempts = otpService.getRemainingAttempts(phoneNumber);
            throw new IllegalArgumentException(
                "Invalid OTP code. Remaining attempts: " + remainingAttempts
            );
        }

        // Find or create user
        User user = findOrCreateUser(phoneNumber);
        
        // Mark user as verified if not already
        if (!user.getIsVerified()) {
            user.verify();
            userRepository.save(user);
            logger.info("User verified successfully: {}", phoneNumber);
        }

        // Clean up OTP records after successful verification
        otpService.invalidateOtpsForPhoneNumber(phoneNumber);

        // Generate JWT tokens
        String accessToken = tokenProvider.generateToken(user.getId(), user.getPhoneNumber());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());

        // Calculate token expiration
        long expiresIn = tokenProvider.getTimeUntilExpiration(accessToken) / 1000; // Convert to seconds

        // Create user info for response
        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
            user.getId(),
            user.getPhoneNumber(),
            user.getGameCoins().doubleValue(),
            user.hasProfile()
        );

        // Add profile information if it exists
        if (user.hasProfile()) {
            userInfo.setDisplayName(user.getProfile().getDisplayName());
            userInfo.setAvatarId(user.getProfile().getAvatarId());
        }

        // Determine if this is a new user (first time login)
        boolean isNewUser = user.getCreatedAt().equals(user.getUpdatedAt());

        AuthResponse response = new AuthResponse(
            accessToken,
            refreshToken,
            expiresIn,
            userInfo,
            isNewUser
        );

        logger.info("Authentication successful for user: {}", user.getId());
        return response;
    }

    /**
     * Refresh JWT token
     */
    public AuthResponse refreshToken(String refreshToken) {
        logger.info("Processing token refresh request");

        // Validate refresh token
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        // Check if it's actually a refresh token
        String tokenType = tokenProvider.getTokenType(refreshToken);
        if (!"refresh".equals(tokenType)) {
            throw new IllegalArgumentException("Invalid token type. Expected refresh token");
        }

        // Get user ID from token
        Long userId = tokenProvider.getUserIdFromToken(refreshToken);
        
        // Find user
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found");
        }

        User user = userOpt.get();

        // Generate new tokens
        String newAccessToken = tokenProvider.generateToken(user.getId(), user.getPhoneNumber());
        String newRefreshToken = tokenProvider.generateRefreshToken(user.getId());

        // Calculate token expiration
        long expiresIn = tokenProvider.getTimeUntilExpiration(newAccessToken) / 1000;

        // Create user info for response
        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
            user.getId(),
            user.getPhoneNumber(),
            user.getGameCoins().doubleValue(),
            user.hasProfile()
        );

        AuthResponse response = new AuthResponse(
            newAccessToken,
            newRefreshToken,
            expiresIn,
            userInfo,
            false // Not a new user for refresh
        );

        logger.info("Token refresh successful for user: {}", user.getId());
        return response;
    }

    /**
     * Logout user (invalidate tokens)
     */
    public void logout(String token) {
        logger.info("Processing logout request");

        // In a more sophisticated implementation, we would maintain a blacklist
        // of invalidated tokens. For now, we just log the logout.
        // The token will naturally expire based on its expiration time.

        try {
            Long userId = tokenProvider.getUserIdFromToken(token);
            logger.info("User logged out successfully: {}", userId);
        } catch (Exception e) {
            logger.warn("Could not extract user ID from token during logout", e);
        }

        // TODO: Implement token blacklisting for immediate invalidation
        // This could be done using Redis or a database table
    }

    /**
     * Validate JWT token
     */
    public boolean validateToken(String token) {
        return tokenProvider.validateToken(token);
    }

    /**
     * Find existing user or create new one
     */
    private User findOrCreateUser(String phoneNumber) {
        Optional<User> existingUser = userRepository.findByPhoneNumber(phoneNumber);
        
        if (existingUser.isPresent()) {
            logger.info("Found existing user for phone number: {}", phoneNumber);
            return existingUser.get();
        } else {
            logger.info("Creating new user for phone number: {}", phoneNumber);
            User newUser = new User(phoneNumber);
            // Set initial game coins (default is already set in entity)
            newUser.setGameCoins(BigDecimal.valueOf(1000.00));
            return userRepository.save(newUser);
        }
    }

    /**
     * Validate phone number format
     */
    private boolean isValidPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return false;
        }

        // Basic validation for international phone number format
        // Accepts formats like: +1234567890, +91234567890, etc.
        String cleanNumber = phoneNumber.trim();
        
        // Must start with + and have 10-15 digits
        return cleanNumber.matches("^\\+?[1-9]\\d{9,14}$");
    }
}