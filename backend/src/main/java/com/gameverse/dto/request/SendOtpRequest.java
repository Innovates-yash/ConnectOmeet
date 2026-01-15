package com.gameverse.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request DTO for sending OTP to phone number
 */
public class SendOtpRequest {

    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^\\+?[1-9]\\d{1,14}$", 
        message = "Phone number must be in valid international format (e.g., +1234567890)"
    )
    private String phoneNumber;

    // Constructors
    public SendOtpRequest() {}

    public SendOtpRequest(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    // Getters and Setters
    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    @Override
    public String toString() {
        return "SendOtpRequest{" +
                "phoneNumber='" + phoneNumber + '\'' +
                '}';
    }
}