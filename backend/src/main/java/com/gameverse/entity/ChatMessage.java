package com.gameverse.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing chat messages in rooms
 */
@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "message", nullable = false, length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false)
    private MessageType messageType = MessageType.TEXT;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    // Constructors
    public ChatMessage() {
        this.createdAt = LocalDateTime.now();
    }

    public ChatMessage(Room room, User user, String message) {
        this();
        this.room = room;
        this.user = user;
        this.message = message;
    }

    public ChatMessage(Room room, User user, String message, MessageType messageType) {
        this(room, user, message);
        this.messageType = messageType;
    }

    // Enums
    public enum MessageType {
        TEXT,           // Regular text message
        SYSTEM,         // System notification (user joined/left)
        EMOJI,          // Emoji-only message
        GAME_INVITE,    // Game invitation message
        ANNOUNCEMENT    // Room announcement
    }

    // Business methods
    public void delete() {
        this.isDeleted = true;
    }

    public boolean isSystemMessage() {
        return messageType == MessageType.SYSTEM;
    }

    public boolean isUserMessage() {
        return messageType == MessageType.TEXT || messageType == MessageType.EMOJI;
    }

    public boolean isVisible() {
        return !isDeleted;
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

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public MessageType getMessageType() {
        return messageType;
    }

    public void setMessageType(MessageType messageType) {
        this.messageType = messageType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    @Override
    public String toString() {
        return "ChatMessage{" +
                "id=" + id +
                ", roomId='" + (room != null ? room.getId() : null) + '\'' +
                ", userId=" + (user != null ? user.getId() : null) +
                ", message='" + message + '\'' +
                ", messageType=" + messageType +
                ", createdAt=" + createdAt +
                ", isDeleted=" + isDeleted +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ChatMessage)) return false;
        ChatMessage that = (ChatMessage) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}