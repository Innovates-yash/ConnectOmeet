package com.gameverse.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket Configuration for Real-time Gaming Communication
 * 
 * Configures STOMP messaging for:
 * - Real-time game state synchronization
 * - Chat messaging in rooms
 * - Live user presence updates
 * - Game move broadcasting
 * 
 * Endpoints:
 * - /ws - Main WebSocket connection endpoint
 * - /app - Application destination prefix for client messages
 * - /topic - Broadcast destinations (rooms, games)
 * - /queue - Point-to-point destinations (private messages)
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Configure message broker for handling subscriptions and broadcasting
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple broker for destinations
        config.enableSimpleBroker("/topic", "/queue");
        
        // Set application destination prefix for client messages
        config.setApplicationDestinationPrefixes("/app");
        
        // Configure user-specific destinations
        config.setUserDestinationPrefix("/user");
    }

    /**
     * Register STOMP endpoints for WebSocket connections
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Main WebSocket endpoint with SockJS fallback
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Configure for your frontend domains
                .withSockJS();
        
        // Direct WebSocket endpoint (no SockJS)
        registry.addEndpoint("/ws-direct")
                .setAllowedOriginPatterns("*");
    }
}

/**
 * WebSocket Destination Patterns:
 * 
 * Game Sessions:
 * - /topic/game/{sessionId} - Game state updates for all players
 * - /topic/game/{sessionId}/moves - Real-time move broadcasting
 * - /queue/game/{sessionId}/player/{userId} - Private player messages
 * 
 * Rooms:
 * - /topic/room/{roomId} - Room chat messages
 * - /topic/room/{roomId}/users - User join/leave notifications
 * 
 * User Notifications:
 * - /queue/user/{userId}/notifications - Private notifications
 * - /queue/user/{userId}/invites - Game invitations
 * 
 * Matchmaking:
 * - /topic/matchmaking/{gameType} - Queue status updates
 * - /queue/matchmaking/user/{userId} - Match found notifications
 */