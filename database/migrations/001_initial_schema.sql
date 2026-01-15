-- Migration 001: Initial GameVerse Schema
-- Created: 2024-12-28
-- Description: Initial database schema for GameVerse Social Gaming Platform

-- This migration creates all the core tables needed for the platform

-- Check if migration has already been applied
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Only apply if not already applied
INSERT IGNORE INTO schema_migrations (version, description) 
VALUES ('001_initial_schema', 'Initial database schema with all core tables');

-- The actual schema creation is in schema.sql
-- This file serves as a migration tracker