-- Migration: Add GameCoin Transactions Table
-- Description: Creates the gamecoin_transactions table for virtual currency management
-- Date: 2024-12-28

-- Create gamecoin_transactions table
CREATE TABLE IF NOT EXISTS gamecoin_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    transaction_type ENUM('CREDIT', 'DEBIT', 'INITIAL', 'BONUS', 'REFUND') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    balance_before DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    reference_id VARCHAR(100),
    reference_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_gamecoin_transactions_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_gamecoin_transactions_user_id (user_id),
    INDEX idx_gamecoin_transactions_created_at (created_at),
    INDEX idx_gamecoin_transactions_type (transaction_type),
    INDEX idx_gamecoin_transactions_reference (reference_id, reference_type),
    INDEX idx_gamecoin_transactions_user_date (user_id, created_at)
);

-- Add comments for documentation
ALTER TABLE gamecoin_transactions 
COMMENT = 'Stores all GameCoin virtual currency transactions for audit and history tracking';

ALTER TABLE gamecoin_transactions 
MODIFY COLUMN id BIGINT AUTO_INCREMENT COMMENT 'Primary key for transaction record',
MODIFY COLUMN user_id BIGINT NOT NULL COMMENT 'Foreign key reference to users table',
MODIFY COLUMN transaction_type ENUM('CREDIT', 'DEBIT', 'INITIAL', 'BONUS', 'REFUND') NOT NULL COMMENT 'Type of transaction: CREDIT (earning), DEBIT (spending), INITIAL (registration bonus), BONUS (daily/weekly), REFUND (cancelled games)',
MODIFY COLUMN amount DECIMAL(10, 2) NOT NULL COMMENT 'Transaction amount in GameCoins',
MODIFY COLUMN balance_before DECIMAL(10, 2) NOT NULL COMMENT 'User balance before this transaction',
MODIFY COLUMN balance_after DECIMAL(10, 2) NOT NULL COMMENT 'User balance after this transaction',
MODIFY COLUMN description VARCHAR(255) COMMENT 'Human-readable description of the transaction',
MODIFY COLUMN reference_id VARCHAR(100) COMMENT 'Reference ID for related entity (game session, achievement, etc.)',
MODIFY COLUMN reference_type VARCHAR(50) COMMENT 'Type of reference (GAME_WIN, DAILY_BONUS, GAME_ENTRY, etc.)',
MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when transaction was created';