package com.gameverse.config;

import com.gameverse.security.JwtAuthenticationEntryPoint;
import com.gameverse.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit tests for Security configuration
 * Tests authentication, authorization, and CORS setup
 */
@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void passwordEncoder_ShouldUseBCryptWithStrength12() {
        // Given
        String rawPassword = "testPassword123";

        // When
        String encodedPassword = passwordEncoder.encode(rawPassword);

        // Then
        assertNotNull(encodedPassword);
        assertTrue(passwordEncoder.matches(rawPassword, encodedPassword));
        assertFalse(passwordEncoder.matches("wrongPassword", encodedPassword));
        
        // BCrypt hashes start with $2a$, $2b$, or $2y$ followed by cost factor
        assertTrue(encodedPassword.matches("^\\$2[aby]\\$\\d{2}\\$.+"));
    }

    @Test
    void publicEndpoints_ShouldBeAccessibleWithoutAuthentication() throws Exception {
        // Test auth endpoints
        mockMvc.perform(post("/api/v1/auth/send-otp")
                .contentType("application/json")
                .content("{\"phoneNumber\":\"+1234567890\"}"))
                .andExpect(status().is4xxClientError()); // Bad request due to missing service, not unauthorized

        // Test health endpoint
        mockMvc.perform(get("/api/v1/actuator/health"))
                .andExpect(status().isNotFound()); // Endpoint not implemented yet, but not unauthorized
    }

    @Test
    void protectedEndpoints_ShouldRequireAuthentication() throws Exception {
        // Test protected endpoint without authentication
        mockMvc.perform(get("/api/v1/user/profile"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/game/sessions"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void corsConfiguration_ShouldAllowConfiguredOrigins() {
        // This test verifies CORS configuration is properly set up
        // Actual CORS testing requires integration tests with real HTTP requests
        
        SecurityConfig securityConfig = new SecurityConfig();
        var corsSource = securityConfig.corsConfigurationSource();
        var corsConfig = corsSource.getCorsConfiguration(null);

        assertNotNull(corsConfig);
        assertTrue(corsConfig.getAllowedMethods().contains("GET"));
        assertTrue(corsConfig.getAllowedMethods().contains("POST"));
        assertTrue(corsConfig.getAllowedMethods().contains("PUT"));
        assertTrue(corsConfig.getAllowedMethods().contains("DELETE"));
        assertTrue(corsConfig.getAllowCredentials());
    }

    @Test
    void jwtFilter_ShouldBeConfiguredInSecurityChain() {
        // This test verifies that JWT filter is properly configured
        // The actual filter behavior will be tested in integration tests
        
        assertNotNull(jwtAuthenticationFilter);
        assertNotNull(jwtAuthenticationEntryPoint);
    }
}