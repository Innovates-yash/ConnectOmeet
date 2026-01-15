package com.gameverse.controller;

import com.gameverse.service.GameSessionService;
import com.gameverse.service.GameSessionService.GameStateUpdate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;
import org.springframework.security.core.Authentication;

import java.util.Map;

@Controller
public class GameSessionWebSocketController {

    @Autowired
    private GameSessionService gameSessionService;

    @MessageMapping("/game/{sessionId}/move")
    public void handleGameMove(
            @DestinationVariable Long sessionId,
            @Payload Map<String, Object> moveData,
            SimpMessageHeaderAccessor headerAccessor,
            Authentication authentication) {
        
        try {
            // Extract user ID from authentication
            Long userId = extractUserIdFromAuth(authentication);
            
            // Create game state update
            String moveType = (String) moveData.get("type");
            Object data = moveData.get("data");
            
            GameStateUpdate update = new GameStateUpdate(moveType, userId, data);
            
            // Process the move
            gameSessionService.updateGameState(sessionId, userId, update);
            
        } catch (Exception e) {
            // Send error back to user
            // In a real implementation, you'd use SimpMessagingTemplate to send error
            System.err.println("Error processing move: " + e.getMessage());
        }
    }

    @MessageMapping("/game/{sessionId}/join")
    public void handleJoinSession(
            @DestinationVariable Long sessionId,
            SimpMessageHeaderAccessor headerAccessor,
            Authentication authentication) {
        
        try {
            Long userId = extractUserIdFromAuth(authentication);
            String sessionId_str = headerAccessor.getSessionId();
            
            // Handle player connection
            gameSessionService.handlePlayerConnection(sessionId, userId, sessionId_str);
            
        } catch (Exception e) {
            System.err.println("Error joining session: " + e.getMessage());
        }
    }

    @SubscribeMapping("/game/{sessionId}")
    public GameSessionService.SessionInfo handleSubscribeToSession(
            @DestinationVariable Long sessionId,
            Authentication authentication) {
        
        try {
            Long userId = extractUserIdFromAuth(authentication);
            
            // Return current session info
            return gameSessionService.getSessionInfo(sessionId, userId);
            
        } catch (Exception e) {
            System.err.println("Error subscribing to session: " + e.getMessage());
            return null;
        }
    }

    @MessageMapping("/game/{sessionId}/disconnect")
    public void handleDisconnect(
            @DestinationVariable Long sessionId,
            SimpMessageHeaderAccessor headerAccessor,
            Authentication authentication) {
        
        try {
            Long userId = extractUserIdFromAuth(authentication);
            String sessionId_str = headerAccessor.getSessionId();
            
            // Handle player disconnection
            gameSessionService.handlePlayerDisconnection(sessionId, userId, sessionId_str);
            
        } catch (Exception e) {
            System.err.println("Error handling disconnect: " + e.getMessage());
        }
    }

    @MessageMapping("/game/{sessionId}/forfeit")
    public void handleForfeit(
            @DestinationVariable Long sessionId,
            Authentication authentication) {
        
        try {
            Long userId = extractUserIdFromAuth(authentication);
            
            // Create forfeit update
            GameStateUpdate forfeitUpdate = new GameStateUpdate("FORFEIT", userId, 
                Map.of("reason", "player_forfeit"));
            
            // Process forfeit
            gameSessionService.updateGameState(sessionId, userId, forfeitUpdate);
            
        } catch (Exception e) {
            System.err.println("Error processing forfeit: " + e.getMessage());
        }
    }

    @MessageMapping("/game/{sessionId}/chat")
    public void handleGameChat(
            @DestinationVariable Long sessionId,
            @Payload Map<String, Object> chatData,
            Authentication authentication) {
        
        try {
            Long userId = extractUserIdFromAuth(authentication);
            String message = (String) chatData.get("message");
            
            // Create chat update
            GameStateUpdate chatUpdate = new GameStateUpdate("CHAT", userId,
                Map.of("message", message, "timestamp", System.currentTimeMillis()));
            
            // Broadcast chat (doesn't update game state, just broadcasts)
            gameSessionService.updateGameState(sessionId, userId, chatUpdate);
            
        } catch (Exception e) {
            System.err.println("Error processing chat: " + e.getMessage());
        }
    }

    private Long extractUserIdFromAuth(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        try {
            return Long.parseLong(authentication.getName());
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid user ID in authentication");
        }
    }
}