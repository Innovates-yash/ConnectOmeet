package com.gameverse.controller;

import com.gameverse.service.GameSessionService;
import com.gameverse.service.GameSessionService.SessionInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/game-sessions")
@CrossOrigin(origins = "http://localhost:5173")
public class GameSessionController {

    @Autowired
    private GameSessionService gameSessionService;

    @GetMapping("/{sessionId}")
    public ResponseEntity<?> getSessionInfo(
            @PathVariable Long sessionId,
            Authentication authentication) {
        
        try {
            Long userId = Long.parseLong(authentication.getName());
            SessionInfo sessionInfo = gameSessionService.getSessionInfo(sessionId, userId);
            
            return ResponseEntity.ok(sessionInfo);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<?> endSession(
            @PathVariable Long sessionId,
            @RequestBody Map<String, Object> endData,
            Authentication authentication) {
        
        try {
            Long userId = Long.parseLong(authentication.getName());
            Long winnerId = endData.containsKey("winnerId") ? 
                Long.parseLong(endData.get("winnerId").toString()) : null;
            
            gameSessionService.endSession(sessionId, winnerId);
            
            return ResponseEntity.ok(Map.of("message", "Session ended successfully"));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{sessionId}/reconnect")
    public ResponseEntity<?> reconnectToSession(
            @PathVariable Long sessionId,
            Authentication authentication) {
        
        try {
            Long userId = Long.parseLong(authentication.getName());
            SessionInfo sessionInfo = gameSessionService.getSessionInfo(sessionId, userId);
            
            // Handle reconnection logic
            gameSessionService.handlePlayerConnection(sessionId, userId, "reconnect-" + System.currentTimeMillis());
            
            return ResponseEntity.ok(Map.of(
                "message", "Reconnected successfully",
                "sessionInfo", sessionInfo
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{sessionId}/status")
    public ResponseEntity<?> getSessionStatus(
            @PathVariable Long sessionId,
            Authentication authentication) {
        
        try {
            Long userId = Long.parseLong(authentication.getName());
            SessionInfo sessionInfo = gameSessionService.getSessionInfo(sessionId, userId);
            
            return ResponseEntity.ok(Map.of(
                "sessionId", sessionInfo.getSessionId(),
                "status", sessionInfo.getStatus(),
                "gameType", sessionInfo.getGameType(),
                "playerCount", sessionInfo.getPlayers().size(),
                "connectedPlayers", sessionInfo.getPlayers().stream()
                    .mapToInt(p -> p.isConnected() ? 1 : 0).sum()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }
}