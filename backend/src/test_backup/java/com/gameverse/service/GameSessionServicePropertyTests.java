package com.gameverse.service;

import com.gameverse.entity.GameSession;
import com.gameverse.entity.GameParticipant;
import com.gameverse.entity.User;
import com.gameverse.entity.Profile;
import com.gameverse.repository.GameSessionRepository;
import com.gameverse.repository.GameParticipantRepository;
import com.gameverse.repository.UserRepository;
import com.gameverse.repository.ProfileRepository;
import com.gameverse.service.GameSessionService.GameStateUpdate;
import com.gameverse.service.GameSessionService.SessionInfo;
import net.jqwik.api.*;
import net.jqwik.api.constraints.IntRange;
import net.jqwik.api.constraints.NotEmpty;
import net.jqwik.api.constraints.Size;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for Game Session Management
 * 
 * Property 10: Real-time Game State Synchronization
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 * Feature: gameverse-social-gaming-platform, Property 10: Real-time Game State Synchronization
 */
class GameSessionServicePropertyTests {

    @Mock
    private GameSessionRepository gameSessionRepository;
    
    @Mock
    private GameParticipantRepository gameParticipantRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private ProfileRepository profileRepository;
    
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private GameSessionService gameSessionService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        gameSessionService = new GameSessionService();
        
