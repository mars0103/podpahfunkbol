<?php
declare(strict_types=1);
ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_httponly', '1');
require __DIR__ . '/config.php';
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');
function campaignRespond(int $code, array $data): never {
    http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR); exit;
}
function campaignBody(): array {
    $raw = file_get_contents('php://input', false, null, 0, 8000001);
    if ($raw === false || strlen($raw) > 8000000) campaignRespond(413, ['error' => 'Partida muito grande.']);
    try { $data = json_decode($raw, true, 32, JSON_THROW_ON_ERROR); }
    catch (JsonException $e) { campaignRespond(400, ['error' => 'Dados inválidos.']); }
    if (!is_array($data)) campaignRespond(400, ['error' => 'Dados inválidos.']);
    return $data;
}
function campaignCsrf(): string {
    if (empty($_SESSION['game_csrf'])) $_SESSION['game_csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['game_csrf'];
}
function campaignCheckCsrf(): void {
    if (!hash_equals(campaignCsrf(), $_SERVER['HTTP_X_GAME_CSRF'] ?? '')) campaignRespond(403, ['error' => 'Sua sessão precisa ser atualizada. Recarregue a página.']);
}
function campaignUser(PDO $pdo): ?array {
    if (empty($_SESSION['game_user'])) return null;
    $stmt = $pdo->prepare('SELECT id, username, auth_version FROM game_users WHERE id = ?');
    $stmt->execute([$_SESSION['game_user']]); $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user || (int)$user['auth_version'] !== ($_SESSION['game_auth_version'] ?? 0)) { unset($_SESSION['game_user'], $_SESSION['game_auth_version']); return null; }
    return ['id' => $user['id'], 'username' => $user['username']];
}
function campaignRequireUser(PDO $pdo): array {
    $user = campaignUser($pdo);
    if (!$user) campaignRespond(401, ['error' => 'Entre na sua conta para jogar.']);
    return $user;
}
function campaignLimit(PDO $pdo, string $scope, int $max, int $seconds = 900): void {
    $key = hash('sha256', $scope . ':' . (int)floor(time() / $seconds));
    $stmt = $pdo->prepare('INSERT INTO game_auth_limits (bucket_key, attempts, expires_at) VALUES (?, 1, DATE_ADD(NOW(), INTERVAL 1 DAY)) ON DUPLICATE KEY UPDATE attempts = attempts + 1');
    $stmt->execute([$key]);
    $stmt = $pdo->prepare('SELECT attempts FROM game_auth_limits WHERE bucket_key = ?'); $stmt->execute([$key]);
    if ((int)$stmt->fetchColumn() > $max) campaignRespond(429, ['error' => 'Muitas tentativas. Aguarde alguns minutos e tente novamente.']);
    $pdo->exec('DELETE FROM game_auth_limits WHERE expires_at < NOW() LIMIT 100');
}
function campaignPassword(mixed $password): string {
    if (!is_string($password) || strlen($password) < 8 || strlen($password) > 64) campaignRespond(400, ['error' => 'Use uma senha entre 8 e 64 caracteres.']);
    return $password;
}
