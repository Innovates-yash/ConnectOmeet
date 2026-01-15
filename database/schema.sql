-- GameVerse Social Gaming Platform Database Schema
-- MySQL 8.0+ Compatible

-- Create database
CREATE DATABASE IF NOT EXISTS gameverse_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE gameverse_db;

-- Users table - Core user authentication and basic info
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    game_coins DECIMAL(10,2) DEFAULT 1000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone_number),
    INDEX idx_verified (is_verified),
    INDEX idx_created_at (created_at)
);

-- Profiles table - User gaming identity and preferences
CREATE TABLE profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    avatar_id VARCHAR(50) NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    bio TEXT,
    interest_tags JSON,
    games_played JSON,
    total_games_won INT DEFAULT 0,
    total_games_played INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_display_name (display_name),
    INDEX idx_games_won (total_games_won DESC)
);

-- Game sessions table - Active and completed game instances
CREATE TABLE game_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    game_type ENUM(
        'CAR_RACING', 'CHESS', 'UNO', 'RUMMY', 'LUDO', 
        'TRUTH_DARE', 'MEME_BATTLE', 'BUBBLE_BLAST', 
        'FIGHTING', 'MATH_MASTER'
    ) NOT NULL,
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

-- Game participants table - Players in each game session
CREATE TABLE game_participants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    player_position INT,
    final_score INT DEFAULT 0,
    coins_won DECIMAL(10,2) DEFAULT 0.00,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_user (session_id, user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_joined_at (joined_at)
);

-- Rooms table - Virtual lobbies for socializing
CREATE TABLE rooms (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    max_capacity INT DEFAULT 50,
    current_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_current_count (current_count),
    INDEX idx_created_at (created_at)
);

-- Room participants table - Users currently in rooms
CREATE TABLE room_participants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_id VARCHAR(20) NOT NULL,
    user_id BIGINT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_room_user (room_id, user_id),
    INDEX idx_room_id (room_id),
    INDEX idx_user_id (user_id),
    INDEX idx_active (is_active),
    INDEX idx_last_activity (last_activity)
);

-- Friendships table - User connections and relationships
CREATE TABLE friendships (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user1_id BIGINT NOT NULL,
    user2_id BIGINT NOT NULL,
    status ENUM('PENDING', 'ACCEPTED', 'BLOCKED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_friendship (user1_id, user2_id),
    INDEX idx_user1 (user1_id),
    INDEX idx_user2 (user2_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Meme posts table - User-generated content for competitions
CREATE TABLE meme_posts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    description TEXT,
    likes_count INT DEFAULT 0,
    competition_week DATE NOT NULL,
    is_winner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_competition_week (competition_week),
    INDEX idx_likes_count (likes_count DESC),
    INDEX idx_is_winner (is_winner),
    INDEX idx_created_at (created_at)
);

-- GameCoin transactions table - Virtual currency transaction log
CREATE TABLE gamecoin_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    transaction_type ENUM('CREDIT', 'DEBIT', 'INITIAL', 'BONUS', 'REFUND') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    reference_id VARCHAR(100),
    reference_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_created_at (created_at),
    INDEX idx_reference (reference_id, reference_type),
    INDEX idx_user_date (user_id, created_at)
);

-- Chat messages table - Messages in rooms
CREATE TABLE chat_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_id VARCHAR(20) NOT NULL,
    user_id BIGINT,
    message VARCHAR(1000) NOT NULL,
    message_type ENUM('TEXT', 'SYSTEM', 'EMOJI', 'GAME_INVITE', 'ANNOUNCEMENT') DEFAULT 'TEXT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_room_id (room_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_message_type (message_type),
    INDEX idx_room_created (room_id, created_at)
);

-- OTP verification table - Temporary storage for authentication codes
CREATE TABLE otp_verifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    phone_number VARCHAR(15) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    attempts INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone_number (phone_number),
    INDEX idx_expires_at (expires_at),
    INDEX idx_created_at (created_at)
);

-- Truth or Dare questions table - Content for the game
CREATE TABLE truth_dare_questions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_type ENUM('TRUTH', 'DARE') NOT NULL,
    content TEXT NOT NULL,
    difficulty_level ENUM('EASY', 'MEDIUM', 'HARD') DEFAULT 'MEDIUM',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_question_type (question_type),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_active (is_active)
);

-- Math questions table - Content for Math Master game
CREATE TABLE math_questions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question TEXT NOT NULL,
    option_a VARCHAR(100) NOT NULL,
    option_b VARCHAR(100) NOT NULL,
    option_c VARCHAR(100) NOT NULL,
    option_d VARCHAR(100) NOT NULL,
    correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
    difficulty_level ENUM('BASIC', 'INTERMEDIATE', 'ADVANCED') DEFAULT 'BASIC',
    category ENUM('ARITHMETIC', 'ALGEBRA', 'GEOMETRY', 'STATISTICS') DEFAULT 'ARITHMETIC',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_category (category),
    INDEX idx_active (is_active)
);