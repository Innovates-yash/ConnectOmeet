package com.gameverse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * GameVerse Social Gaming Platform
 * Main Spring Boot Application Class
 * 
 * Features:
 * - RESTful API for game management
 * - WebSocket support for real-time gaming
 * - JWT-based authentication
 * - MySQL database integration
 * - Async processing for performance
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class GameVerseApplication {

    public static void main(String[] args) {
        SpringApplication.run(GameVerseApplication.class, args);
        System.out.println("""
            
            ╔══════════════════════════════════════════════════════════════╗
            ║                    🎮 GameVerse Platform 🎮                  ║
            ║                                                              ║
            ║  🚀 Social Gaming Platform Started Successfully!             ║
            ║  📱 Phone + OTP Authentication Ready                         ║
            ║  🎯 10 Games Available                                       ║
            ║  💰 Virtual Currency System Active                          ║
            ║  🔗 WebSocket Real-time Communication Enabled               ║
            ║                                                              ║
            ║  🌐 API: http://localhost:8080                               ║
            ║  📚 Docs: http://localhost:8080/swagger-ui.html             ║
            ║  🔌 WebSocket: ws://localhost:8080/ws                        ║
            ╚══════════════════════════════════════════════════════════════╝
            """);
    }
}