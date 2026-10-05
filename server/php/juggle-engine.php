<?php
declare(strict_types=1);

// Same fixed-step rules as src/components/game/juggleEngine.js.
// Cross-language replay fixtures guard changes to either implementation.
function juggleCreate(int $seed): array {
    return ['tick' => 0, 'x' => 480.0, 'vx' => 0.0, 'jump' => 0.0, 'jumpV' => 0.0,
        'ball' => ['x' => 480.0, 'y' => 135.0, 'vx' => 0.0, 'vy' => 0.0],
        'score' => 0, 'perfect' => 0, 'combo' => 0, 'bestCombo' => 0, 'points' => 0,
        'ended' => false, 'seed' => $seed, 'lastHit' => -120, 'jumpHeld' => false];
}
function juggleRandom(array &$s): float {
    $s['seed'] = ($s['seed'] * 1664525 + 1013904223) & 0xffffffff;
    return $s['seed'] / 4294967296;
}
function juggleAdvance(array &$s, array $input, array $options = []): void {
    if ($s['ended']) return;
    $step = 1 / 120;
    $s['tick']++;
    $previousJump = $s['jump'];
    $direction = isset($input['target']) ? max(-1, min(1, ($input['target'] - $s['x']) / 55))
        : (int)($input['right'] ?? false) - (int)($input['left'] ?? false);
    $s['vx'] += ($direction * 410 * ($options['speed'] ?? 1) - $s['vx']) * (1 - exp(-14 * $step));
    $s['x'] = max(38, min(922, $s['x'] + $s['vx'] * $step));
    if (($input['jump'] ?? false) && !$s['jumpHeld'] && $s['jump'] == 0) $s['jumpV'] = 330;
    $s['jumpHeld'] = $input['jump'] ?? false;
    $s['jump'] = max(0, $s['jump'] + $s['jumpV'] * $step);
    if ($s['jump'] > 0) $s['jumpV'] -= 1150 * $step;
    else $s['jumpV'] = 0;
    $b = &$s['ball'];
    $oldY = $b['y'];
    $b['vy'] += (600 + min($s['score'], 80) * 1.4) * $step;
    $b['x'] += $b['vx'] * $step;
    $b['y'] += $b['vy'] * $step;
    if ($b['x'] < 18 || $b['x'] > 942) { $b['x'] = max(18, min(942, $b['x'])); $b['vx'] *= -0.88; }
    $dx = $b['x'] - $s['x'];
    $contactY = 464 - $s['jump'] - sqrt(max(0, 44 * 44 - $dx * $dx));
    $previousContactY = $contactY + $s['jump'] - $previousJump;
    if (abs($dx) < 44 && $b['vy'] > 0 && $oldY <= $previousContactY + 5 && $b['y'] >= $contactY && $s['tick'] - $s['lastHit'] > 18) {
        $perfect = abs($dx) < 14;
        $s['score']++;
        $s['perfect'] += (int)$perfect;
        $s['combo'] = $perfect ? $s['combo'] + 1 : 0;
        $s['bestCombo'] = max($s['bestCombo'], $s['combo']);
        $s['points'] += 100 + ($perfect ? 50 : 0) + min($s['combo'], 10) * 10;
        $s['lastHit'] = $s['tick'];
        $b['y'] = $contactY - 1;
        $b['vy'] = -min(590, 505 + max(0, $s['jumpV']) * 0.14);
        $b['vx'] = max(-290, min(290, $dx * 5 + $s['vx'] * 0.22 + (juggleRandom($s) - 0.5) * (65 + min($s['score'] * 3, 110))));
    }
    if ($b['y'] >= 546 || $s['tick'] >= ($options['maxTicks'] ?? 21600)) { $b['y'] = min($b['y'], 546); $s['ended'] = true; }
}
function juggleVerify(int $seed, mixed $inputs): array {
    if (!is_array($inputs) || !array_is_list($inputs) || count($inputs) > 21600) throw new InvalidArgumentException('Replay inválido');
    $last = -1;
    foreach ($inputs as $entry) {
        if (!is_array($entry) || !isset($entry['tick']) || !is_int($entry['tick']) || $entry['tick'] <= $last || $entry['tick'] >= 21600) throw new InvalidArgumentException('Tick inválido');
        foreach (['left', 'right', 'jump'] as $key) if (!isset($entry[$key]) || !is_bool($entry[$key])) throw new InvalidArgumentException('Controle inválido');
        if (!array_key_exists('target', $entry) || ($entry['target'] !== null && (!is_int($entry['target']) || $entry['target'] < 38 || $entry['target'] > 922))) throw new InvalidArgumentException('Alvo inválido');
        $last = $entry['tick'];
    }
    $s = juggleCreate($seed);
    $index = 0;
    $input = [];
    while (!$s['ended']) {
        if (isset($inputs[$index]) && $inputs[$index]['tick'] === $s['tick']) $input = $inputs[$index++];
        juggleAdvance($s, $input);
    }
    if ($index !== count($inputs)) throw new InvalidArgumentException('Controles após o fim');
    return ['score' => $s['score'], 'points' => $s['points'], 'perfect' => $s['perfect'],
        'bestCombo' => $s['bestCombo'], 'duration' => round($s['tick'] / 120 * 10) / 10];
}
