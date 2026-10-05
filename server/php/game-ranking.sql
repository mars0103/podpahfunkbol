-- Additive migration: existing site/admin tables are not modified.
CREATE TABLE IF NOT EXISTS game_sessions (
    id CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    player_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    seed BIGINT UNSIGNED NOT NULL,
    ip_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    consumed TINYINT(1) NOT NULL DEFAULT 0,
    INDEX game_session_rate (ip_hash, created_at),
    INDEX game_session_expiry (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS game_records (
    player_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    name VARCHAR(20) NOT NULL,
    team VARCHAR(20) NOT NULL,
    score INT UNSIGNED NOT NULL,
    points INT UNSIGNED NOT NULL,
    perfect INT UNSIGNED NOT NULL,
    best_combo INT UNSIGNED NOT NULL,
    duration DECIMAL(6,1) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX game_leaderboard (points, score, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
