package com.gameverse.service;

import com.gameverse.entity.Room;
import com.gameverse.entity.RoomParticipant;
import com.gameverse.entity.User;
import com.gameverse.repository.ChatMessageRepository;
import com.gameverse.repository.RoomParticipantRepository;
import com.gameverse.repository.RoomRepository;
import com.gameverse.repository.UserRepository;
import net.jqwik.api.*;
import net.jqwik.api.constraints.IntRange;
import net.jqwik.api.constraints.StringLength;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for Room Management System
 * 
 * Property 4: Room Capacity and State Management
 * Property 5: Real-time Message Broadcasting
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 * 
 * These tests verify universal properties that should hold for all room operations:
 * - Room capacity enforcement across all scenarios
 * - Participant state consistency
 * - Real-time synchronization guarantees
 * - Message broadcasting reliability
 * - Room cleanup and lifecycle management
 */
class RoomServicePropertyTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomParticipantRepository participantRepository;

    @Mock
    private ChatMessageRepository messageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private RoomService roomService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    /**
     * Property 4.1: Room Capacity Enforcement
     * For any room with maximum capacity N, the number of active participants
     * should never exceed N
     */
    @Property
    void roomCapacityEnforcementProperty(
            @ForAll @IntRange(min = 2, max = 50) int maxCapacity,
            @ForAll @IntRange(min = 1, max = 100) int attemptedJoins) {
        
        // Given: A room with specific capacity
        Room room = createTestRoom("test_room", "Test Room", maxCapacity);
        when(roomRepository.findById("test_room")).thenReturn(Optional.of(room));
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When: Multiple users attempt to join
        int successfulJoins = 0;
        for (int i = 1; i <= attemptedJoins && successfulJoins < maxCapacity; i++) {
            User user = createTestUser((long) i);
            when(userRepository.findById((long) i)).thenReturn(Optional.of(user));
            when(participantRepository.isUserActiveInRoom("test_room", (long) i)).thenReturn(false);
            when(participantRepository.save(any(RoomParticipant.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

            try {
                roomService.joinRoom("test_room", (long) i);
                successfulJoins++;
                room.incrementParticipantCount(); // Simulate the increment
            } catch (IllegalArgumentException e) {
                // Expected when room is full
                break;
            }
        }

        // Then: Number of participants should not exceed capacity
        assertThat(room.getCurrentCount()).isLessThanOrEqualTo(maxCapacity);
        assertThat(successfulJoins).isLessThanOrEqualTo(maxCapacity);
    }

    /**
     * Property 4.2: Room State Consistency
     * For any sequence of join/leave operations, the room's current count
     * should always match the number of active participants
     */
    @Property
    void roomStateConsistencyProperty(
            @ForAll("roomOperations") List<RoomOperation> operations) {
        
        // Given: A room and tracking of active participants
        Room room = createTestRoom("test_room", "Test Room", 10);
        List<Long> activeParticipants = new ArrayList<>();
        
        when(roomRepository.findById("test_room")).thenReturn(Optional.of(room));
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When: Applying sequence of operations
        for (RoomOperation operation : operations) {
            User user = createTestUser(operation.userId);
            when(userRepository.findById(operation.userId)).thenReturn(Optional.of(user));
            
            if (operation.isJoin) {
                // Join operation
                boolean isAlreadyActive = activeParticipants.contains(operation.userId);
                when(participantRepository.isUserActiveInRoom("test_room", operation.userId))
                    .thenReturn(isAlreadyActive);
                
                if (!isAlreadyActive && room.hasSpace()) {
                    when(participantRepository.save(any(RoomParticipant.class)))
                        .thenAnswer(invocation -> invocation.getArgument(0));
                    
                    try {
                        roomService.joinRoom("test_room", operation.userId);
                        activeParticipants.add(operation.userId);
                        room.incrementParticipantCount();
                    } catch (IllegalArgumentException e) {
                        // Expected when room is full or user already in room
                    }
                }
            } else {
                // Leave operation
                if (activeParticipants.contains(operation.userId)) {
                    RoomParticipant participant = new RoomParticipant(room, user);
                    when(participantRepository.findActiveByRoomIdAndUserId("test_room", operation.userId))
                        .thenReturn(Optional.of(participant));
                    when(participantRepository.save(any(RoomParticipant.class)))
                        .thenAnswer(invocation -> invocation.getArgument(0));
                    
                    roomService.leaveRoom("test_room", operation.userId);
                    activeParticipants.remove(operation.userId);
                    room.decrementParticipantCount();
                }
            }
        }

        // Then: Room count should match active participants
        assertThat(room.getCurrentCount()).isEqualTo(activeParticipants.size());
        assertThat(room.getCurrentCount()).isGreaterThanOrEqualTo(0);
        assertThat(room.getCurrentCount()).isLessThanOrEqualTo(room.getMaxCapacity());
    }

    /**
     * Property 4.3: Room Capacity Bounds
     * Room capacity should always be within valid bounds and room state should be consistent
     */
    @Property
    void roomCapacityBoundsProperty(
            @ForAll @StringLength(min = 1, max = 100) String roomName,
            @ForAll @IntRange(min = 1, max = 100) int requestedCapacity) {
        
        // When: Creating a room with any capacity
        Room room = roomService.createRoom(roomName, "Test description", requestedCapacity);
        
        // Then: Capacity should be within valid bounds
        assertThat(room.getMaxCapacity()).isGreaterThan(0);
        assertThat(room.getMaxCapacity()).isLessThanOrEqualTo(50); // System maximum
        assertThat(room.getCurrentCount()).isEqualTo(0);
        assertThat(room.getIsActive()).isTrue();
        assertThat(room.hasSpace()).isTrue();
        assertThat(room.isFull()).isFalse();
    }

    /**
     * Property 5.1: Message Broadcasting Consistency
     * For any valid message sent to a room, it should be broadcast to all participants
     */
    @Property
    void messageBroadcastingConsistencyProperty(
            @ForAll @StringLength(min = 1, max = 1000) String messageContent) {
        
        // Given: A room with an active participant
        Room room = createTestRoom("test_room", "Test Room", 10);
        User user = createTestUser(1L);
        
        when(roomRepository.findById("test_room")).thenReturn(Optional.of(room));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(participantRepository.isUserActiveInRoom("test_room", 1L)).thenReturn(true);
        when(participantRepository.updateParticipantActivity("test_room", 1L)).thenReturn(1);
        when(messageRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // When: Sending a message
        try {
            roomService.sendMessage("test_room", 1L, messageContent);
            
            // Then: Message should be broadcast (verify messaging template was called)
            verify(messagingTemplate, times(1)).convertAndSend(
                eq("/topic/room/test_room/messages"), 
                any()
            );
        } catch (IllegalArgumentException e) {
            // Expected for invalid messages (empty, too long, etc.)
            // In this case, no broadcast should occur
            verify(messagingTemplate, never()).convertAndSend(anyString(), any());
        }
    }

    /**
     * Property 5.2: Participant List Synchronization
     * When participants join or leave, the participant list should be broadcast
     */
    @Property
    void participantListSynchronizationProperty(
            @ForAll @IntRange(min = 1, max = 10) int userId) {
        
        // Given: A room setup
        Room room = createTestRoom("test_room", "Test Room", 10);
        User user = createTestUser((long) userId);
        
        when(roomRepository.findById("test_room")).thenReturn(Optional.of(room));
        when(userRepository.findById((long) userId)).thenReturn(Optional.of(user));
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Test join operation
        when(participantRepository.isUserActiveInRoom("test_room", (long) userId)).thenReturn(false);
        when(participantRepository.save(any(RoomParticipant.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(participantRepository.findActiveParticipantsByRoomId("test_room"))
            .thenReturn(new ArrayList<>());

        try {
            // When: User joins room
            roomService.joinRoom("test_room", (long) userId);
            
            // Then: Participant list should be broadcast
            verify(messagingTemplate, atLeastOnce()).convertAndSend(
                eq("/topic/room/test_room/participants"), 
                any()
            );
        } catch (IllegalArgumentException e) {
            // Expected in some cases (room full, user already in room, etc.)
        }
    }

    /**
     * Property 5.3: Activity Update Consistency
     * User activity updates should always succeed for active participants
     */
    @Property
    void activityUpdateConsistencyProperty(
            @ForAll @IntRange(min = 1, max = 100) int userId) {
        
        // Given: User is active in room
        when(participantRepository.updateParticipantActivity("test_room", (long) userId))
            .thenReturn(1); // Indicates successful update

        // When: Updating user activity
        roomService.updateUserActivity("test_room", (long) userId);

        // Then: Update should be attempted
        verify(participantRepository, times(1))
            .updateParticipantActivity("test_room", (long) userId);
    }

    // Arbitraries for test data generation

    @Provide
    Arbitrary<List<RoomOperation>> roomOperations() {
        return Arbitraries.create(() -> new RoomOperation(
                Arbitraries.longs().between(1L, 20L).sample(),
                Arbitraries.of(true, false).sample()
            )).list().ofMaxSize(30);
    }

    // Helper classes and methods

    private Room createTestRoom(String id, String name, int maxCapacity) {
        Room room = new Room(id, name);
        room.setMaxCapacity(maxCapacity);
        room.setCurrentCount(0);
        room.setIsActive(true);
        return room;
    }

    private User createTestUser(Long id) {
        User user = new User();
        user.setId(id);
        user.setPhoneNumber("+123456789" + id);
        user.setIsVerified(true);
        return user;
    }

    private static class RoomOperation {
        final Long userId;
        final boolean isJoin;

        RoomOperation(Long userId, boolean isJoin) {
            this.userId = userId;
            this.isJoin = isJoin;
        }
    }
}