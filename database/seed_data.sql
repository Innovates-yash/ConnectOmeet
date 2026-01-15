-- GameVerse Database Seed Data
-- Initial data for development and testing

USE gameverse_db;

-- Seed default rooms
INSERT INTO rooms (id, name, description, max_capacity, current_count, is_active) VALUES
('lobby-001', 'Main Lobby', 'Welcome to GameVerse! Meet other gamers here.', 50, 0, TRUE),
('casual-001', 'Casual Gaming', 'For relaxed gaming sessions and friendly matches.', 30, 0, TRUE),
('competitive-001', 'Competitive Arena', 'Serious gamers only! High-stakes matches.', 25, 0, TRUE),
('social-001', 'Social Hub', 'Chat, make friends, and plan gaming sessions.', 40, 0, TRUE),
('newbie-001', 'Newbie Corner', 'New to gaming? Start here with friendly players.', 35, 0, TRUE);

-- Seed Truth or Dare questions
INSERT INTO truth_dare_questions (question_type, content, difficulty_level, is_active) VALUES
-- Truth questions
('TRUTH', 'What is your most embarrassing gaming moment?', 'EASY', TRUE),
('TRUTH', 'Which game character do you have a crush on?', 'EASY', TRUE),
('TRUTH', 'What is the longest gaming session you have ever had?', 'EASY', TRUE),
('TRUTH', 'Have you ever rage quit a game? What happened?', 'MEDIUM', TRUE),
('TRUTH', 'What is your biggest gaming achievement?', 'MEDIUM', TRUE),
('TRUTH', 'Have you ever spent real money on in-game items you regretted?', 'MEDIUM', TRUE),
('TRUTH', 'What game do you play when you want to relax?', 'EASY', TRUE),
('TRUTH', 'Have you ever lied about your gaming skills to impress someone?', 'HARD', TRUE),
('TRUTH', 'What is your most toxic gaming behavior?', 'HARD', TRUE),
('TRUTH', 'Which gaming community do you think is the most welcoming?', 'MEDIUM', TRUE),

-- Dare questions
('DARE', 'Do your best impression of a game character for 30 seconds.', 'EASY', TRUE),
('DARE', 'Sing the theme song of your favorite game.', 'EASY', TRUE),
('DARE', 'Play the next game with your non-dominant hand only.', 'MEDIUM', TRUE),
('DARE', 'Speak in a funny accent for the next 5 minutes.', 'EASY', TRUE),
('DARE', 'Do 10 push-ups while explaining your favorite game strategy.', 'MEDIUM', TRUE),
('DARE', 'Play a game blindfolded for 2 minutes.', 'HARD', TRUE),
('DARE', 'Create a victory dance and perform it.', 'EASY', TRUE),
('DARE', 'Compliment each player in the most creative way possible.', 'MEDIUM', TRUE),
('DARE', 'Play the next round while standing on one foot.', 'MEDIUM', TRUE),
('DARE', 'Record a 30-second gaming tip video for social media.', 'HARD', TRUE);

-- Seed Math questions for Math Master game
INSERT INTO math_questions (question, option_a, option_b, option_c, option_d, correct_answer, difficulty_level, category, is_active) VALUES
-- Basic Arithmetic
('What is 15 + 27?', '42', '41', '43', '40', 'A', 'BASIC', 'ARITHMETIC', TRUE),
('What is 144 ÷ 12?', '11', '12', '13', '14', 'B', 'BASIC', 'ARITHMETIC', TRUE),
('What is 8 × 9?', '71', '72', '73', '74', 'B', 'BASIC', 'ARITHMETIC', TRUE),
('What is 100 - 37?', '63', '62', '64', '61', 'A', 'BASIC', 'ARITHMETIC', TRUE),
('What is 25% of 80?', '15', '20', '25', '30', 'B', 'BASIC', 'ARITHMETIC', TRUE),

-- Intermediate Arithmetic
('What is 15² (15 squared)?', '225', '215', '235', '245', 'A', 'INTERMEDIATE', 'ARITHMETIC', TRUE),
('What is the square root of 169?', '12', '13', '14', '15', 'B', 'INTERMEDIATE', 'ARITHMETIC', TRUE),
('What is 7! (7 factorial)?', '5040', '4320', '5760', '4800', 'A', 'INTERMEDIATE', 'ARITHMETIC', TRUE),
('What is 2⁵ (2 to the power of 5)?', '30', '32', '28', '35', 'B', 'INTERMEDIATE', 'ARITHMETIC', TRUE),
('What is 3/4 + 2/3?', '17/12', '5/7', '6/7', '11/12', 'A', 'INTERMEDIATE', 'ARITHMETIC', TRUE),

