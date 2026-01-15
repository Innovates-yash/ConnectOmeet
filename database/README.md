# GameVerse Database Setup

This directory contains all the database-related files for the GameVerse Social Gaming Platform.

## Files Overview

- `schema.sql` - Complete database schema with all tables
- `seed_data.sql` - Initial data for development and testing
- `setup.sql` - Complete setup script (creates user, database, and seeds data)
- `database.properties` - Configuration file for database connections
- `migrations/` - Directory for database migration scripts

## Quick Setup

### Prerequisites
- MySQL 8.0+ installed and running
- MySQL root access for initial setup

### Setup Steps

1. **Run the complete setup** (as MySQL root user):
```bash
mysql -u root -p < setup.sql
```

2. **Or set up step by step**:
```bash
# Create database and user
mysql -u root -p < setup.sql

# Create schema
mysql -u gameverse_user -p gameverse_db < schema.sql

# Seed initial data
mysql -u gameverse_user -p gameverse_db < seed_data.sql
```

### Verification

Connect to the database and verify setup:
```sql
USE gameverse_db;
SHOW TABLES;
SELECT COUNT(*) FROM rooms;
SELECT COUNT(*) FROM truth_dare_questions;
SELECT COUNT(*) FROM math_questions;
```

## Database Schema Overview

### Core Tables
- `users` - User authentication and basic info
- `profiles` - User gaming profiles and preferences
- `game_sessions` - Active and completed games
- `game_participants` - Players in each game session
- `rooms` - Virtual lobbies for socializing
- `room_participants` - Users currently in rooms
- `friendships` - User connections
- `coin_transactions` - Virtual currency transactions

### Game Content Tables
- `meme_posts` - User-generated memes for competitions
- `truth_dare_questions` - Content for Truth or Dare game
- `math_questions` - Questions for Math Master game
- `otp_verifications` - Temporary OTP storage

### Features
- **Indexes** - Optimized for common queries
- **Foreign Keys** - Referential integrity
- **JSON Columns** - Flexible data storage for game states and preferences
- **Timestamps** - Automatic creation and update tracking
- **Constraints** - Data validation at database level

## Configuration

Update `database.properties` with your specific settings:
- Database host and port
- Username and password
- Connection pool settings
- Environment-specific configurations

## Migration System

The `migrations/` directory contains versioned schema changes:
- `001_initial_schema.sql` - Initial schema setup
- Future migrations will be numbered sequentially

## Security Notes

- Change default passwords in production
- Use environment variables for sensitive configuration
- Implement proper backup strategies
- Consider read replicas for scaling

## Sample Data

The seed data includes:
- 5 default rooms for different gaming communities
- 20 Truth or Dare questions (10 truths, 10 dares)
- 25 Math questions across different difficulty levels
- Sample profile data for testing

This provides a solid foundation for development and testing of the GameVerse platform.