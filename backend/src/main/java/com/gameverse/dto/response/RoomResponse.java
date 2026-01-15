package com.gameverse.dto.response;

import com.gameverse.entity.Room;
import java.time.LocalDateTime;

/**
 * Response DTO for Room information
 */
public class RoomResponse {
    
    private String id;
    private String name;
    private String description;
    private Integer maxCapacity;
    private Integer currentCount;
    private Integer availableSpots;
    private Boolean isActive;
    private Boolean isFull;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public RoomResponse() {}
    
    public RoomResponse(Room room) {
        this.id = room.getId();
        this.name = room.getName();
        this.description = room.getDescription();
        this.maxCapacity = room.getMaxCapacity();
        this.currentCount = room.getCurrentCount();
        this.availableSpots = room.getAvailableSpots();
        this.isActive = room.getIsActive();
        this.isFull = room.isFull();
        this.createdAt = room.getCreatedAt();
        this.updatedAt = room.getUpdatedAt();
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Integer getMaxCapacity() {
        return maxCapacity;
    }
    
    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }
    
    public Integer getCurrentCount() {
        return currentCount;
    }
    
    public void setCurrentCount(Integer currentCount) {
        this.currentCount = currentCount;
    }
    
    public Integer getAvailableSpots() {
        return availableSpots;
    }
    
    public void setAvailableSpots(Integer availableSpots) {
        this.availableSpots = availableSpots;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public Boolean getIsFull() {
        return isFull;
    }
    
    public void setIsFull(Boolean isFull) {
        this.isFull = isFull;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}