-- GameVerse Database Setup Script
-- Run this script to set up the complete database

-- Create database user (run as root)
CREATE USER IF NOT EXISTS 'gameverse_user'@'localhost' IDENTIFIED BY 'gameverse_password';
CREATE USER IF NOT EXISTS 'gameverse_user'@'%' IDENTIFIED BY 'gameverse_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON gameverse_db.* TO 'gameverse_user'@'localhost';
GRANT ALL PRIVILEGES ON gameverse_db.* TO 'gameverse_user'@'%';
FLUSH PRIVILEGES;

-- Source the schema and seed data
SOURCE schema.sql;
SOURCE seed_data.sql;

-- Verify setup
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'gameverse_db';
SELECT COUNT(*) as sample_rooms FROM gameverse_db.rooms;
SELECT COUNT(*) as truth_dare_questions FROM gameverse_db.truth_dare_questions;
SELECT COUNT(*) as math_questions FROM gameverse_db.math_questions;