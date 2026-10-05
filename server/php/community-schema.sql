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
