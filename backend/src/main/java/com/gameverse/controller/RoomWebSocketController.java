package com.gameverse.controller;

import com.gameverse.dto.request.SendMessageRequest;
import com.gameverse.entity.ChatMessage;
import com.gameverse.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

/**
 * WebSocket controller for real-time room messaging
 * Handles WebSocket connections and message broadcasting
 */
@Controller
public class RoomWebSocketController {

    @Autowired
    private RoomService roomService;

    /**
     * Handle incoming chat messages via WebSocket
     * 
     * @param roomId Room ID from URL path
     * @param messageRequest Message content
     * @param headerAccessor WebSocket headers
     * @param principal User principal
     */
    @MessageMapping("/room/{roomId}/send")
    public void sendMessage(
            @DestinationVariable String roomId,
            @Payload SendMessageRequest messageRequest,
            SimpMessageHeaderAccessor headerAccessor,
            Principal principal) {
        
        try {
            // Extract user ID from principal or session
            Long userId = getUserIdFromPrincipal(principal, headerAccessor);
            
            // Update user activity
            roomService.updateUserActivity(roomId, userId);
            
            // Send message (this will automatically broadcast to all room participants)
            roomService.sendMessage(roomId, userId, messageRequest.getMessage());
            
        } catch (Exception e) {
            // Send error message back to sender
            // In a real implementation, you might want to send this to a specific user destination
            System.err.println("Error sending message: " + e.getMessage());
        }
    }

    /**
     * Handle user joining room via WebSocket
     * 
     * @param roomId Room ID from URL path
     * @param headerAccessor WebSocket headers
     * @param principal User principal
     */
    @MessageMapping("/room/{roomId}/join")
    public void joinRoom(
            @DestinationVariable String roomId,
            SimpMessageHeaderAccessor headerAccessor,
            Principal principal) {
        
        try {
            Long userId = getUserIdFromPrincipal(principal, headerAccessor);
            
            // Join room
            roomService.joinRoom(roomId, userId);
            
            // Store room ID in session for cleanup on disconnect
            headerAccessor.getSessionAttributes().put("roomId", roomId);
            headerAccessor.getSessionAttributes().put("userId", userId);
            
        } catch (Exception e) {
            System.err.println("Error joining room: " + e.getMessage());
        }
    }

    /**
     * Handle user leaving room via WebSocket
     * 
     * @param roomId Room ID from URL path
     * @param headerAccessor WebSocket headers
     * @param principal User principal
     */
    @MessageMapping("/room/{roomId}/leave")
    public void leaveRoom(
            @DestinationVariable String roomId,
            SimpMessageHeaderAccessor headerAccessor,
            Principal principal) {
        
        try {
            Long userId = getUserIdFromPrincipal(principal, headerAccessor);
            
            // Leave room
            roomService.leaveRoom(roomId, userId);
            
            // Clear session attributes
            headerAccessor.getSessionAttributes().remove("roomId");
            headerAccessor.getSessionAttributes().remove("userId");
            
        } catch (Exception e) {
            System.err.println("Error leaving room: " + e.getMessage());
        }
    }

    /**
     * Handle user activity heartbeat via WebSocket
     * 
     * @param roomId Room ID from URL path
     * @param headerAccessor WebSocket headers
     * @param principal User principal
     */
    @MessageMapping("/room/{roomId}/heartbeat")
    public void heartbeat(
            @DestinationVariable String roomId,
            SimpMessageHeaderAccessor headerAccessor,
            Principal principal) {
        
        try {
            Long userId = getUserIdFromPrincipal(principal, headerAccessor);
            
            // Update user activity
            roomService.updateUserActivity(roomId, userId);
            
        } catch (Exception e) {
            System.err.println("Error updating activity: " + e.getMessage());
        }
    }

    // Helper methods

    private Long getUserIdFromPrincipal(Principal principal, SimpMessageHeaderAccessor headerAccessor) {
        if (principal != null) {
            // Try to extract user ID from principal name
            try {
                return Long.parseLong(principal.getName());
            } catch (NumberFormatException e) {
                // Principal name is not a user ID, might be username
            }
        }
        
        // Try to get user ID from session attributes
        Object userId = headerAccessor.getSessionAttributes().get("userId");
        if (userId instanceof Long) {
            return (Long) userId;
        }
        
        // For development/testing, return mock user ID
        // In production, this should throw an authentication error
        return 1L;
    }
}