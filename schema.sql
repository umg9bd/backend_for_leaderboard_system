CREATE DATABASE IF NOT EXISTS backend_for_leaderboard_system;
USE backend_for_leaderboard_system;

DROP TABLE IF EXISTS scores;
DROP TABLE IF EXISTS competition_snapshots;
DROP TABLE IF EXISTS competitions;
DROP TABLE IF EXISTS players;

-- 1. Players table
CREATE TABLE IF NOT EXISTS players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Competitions table
CREATE TABLE competitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unique_id VARCHAR(255) NOT NULL UNIQUE,
    score_type VARCHAR(50) DEFAULT 'points',
    sorting_order ENUM('ASC', 'DESC') NOT NULL,
    status ENUM('active', 'completed', 'archived') DEFAULT 'active',
    start_date DATETIME,
    end_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Scores table (Real-time scores)
CREATE TABLE scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    competition_id INT NOT NULL,
    player_id INT NOT NULL,
    score INT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    INDEX idx_competition_player (competition_id, player_id),
    INDEX idx_timestamp (timestamp)
);

-- 4. Competition Snapshots (Historical records)
-- Stores final leaderboard state when competition ends
CREATE TABLE competition_snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    competition_id INT NOT NULL,
    snapshot_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    final_leaderboard JSON NOT NULL,
    total_participants INT,
    
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    INDEX idx_competition_snapshot (competition_id, snapshot_date)
);

-- 5. Player History (Optional - tracks player stats across competitions)
CREATE TABLE IF NOT EXISTS player_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    competition_id INT NOT NULL,
    final_rank INT,
    final_score INT,
    completed_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    INDEX idx_player_competition (player_id, competition_id)
);