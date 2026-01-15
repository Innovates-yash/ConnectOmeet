package com.gameverse.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for sending a chat message
 */
public class SendMessageRequest {
    
    @NotBlank(message = "Message content is required")
    @Size(min = 1, max = 1000, message = "Message must be between 1 and 1000 characters")
    private String message;
    
    public SendMessageRequest() {}
    
    public SendMessageRequest(String message) {
        this.message = message;
    }
    
    // Getters and Setters
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
}