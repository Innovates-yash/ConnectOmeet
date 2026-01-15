package com.gameverse.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for verifying OTP and authenticating user
 */
public class VerifyOtpRequest {

    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^\\+?[1-9]\\d{1,14}$", 
        message = "Phone number must be in valid international format"
    )
    private String phoneNumber;

    @NotBlank(message = "OTP code is required")
    @Size(min = 4, max = 6, message = "OTP code must be 4-6 digits")
    @Pattern(regexp = "^\\d+$", message = "OTP code must contain only digits")
    private String otpCode;

    // Constructors
    public VerifyOtpRequest() {}

    public VerifyOtpRequest(String phoneNumber, String otpCode) {
        this.phoneNumber = phoneNumber;
        this.otpCode = otpCode;
    }

    // Getters and Setters
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

    @Override
    public String toString() {
        return "VerifyOtpRequest{" +
                "phoneNumber='" + phoneNumber + '\'' +
                ", otpCode='[PROTECTED]'" +
                '}';
    }
}