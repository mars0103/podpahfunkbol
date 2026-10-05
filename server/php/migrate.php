<?php
declare(strict_types=1);
// CLI only. Run from a private deployment directory, never upload to the web root.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root = getenv('PODPAH_SITE_ROOT');
if (!$root || !is_file($root . '/api/config.php')) throw new RuntimeException('Site root missing');
$_SERVER['REQUEST_METHOD'] = 'GET';
require $root . '/api/config.php';
if (session_status() === PHP_SESSION_ACTIVE) session_write_close();
$existing = $pdo->query("SHOW TABLES LIKE 'game_%'")->fetchAll(PDO::FETCH_COLUMN);
if ($existing) throw new RuntimeException('Game tables already exist; inspect schema before applying migration.');
$pdo->exec(file_get_contents(__DIR__ . '/game-ranking.sql'));
echo "Created game_sessions and game_records. Existing tables unchanged.\n";
