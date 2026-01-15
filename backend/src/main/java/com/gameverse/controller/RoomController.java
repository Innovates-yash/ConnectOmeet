package com.gameverse.controller;

import com.gameverse.dto.request.CreateRoomRequest;
import com.gameverse.dto.request.SendMessageRequest;
import com.gameverse.dto.response.RoomParticipantResponse;
import com.gameverse.dto.response.RoomResponse;
import com.gameverse.entity.ChatMessage;
import com.gameverse.entity.Room;
import com.gameverse.entity.RoomParticipant;
import com.gameverse.entity.User;
import com.gameverse.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST Controller for room management and chat functionality
 * Provides endpoints for room creation, joining, leaving, and messaging
 */
@RestController
@RequestMapping("/rooms")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class RoomController {

    @Autowired
    private RoomService roomService;

    /**
     * Create a new room
     * 
     * @param request Room creation request
     * @param authentication Current user authentication
     * @return Created room response
     */
    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            Authentication authentication) {
        
        Room room = roomService.createRoom(
            request.getName(),
            request.getDescription(),
            request.getMaxCapacity()
        );
        
        RoomResponse response = new RoomResponse(room);
        return ResponseEntity.ok(response);
    }

    /**
     * Get list of available rooms
     * 
     * @param search Optional search term
     * @param popular Whether to show only popular rooms
     * @return List of available rooms
     */
    @GetMapping
    public ResponseEntity<List<RoomResponse>> getRooms(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean popular) {
        
        List<Room> rooms;
        
        if (popular) {
            rooms = roomService.getPopularRooms(5); // Rooms with at least 5 participants
        } else if (search != null && !search.trim().isEmpty()) {
            rooms = roomService.searchRooms(search);
        } else {
            rooms = roomService.getAvailableRooms();
        }
        
        List<RoomResponse> response = rooms.stream()
                .map(RoomResponse::new)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get room details
     * 
     * @param roomId Room ID
     * @return Room details with participants
     */
    @GetMapping("/{roomId}")
    public ResponseEntity<Map<String, Object>> getRoomDetails(@PathVariable String roomId) {
        Room room = roomService.getRoomWithParticipants(roomId);
        List<RoomParticipant> participants = roomService.getActiveParticipants(roomId);
        List<ChatMessage> recentMessages = roomService.getRecentMessages(roomId, 20);
        
        Map<String, Object> response = new HashMap<>();
        response.put("room", new RoomResponse(room));
        response.put("participants", participants.stream()
                .map(RoomParticipantResponse::new)
                .collect(Collectors.toList()));
        response.put("recentMessages", recentMessages.stream()
                .map(this::createMessageResponse)
                .collect(Collectors.toList()));
        
        return ResponseEntity.ok(response);
    }

    /**
     * Join a room
     * 
     * @param roomId Room ID
     * @param authentication Current user authentication
     * @return Join result
     */
    @PostMapping("/{roomId}/join")
    public ResponseEntity<Map<String, Object>> joinRoom(
            @PathVariable String roomId,
            Authentication authentication) {
        
        Long userId = getUserIdFromAuth(authentication);
        
        try {
            RoomParticipant participant = roomService.joinRoom(roomId, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Successfully joined room");
            response.put("participant", new RoomParticipantResponse(participant));
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Leave a room
     * 
     * @param roomId Room ID
     * @param authentication Current user authentication
     * @return Leave result
     */
    @PostMapping("/{roomId}/leave")
    public ResponseEntity<Map<String, Object>> leaveRoom(
            @PathVariable String roomId,
            Authentication authentication) {
        
        Long userId = getUserIdFromAuth(authentication);
        roomService.leaveRoom(roomId, userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Successfully left room");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Send a message in a room
     * 
     * @param roomId Room ID
     * @param request Message request
     * @param authentication Current user authentication
     * @return Message response
     */
    @PostMapping("/{roomId}/messages")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @PathVariable String roomId,
            @Valid @RequestBody SendMessageRequest request,
            Authentication authentication) {
        
        Long userId = getUserIdFromAuth(authentication);
        
        try {
            ChatMessage message = roomService.sendMessage(roomId, userId, request.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", createMessageResponse(message));
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Get recent messages in a room
     * 
     * @param roomId Room ID
     * @param limit Number of messages to retrieve (default: 20, max: 50)
     * @return List of recent messages
     */
    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<Map<String, Object>>> getMessages(
            @PathVariable String roomId,
            @RequestParam(defaultValue = "20") int limit) {
        
        // Limit the number of messages to prevent abuse
        limit = Math.min(limit, 50);
        
        List<ChatMessage> messages = roomService.getRecentMessages(roomId, limit);
        List<Map<String, Object>> response = messages.stream()
                .map(this::createMessageResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get participants in a room
     * 
     * @param roomId Room ID
     * @return List of active participants
     */
    @GetMapping("/{roomId}/participants")
    public ResponseEntity<List<RoomParticipantResponse>> getParticipants(@PathVariable String roomId) {
        List<RoomParticipant> participants = roomService.getActiveParticipants(roomId);
        List<RoomParticipantResponse> response = participants.stream()
                .map(RoomParticipantResponse::new)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Update user activity in room (heartbeat)
     * 
     * @param roomId Room ID
     * @param authentication Current user authentication
     * @return Activity update result
     */
    @PostMapping("/{roomId}/activity")
    public ResponseEntity<Map<String, Object>> updateActivity(
            @PathVariable String roomId,
            Authentication authentication) {
        
        Long userId = getUserIdFromAuth(authentication);
        roomService.updateUserActivity(roomId, userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get room statistics
     * 
     * @return Room statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<RoomService.RoomStatistics> getRoomStatistics() {
        RoomService.RoomStatistics statistics = roomService.getRoomStatistics();
        return ResponseEntity.ok(statistics);
    }

    // Helper methods

    private Long getUserIdFromAuth(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        Object principal = authentication.getPrincipal();
        
        // If principal is our User entity (from JWT authentication)
        if (principal instanceof User) {
            return ((User) principal).getId();
        }
        
        // For development/testing, return mock user ID
        return 1L;
    }

    private Map<String, Object> createMessageResponse(ChatMessage message) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", message.getId());
        response.put("userId", message.getUser() != null ? message.getUser().getId() : null);
        response.put("userName", message.getUser() != null && message.getUser().getProfile() != null ? 
            message.getUser().getProfile().getDisplayName() : "System");
        response.put("message", message.getMessage());
        response.put("messageType", message.getMessageType().name());
        response.put("timestamp", message.getCreatedAt());
        return response;
    }
}