-- Basic Algebra
('If x + 5 = 12, what is x?', '6', '7', '8', '9', 'B', 'BASIC', 'ALGEBRA', TRUE),
('If 2x = 16, what is x?', '6', '7', '8', '9', 'C', 'BASIC', 'ALGEBRA', TRUE),
('If x - 3 = 10, what is x?', '13', '12', '14', '11', 'A', 'BASIC', 'ALGEBRA', TRUE),
('What is the value of x in 3x + 6 = 21?', '4', '5', '6', '7', 'B', 'INTERMEDIATE', 'ALGEBRA', TRUE),
('If y = 2x + 3 and x = 4, what is y?', '10', '11', '12', '13', 'B', 'INTERMEDIATE', 'ALGEBRA', TRUE),

-- Basic Geometry
('What is the area of a rectangle with length 8 and width 5?', '40', '35', '45', '30', 'A', 'BASIC', 'GEOMETRY', TRUE),
('How many degrees are in a triangle?', '180', '360', '90', '270', 'A', 'BASIC', 'GEOMETRY', TRUE),
('What is the circumference of a circle with radius 5? (Use π ≈ 3.14)', '31.4', '15.7', '78.5', '25.12', 'A', 'INTERMEDIATE', 'GEOMETRY', TRUE),
('What is the area of a circle with radius 3? (Use π ≈ 3.14)', '28.26', '18.84', '9.42', '37.68', 'A', 'INTERMEDIATE', 'GEOMETRY', TRUE),
('How many sides does a hexagon have?', '5', '6', '7', '8', 'B', 'BASIC', 'GEOMETRY', TRUE),

-- Advanced questions
('What is the derivative of x²?', '2x', 'x', '2', 'x²', 'A', 'ADVANCED', 'ALGEBRA', TRUE),
('What is log₁₀(1000)?', '2', '3', '4', '5', 'B', 'ADVANCED', 'ALGEBRA', TRUE),
('In a normal distribution, what percentage of data falls within 1 standard deviation?', '68%', '95%', '99.7%', '50%', 'A', 'ADVANCED', 'STATISTICS', TRUE),
('What is the sum of interior angles of a pentagon?', '540°', '720°', '900°', '360°', 'A', 'ADVANCED', 'GEOMETRY', TRUE),
('If sin(θ) = 0.5, what is θ in degrees? (0° ≤ θ ≤ 90°)', '30°', '45°', '60°', '90°', 'A', 'ADVANCED', 'GEOMETRY', TRUE);

-- Create indexes for better performance
CREATE INDEX idx_truth_dare_type_difficulty ON truth_dare_questions(question_type, difficulty_level);
CREATE INDEX idx_math_difficulty_category ON math_questions(difficulty_level, category);

-- Insert sample avatar IDs (these would correspond to actual avatar assets)
-- This is just metadata - actual avatar images would be stored separately
INSERT INTO profiles (user_id, avatar_id, display_name, bio, interest_tags, games_played, total_games_won, total_games_played) VALUES
(1, 'cyber_warrior_01', 'CyberGamer', 'Love competitive gaming and making new friends!', 
 JSON_ARRAY('FPS', 'Strategy', 'RPG', 'Competitive'), 
 JSON_ARRAY('Chess', 'Racing', 'Fighting'), 5, 20),
(2, 'neon_ninja_02', 'NeonNinja', 'Casual gamer who enjoys puzzle games and socializing.', 
 JSON_ARRAY('Puzzle', 'Casual', 'Social', 'Card Games'), 
 JSON_ARRAY('Uno', 'Math Master', 'Truth or Dare'), 8, 15),
(3, 'pixel_punk_03', 'PixelPunk', 'Retro gaming enthusiast and meme creator extraordinaire!', 
 JSON_ARRAY('Retro', 'Memes', 'Creative', 'Arcade'), 
 JSON_ARRAY('Bubble Blast', 'Meme Battle', 'Ludo'), 12, 25)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- Note: The above profiles reference user_id 1, 2, 3 which would be created when users register
-- This is sample data for development purposes