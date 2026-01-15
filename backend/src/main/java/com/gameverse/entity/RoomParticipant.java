package com.gameverse.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing users currently in rooms
 */
@Entity
@Table(name = "room_participants")
public class RoomParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "last_activity", nullable = false)
    private LocalDateTime lastActivity;

    // Constructors
    public RoomParticipant() {
        this.joinedAt = LocalDateTime.now();
        this.lastActivity = LocalDateTime.now();
    }

    public RoomParticipant(Room room, User user) {
        this();
        this.room = room;
        this.user = user;
    }

    // JPA lifecycle callbacks
    @PreUpdate
    protected void onUpdate() {
        this.lastActivity = LocalDateTime.now();
    }

    // Business methods
    public void updateActivity() {
        this.lastActivity = LocalDateTime.now();
    }

    public void activate() {
        this.isActive = true;
        updateActivity();
    }

    public void deactivate() {
        this.isActive = false;
        updateActivity();
    }

    public boolean isActiveParticipant() {
        return isActive;
    }

    public boolean isInactive(int inactiveThresholdMinutes) {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(inactiveThresholdMinutes);
        return lastActivity.isBefore(threshold);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getLastActivity() {
        return lastActivity;
    }

    public void setLastActivity(LocalDateTime lastActivity) {
        this.lastActivity = lastActivity;
    }

    @Override
    public String toString() {
        return "RoomParticipant{" +
                "id=" + id +
                ", roomId='" + (room != null ? room.getId() : null) + '\'' +
                ", userId=" + (user != null ? user.getId() : null) +
                ", joinedAt=" + joinedAt +
                ", isActive=" + isActive +
                ", lastActivity=" + lastActivity +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RoomParticipant)) return false;
        RoomParticipant that = (RoomParticipant) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}