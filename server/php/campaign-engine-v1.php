<?php
declare(strict_types=1);
require_once __DIR__ . '/juggle-engine.php';
function campaignOrder(int $seed, string $team): array {
    $order = array_values(array_diff(['podpah', 'capim', 'dendele', 'furia', 'loud', 'g3x'], [$team]));
    for ($i = count($order) - 1; $i > 0; $i--) {
        $seed = ($seed * 1664525 + 1013904223) & 0xffffffff;
        $j = (int)floor($seed / 4294967296 * ($i + 1));
        [$order[$i], $order[$j]] = [$order[$j], $order[$i]];
    }
    return $order;
}
function campaignCreate(int $seed, string $team): array {
    return array_merge(juggleCreate($seed), ['team' => $team, 'order' => campaignOrder($seed, $team), 'clockTick' => 0,
        'stage' => -1, 'stagePoints' => 0, 'stageGoal' => 100, 'peak' => 0, 'defeated' => 0,
        'phase' => 'intro', 'intro' => 360, 'outcome' => null, 'stageStart' => 0,
        'rival' => ['x' => 900, 'direction' => -1, 'cooldown' => 0, 'charging' => false, 'warning' => false]]);
}
function campaignAdvance(array &$s, array $input): void {
    if ($s['ended']) return;
    $s['clockTick']++;
    if ($s['phase'] === 'intro') {
        $s['intro']--;
        if ($s['intro'] <= 0) { $s['phase'] = 'play'; $s['stageStart'] = $s['tick']; }
        return;
    }
    if ($s['stage'] >= 0) {
        $r = &$s['rival'];
        $cycleLength = 420 - $s['stage'] * 35;
        $cycle = ($s['tick'] - $s['stageStart']) % $cycleLength;
        $r['warning'] = $cycle >= $cycleLength - 150 && $cycle < $cycleLength - 90;
        $r['charging'] = $cycle >= $cycleLength - 90;
        $speed = (90 + $s['stage'] * 24) * ($r['charging'] ? 2 : .65);
        $target = $r['charging'] ? $s['x'] : $s['x'] + ($s['stage'] % 2 ? -150 : 150);
        $r['direction'] = $target < $r['x'] ? -1 : 1;
        if (!$r['warning']) $r['x'] = max(40, min(920, $r['x'] + $r['direction'] * $speed / 120));
        $r['cooldown'] = max(0, $r['cooldown'] - 1);
        if ($r['charging'] && abs($r['x'] - $s['x']) < 65 && $s['jump'] < 30 && !$r['cooldown']) {
            $sign = $s['x'] >= $r['x'] ? 1 : -1;
            $s['x'] = max(38, min(922, $s['x'] + $sign * (20 + $s['stage'] * 5)));
            $s['vx'] += $sign * (120 + $s['stage'] * 25);
            $r['cooldown'] = 100;
        }
        unset($r);
    }
    $before = $s['points']; $heads = $s['score']; $perfect = $s['perfect'];
    juggleAdvance($s, $input);
    if ($s['score'] > $heads) {
        $gain = (10 + ($s['perfect'] > $perfect ? 5 : 0) + min($s['combo'], 5)) * ($s['stage'] + 2);
        $s['points'] = $before + $gain; $s['peak'] = $s['points']; $s['stagePoints'] += $gain;
    }
    if ($s['ended']) { $s['outcome'] = 'lose'; $s['phase'] = 'ended'; $s['points'] = 0; return; }
    if ($s['stagePoints'] >= $s['stageGoal']) {
        if ($s['stage'] >= 0) $s['defeated']++;
        if ($s['stage'] === 4) { $s['ended'] = true; $s['outcome'] = 'win'; $s['phase'] = 'ended'; return; }
        $s['stage']++; $s['stagePoints'] = 0; $s['stageGoal'] = 100 + $s['stage'] * 50;
        $s['phase'] = 'intro'; $s['intro'] = 420;
        $s['ball'] = ['x' => $s['x'], 'y' => 135, 'vx' => 0, 'vy' => 0];
        $s['jump'] = 0; $s['jumpV'] = 0; $s['vx'] = 0;
        $s['rival'] = ['x' => $s['stage'] % 2 ? 50 : 910, 'direction' => $s['stage'] % 2 ? 1 : -1, 'cooldown' => 0, 'charging' => false, 'warning' => false];
    }
}
function campaignResult(array $s): array {
    return ['score' => $s['score'], 'points' => $s['points'], 'peak' => $s['peak'], 'perfect' => $s['perfect'],
        'bestCombo' => $s['bestCombo'], 'defeated' => $s['defeated'], 'stage' => $s['stage'], 'outcome' => $s['outcome'],
        'duration' => round($s['tick'] / 12) / 10, 'clockTick' => $s['clockTick'], 'ended' => $s['ended']];
}
function campaignVerify(int $seed, string $team, mixed $inputs, mixed $tick): array {
    if (!is_int($tick) || $tick < 1 || $tick > 25200 || !is_array($inputs) || !array_is_list($inputs) || count($inputs) > $tick) throw new InvalidArgumentException('Replay inválido');
    $last = -1;
    foreach ($inputs as $e) {
        if (!is_array($e) || !isset($e['tick']) || !is_int($e['tick']) || $e['tick'] <= $last || $e['tick'] >= $tick) throw new InvalidArgumentException('Tick inválido');
        foreach (['left', 'right', 'jump'] as $key) if (!isset($e[$key]) || !is_bool($e[$key])) throw new InvalidArgumentException('Controle inválido');
        if (!array_key_exists('target', $e) || ($e['target'] !== null && (!is_int($e['target']) || $e['target'] < 38 || $e['target'] > 922))) throw new InvalidArgumentException('Alvo inválido');
        $last = $e['tick'];
    }
    $s = campaignCreate($seed, $team); $i = 0; $control = [];
    while ($s['clockTick'] < $tick && !$s['ended']) {
        if (isset($inputs[$i]) && $inputs[$i]['tick'] === $s['clockTick']) $control = $inputs[$i++];
        campaignAdvance($s, $control);
    }
    if ($s['clockTick'] !== $tick || $i !== count($inputs)) throw new InvalidArgumentException('Partida encerrada');
    return campaignResult($s);
}
