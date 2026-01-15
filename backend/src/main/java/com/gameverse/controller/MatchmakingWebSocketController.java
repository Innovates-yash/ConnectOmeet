package com.gameverse.controller;

import com.gameverse.service.MatchmakingService;
import com.gameverse.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class MatchmakingWebSocketController {

    @Autowired
    private MatchmakingService matchmakingService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @MessageMapping("/matchmaking/join")
    public void joinMatchmakingQueue(@Payload Map<String, String> payload, 
                                   SimpMessageHeaderAccessor headerAccessor) {
        try {
            Long userId = getUserIdFromHeaders(headerAccessor);
            String gameType = payload.get("gameType");
            String skillLevel = payload.getOrDefault("skillLevel", "BEGINNER");

            MatchmakingService.QueueStatus status = matchmakingService.joinQueue(userId, gameType, skillLevel);
            
            // Send confirmation back to user
            messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/matchmaking/status",
                status
            );
            
        } catch (Exception e) {
            // Send error back to user
            messagingTemplate.convertAndSendToUser(
                headerAccessor.getUser().getName(),
                "/queue/matchmaking/error",
                Map.of("error", "Failed to join queue: " + e.getMessage())
            );
        }
    }

    @MessageMapping("/matchmaking/leave")
    public void leaveMatchmakingQueue(SimpMessageHeaderAccessor headerAccessor) {
        try {
            Long userId = getUserIdFromHeaders(headerAccessor);
            
            MatchmakingService.QueueStatus status = matchmakingService.leaveQueue(userId);
            
            // Send confirmation back to user
            messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/matchmaking/status",
                status
            );
            
        } catch (Exception e) {
            // Send error back to user
            messagingTemplate.convertAndSendToUser(
                headerAccessor.getUser().getName(),
                "/queue/matchmaking/error",
                Map.of("error", "Failed to leave queue: " + e.getMessage())
            );
        }
    }

    @MessageMapping("/matchmaking/status")
    public void getMatchmakingStatus(SimpMessageHeaderAccessor headerAccessor) {
        try {
            Long userId = getUserIdFromHeaders(headerAccessor);
            
            MatchmakingService.QueueStatus status = matchmakingService.getQueueStatus(userId);
            
            // Send status back to user
            messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/matchmaking/status",
                status
            );
            
        } catch (Exception e) {
            // Send error back to user
            messagingTemplate.convertAndSendToUser(
                headerAccessor.getUser().getName(),
                "/queue/matchmaking/error",
                Map.of("error", "Failed to get status: " + e.getMessage())
            );
        }
    }

    private Long getUserIdFromHeaders(SimpMessageHeaderAccessor headerAccessor) {
        // Extract JWT token from WebSocket headers
        String token = (String) headerAccessor.getSessionAttributes().get("token");
        if (token != null && jwtTokenProvider.validateToken(token)) {
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new RuntimeException("Invalid or missing authentication token");
    }
}