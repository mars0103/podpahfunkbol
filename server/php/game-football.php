<?php
declare(strict_types=1);
require __DIR__ . '/campaign-common.php';
require __DIR__ . '/football-store.php';

function campaignRank(PDO $pdo, string $id): array {
    $stmt = $pdo->prepare('SELECT points, score FROM game_football_records WHERE user_id = ?'); $stmt->execute([$id]); $r = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$r || !(int)$r['points']) return ['rank' => null, 'best' => 0];
    $stmt = $pdo->prepare('SELECT COUNT(*) + 1 FROM game_football_records WHERE points > ? OR (points = ? AND score > ?) OR (points = ? AND score = ? AND user_id < ?)');
    $stmt->execute([$r['points'], $r['points'], $r['score'], $r['points'], $r['score'], $id]);
    return ['rank' => (int)$stmt->fetchColumn(), 'best' => (int)$r['points']];
}
try {
    $route = $_GET['route'] ?? 'leaderboard';
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $route === 'leaderboard') {
        $rows = $pdo->query('SELECT r.user_id AS id, u.username AS name, r.team, r.points, r.score, r.defeated FROM game_football_records r JOIN game_users u ON u.id = r.user_id WHERE r.points > 0 ORDER BY r.points DESC, r.score DESC, r.user_id ASC LIMIT 50')->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) foreach (['points', 'score', 'defeated'] as $k) $r[$k] = (int)$r[$k]; unset($r);
        campaignRespond(200, $rows);
    }
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $route === 'teams') campaignRespond(200, communityTeams($pdo));
    $user = campaignRequireUser($pdo);
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $route === 'position') campaignRespond(200, campaignRank($pdo, $user['id']));
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') campaignRespond(405, ['error' => 'Método inválido.']);
    campaignCheckCsrf(); $b = campaignBody();
    session_write_close();
    if ($route === 'start') {
        $version = $b['version'] ?? 9;
        if (!in_array($version,[7,8,9],true)) campaignRespond(400,['error'=>'Atualize o jogo para continuar.']);
        require __DIR__ . ($version===7?'/football-engine-v7.php':($version===8?'/football-engine-v8.php':'/football-engine.php'));
        if (!in_array($b['team'] ?? null, $version>=5 ? ['podpah', 'capim', 'dendele', 'furia', 'loud', 'g3x', 'dibrados', 'nyvelados', 'fluxo', 'desimpain'] : ['podpah', 'capim', 'dendele', 'furia', 'loud', 'g3x'], true)) campaignRespond(400, ['error' => 'Escolha um time.']);
        campaignLimit($pdo, 'start:' . $user['id'], 30, 60);
        $pdo->beginTransaction();
        $pdo->prepare('SELECT id FROM game_users WHERE id = ? FOR UPDATE')->execute([$user['id']]);
        $pdo->prepare("UPDATE game_football_runs SET status = 'abandoned' WHERE user_id = ? AND status = 'active'")->execute([$user['id']]);
        $id = bin2hex(random_bytes(32)); $seed = random_int(0, 4294967295);
        $pdo->prepare('INSERT INTO game_football_runs (id, user_id, seed, team, engine_version) VALUES (?, ?, ?, ?, ?)')->execute([$id, $user['id'], $seed, $b['team'], $version]);
        $pdo->exec("DELETE FROM game_football_runs WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY) LIMIT 100");
        $pdo->commit();
        campaignRespond(201, ['id' => $id, 'version' => $version, 'seed' => $seed, 'order' => campaignOrder($seed, $b['team'])] + campaignRank($pdo, $user['id']));
    }
    if (!in_array($route, ['checkpoint', 'finish', 'abandon'], true)) campaignRespond(404, ['error' => 'Rota inválida.']);
    if ($route === 'checkpoint') campaignLimit($pdo, 'checkpoint:' . $user['id'], 30, 60);
    if (!is_string($b['id'] ?? null) || !preg_match('/^[a-f0-9]{64}$/D', $b['id'])) campaignRespond(400, ['error' => 'Partida inválida.']);
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT *, TIMESTAMPDIFF(MICROSECOND, created_at, NOW(3)) / 1000000 AS age FROM game_football_runs WHERE id = ? AND user_id = ? FOR UPDATE');
    $stmt->execute([$b['id'], $user['id']]); $run = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$run) throw new InvalidArgumentException('Partida inválida');
    if ($route === 'abandon') {
        $pdo->prepare("UPDATE game_football_runs SET status = 'abandoned' WHERE id = ? AND status = 'active'")->execute([$run['id']]); $pdo->commit(); campaignRespond(200, ['ok' => true]);
    }
    if ($run['status'] !== 'active') {
        if ($route === 'finish' && $run['status'] === 'finished') { $pdo->commit(); campaignRespond(200, ['saved' => true] + campaignRank($pdo, $user['id'])); }
        throw new InvalidArgumentException('Partida encerrada');
    }
    if ((float)$run['age'] > 3600 || !is_int($b['tick'] ?? null) || $b['tick'] < (int)$run['last_tick'] || $b['tick'] / 120 > (float)$run['age'] + 1.5) throw new InvalidArgumentException('Tempo inválido');
    require __DIR__ . ((int)$run['engine_version']===7?'/football-engine-v7.php':((int)$run['engine_version']===8?'/football-engine-v8.php':'/football-engine.php'));
    $result = campaignVerify((int)$run['seed'], $run['team'], $b['inputs'] ?? null, $b['tick']);
    if ($route === 'finish' && !$result['ended']) throw new InvalidArgumentException('Partida em andamento');
    $pdo->prepare('INSERT IGNORE INTO game_football_records (user_id, team, points, score, defeated) VALUES (?, ?, 0, 0, 0)')->execute([$user['id'], $run['team']]);
    $stmt = $pdo->prepare('SELECT points, score FROM game_football_records WHERE user_id = ? FOR UPDATE'); $stmt->execute([$user['id']]); $old = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($result['peak'] > (int)$old['points'] || ($result['peak'] === (int)$old['points'] && $result['score'] > (int)$old['score'])) {
        $pdo->prepare('UPDATE game_football_records SET team = ?, points = ?, score = ?, defeated = ?, updated_at = NOW(3) WHERE user_id = ?')->execute([$run['team'], $result['peak'], $result['score'], $result['defeated'], $user['id']]);
    }
    communityTeamRecord($pdo,$user['id'],$run['team'],$result['peak'],$result['score']);
    $pdo->prepare('UPDATE game_football_runs SET last_tick = ?, status = ?, updated_at = NOW(3) WHERE id = ?')->execute([$b['tick'], $result['ended'] ? 'finished' : 'active', $run['id']]);
    $pdo->commit(); campaignRespond(200, ['saved' => true, 'result' => $result] + campaignRank($pdo, $user['id']));
} catch (InvalidArgumentException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack(); campaignRespond(400, ['error' => 'Não foi possível validar essa partida.']);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack(); error_log('Game campaign: ' . $e->getMessage()); campaignRespond(503, ['error' => 'Ranking indisponível. Tente novamente.']);
}
