<?php
declare(strict_types=1);
require __DIR__ . '/campaign-common.php';
try {
    $route = $_GET['route'] ?? 'me';
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $route === 'me') campaignRespond(200, ['user' => campaignUser($pdo), 'csrf' => campaignCsrf()]);
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') campaignRespond(405, ['error' => 'Método inválido.']);
    campaignCheckCsrf(); $b = campaignBody(); $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if ($route === 'register') {
        campaignLimit($pdo, 'register:' . $ip, 8, 3600);
        $name = is_string($b['username'] ?? null) ? trim($b['username']) : '';
        $email = is_string($b['email'] ?? null) ? strtolower(trim($b['email'])) : '';
        $password = campaignPassword($b['password'] ?? null);
        if (!preg_match('/^[a-zA-Z0-9_]{3,20}$/D', $name)) campaignRespond(400, ['error' => 'Usuário: 3 a 20 letras, números ou underline.']);
        if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) campaignRespond(400, ['error' => 'Informe um e-mail válido.']);
        $id = bin2hex(random_bytes(16));
        try {
            $stmt = $pdo->prepare('INSERT INTO game_users (id, username, email, password_hash) VALUES (?, ?, ?, ?)');
            $stmt->execute([$id, $name, $email, password_hash($password, PASSWORD_DEFAULT)]);
        } catch (PDOException $e) { if ($e->getCode() === '23000') campaignRespond(409, ['error' => 'Usuário ou e-mail já cadastrado. Entre na conta ou recupere sua senha.']); throw $e; }
        session_regenerate_id(true); $_SESSION['game_user'] = $id; $_SESSION['game_auth_version'] = 1;
        campaignRespond(201, ['user' => ['id' => $id, 'username' => $name], 'csrf' => campaignCsrf()]);
    }
    if ($route === 'login') {
        $login = is_string($b['login'] ?? null) ? strtolower(trim($b['login'])) : '';
        campaignLimit($pdo, 'login-ip:' . $ip, 30); campaignLimit($pdo, 'login-account:' . $login, 15);
        $password = is_string($b['password'] ?? null) ? $b['password'] : '';
        if (strlen($login) > 254 || strlen($password) > 64) campaignRespond(401, ['error' => 'Usuário ou senha incorretos.']);
        $stmt = $pdo->prepare('SELECT id, username, password_hash, auth_version FROM game_users WHERE username = ? OR email = ? LIMIT 1');
        $stmt->execute([$login, $login]); $u = $stmt->fetch(PDO::FETCH_ASSOC);
        $valid = password_verify($password, $u['password_hash'] ?? '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.');
        if (!$u || !$valid) campaignRespond(401, ['error' => 'Usuário ou senha incorretos.']);
        session_regenerate_id(true); $_SESSION['game_user'] = $u['id']; $_SESSION['game_auth_version'] = (int)$u['auth_version'];
        campaignRespond(200, ['user' => ['id' => $u['id'], 'username' => $u['username']], 'csrf' => campaignCsrf()]);
    }
    if ($route === 'logout') {
        unset($_SESSION['game_user'], $_SESSION['game_auth_version']); session_regenerate_id(true);
        campaignRespond(200, ['ok' => true]);
    }
    if ($route === 'forgot') {
        campaignLimit($pdo, 'forgot-ip:' . $ip, 8, 3600);
        $email = is_string($b['email'] ?? null) ? strtolower(trim($b['email'])) : '';
        campaignLimit($pdo, 'forgot-email:' . $email, 3, 3600);
        $stmt = $pdo->prepare('SELECT id, email FROM game_users WHERE email = ?'); $stmt->execute([$email]); $u = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($u) {
            $token = bin2hex(random_bytes(32));
            $pdo->prepare('DELETE FROM game_password_resets WHERE user_id = ? OR expires_at < NOW()')->execute([$u['id']]);
            $pdo->prepare('INSERT INTO game_password_resets (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))')->execute([hash('sha256', $token), $u['id']]);
            $link = 'https://marsdesigner.com.br/podpahfunkbol/jogo#reset=' . $token;
            $message = "Você pediu uma nova senha para o Podpah Funkbol.\n\nAbra este link em até 30 minutos:\n$link\n\nSe não foi você, ignore este e-mail. Sua senha continua igual.\n";
            $headers = "From: Podpah Funkbol <noreply@marsdesigner.com.br>\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8";
            if (!mail($u['email'], 'Recuperar senha - Podpah Funkbol', $message, $headers, '-fnoreply@marsdesigner.com.br')) error_log('Game password recovery: mail transport failed');
        }
        campaignRespond(200, ['message' => 'Se esse e-mail estiver cadastrado, enviaremos um link para criar uma nova senha. Confira também o spam.']);
    }
    if ($route === 'reset') {
        campaignLimit($pdo, 'reset-ip:' . $ip, 15);
        $token = $b['token'] ?? ''; $password = campaignPassword($b['password'] ?? null);
        if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/D', $token)) campaignRespond(400, ['error' => 'Link inválido ou expirado. Solicite outro.']);
        $pdo->beginTransaction();
        $stmt = $pdo->prepare('SELECT user_id FROM game_password_resets WHERE token_hash = ? AND expires_at > NOW() FOR UPDATE'); $stmt->execute([hash('sha256', $token)]); $id = $stmt->fetchColumn();
        if (!$id) { $pdo->rollBack(); campaignRespond(400, ['error' => 'Link inválido ou expirado. Solicite outro.']); }
        $pdo->prepare('UPDATE game_users SET password_hash = ?, auth_version = auth_version + 1 WHERE id = ?')->execute([password_hash($password, PASSWORD_DEFAULT), $id]);
        $pdo->prepare('DELETE FROM game_password_resets WHERE user_id = ?')->execute([$id]);
        $pdo->prepare("UPDATE game_campaign_runs SET status = 'abandoned' WHERE user_id = ? AND status = 'active'")->execute([$id]);
        $pdo->commit(); unset($_SESSION['game_user'], $_SESSION['game_auth_version']);
        campaignRespond(200, ['message' => 'Senha atualizada. Entre com sua nova senha.']);
    }
    campaignRespond(404, ['error' => 'Rota não encontrada.']);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack(); error_log('Game auth: ' . $e->getMessage());
    campaignRespond(503, ['error' => 'Não foi possível concluir agora. Tente novamente.']);
}
