-- Migration: Add Chat Messages Table
-- Description: Creates the chat_messages table for real-time room messaging
-- Date: 2024-12-28

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(20) NOT NULL,
    user_id BIGINT,
    message VARCHAR(1000) NOT NULL,
    message_type ENUM('TEXT', 'SYSTEM', 'EMOJI', 'GAME_INVITE', 'ANNOUNCEMENT') DEFAULT 'TEXT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Foreign key constraints
    CONSTRAINT fk_chat_messages_room_id 
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_messages_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_chat_messages_room_id (room_id),
    INDEX idx_chat_messages_user_id (user_id),
    INDEX idx_chat_messages_created_at (created_at),
    INDEX idx_chat_messages_type (message_type),
    INDEX idx_chat_messages_room_created (room_id, created_at),
    INDEX idx_chat_messages_deleted (is_deleted)
);

-- Add comments for documentation
ALTER TABLE chat_messages 
COMMENT = 'Stores chat messages in virtual rooms for real-time communication';

ALTER TABLE chat_messages 
MODIFY COLUMN id BIGINT AUTO_INCREMENT COMMENT 'Primary key for message record',
MODIFY COLUMN room_id VARCHAR(20) NOT NULL COMMENT 'Foreign key reference to rooms table',
MODIFY COLUMN user_id BIGINT COMMENT 'Foreign key reference to users table (NULL for system messages)',
MODIFY COLUMN message VARCHAR(1000) NOT NULL COMMENT 'Message content (max 1000 characters)',
MODIFY COLUMN message_type ENUM('TEXT', 'SYSTEM', 'EMOJI', 'GAME_INVITE', 'ANNOUNCEMENT') DEFAULT 'TEXT' COMMENT 'Type of message: TEXT (regular), SYSTEM (notifications), EMOJI (emoji-only), GAME_INVITE (game invitations), ANNOUNCEMENT (room announcements)',
MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when message was created',
MODIFY COLUMN is_deleted BOOLEAN DEFAULT FALSE COMMENT 'Soft delete flag for message moderation';