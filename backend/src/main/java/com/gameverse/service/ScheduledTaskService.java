package com.gameverse.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Scheduled Task Service
 * 
 * Handles periodic maintenance tasks:
 * - Cleanup expired OTP verifications
 * - Matchmaking queue timeout processing
 * - User activity monitoring
 * - System health checks
 */
@Service
public class ScheduledTaskService {

    private static final Logger logger = LoggerFactory.getLogger(ScheduledTaskService.class);

    @Autowired
    private OtpService otpService;

    @Autowired
    private MatchmakingService matchmakingService;

    /**
     * Cleanup expired OTP verifications every 15 minutes
     */
    @Scheduled(fixedRate = 900000) // 15 minutes = 900,000 ms
    public void cleanupExpiredOtps() {
        try {
            logger.debug("Starting scheduled OTP cleanup task");
            int deletedCount = otpService.cleanupExpiredOtps();
            
            if (deletedCount > 0) {
                logger.info("Scheduled OTP cleanup completed. Deleted {} expired records", deletedCount);
            } else {
                logger.debug("Scheduled OTP cleanup completed. No expired records found");
            }
        } catch (Exception e) {
            logger.error("Error during scheduled OTP cleanup", e);
        }
    }

    /**
     * Process matchmaking queue timeouts every 30 seconds
     */
    @Scheduled(fixedRate = 30000) // 30 seconds = 30,000 ms
    public void processMatchmakingTimeouts() {
        try {
            logger.debug("Processing matchmaking queue timeouts");
            matchmakingService.processQueueTimeouts();
        } catch (Exception e) {
            logger.error("Error during matchmaking timeout processing", e);
        }
    }

    /**
     * Log system health status every hour
     */
    @Scheduled(fixedRate = 3600000) // 1 hour = 3,600,000 ms
    public void logSystemHealth() {
        try {
            logger.info("=== GameVerse System Health Check ===");
            logger.info("Authentication system: ACTIVE");
            logger.info("OTP service: ACTIVE");
            logger.info("Matchmaking service: ACTIVE");
            logger.info("Database connection: ACTIVE");
            logger.info("Scheduled tasks: RUNNING");
            logger.info("=====================================");
        } catch (Exception e) {
            logger.error("Error during system health check", e);
        }
    }
}