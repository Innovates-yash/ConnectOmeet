package com.gameverse.config;

import com.gameverse.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/**
 * WebSocket event listener for handling connection and disconnection events
 */
@Component
public class WebSocketEventListener {

    @Autowired
    private RoomService roomService;

    /**
     * Handle WebSocket connection events
     * 
     * @param event Connection event
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        
        // Log connection for debugging
        String sessionId = headerAccessor.getSessionId();
        System.out.println("WebSocket connection established: " + sessionId);
        
        // You can perform additional setup here if needed
    }

    /**
     * Handle WebSocket disconnection events
     * Clean up user from rooms when they disconnect
     * 
     * @param event Disconnection event
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        
        String sessionId = headerAccessor.getSessionId();
        System.out.println("WebSocket connection closed: " + sessionId);
        
        // Get user and room information from session attributes
        Object userIdObj = headerAccessor.getSessionAttributes().get("userId");
        Object roomIdObj = headerAccessor.getSessionAttributes().get("roomId");
        
        if (userIdObj instanceof Long && roomIdObj instanceof String) {
            Long userId = (Long) userIdObj;
            String roomId = (String) roomIdObj;
            
            try {
                // Remove user from room when they disconnect
                roomService.leaveRoom(roomId, userId);
                System.out.println("User " + userId + " automatically left room " + roomId + " due to disconnection");
            } catch (Exception e) {
                System.err.println("Error handling user disconnection: " + e.getMessage());
            }
        }
        
        // Alternative approach: Leave all rooms for the user
        if (userIdObj instanceof Long) {
            Long userId = (Long) userIdObj;
            try {
                roomService.leaveAllRooms(userId);
                System.out.println("User " + userId + " left all rooms due to disconnection");
            } catch (Exception e) {
                System.err.println("Error handling user disconnection from all rooms: " + e.getMessage());
            }
        }
    }
}