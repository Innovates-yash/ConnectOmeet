package com.gameverse.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

/**
 * Standard API Response wrapper for all endpoints
 * Provides consistent response structure across the application
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse {
    
    private boolean success;
    private String message;
    private Object data;
    private String error;
    private LocalDateTime timestamp;

    // Constructors
    public ApiResponse() {
        this.timestamp = LocalDateTime.now();
    }

    public ApiResponse(boolean success, String message) {
        this();
        this.success = success;
        this.message = message;
    }

    public ApiResponse(boolean success, String message, Object data) {
        this();
        this.success = success;
        this.message = message;
        this.data = data;
    }

    // Static factory methods for common responses
    public static ApiResponse success(String message) {
        return new ApiResponse(true, message);
    }

    public static ApiResponse success(String message, Object data) {
        return new ApiResponse(true, message, data);
    }

    public static ApiResponse error(String errorMessage) {
        ApiResponse response = new ApiResponse(false, null);
        response.setError(errorMessage);
        return response;
    }

    public static ApiResponse error(String message, String errorDetails) {
        ApiResponse response = new ApiResponse(false, message);
        response.setError(errorDetails);
        return response;
    }

    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "ApiResponse{" +
                "success=" + success +
                ", message='" + message + '\'' +
                ", data=" + data +
                ", error='" + error + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
}