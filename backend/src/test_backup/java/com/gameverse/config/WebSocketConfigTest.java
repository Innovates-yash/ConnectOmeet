package com.gameverse.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.StompWebSocketEndpointRegistration;

import static org.mockito.Mockito.*;

/**
 * Unit tests for WebSocket configuration
 * Tests WebSocket setup and STOMP endpoint configuration
 */
@SpringBootTest
@ActiveProfiles("test")
class WebSocketConfigTest {

    @Test
    void configureMessageBroker_ShouldSetupCorrectDestinations() {
        // Given
        WebSocketConfig config = new WebSocketConfig();
        MessageBrokerRegistry registry = mock(MessageBrokerRegistry.class);

        // When
        config.configureMessageBroker(registry);

        // Then
        verify(registry).enableSimpleBroker("/topic", "/queue");
        verify(registry).setApplicationDestinationPrefixes("/app");
        verify(registry).setUserDestinationPrefix("/user");
    }

    @Test
    void registerStompEndpoints_ShouldRegisterCorrectEndpoints() {
        // Given
        WebSocketConfig config = new WebSocketConfig();
        StompEndpointRegistry registry = mock(StompEndpointRegistry.class);
        StompWebSocketEndpointRegistration registration = 
            mock(StompWebSocketEndpointRegistration.class);

        when(registry.addEndpoint("/ws")).thenReturn(registration);
        when(registry.addEndpoint("/ws-direct")).thenReturn(registration);
        when(registration.setAllowedOriginPatterns("*")).thenReturn(registration);

        // When
        config.registerStompEndpoints(registry);

        // Then
        verify(registry).addEndpoint("/ws");
        verify(registry).addEndpoint("/ws-direct");
        verify(registration, times(2)).setAllowedOriginPatterns("*");
        verify(registration).withSockJS(); // Only called once for /ws endpoint
    }
}