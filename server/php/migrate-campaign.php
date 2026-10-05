<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$_SERVER['REQUEST_METHOD'] = 'GET';
$root = getenv('PODPAH_SITE_ROOT');
if (!$root || !is_file($root . '/api/config.php')) throw new RuntimeException('Site root missing');
require $root . '/api/config.php';
session_write_close();
$pdo->exec(file_get_contents(__DIR__ . '/campaign-schema.sql'));
echo "Campaign/account tables ready. Legacy records and admin tables preserved.\n";
