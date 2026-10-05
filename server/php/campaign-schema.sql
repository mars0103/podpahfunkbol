CREATE TABLE IF NOT EXISTS game_users (
 id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 username VARCHAR(20) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL UNIQUE,
 email VARCHAR(254) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 auth_version INT UNSIGNED NOT NULL DEFAULT 1,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS game_password_resets (
 token_hash CHAR(64) CHARACTER SET ascii PRIMARY KEY,
 user_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 expires_at DATETIME NOT NULL,
 INDEX (user_id), INDEX (expires_at),
 FOREIGN KEY (user_id) REFERENCES game_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS game_auth_limits (
 bucket_key CHAR(64) CHARACTER SET ascii PRIMARY KEY,
 attempts INT UNSIGNED NOT NULL DEFAULT 0,
 expires_at DATETIME NOT NULL, INDEX (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS game_campaign_runs (
 id CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 user_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 seed BIGINT UNSIGNED NOT NULL,
 team VARCHAR(20) NOT NULL,
 engine_version SMALLINT UNSIGNED NOT NULL DEFAULT 1,
 last_tick INT UNSIGNED NOT NULL DEFAULT 0,
 status VARCHAR(12) NOT NULL DEFAULT 'active',
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX (user_id, status), INDEX (created_at),
 FOREIGN KEY (user_id) REFERENCES game_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS game_campaign_records (
 user_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 team VARCHAR(20) NOT NULL,
 points INT UNSIGNED NOT NULL DEFAULT 0,
 score INT UNSIGNED NOT NULL DEFAULT 0,
 defeated INT UNSIGNED NOT NULL DEFAULT 0,
 updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX (points, score),
 FOREIGN KEY (user_id) REFERENCES game_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS game_team_records (
 user_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 team VARCHAR(20) NOT NULL,
 points INT UNSIGNED NOT NULL DEFAULT 0,
 score INT UNSIGNED NOT NULL DEFAULT 0,
 PRIMARY KEY (user_id, team),
 CONSTRAINT game_team_user_fk FOREIGN KEY (user_id) REFERENCES game_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO game_team_records (user_id, team, points, score)
 SELECT user_id, team, points, score FROM game_campaign_records WHERE points > 0
 ON DUPLICATE KEY UPDATE score=IF(VALUES(points)>game_team_records.points,VALUES(score),game_team_records.score),points=GREATEST(game_team_records.points,VALUES(points));
CREATE TABLE IF NOT EXISTS game_chat_messages (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 client_nonce CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 body VARCHAR(180) NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY chat_retry (user_id, client_nonce),
 KEY chat_user_time (user_id, created_at),
 KEY chat_recent (created_at),
 CONSTRAINT game_chat_user_fk FOREIGN KEY (user_id) REFERENCES game_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
