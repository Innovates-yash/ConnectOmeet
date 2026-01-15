-- Migration 004: Game Sessions and Participants Tables
-- Description: Create tables for game session management and matchmaking

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    game_type ENUM('CAR_RACING', 'CHESS', 'UNO', 'RUMMY', 'LUDO', 'TRUTH_DARE', 'MEME_BATTLE', 'BUBBLE_BLAST', 'FIGHTING', 'MATH_MASTER') NOT NULL,
    session_code VARCHAR(10) UNIQUE,
    status ENUM('WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'WAITING',
    max_players INT NOT NULL,
    current_players INT DEFAULT 0,
    game_state JSON,
    winner_id BIGINT,
    entry_fee DECIMAL(10,2) DEFAULT 0.00,
    prize_pool DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    FOREIGN KEY (winner_id) REFERENCES users(id),
    INDEX idx_game_type (game_type),
    INDEX idx_status (status),
    INDEX idx_session_code (session_code),
    INDEX idx_created_at (created_at)
);

-- Create game_participants table
CREATE TABLE IF NOT EXISTS game_participants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    player_position INT,
    final_score INT DEFAULT 0,
    coins_won DECIMAL(10,2) DEFAULT 0.00,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_user (session_id, user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_joined_at (joined_at)
);

-- Add some sample game sessions for testing
INSERT INTO game_sessions (game_type, session_code, max_players, current_players, status) VALUES
('CHESS', 'CHESS001', 2, 0, 'WAITING'),
('UNO', 'UNO001', 4, 0, 'WAITING'),
('CAR_RACING', 'RACE001', 8, 0, 'WAITING'),
('FIGHTING', 'FIGHT001', 2, 0, 'WAITING');