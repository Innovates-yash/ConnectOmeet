package com.gameverse.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * OTP Verification entity for phone number authentication
 */
@Entity
@Table(name = "otp_verifications")
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "phone_number", nullable = false, length = 15)
    private String phoneNumber;

    @Column(name = "otp_code", nullable = false, length = 6)
    private String otpCode;

    @Column(name = "attempts", nullable = false)
    private Integer attempts = 0;

    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Constructors
    public OtpVerification() {
        this.createdAt = LocalDateTime.now();
    }

    public OtpVerification(String phoneNumber, String otpCode, LocalDateTime expiresAt) {
        this();
        this.phoneNumber = phoneNumber;
        this.otpCode = otpCode;
        this.expiresAt = expiresAt;
    }

    // Business methods
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isMaxAttemptsReached(int maxAttempts) {
        return attempts >= maxAttempts;
    }

    public void incrementAttempts() {
        this.attempts++;
    }

    public void markAsVerified() {
        this.isVerified = true;
    }

    public boolean canAttemptVerification(int maxAttempts) {
        return !isExpired() && !isVerified && !isMaxAttemptsReached(maxAttempts);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getOtpCode() {
        return otpCode;
    }

    public void setOtpCode(String otpCode) {
        this.otpCode = otpCode;
    }

    public Integer getAttempts() {
        return attempts;
    }

    public void setAttempts(Integer attempts) {
        this.attempts = attempts;
    }

    public Boolean getIsVerified() {
        return isVerified;
    }

    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "OtpVerification{" +
                "id=" + id +
                ", phoneNumber='" + phoneNumber + '\'' +
                ", attempts=" + attempts +
                ", isVerified=" + isVerified +
                ", expiresAt=" + expiresAt +
                ", createdAt=" + createdAt +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof OtpVerification)) return false;
        OtpVerification that = (OtpVerification) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}