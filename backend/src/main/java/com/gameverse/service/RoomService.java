package com.gameverse.service;

import com.gameverse.entity.ChatMessage;
import com.gameverse.entity.Room;
import com.gameverse.entity.RoomParticipant;
import com.gameverse.entity.User;
import com.gameverse.repository.ChatMessageRepository;
import com.gameverse.repository.RoomParticipantRepository;
import com.gameverse.repository.RoomRepository;
import com.gameverse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing virtual rooms and real-time chat functionality
 * Handles room creation, participant management, and message broadcasting
 */
@Service
@Transactional
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomParticipantRepository participantRepository;

    @Autowired
    private ChatMessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Configuration constants
    private static final int DEFAULT_MAX_CAPACITY = 50;
    private static final int INACTIVE_THRESHOLD_MINUTES = 30;
    private static final int MESSAGE_HISTORY_LIMIT = 50;
    private static final int MAX_MESSAGE_LENGTH = 1000;

    /**
     * Create a new room
     * 
     * @param name Room name
     * @param description Room description
     * @param maxCapacity Maximum capacity (optional, defaults to 50)
     * @return Created room
     */
    public Room createRoom(String name, String description, Integer maxCapacity) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Room name cannot be empty");
        }

        String roomId = generateRoomId();
        int capacity = (maxCapacity != null && maxCapacity > 0) ? maxCapacity : DEFAULT_MAX_CAPACITY;
        
        // Enforce maximum capacity limit
        capacity = Math.min(capacity, DEFAULT_MAX_CAPACITY);

        Room room = new Room(roomId, name.trim(), description, capacity);
        return roomRepository.save(room);
    }

    /**
     * Join a room
     * 
     * @param roomId Room ID
     * @param userId User ID
     * @return RoomParticipant record
     * @throws IllegalArgumentException if room is full or user already in room
     */
    public RoomParticipant joinRoom(String roomId, Long userId) {
        Room room = getRoomById(roomId);
        User user = getUserById(userId);

        // Check if room can accept new participants
        if (!room.canAcceptNewParticipant()) {
            throw new IllegalArgumentException("Room is not accepting new participants (full or inactive)");
        }

        // Check if user is already in the room
        if (participantRepository.isUserActiveInRoom(roomId, userId)) {
            throw new IllegalArgumentException("User is already in this room");
        }

        // Deactivate user from other rooms (users can only be in one room at a time)
        leaveAllRooms(userId);

        // Create participant record
        RoomParticipant participant = new RoomParticipant(room, user);
        participant = participantRepository.save(participant);

        // Update room participant count
        room.incrementParticipantCount();
        roomRepository.save(room);

        // Send system message about user joining
        sendSystemMessage(room, user.getProfile() != null ? 
            user.getProfile().getDisplayName() + " joined the room" : 
            "User joined the room");

        // Broadcast updated participant list
        broadcastParticipantList(roomId);

        return participant;
    }

    /**
     * Leave a room
     * 
     * @param roomId Room ID
     * @param userId User ID
     */
    public void leaveRoom(String roomId, Long userId) {
        Optional<RoomParticipant> participantOpt = participantRepository.findActiveByRoomIdAndUserId(roomId, userId);
        
        if (participantOpt.isPresent()) {
            RoomParticipant participant = participantOpt.get();
            User user = participant.getUser();
            Room room = participant.getRoom();

            // Deactivate participant
            participant.deactivate();
            participantRepository.save(participant);

            // Update room participant count
            room.decrementParticipantCount();
            roomRepository.save(room);

            // Send system message about user leaving
            sendSystemMessage(room, user.getProfile() != null ? 
                user.getProfile().getDisplayName() + " left the room" : 
                "User left the room");

            // Broadcast updated participant list
            broadcastParticipantList(roomId);
        }
    }

    /**
     * Leave all rooms (when user joins a new room or disconnects)
     * 
     * @param userId User ID
     */
    public void leaveAllRooms(Long userId) {
        List<RoomParticipant> activeParticipations = participantRepository.findActiveRoomsByUserId(userId);
        
        for (RoomParticipant participant : activeParticipations) {
            leaveRoom(participant.getRoom().getId(), userId);
        }
    }

    /**
     * Send a chat message
     * 
     * @param roomId Room ID
     * @param userId User ID
     * @param message Message content
     * @return ChatMessage record
     */
    public ChatMessage sendMessage(String roomId, Long userId, String message) {
        if (message == null || message.trim().isEmpty()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }

        if (message.length() > MAX_MESSAGE_LENGTH) {
            throw new IllegalArgumentException("Message too long (max " + MAX_MESSAGE_LENGTH + " characters)");
        }

        Room room = getRoomById(roomId);
        User user = getUserById(userId);

        // Verify user is active participant in room
        if (!participantRepository.isUserActiveInRoom(roomId, userId)) {
            throw new IllegalArgumentException("User is not an active participant in this room");
        }

        // Update user activity
        participantRepository.updateParticipantActivity(roomId, userId);

        // Create and save message
        ChatMessage chatMessage = new ChatMessage(room, user, message.trim());
        chatMessage = messageRepository.save(chatMessage);

        // Broadcast message to all participants
        broadcastMessage(chatMessage);

        return chatMessage;
    }

    /**
     * Get room details with participant list
     * 
     * @param roomId Room ID
     * @return Room with participants
     */
    public Room getRoomWithParticipants(String roomId) {
        Room room = getRoomById(roomId);
        // Participants are loaded lazily, but we can trigger loading here if needed
        room.getParticipants().size(); // Trigger lazy loading
        return room;
    }

    /**
     * Get active participants in room
     * 
     * @param roomId Room ID
     * @return List of active participants
     */
    public List<RoomParticipant> getActiveParticipants(String roomId) {
        return participantRepository.findActiveParticipantsByRoomId(roomId);
    }

    /**
     * Get recent messages in room
     * 
     * @param roomId Room ID
     * @param limit Number of messages to retrieve
     * @return List of recent messages
     */
    public List<ChatMessage> getRecentMessages(String roomId, int limit) {
        Pageable pageable = PageRequest.of(0, Math.min(limit, MESSAGE_HISTORY_LIMIT));
        Page<ChatMessage> messagePage = messageRepository.findRecentMessagesByRoomId(roomId, pageable);
        return messagePage.getContent();
    }

    /**
     * Get available rooms (with space)
     * 
     * @return List of rooms with available space
     */
    public List<Room> getAvailableRooms() {
        return roomRepository.findRoomsWithAvailableSpace();
    }

    /**
     * Get popular rooms
     * 
     * @param minParticipants Minimum number of participants
     * @return List of popular rooms
     */
    public List<Room> getPopularRooms(int minParticipants) {
        return roomRepository.findPopularRooms(minParticipants);
    }

    /**
     * Search rooms by name
     * 
     * @param searchTerm Search term
     * @return List of matching rooms
     */
    public List<Room> searchRooms(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getAvailableRooms();
        }
        return roomRepository.searchRooms(searchTerm.trim());
    }

    /**
     * Update user activity in room
     * 
     * @param roomId Room ID
     * @param userId User ID
     */
    public void updateUserActivity(String roomId, Long userId) {
        participantRepository.updateParticipantActivity(roomId, userId);
    }

    /**
     * Clean up inactive participants and empty rooms
     */
    @Transactional
    public void cleanupInactiveParticipants() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(INACTIVE_THRESHOLD_MINUTES);
        
        // Get inactive participants before deactivating them
        List<RoomParticipant> inactiveParticipants = participantRepository.findInactiveParticipants(threshold);
        
        // Deactivate inactive participants
        int deactivatedCount = participantRepository.deactivateInactiveParticipants(threshold);
        
        // Update room counts for affected rooms
        for (RoomParticipant participant : inactiveParticipants) {
            String roomId = participant.getRoom().getId();
            long activeCount = participantRepository.countActiveParticipantsByRoomId(roomId);
            roomRepository.updateParticipantCount(roomId, (int) activeCount);
            
            // Broadcast updated participant list
            broadcastParticipantList(roomId);
        }

        // Deactivate empty rooms
        LocalDateTime roomThreshold = LocalDateTime.now().minusHours(1);
        roomRepository.deactivateEmptyRooms(roomThreshold);
    }

    /**
     * Get room statistics
     * 
     * @return Room statistics object
     */
    public RoomStatistics getRoomStatistics() {
        Object[] stats = roomRepository.getRoomStatistics();
        long totalRooms = roomRepository.countActiveRooms();
        Long totalParticipants = roomRepository.getTotalParticipantsCount();
        
        return new RoomStatistics(
            totalRooms,
            totalParticipants != null ? totalParticipants : 0L,
            stats.length > 1 && stats[1] != null ? ((Number) stats[1]).doubleValue() : 0.0,
            stats.length > 2 && stats[2] != null ? ((Number) stats[2]).intValue() : 0
        );
    }

    // Private helper methods

    private Room getRoomById(String roomId) {
        return roomRepository.findById(roomId)
            .orElseThrow(() -> new RuntimeException("Room not found: " + roomId));
    }

    private User getUserById(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
    }

    private String generateRoomId() {
        // Generate a short, unique room ID
        return "room_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private void sendSystemMessage(Room room, String message) {
        ChatMessage systemMessage = new ChatMessage(room, null, message, ChatMessage.MessageType.SYSTEM);
        systemMessage = messageRepository.save(systemMessage);
        broadcastMessage(systemMessage);
    }

    private void broadcastMessage(ChatMessage message) {
        String destination = "/topic/room/" + message.getRoom().getId() + "/messages";
        messagingTemplate.convertAndSend(destination, createMessageResponse(message));
    }

    private void broadcastParticipantList(String roomId) {
        List<RoomParticipant> participants = getActiveParticipants(roomId);
        String destination = "/topic/room/" + roomId + "/participants";
        messagingTemplate.convertAndSend(destination, participants);
    }

    private MessageResponse createMessageResponse(ChatMessage message) {
        return new MessageResponse(
            message.getId(),
            message.getUser() != null ? message.getUser().getId() : null,
            message.getUser() != null && message.getUser().getProfile() != null ? 
                message.getUser().getProfile().getDisplayName() : "System",
            message.getMessage(),
            message.getMessageType().name(),
            message.getCreatedAt()
        );
    }

    // Data classes for responses
    public static class RoomStatistics {
        private final long totalRooms;
        private final long totalParticipants;
        private final double averageParticipants;
        private final int maxParticipants;

        public RoomStatistics(long totalRooms, long totalParticipants, double averageParticipants, int maxParticipants) {
            this.totalRooms = totalRooms;
            this.totalParticipants = totalParticipants;
            this.averageParticipants = averageParticipants;
            this.maxParticipants = maxParticipants;
        }

        // Getters
        public long getTotalRooms() { return totalRooms; }
        public long getTotalParticipants() { return totalParticipants; }
        public double getAverageParticipants() { return averageParticipants; }
        public int getMaxParticipants() { return maxParticipants; }
    }

    public static class MessageResponse {
        private final Long id;
        private final Long userId;
        private final String userName;
        private final String message;
        private final String messageType;
        private final LocalDateTime timestamp;

        public MessageResponse(Long id, Long userId, String userName, String message, String messageType, LocalDateTime timestamp) {
            this.id = id;
            this.userId = userId;
            this.userName = userName;
            this.message = message;
            this.messageType = messageType;
            this.timestamp = timestamp;
        }

        // Getters
        public Long getId() { return id; }
        public Long getUserId() { return userId; }
        public String getUserName() { return userName; }
        public String getMessage() { return message; }
        public String getMessageType() { return messageType; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
}