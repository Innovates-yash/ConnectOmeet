package com.gameverse.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Service for scheduled cleanup of inactive participants and empty rooms
 */
@Service
public class RoomCleanupService {

    @Autowired
    private RoomService roomService;

    /**
     * Clean up inactive participants every 5 minutes
     * This removes users who haven't been active for more than 30 minutes
     */
    @Scheduled(fixedRate = 300000) // 5 minutes in milliseconds
    public void cleanupInactiveParticipants() {
        try {
            roomService.cleanupInactiveParticipants();
            System.out.println("Completed cleanup of inactive participants at " + java.time.LocalDateTime.now());
        } catch (Exception e) {
            System.err.println("Error during participant cleanup: " + e.getMessage());
        }
    }

    /**
     * Log room statistics every hour for monitoring
     */
    @Scheduled(fixedRate = 3600000) // 1 hour in milliseconds
    public void logRoomStatistics() {
        try {
            RoomService.RoomStatistics stats = roomService.getRoomStatistics();
            System.out.println("Room Statistics - Total Rooms: " + stats.getTotalRooms() + 
                             ", Total Participants: " + stats.getTotalParticipants() +
                             ", Average Participants: " + String.format("%.2f", stats.getAverageParticipants()) +
                             ", Max Participants: " + stats.getMaxParticipants());
        } catch (Exception e) {
            System.err.println("Error logging room statistics: " + e.getMessage());
        }
    }
}