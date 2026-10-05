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
function campaignPowers(): array { return ['health'=>100, 'hurt'=>0, 'push'=>0, 'shield'=>0, 'slow'=>0, 'boost'=>0, 'dash'=>0, 'dashDirection'=>1, 'fx'=>0, 'specialCooldown'=>0]; }
function campaignRival(int $stage): array {
    return array_merge(campaignPowers(), ['health'=>200+$stage*75,'maxHealth'=>200+$stage*75,'x'=>$stage % 2 ? 50 : 910, 'jump'=>0, 'direction'=>$stage % 2 ? 1 : -1, 'cooldown'=>0,
        'charging'=>false, 'warning'=>false, 'specialWarning'=>0, 'specialCooldown'=>720]);
}
function campaignCreate(int $seed, string $team): array {
    return array_merge(juggleCreate($seed), campaignPowers(), ['team'=>$team, 'order'=>campaignOrder($seed,$team), 'clockTick'=>0,
        'stage'=>-1, 'stagePoints'=>0, 'stageGoal'=>200, 'peak'=>0, 'defeated'=>0, 'phase'=>'intro', 'intro'=>360,
        'outcome'=>null, 'stageStart'=>0, 'specialHeld'=>false, 'rival'=>campaignRival(0)]);
}
function campaignTimers(array &$a): void {
    foreach (['hurt','shield','slow','boost','dash','fx','specialCooldown'] as $key) $a[$key] = max(0, $a[$key]-1);
    $a['x'] = max(38,min(922,$a['x']+$a['push']/120)); $a['push'] *= .976;
    if (abs($a['push'])<1) $a['push']=0;
}
function campaignPush(array &$a, array $source, int $force): bool {
    if ($a['shield'] || $a['jump']>30) return false;
    if (!$a['hurt']) { $a['health']=max(0,$a['health']-($force>=780 ? 16 : ($force>=440 ? 8 : 2))); $a['hurt']=72; }
    $a['push']=($a['x'] >= $source['x'] ? 1 : -1)*$force; return true;
}
function campaignSpecial(array &$a, array &$other, string $team): void {
    $a['specialCooldown']=1200; $a['fx']=120; $distance=abs($a['x']-$other['x']);
    if ($team==='podpah' && $distance<=260) campaignPush($other,$a,540);
    if ($team==='capim' && $distance<=140) campaignPush($other,$a,850);
    if ($team==='dendele') { $a['dash']=120; $a['dashDirection']=$other['x']<$a['x'] ? -1 : 1; }
    if ($team==='furia') { $a['shield']=360; $a['slow']=0; $a['push']=0; }
    if ($team==='loud' && $distance<=320 && !$other['shield'] && $other['jump']<=30) { $other['slow']=360; if (!$other['hurt']) { $other['health']=max(0,$other['health']-8); $other['hurt']=72; } }
    if ($team==='g3x') $a['boost']=360;
}
function campaignAdvance(array &$s, array $input): void {
    if ($s['ended']) return;
    $s['clockTick']++;
    if ($s['phase']==='intro') {
        $s['intro']--;
        if ($s['intro']<=0) { $s['phase']='play'; $s['stageStart']=$s['tick']; }
        return;
    }
    // Keep the rival separate while passing player and opponent by reference.
    $r=$s['rival']; campaignTimers($s); campaignTimers($r);
    if (($input['special'] ?? false) && !$s['specialHeld'] && !$s['specialCooldown']) campaignSpecial($s,$r,$s['team']);
    $s['specialHeld']=$input['special'] ?? false;
    if ($s['stage']>=0) {
        $enemy=$s['order'][$s['stage']];
        $cycleLength=540-$s['stage']*40; $cycle=($s['tick']-$s['stageStart'])%$cycleLength;
        $r['warning']=$cycle >= $cycleLength-156 && $cycle < $cycleLength-84;
        $r['charging']=$cycle >= $cycleLength-84;
        if (!$r['charging']) $r['direction']=$s['x']<$r['x'] ? -1 : 1;
        if ($r['specialWarning']>0) {
            $r['specialWarning']--;
            if (!$r['specialWarning']) campaignSpecial($r,$s,$enemy);
        } elseif (!$r['specialCooldown'] && abs($r['x']-$s['x']) <= ['podpah'=>260,'capim'=>140,'dendele'=>960,'furia'=>960,'loud'=>320,'g3x'=>960][$enemy]) $r['specialWarning']=96;
        $speed=($r['charging'] ? 470+$s['stage']*25 : 145+$s['stage']*18)*($r['slow'] ? .45 : 1)*($r['boost'] ? 1.6 : 1);
        if (!$r['warning'] && !$r['specialWarning']) $r['x']=max(38,min(922,$r['x']+$r['direction']*$speed/120));
        if ($r['dash']) $r['x']=max(38,min(922,$r['x']+$r['dashDirection']*430/120));
        $r['cooldown']=max(0,$r['cooldown']-1);
        if (abs($r['x']-$s['x'])<64 && $s['jump']<30 && !$r['cooldown']) {
            if ($s['shield'] || $s['dash']) campaignPush($r,$s,$s['dash'] ? 780 : 440);
            else campaignPush($s,$r,$r['dash'] ? 780 : ($r['charging'] ? 440+$s['stage']*35 : 130));
            $r['cooldown']=144;
        }
    }
    $s['rival']=$r;
    if ($s['dash']) $s['x']=max(38,min(922,$s['x']+$s['dashDirection']*430/120));
    $before=$s['points']; $heads=$s['score']; $perfect=$s['perfect'];
    juggleAdvance($s,$input,['maxTicks'=>72000,'speed'=>($s['slow'] ? .45 : 1)*($s['boost'] ? 1.6 : 1)]);
    if ($s['score']>$heads) {
        $gain=(10+($s['perfect']>$perfect ? 5 : 0)+min($s['combo'],5))*($s['stage']+2);
        $s['points']=$before+$gain; $s['peak']=$s['points']; $s['stagePoints']+=$gain;
        if ($s['stage']>=0) $s['rival']['health']=max(0,$s['rival']['health']-$gain*$s['rival']['maxHealth']/$s['stageGoal']);
    }
    if ($s['ended'] || $s['health']<=0) { $s['ended']=true; $s['outcome']='lose'; $s['phase']='ended'; $s['points']=0; return; }
    if ($s['stagePoints'] >= $s['stageGoal'] || ($s['stage']>=0 && $s['rival']['health']<=0)) {
        if ($s['stage']>=0) $s['defeated']++;
        if ($s['stage']===4) { $s['ended']=true; $s['outcome']='win'; $s['phase']='ended'; return; }
        $s['stage']++; $s['stagePoints']=0; $s['stageGoal']=[800,1200,1800,2600,3600][$s['stage']];
        $s['phase']='intro'; $s['intro']=420; $s['ball']=['x'=>$s['x'],'y'=>135,'vx'=>0,'vy'=>0];
        $s['jump']=0; $s['jumpV']=0; $s['vx']=0;
        $s=array_merge($s,campaignPowers()); $s['specialHeld']=false; $s['rival']=campaignRival($s['stage']);
    }
}
function campaignResult(array $s): array {
    return ['health'=>(int)ceil($s['health']),'rivalHealth'=>(int)ceil($s['rival']['health']),'score'=>$s['score'],'points'=>$s['points'],'peak'=>$s['peak'],'perfect'=>$s['perfect'],'bestCombo'=>$s['bestCombo'],
        'defeated'=>$s['defeated'],'stage'=>$s['stage'],'outcome'=>$s['outcome'],'duration'=>round($s['tick']/12)/10,'clockTick'=>$s['clockTick'],'ended'=>$s['ended']];
}
function campaignVerify(int $seed, string $team, mixed $inputs, mixed $tick): array {
    if (!is_int($tick) || $tick<1 || $tick>74460 || !is_array($inputs) || !array_is_list($inputs) || count($inputs)>$tick) throw new InvalidArgumentException('Replay inválido');
    $last=-1;
    foreach ($inputs as $e) {
        if (!is_array($e) || !isset($e['tick']) || !is_int($e['tick']) || $e['tick']<0 || $e['tick']<=$last || $e['tick']>=$tick) throw new InvalidArgumentException('Tick inválido');
        foreach (['left','right','jump','special'] as $key) if (!isset($e[$key]) || !is_bool($e[$key])) throw new InvalidArgumentException('Controle inválido');
        if (!array_key_exists('target',$e) || ($e['target']!==null && (!is_int($e['target']) || $e['target']<38 || $e['target']>922))) throw new InvalidArgumentException('Alvo inválido');
        $last=$e['tick'];
    }
    $s=campaignCreate($seed,$team); $i=0; $control=[];
    while ($s['clockTick']<$tick && !$s['ended']) {
        if (isset($inputs[$i]) && $inputs[$i]['tick']===$s['clockTick']) $control=$inputs[$i++];
        campaignAdvance($s,$control);
    }
    if ($s['clockTick']!==$tick || $i!==count($inputs)) throw new InvalidArgumentException('Partida encerrada');
    return campaignResult($s);
}
