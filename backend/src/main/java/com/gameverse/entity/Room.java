package com.gameverse.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing virtual rooms for socializing and chat
 */
@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @Column(name = "id", length = 20)
    private String id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "max_capacity", nullable = false)
    private Integer maxCapacity = 50;

    @Column(name = "current_count", nullable = false)
    private Integer currentCount = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<RoomParticipant> participants = new ArrayList<>();

    // Constructors
    public Room() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Room(String id, String name) {
        this();
        this.id = id;
        this.name = name;
    }

    public Room(String id, String name, String description) {
        this(id, name);
        this.description = description;
    }

    public Room(String id, String name, String description, Integer maxCapacity) {
        this(id, name, description);
        this.maxCapacity = maxCapacity;
    }

    // JPA lifecycle callbacks
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Business methods
    public boolean isFull() {
        return currentCount >= maxCapacity;
    }

    public boolean hasSpace() {
        return currentCount < maxCapacity;
    }

    public int getAvailableSpots() {
        return Math.max(0, maxCapacity - currentCount);
    }

    public void incrementParticipantCount() {
        if (currentCount < maxCapacity) {
            this.currentCount++;
        } else {
            throw new IllegalStateException("Room is at maximum capacity");
        }
    }

    public void decrementParticipantCount() {
        if (currentCount > 0) {
            this.currentCount--;
        }
    }

    public boolean canAcceptNewParticipant() {
        return isActive && hasSpace();
    }

    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
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

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
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

    public List<RoomParticipant> getParticipants() {
        return participants;
    }

    public void setParticipants(List<RoomParticipant> participants) {
        this.participants = participants;
    }

    @Override
    public String toString() {
        return "Room{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", maxCapacity=" + maxCapacity +
                ", currentCount=" + currentCount +
                ", isActive=" + isActive +
                ", createdAt=" + createdAt +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Room)) return false;
        Room room = (Room) o;
        return id != null && id.equals(room.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}