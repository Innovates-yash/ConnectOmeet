package com.gameverse.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT Authentication Entry Point
 * 
 * Handles unauthorized access attempts by returning a structured JSON error response
 * instead of redirecting to a login page (which is not suitable for API-based authentication).
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request, 
                        HttpServletResponse response,
                        AuthenticationException authException) throws IOException {
        
        // Set response status and content type
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        
        // Create error response body
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", HttpServletResponse.SC_UNAUTHORIZED);
        errorResponse.put("error", "Unauthorized");
        errorResponse.put("message", "Authentication required to access this resource");
        errorResponse.put("path", request.getRequestURI());
        
        // Add specific error details based on the exception
        if (authException.getMessage() != null) {
            errorResponse.put("details", authException.getMessage());
        }
        
        // Provide helpful hints for common scenarios
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null) {
            errorResponse.put("hint", "Missing Authorization header. Include 'Bearer <token>' in your request.");
        } else if (!authHeader.startsWith("Bearer ")) {
            errorResponse.put("hint", "Invalid Authorization header format. Use 'Bearer <token>'.");
        } else {
            errorResponse.put("hint", "Invalid or expired JWT token. Please authenticate again.");
        }
        
        // Write JSON response
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}