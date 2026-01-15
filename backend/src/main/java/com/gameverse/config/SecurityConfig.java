package com.gameverse.config;

import com.gameverse.security.JwtAuthenticationEntryPoint;
import com.gameverse.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security Configuration for GameVerse Platform
 * 
 * Security Features:
 * - JWT-based stateless authentication
 * - Phone number + OTP authentication flow
 * - CORS configuration for frontend integration
 * - WebSocket security for real-time features
 * - Role-based access control
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * Configure HTTP security with JWT authentication
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
            .authorizeHttpRequests(authz -> authz
                // Public endpoints - no authentication required (relative to context path)
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/public/**").permitAll()
                .requestMatchers("/ws/**").permitAll() // WebSocket endpoint
                .requestMatchers("/ws-direct/**").permitAll()
                
                // Health and monitoring endpoints
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/actuator/info").permitAll()
                
                // API documentation
                .requestMatchers("/swagger-ui/**").permitAll()
                .requestMatchers("/v3/api-docs/**").permitAll()
                .requestMatchers("/swagger-resources/**").permitAll()
                .requestMatchers("/webjars/**").permitAll()
                
                // Static resources
                .requestMatchers("/static/**").permitAll()
                .requestMatchers("/images/**").permitAll()
                
                // All other endpoints require authentication
                .anyRequest().authenticated()
            );

        // Add JWT filter before UsernamePasswordAuthenticationFilter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CORS configuration for frontend integration
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allow specific origins (configure for your frontend)
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:3000",    // React dev server
            "http://localhost:5173",    // Vite dev server
            "http://localhost:4200",    // Angular dev server
            "https://*.gameverse.com"   // Production domains
        ));
        
        // Allow specific HTTP methods
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));
        
        // Allow specific headers
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization", 
            "Content-Type", 
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));
        
        // Allow credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);
        
        // Cache preflight response for 1 hour
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Password encoder for secure password hashing
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // Strength 12 for good security
    }

    /**
     * Authentication manager for handling authentication requests
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
}

/**
 * Security Endpoint Patterns:
 * 
 * Public Endpoints (No Authentication):
 * - POST /api/v1/auth/send-otp - Send OTP to phone number
 * - POST /api/v1/auth/verify-otp - Verify OTP and get JWT token
 * - GET /api/v1/public/rooms - List public rooms
 * - WebSocket /ws - Real-time connection (authenticated after connection)
 * 
 * Protected Endpoints (JWT Required):
 * - All /api/v1/user/** - User profile management
 * - All /api/v1/game/** - Game session management
 * - All /api/v1/room/** - Room management
 * - All /api/v1/social/** - Social features
 * 
 * WebSocket Security:
 * - Initial connection is public
 * - Message-level authentication via JWT in headers
 * - User-specific destinations require valid JWT
 */