        // Use reflection to inject mocked dependencies
        try {
            var gameSessionRepoField = GameSessionService.class.getDeclaredField("gameSessionRepository");
            gameSessionRepoField.setAccessible(true);
            gameSessionRepoField.set(gameSessionService, gameSessionRepository);
            
            var gameParticipantRepoField = GameSessionService.class.getDeclaredField("gameParticipantRepository");
            gameParticipantRepoField.setAccessible(true);
            gameParticipantRepoField.set(gameSessionService, gameParticipantRepository);
            
            var userRepoField = GameSessionService.class.getDeclaredField("userRepository");
            userRepoField.setAccessible(true);
            userRepoField.set(gameSessionService, userRepository);
            
            var profileRepoField = GameSessionService.class.getDeclaredField("profileRepository");
            profileRepoField.setAccessible(true);
            profileRepoField.set(gameSessionService, profileRepository);
            
            var messagingTemplateField = GameSessionService.class.getDeclaredField("messagingTemplate");
            messagingTemplateField.setAccessible(true);
            messagingTemplateField.set(gameSessionService, messagingTemplate);
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to inject dependencies", e);
        }
    }

    // Arbitraries for generating test data
    @Provide
    Arbitrary<GameSession.GameType> gameTypes() {
        return Arbitraries.of(GameSession.GameType.values());
    }

    @Provide
    Arbitrary<GameSession.Status> gameStatuses() {
        return Arbitraries.of(GameSession.Status.values());
    }

    @Provide
    Arbitrary<String> moveTypes() {
        return Arbitraries.of("MOVE", "POSITION_UPDATE", "CARD_PLAY", "SCORE_UPDATE", "CHAT");
    }

    @Provide
    Arbitrary<GameSession> gameSessions() {
        return Arbitraries.longs().between(1L, 1000L).flatMap(id ->
            gameTypes().flatMap(gameType ->
                gameStatuses().flatMap(status ->
                    Arbitraries.integers().between(2, 8).flatMap(maxPlayers ->
                        Arbitraries.integers().between(1, 8).map(currentPlayers -> {
                            GameSession session = new GameSession();
                            session.setId(id);
                            session.setGameType(gameType);
                            session.setStatus(status);
                            session.setMaxPlayers(maxPlayers);
                            session.setCurrentPlayers(Math.min(currentPlayers, maxPlayers));
                            session.setCreatedAt(LocalDateTime.now().minusMinutes(30));
                            session.setStartedAt(status == GameSession.Status.IN_PROGRESS ? LocalDateTime.now().minusMinutes(15) : null);
                            session.setGameState("{}");
                            return session;
                        })
                    )
                )
            )
        );
    }

    @Provide
    Arbitrary<List<GameParticipant>> gameParticipants() {
        return Arbitraries.integers().between(2, 6).flatMap(count ->
            Arbitraries.longs().between(1L, 1000L).list().ofSize(count).map(userIds -> {
                List<GameParticipant> participants = new ArrayList<>();
                for (int i = 0; i < userIds.size(); i++) {
                    GameParticipant participant = new GameParticipant();
                    participant.setId((long) (i + 1));
                    participant.setSessionId(1L);
                    participant.setUserId(userIds.get(i));
                    participant.setPlayerPosition(i + 1);
                    participant.setFinalScore(0);
                    participant.setJoinedAt(LocalDateTime.now().minusMinutes(20));
                    participants.add(participant);
                }
                return participants;
            })
        );
    }

    @Provide
    Arbitrary<GameStateUpdate> gameStateUpdates() {
        return moveTypes().flatMap(moveType ->
            Arbitraries.longs().between(1L, 1000L).flatMap(playerId ->
                Arbitraries.of(
                    Map.of("x", 10, "y", 20),
                    Map.of("card", "RED_5"),
                    Map.of("score", 100),
                    Map.of("message", "Hello!")
                ).map(data -> new GameStateUpdate(moveType, playerId, data))
            )
        );
    }

    /**
     * Property 10.1: Session info retrieval should be consistent for authorized participants
     * Validates: Requirements 10.1
     */
    @Property(tries = 20)
    void sessionInfoRetrievalConsistency(
            @ForAll("gameSessions") GameSession session,
            @ForAll("gameParticipants") List<GameParticipant> participants) {
        
        // Setup mocks
        when(gameSessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(gameParticipantRepository.findBySessionId(session.getId())).thenReturn(participants);
        
        // Mock users and profiles for each participant
        for (GameParticipant participant : participants) {
            User user = new User();
            user.setId(participant.getUserId());
            user.setPhoneNumber("+1234567890");
            
            Profile profile = new Profile();
            profile.setId(participant.getUserId());
            profile.setDisplayName("Player" + participant.getUserId());
            
            when(userRepository.findById(participant.getUserId())).thenReturn(Optional.of(user));
            when(profileRepository.findByUserId(participant.getUserId())).thenReturn(Optional.of(profile));
        }

        // Test: Each participant should be able to retrieve session info
        for (GameParticipant participant : participants) {
            SessionInfo sessionInfo = gameSessionService.getSessionInfo(session.getId(), participant.getUserId());
            
            assertThat(sessionInfo).isNotNull();
            assertThat(sessionInfo.getSessionId()).isEqualTo(session.getId());
            assertThat(sessionInfo.getGameType()).isEqualTo(session.getGameType().name());
            assertThat(sessionInfo.getStatus()).isEqualTo(session.getStatus().name());
            assertThat(sessionInfo.getPlayers()).hasSize(participants.size());
        }
    }

    /**
     * Property 10.2: Game state updates should be validated before application
     * Validates: Requirements 10.2
     */
    @Property(tries = 20)
    void gameStateUpdateValidation(
            @ForAll("gameSessions") GameSession session,
            @ForAll("gameParticipants") List<GameParticipant> participants,
            @ForAll("gameStateUpdates") GameStateUpdate update) {
        
        // Only test in-progress sessions
        Assume.that(session.getStatus() == GameSession.Status.IN_PROGRESS);
        Assume.that(!participants.isEmpty());
        
        GameParticipant testParticipant = participants.get(0);
        
        // Setup mocks
        when(gameSessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(gameParticipantRepository.findBySessionId(session.getId())).thenReturn(participants);
        when(gameSessionRepository.save(any(GameSession.class))).thenReturn(session);

        try {
            // Test: Valid participants should be able to update game state
            gameSessionService.updateGameState(session.getId(), testParticipant.getUserId(), update);
            
            // Verify that the session was saved (indicating successful validation)
            verify(gameSessionRepository, atLeastOnce()).save(any(GameSession.class));
            
        } catch (RuntimeException e) {
            // Invalid moves should be rejected with appropriate error messages
            assertThat(e.getMessage()).containsAnyOf("Invalid move", "not authorized", "not found");
        }
    }

    /**
     * Property 10.3: Real-time updates should be broadcast to all participants
     * Validates: Requirements 10.3
     */
    @Property(tries = 20)
    void realTimeUpdateBroadcasting(
            @ForAll("gameSessions") GameSession session,
            @ForAll("gameParticipants") List<GameParticipant> participants,
            @ForAll("gameStateUpdates") GameStateUpdate update) {
        
        Assume.that(session.getStatus() == GameSession.Status.IN_PROGRESS);
        Assume.that(!participants.isEmpty());
        
        GameParticipant testParticipant = participants.get(0);
        
        // Setup mocks
        when(gameSessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(gameParticipantRepository.findBySessionId(session.getId())).thenReturn(participants);
        when(gameSessionRepository.save(any(GameSession.class))).thenReturn(session);

        try {
            // Test: Update game state
            gameSessionService.updateGameState(session.getId(), testParticipant.getUserId(), update);
            
            // Verify: All participants should receive the update
            for (GameParticipant participant : participants) {
                verify(messagingTemplate, atLeastOnce()).convertAndSendToUser(
                    eq(participant.getUserId().toString()),
                    eq("/queue/game/" + session.getId()),
                    any(GameStateUpdate.class)
                );
            }
            
        } catch (RuntimeException e) {
            // If update fails, no broadcasts should occur
            verify(messagingTemplate, never()).convertAndSendToUser(anyString(), anyString(), any());
        }
    }

    /**
     * Property 10.4: Connection tracking should handle multiple connections per user
     * Validates: Requirements 10.4
     */
    @Property(tries = 20)
    void connectionTrackingConsistency(
            @ForAll @IntRange(min = 1, max = 1000) Long sessionId,
            @ForAll @IntRange(min = 1, max = 1000) Long userId,
            @ForAll @Size(min = 1, max = 3) List<@NotEmpty String> connectionIds) {
        
        // Setup mock participants
        List<GameParticipant> participants = List.of(new GameParticipant(sessionId, userId, 1));
        when(gameParticipantRepository.findBySessionId(sessionId)).thenReturn(participants);

        // Test: Handle multiple connections for the same user
        for (String connectionId : connectionIds) {
            gameSessionService.handlePlayerConnection(sessionId, userId, connectionId);
        }

        // Test: Disconnect one connection at a time
        for (int i = 0; i < connectionIds.size() - 1; i++) {
            gameSessionService.handlePlayerDisconnection(sessionId, userId, connectionIds.get(i));
        }

        // Test: Disconnect last connection
        gameSessionService.handlePlayerDisconnection(sessionId, userId, connectionIds.get(connectionIds.size() - 1));
        
        // Verify: Disconnection should be broadcast to other participants
        verify(messagingTemplate, atLeastOnce()).convertAndSendToUser(
            anyString(),
            eq("/queue/game/" + sessionId),
            any(GameStateUpdate.class)
        );
    }

    /**
     * Property 10.5: Game end conditions should be detected correctly
     * Validates: Requirements 10.5
     */
    @Property(tries = 20)
    void gameEndConditionDetection(
            @ForAll("gameSessions") GameSession session,
            @ForAll("gameParticipants") List<GameParticipant> participants) {
        
        Assume.that(session.getStatus() == GameSession.Status.IN_PROGRESS);
        Assume.that(!participants.isEmpty());
        
        // Use first participant as winner
        Long validWinnerId = participants.get(0).getUserId();
        
        // Setup mocks
        when(gameSessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(gameParticipantRepository.findBySessionId(session.getId())).thenReturn(participants);
        when(gameSessionRepository.save(any(GameSession.class))).thenReturn(session);

        // Test: End the session
        gameSessionService.endSession(session.getId(), validWinnerId);

        // Verify: Session should be marked as completed
        verify(gameSessionRepository).save(argThat(savedSession -> 
            savedSession.getStatus() == GameSession.Status.COMPLETED &&
            savedSession.getWinnerId().equals(validWinnerId) &&
            savedSession.getEndedAt() != null
        ));

        // Verify: Game end should be broadcast to all participants
        verify(messagingTemplate, times(participants.size())).convertAndSendToUser(
            anyString(),
            eq("/queue/game/" + session.getId()),
            any(GameStateUpdate.class)
        );
    }
}