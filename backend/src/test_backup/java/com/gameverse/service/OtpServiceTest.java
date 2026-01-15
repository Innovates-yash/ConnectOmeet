package com.gameverse.service;

import com.gameverse.entity.OtpVerification;
import com.gameverse.repository.OtpVerificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for OTP Service
 * Tests OTP generation, verification, and rate limiting
 */
@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    @Mock
    private OtpVerificationRepository otpRepository;

    @InjectMocks
    private OtpService otpService;

    @BeforeEach
    void setUp() {
        // Set test configuration values
        ReflectionTestUtils.setField(otpService, "otpExpirationMs", 300000L); // 5 minutes
        ReflectionTestUtils.setField(otpService, "maxAttempts", 3);
        ReflectionTestUtils.setField(otpService, "defaultOtpCode", "1234");
    }

    @Test
    void sendOtp_ShouldCreateOtpVerificationRecord() {
        // Given
        String phoneNumber = "+1234567890";
        when(otpRepository.hasExceededOtpRequestLimit(any(), any(), any())).thenReturn(false);
        when(otpRepository.save(any(OtpVerification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        otpService.sendOtp(phoneNumber);

        // Then
        verify(otpRepository).save(any(OtpVerification.class));
        verify(otpRepository).hasExceededOtpRequestLimit(eq(phoneNumber), any(LocalDateTime.class), eq(3L));
    }

    @Test
    void sendOtp_ShouldThrowExceptionWhenRateLimited() {
        // Given
        String phoneNumber = "+1234567890";
        when(otpRepository.hasExceededOtpRequestLimit(any(), any(), any())).thenReturn(true);

        // When & Then
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            otpService.sendOtp(phoneNumber);
        });

        assertTrue(exception.getMessage().contains("Too many OTP requests"));
        verify(otpRepository, never()).save(any());
    }

    @Test
    void verifyOtp_ShouldReturnTrueForValidOtp() {
        // Given
        String phoneNumber = "+1234567890";
        String otpCode = "1234";
        OtpVerification mockOtp = createMockOtp(phoneNumber, otpCode);
        
        when(otpRepository.findActiveOtpByPhoneNumber(eq(phoneNumber), any(LocalDateTime.class)))
            .thenReturn(Optional.of(mockOtp));
        when(otpRepository.save(any(OtpVerification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        boolean result = otpService.verifyOtp(phoneNumber, otpCode);

        // Then
        assertTrue(result);
        assertEquals(1, mockOtp.getAttempts());
        assertTrue(mockOtp.getIsVerified());
        verify(otpRepository, times(2)).save(mockOtp); // Once for increment, once for verification
    }

    @Test
    void verifyOtp_ShouldReturnFalseForInvalidOtp() {
        // Given
        String phoneNumber = "+1234567890";
        String correctOtp = "1234";
        String wrongOtp = "5678";
        OtpVerification mockOtp = createMockOtp(phoneNumber, correctOtp);
        
        when(otpRepository.findActiveOtpByPhoneNumber(eq(phoneNumber), any(LocalDateTime.class)))
            .thenReturn(Optional.of(mockOtp));
        when(otpRepository.save(any(OtpVerification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        boolean result = otpService.verifyOtp(phoneNumber, wrongOtp);

        // Then
        assertFalse(result);
        assertEquals(1, mockOtp.getAttempts());
        assertFalse(mockOtp.getIsVerified());
        verify(otpRepository).save(mockOtp); // Only incremented attempts
    }

    @Test
    void verifyOtp_ShouldReturnFalseWhenMaxAttemptsReached() {
        // Given
        String phoneNumber = "+1234567890";
        String otpCode = "1234";
        OtpVerification mockOtp = createMockOtp(phoneNumber, otpCode);
        mockOtp.setAttempts(3); // Max attempts reached
        
        when(otpRepository.findActiveOtpByPhoneNumber(eq(phoneNumber), any(LocalDateTime.class)))
            .thenReturn(Optional.of(mockOtp));

        // When
        boolean result = otpService.verifyOtp(phoneNumber, otpCode);

        // Then
        assertFalse(result);
        verify(otpRepository, never()).save(any()); // Should not save when max attempts reached
    }

    @Test
    void verifyOtp_ShouldReturnFalseWhenNoActiveOtp() {
        // Given
        String phoneNumber = "+1234567890";
        String otpCode = "1234";
        
        when(otpRepository.findActiveOtpByPhoneNumber(eq(phoneNumber), any(LocalDateTime.class)))
            .thenReturn(Optional.empty());

        // When
        boolean result = otpService.verifyOtp(phoneNumber, otpCode);

        // Then
        assertFalse(result);
        verify(otpRepository, never()).save(any());
    }

    @Test
    void getRemainingAttempts_ShouldReturnCorrectCount() {
        // Given
        String phoneNumber = "+1234567890";
        OtpVerification mockOtp = createMockOtp(phoneNumber, "1234");
        mockOtp.setAttempts(1);
        
        when(otpRepository.findActiveOtpByPhoneNumber(eq(phoneNumber), any(LocalDateTime.class)))
            .thenReturn(Optional.of(mockOtp));

        // When
        int remainingAttempts = otpService.getRemainingAttempts(phoneNumber);

        // Then
        assertEquals(2, remainingAttempts); // 3 max - 1 used = 2 remaining
    }

    @Test
    void cleanupExpiredOtps_ShouldDeleteExpiredRecords() {
        // Given
        when(otpRepository.deleteExpiredOtps(any(LocalDateTime.class))).thenReturn(5);

        // When
        int deletedCount = otpService.cleanupExpiredOtps();

        // Then
        assertEquals(5, deletedCount);
        verify(otpRepository).deleteExpiredOtps(any(LocalDateTime.class));
    }

    @Test
    void hasValidOtp_ShouldReturnTrueForValidActiveOtp() {
        // Given
        String phoneNumber = "+1234567890";
        OtpVerification mockOtp = createMockOtp(phoneNumber, "1234");
        
        when(otpRepository.findActiveOtpByPhoneNumber(eq(phoneNumber), any(LocalDateTime.class)))
            .thenReturn(Optional.of(mockOtp));

        // When
        boolean hasValidOtp = otpService.hasValidOtp(phoneNumber);

        // Then
        assertTrue(hasValidOtp);
    }

    @Test
    void invalidateOtpsForPhoneNumber_ShouldDeleteAllOtps() {
        // Given
        String phoneNumber = "+1234567890";

        // When
        otpService.invalidateOtpsForPhoneNumber(phoneNumber);

        // Then
        verify(otpRepository).deleteByPhoneNumber(phoneNumber);
    }

    private OtpVerification createMockOtp(String phoneNumber, String otpCode) {
        OtpVerification otp = new OtpVerification();
        otp.setId(1L);
        otp.setPhoneNumber(phoneNumber);
        otp.setOtpCode(otpCode);
        otp.setAttempts(0);
        otp.setIsVerified(false);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        return otp;
    }
}