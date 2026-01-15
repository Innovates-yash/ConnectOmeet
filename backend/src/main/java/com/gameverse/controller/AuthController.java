package com.gameverse.controller;

import com.gameverse.dto.request.SendOtpRequest;
import com.gameverse.dto.request.VerifyOtpRequest;
import com.gameverse.dto.response.ApiResponse;
import com.gameverse.dto.response.AuthResponse;
import com.gameverse.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller
 * 
 * Handles phone number + OTP based authentication flow:
 * 1. Send OTP to phone number
 * 2. Verify OTP and receive JWT tokens
 * 3. Refresh JWT tokens
 */
@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * Send OTP to phone number
     * POST /api/v1/auth/send-otp
     */
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        try {
            authService.sendOtp(request.getPhoneNumber());
            
            return ResponseEntity.ok(
                ApiResponse.success("OTP sent successfully to " + request.getPhoneNumber())
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("Failed to send OTP: " + e.getMessage())
            );
        }
    }

    /**
     * Verify OTP and authenticate user
     * POST /api/v1/auth/verify-otp
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            AuthResponse authResponse = authService.verifyOtpAndAuthenticate(
                request.getPhoneNumber(), 
                request.getOtpCode()
            );
            
            return ResponseEntity.ok(
                ApiResponse.success("Authentication successful", authResponse)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("Authentication failed: " + e.getMessage())
            );
        }
    }

    /**
     * Refresh JWT token
     * POST /api/v1/auth/refresh-token
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse> refreshToken(@RequestHeader("Authorization") String refreshToken) {
        try {
            // Remove "Bearer " prefix
            String token = refreshToken.substring(7);
            AuthResponse authResponse = authService.refreshToken(token);
            
            return ResponseEntity.ok(
                ApiResponse.success("Token refreshed successfully", authResponse)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("Token refresh failed: " + e.getMessage())
            );
        }
    }

    /**
     * Logout user (invalidate tokens)
     * POST /api/v1/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(@RequestHeader("Authorization") String authToken) {
        try {
            // Remove "Bearer " prefix
            String token = authToken.substring(7);
            authService.logout(token);
            
            return ResponseEntity.ok(
                ApiResponse.success("Logged out successfully")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("Logout failed: " + e.getMessage())
            );
        }
    }

    /**
     * Validate token (for frontend to check if user is still authenticated)
     * GET /api/v1/auth/validate-token
     */
    @GetMapping("/validate-token")
    public ResponseEntity<ApiResponse> validateToken(@RequestHeader("Authorization") String authToken) {
        try {
            // Remove "Bearer " prefix
            String token = authToken.substring(7);
            boolean isValid = authService.validateToken(token);
            
            if (isValid) {
                return ResponseEntity.ok(
                    ApiResponse.success("Token is valid")
                );
            } else {
                return ResponseEntity.badRequest().body(
                    ApiResponse.error("Token is invalid or expired")
                );
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("Token validation failed: " + e.getMessage())
            );
        }
    }
}