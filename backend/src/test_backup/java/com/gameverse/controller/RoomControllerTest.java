package com.gameverse.controller;

import com.gameverse.dto.request.CreateRoomRequest;
import com.gameverse.dto.request.SendMessageRequest;
import com.gameverse.entity.ChatMessage;
import com.gameverse.entity.Room;
import com.gameverse.entity.RoomParticipant;
import com.gameverse.entity.User;
import com.gameverse.service.RoomService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for RoomController
 */
@WebMvcTest(RoomController.class)
class RoomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoomService roomService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private Authentication mockAuth;
    private Room testRoom;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setPhoneNumber("+1234567890");
        testUser.setIsVerified(true);

        mockAuth = new UsernamePasswordAuthenticationToken(testUser, null, new ArrayList<>());

        testRoom = new Room("room_123", "Test Room");
        testRoom.setDescription("Test room description");
        testRoom.setMaxCapacity(10);
        testRoom.setCurrentCount(5);
        testRoom.setIsActive(true);
    }

    @Test
    void createRoom_ShouldReturnCreatedRoom() throws Exception {
        // Given
        CreateRoomRequest request = new CreateRoomRequest("Test Room", "Description", 10);
        when(roomService.createRoom("Test Room", "Description", 10)).thenReturn(testRoom);

        // When & Then
        mockMvc.perform(post("/rooms")
                .with(authentication(mockAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("room_123"))
                .andExpect(jsonPath("$.name").value("Test Room"))
                .andExpect(jsonPath("$.maxCapacity").value(10))
                .andExpect(jsonPath("$.currentCount").value(5))
                .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    void getRooms_ShouldReturnAvailableRooms() throws Exception {
        // Given
        List<Room> rooms = Arrays.asList(testRoom);
        when(roomService.getAvailableRooms()).thenReturn(rooms);

        // When & Then
        mockMvc.perform(get("/rooms")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value("room_123"))
                .andExpect(jsonPath("$[0].name").value("Test Room"));
    }

    @Test
    void getRooms_WithSearch_ShouldReturnSearchResults() throws Exception {
        // Given
        List<Room> rooms = Arrays.asList(testRoom);
        when(roomService.searchRooms("Test")).thenReturn(rooms);

        // When & Then
        mockMvc.perform(get("/rooms")
                .param("search", "Test")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("Test Room"));
    }

    @Test
    void getRooms_WithPopular_ShouldReturnPopularRooms() throws Exception {
        // Given
        List<Room> rooms = Arrays.asList(testRoom);
        when(roomService.getPopularRooms(5)).thenReturn(rooms);

        // When & Then
        mockMvc.perform(get("/rooms")
                .param("popular", "true")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("Test Room"));
    }

    @Test
    void joinRoom_ShouldReturnSuccessResponse() throws Exception {
        // Given
        RoomParticipant participant = new RoomParticipant(testRoom, testUser);
        when(roomService.joinRoom("room_123", 1L)).thenReturn(participant);

        // When & Then
        mockMvc.perform(post("/rooms/room_123/join")
                .with(authentication(mockAuth))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Successfully joined room"));
    }

    @Test
    void joinRoom_WhenRoomFull_ShouldReturnBadRequest() throws Exception {
        // Given
        when(roomService.joinRoom("room_123", 1L))
            .thenThrow(new IllegalArgumentException("Room is full"));

        // When & Then
        mockMvc.perform(post("/rooms/room_123/join")
                .with(authentication(mockAuth))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Room is full"));
    }

    @Test
    void leaveRoom_ShouldReturnSuccessResponse() throws Exception {
        // When & Then
        mockMvc.perform(post("/rooms/room_123/leave")
                .with(authentication(mockAuth))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Successfully left room"));
    }

    @Test
    void sendMessage_ShouldReturnMessageResponse() throws Exception {
        // Given
        SendMessageRequest request = new SendMessageRequest("Hello, world!");
        ChatMessage message = new ChatMessage(testRoom, testUser, "Hello, world!");
        message.setId(1L);
        message.setCreatedAt(LocalDateTime.now());
        
        when(roomService.sendMessage("room_123", 1L, "Hello, world!")).thenReturn(message);

        // When & Then
        mockMvc.perform(post("/rooms/room_123/messages")
                .with(authentication(mockAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message.message").value("Hello, world!"));
    }

    @Test
    void sendMessage_WithInvalidMessage_ShouldReturnBadRequest() throws Exception {
        // Given
        SendMessageRequest request = new SendMessageRequest("Hello, world!");
        when(roomService.sendMessage("room_123", 1L, "Hello, world!"))
            .thenThrow(new IllegalArgumentException("Message too long"));

        // When & Then
        mockMvc.perform(post("/rooms/room_123/messages")
                .with(authentication(mockAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Message too long"));
    }

    @Test
    void getMessages_ShouldReturnRecentMessages() throws Exception {
        // Given
        ChatMessage message = new ChatMessage(testRoom, testUser, "Hello, world!");
        message.setId(1L);
        message.setCreatedAt(LocalDateTime.now());
        
        List<ChatMessage> messages = Arrays.asList(message);
        when(roomService.getRecentMessages("room_123", 20)).thenReturn(messages);

        // When & Then
        mockMvc.perform(get("/rooms/room_123/messages")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].message").value("Hello, world!"));
    }

    @Test
    void updateActivity_ShouldReturnSuccessResponse() throws Exception {
        // When & Then
        mockMvc.perform(post("/rooms/room_123/activity")
                .with(authentication(mockAuth))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void getRoomStatistics_ShouldReturnStatistics() throws Exception {
        // Given
        RoomService.RoomStatistics stats = new RoomService.RoomStatistics(5, 25, 5.0, 10);
        when(roomService.getRoomStatistics()).thenReturn(stats);

        // When & Then
        mockMvc.perform(get("/rooms/statistics")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRooms").value(5))
                .andExpect(jsonPath("$.totalParticipants").value(25))
                .andExpect(jsonPath("$.averageParticipants").value(5.0))
                .andExpect(jsonPath("$.maxParticipants").value(10));
    }
}