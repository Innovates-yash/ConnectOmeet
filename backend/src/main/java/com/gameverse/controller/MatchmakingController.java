package com.gameverse.controller;

import com.gameverse.dto.response.ApiResponse;
import com.gameverse.service.MatchmakingService;
import com.gameverse.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/matchmaking")
@CrossOrigin(origins = "*")
public class MatchmakingController {

    @Autowired
    private MatchmakingService matchmakingService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @PostMapping("/join")
    public ResponseEntity<ApiResponse> joinQueue(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        
        try {
            Long userId = getUserIdFromToken(httpRequest);
            String gameType = request.get("gameType");
            String skillLevel = request.getOrDefault("skillLevel", "BEGINNER");

            if (gameType == null || gameType.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Game type is required", null));
            }

            MatchmakingService.QueueStatus status = matchmakingService.joinQueue(userId, gameType, skillLevel);
            
            return ResponseEntity.ok(new ApiResponse(true, "Successfully joined matchmaking queue", status));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "Failed to join queue: " + e.getMessage(), null));
        }
    }

    @PostMapping("/leave")
    public ResponseEntity<ApiResponse> leaveQueue(
            HttpServletRequest httpRequest) {
        
        try {
            Long userId = getUserIdFromToken(httpRequest);
            MatchmakingService.QueueStatus status = matchmakingService.leaveQueue(userId);
            
            return ResponseEntity.ok(new ApiResponse(true, "Successfully left matchmaking queue", status));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "Failed to leave queue: " + e.getMessage(), null));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse> getQueueStatus(
            HttpServletRequest httpRequest) {
        
        try {
            Long userId = getUserIdFromToken(httpRequest);
            MatchmakingService.QueueStatus status = matchmakingService.getQueueStatus(userId);
            
            return ResponseEntity.ok(new ApiResponse(true, "Queue status retrieved", status));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "Failed to get queue status: " + e.getMessage(), null));
        }
    }

    private Long getUserIdFromToken(HttpServletRequest request) {
        String token = getTokenFromRequest(request);
        if (token != null && jwtTokenProvider.validateToken(token)) {
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new RuntimeException("Invalid or missing authentication token");
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}