<?php
declare(strict_types=1);
require_once __DIR__ . '/juggle-engine.php';
require_once __DIR__ . '/duel-physics.php';
function campaignOrder(int $seed, string $team): array {
    $order = array_values(array_diff(['podpah', 'capim', 'dendele', 'furia', 'loud', 'g3x', 'dibrados', 'nyvelados', 'fluxo', 'desimpain'], [$team]));
    for ($i = count($order) - 1; $i > 0; $i--) {
        $seed = ($seed * 1664525 + 1013904223) & 0xffffffff;
        $j = (int)floor($seed / 4294967296 * ($i + 1));
        [$order[$i], $order[$j]] = [$order[$j], $order[$i]];
    }
    return array_slice($order,0,5);
}
function campaignPowers(): array { return ['health'=>100, 'hurt'=>0, 'push'=>0, 'shield'=>0, 'slow'=>0, 'boost'=>0, 'dash'=>0, 'dashDirection'=>1, 'fx'=>0, 'specialCooldown'=>0]; }
function campaignRival(int $stage): array {
    return array_merge(campaignPowers(), ['health'=>200+$stage*75,'maxHealth'=>200+$stage*75,'x'=>600,'vx'=>0,'jump'=>0,'jumpV'=>0,'jumpHeld'=>false,'previousJump'=>0,'target'=>480,
      'score'=>0,'perfect'=>0,'combo'=>0,'bestCombo'=>0,'lastHit'=>-120,'stagePoints'=>0,'direction'=>-1,'cooldown'=>0,'charging'=>false,'warning'=>false,'specialWarning'=>0,'specialCooldown'=>720]);
}
function campaignCreate(int $seed, string $team): array {
    return array_merge(juggleCreate($seed), campaignPowers(), ['x'=>360,'previousJump'=>0,'stageScore'=>0,'rivalHeads'=>0,'bounces'=>0,'ballHitTick'=>-120,'team'=>$team, 'order'=>campaignOrder($seed,$team), 'clockTick'=>0,
        'stage'=>0, 'stagePoints'=>0, 'stageGoal'=>800, 'peak'=>0, 'defeated'=>0, 'phase'=>'intro', 'intro'=>360,
        'outcome'=>null, 'stageStart'=>0, 'specialHeld'=>false, 'rival'=>campaignRival(0)]);
}
function campaignTimers(array &$a): void {
    foreach (['hurt','shield','slow','boost','dash','fx','specialCooldown'] as $key) $a[$key] = max(0, $a[$key]-1);
    $a['push'] *= .976;
    if (abs($a['push'])<1) $a['push']=0;
}
function campaignPush(array &$a, array $source, int $force): bool {
    if ($a['shield'] || $a['jump']>30) return false;
    $a['hurt']=36;
    $a['push']=($a['x'] >= $source['x'] ? 1 : -1)*$force; return true;
}
function campaignSpecial(array &$a, array &$other, string $team): void {
    $a['specialCooldown']=1200; $a['fx']=120; $distance=abs($a['x']-$other['x']);
    if ($team==='podpah' && $distance<=260) campaignPush($other,$a,540);
    if ($team==='capim' && $distance<=140) campaignPush($other,$a,850);
    if ($team==='dendele') { $a['dash']=120; $a['dashDirection']=$other['x']<$a['x'] ? -1 : 1; }
    if ($team==='furia') { $a['shield']=360; $a['slow']=0; $a['push']=0; }
    if ($team==='loud' && $distance<=320 && !$other['shield'] && $other['jump']<=30) $other['slow']=360;
    if ($team==='g3x') $a['boost']=360;
    if ($team==='dibrados') { $a['boost']=180; $a['shield']=90; $a['push']=0; }
    if ($team==='nyvelados') { $a['health']=min($a['maxHealth']??100,$a['health']+12); $a['shield']=120; $a['push']=0; $a['slow']=0; }
    if ($team==='fluxo' && $distance<=210 && campaignPush($other,$a,650)) $other['slow']=180;
    if ($team==='desimpain') { $a['dash']=72; $a['dashDirection']=$other['x']<$a['x'] ? -1 : 1; $a['boost']=240; }
}
function campaignAdvance(array &$s, array $input): void {
    if ($s['ended']) return;
    $s['clockTick']++;
    if ($s['phase']==='intro') {
        $s['intro']--;
        if ($s['intro']<=0) { $s['phase']='play'; $s['stageStart']=$s['tick']; }
        return;
    }
    $s['tick']++;
    $r=$s['rival'];campaignTimers($s);campaignTimers($r);
    if(($input['special']??false)&&!$s['specialHeld']&&!$s['specialCooldown'])campaignSpecial($s,$r,$s['team']);
    $s['specialHeld']=$input['special']??false;
    $enemy=$s['order'][$s['stage']];$cycleLength=540-$s['stage']*40;$cycle=($s['tick']-$s['stageStart'])%$cycleLength;
    $r['warning']=$cycle>=$cycleLength-156&&$cycle<$cycleLength-84;$r['charging']=$cycle>=$cycleLength-84;
    $r['direction']=$r['target']<$r['x']?-1:1;
    if($r['specialWarning']>0){
        $r['specialWarning']--;
        if(!$r['specialWarning'])campaignSpecial($r,$s,$enemy);
    }elseif(!$r['specialCooldown']&&abs($r['x']-$s['x'])<=['podpah'=>260,'capim'=>140,'dendele'=>960,'furia'=>960,'loud'=>320,'g3x'=>960,'dibrados'=>960,'nyvelados'=>960,'fluxo'=>210,'desimpain'=>960][$enemy])$r['specialWarning']=96;
    $r['cooldown']=max(0,$r['cooldown']-1);$s['rival']=$r;
    $contact=duelMove($s,$input);$r=$s['rival'];
    if($contact&&!$r['cooldown']){
        if($s['dash']||$s['shield'])campaignPush($r,$s,$s['dash']?780:440);
        elseif($r['dash'])campaignPush($s,$r,780);
        $r['cooldown']=72;
    }
    $s['rival']=$r;
    $hit=duelBall($s);$r=$s['rival'];
    if($hit==='hit'||$hit==='perfect'){
        $gain=(10+($hit==='perfect'?5:0)+min($s['combo'],5))*($s['stage']+2);
        $s['points']+=$gain;$s['peak']=$s['points'];$s['stagePoints']+=$gain;$s['stageScore']++;
        $r['health']=max(0,$r['health']-$gain*$r['maxHealth']/$s['stageGoal']);$r['hurt']=36;
    }elseif($hit==='rival-hit'||$hit==='rival-perfect'){
        $gain=(10+($hit==='rival-perfect'?5:0)+min($r['combo'],5))*($s['stage']+2);
        $r['stagePoints']+=$gain;$s['rivalHeads']++;
        $s['health']=max(0,$s['health']-$gain*100/$s['stageGoal']);$s['hurt']=36;
    }
    $s['rival']=$r;
    if($s['health']<=0&&$r['score']>0){$s['ended']=true;$s['outcome']='lose';$s['phase']='ended';$s['points']=0;return;}
    if($r['health']<=0&&$s['stageScore']>0){
        $s['defeated']++;
        if($s['stage']===4){$s['ended']=true;$s['outcome']='win';$s['phase']='ended';return;}
        $s['stage']++;$s['stagePoints']=0;$s['stageScore']=0;$s['stageGoal']=[800,1200,1800,2600,3600][$s['stage']];
        $s['phase']='intro';$s['intro']=420;$s['ball']=['x'=>480,'y'=>135,'vx'=>0,'vy'=>0];$s['ballHitTick']=-120;
        $s['x']=360;$s['jump']=0;$s['jumpV']=0;$s['vx']=0;$s['jumpHeld']=false;
        $s=array_merge($s,campaignPowers());$s['specialHeld']=false;$s['rival']=campaignRival($s['stage']);return;
    }
    if($s['tick']>=72000){$s['ended']=true;$s['outcome']='draw';$s['phase']='ended';}
}

function campaignResult(array $s): array {
    return ['rivalHeads'=>$s['rivalHeads'],'bounces'=>$s['bounces'],'health'=>(int)ceil($s['health']),'rivalHealth'=>(int)ceil($s['rival']['health']),'score'=>$s['score'],'points'=>$s['points'],'peak'=>$s['peak'],'perfect'=>$s['perfect'],'bestCombo'=>$s['bestCombo'],
        'defeated'=>$s['defeated'],'stage'=>$s['stage'],'outcome'=>$s['outcome'],'duration'=>round($s['tick']/12)/10,'clockTick'=>$s['clockTick'],'ended'=>$s['ended']];
}
function campaignVerify(int $seed, string $team, mixed $inputs, mixed $tick): array {
    if (!is_int($tick) || $tick<1 || $tick>74040 || !is_array($inputs) || !array_is_list($inputs) || count($inputs)>$tick) throw new InvalidArgumentException('Replay inválido');
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
