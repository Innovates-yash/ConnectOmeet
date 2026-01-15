package com.gameverse.config;

import com.gameverse.service.GameSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class GameWebSocketEventListener {

    @Autowired
    private GameSessionService gameSessionService;

    // Track session to game session mapping
    private final Map<String, SessionInfo> sessionMapping = new ConcurrentHashMap<>();

    private static class SessionInfo {
        private Long sessionId;
        private Long userId;

        public SessionInfo(Long sessionId, Long userId) {
            this.sessionId = sessionId;
            this.userId = userId;
        }

        public Long getSessionId() { return sessionId; }
        public Long getUserId() { return userId; }
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        // Extract game session info from headers if available
        String gameSessionId = headerAccessor.getFirstNativeHeader("gameSessionId");
        String userId = headerAccessor.getFirstNativeHeader("userId");
        
        if (gameSessionId != null && userId != null) {
            try {
                Long gameSessionIdLong = Long.parseLong(gameSessionId);
                Long userIdLong = Long.parseLong(userId);
                
                sessionMapping.put(sessionId, new SessionInfo(gameSessionIdLong, userIdLong));
                
                // Notify game session service of connection
                gameSessionService.handlePlayerConnection(gameSessionIdLong, userIdLong, sessionId);
                
            } catch (NumberFormatException e) {
                System.err.println("Invalid session or user ID in WebSocket headers");
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        SessionInfo sessionInfo = sessionMapping.remove(sessionId);
        if (sessionInfo != null) {
            // Notify game session service of disconnection
            gameSessionService.handlePlayerDisconnection(
                sessionInfo.getSessionId(), 
                sessionInfo.getUserId(), 
                sessionId
            );
        }
    }
}