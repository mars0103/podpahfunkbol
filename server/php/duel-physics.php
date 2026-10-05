<?php
declare(strict_types=1);
function duelBound(float $x): float {return max(54,min(906,$x));}
function duelRivalControl(array &$s,array &$r): array {
    if($s['tick']%max(12,30-$s['stage']*4)===0){
        $error=((int)floor($s['tick']/120)%2?1:-1)*(24-$s['stage']*4);
        $r['target']=duelBound($s['ball']['x']+$s['ball']['vx']*($s['ball']['vy']>0?.18:.3)+$error);
    }
    return ['target'=>$r['target'],'jump'=>$s['stage']>0&&$s['ball']['vy']>100&&$s['ball']['y']>320&&$s['ball']['y']<420&&abs($s['ball']['x']-$r['x'])<60];
}
function duelMoveActor(array &$a,array $input,float $speed,int $acceleration): void {
    $a['previousJump']=$a['jump'];
    $dir=isset($input['target'])?max(-1,min(1,($input['target']-$a['x'])/55)):(int)($input['right']??false)-(int)($input['left']??false);
    $a['vx']+=($dir*$speed*($a['slow']?.45:1)*($a['boost']?1.6:1)-$a['vx'])*(1-exp(-$acceleration/120));
    $a['x']+=($a['vx']+$a['push']+($a['dash']?$a['dashDirection']*430:0))/120;
    if(($input['jump']??false)&&!$a['jumpHeld']&&$a['jump']==0)$a['jumpV']=330;
    $a['jumpHeld']=$input['jump']??false;
    $a['jump']=max(0,$a['jump']+$a['jumpV']/120);
    if($a['jump']>0)$a['jumpV']-=1150/120;else $a['jumpV']=0;
}
function duelMove(array &$s,array $input): bool {
    $r=$s['rival'];$playerLeft=$s['x']<=$r['x'];
    duelMoveActor($s,$input,410,14);
    $control=duelRivalControl($s,$r);
    duelMoveActor($r,$control,$r['warning']||$r['specialWarning']?0:(260+$s['stage']*20)*($r['charging']?1.25:1),10);
    $s['x']=duelBound($s['x']);$r['x']=duelBound($r['x']);
    if($playerLeft){$left=&$s;$right=&$r;}else{$left=&$r;$right=&$s;}
    $overlap=108-($right['x']-$left['x']);
    if($overlap<=0){$s['rival']=$r;return false;}
    $lm=$left['shield']?3:1;$rm=$right['shield']?3:1;
    $left['x']-=$overlap*$rm/($lm+$rm);$right['x']+=$overlap*$lm/($lm+$rm);
    if($left['x']<54){$right['x']+=54-$left['x'];$left['x']=54;}
    if($right['x']>906){$left['x']-=$right['x']-906;$right['x']=906;}
    $shared=($left['vx']*$lm+$right['vx']*$rm)/($lm+$rm);$left['vx']=$shared;$right['vx']=$shared;
    unset($left,$right);$s['rival']=$r;return true;
}
function duelBall(array &$s): ?string {
    $b=&$s['ball'];$r=&$s['rival'];$oldY=$b['y'];
    $b['vy']+=(600+min($s['score']+$r['score'],80)*1.4)/120;$b['x']+=$b['vx']/120;$b['y']+=$b['vy']/120;
    if($b['x']<18||$b['x']>942){$b['x']=max(18,min(942,$b['x']));$b['vx']*= -.88;}
    $candidates=[];
    if($s['tick']-$s['ballHitTick']>18)foreach([0,1] as $index){
        $a=$index===0?$s:$r;$dx=$b['x']-$a['x'];$contact=464-$a['jump']-sqrt(max(0,44*44-$dx*$dx));
        if(abs($dx)<44&&$b['vy']>0&&$oldY<=$contact+$a['jump']-$a['previousJump']+5&&$b['y']>=$contact)$candidates[]=['index'=>$index,'dx'=>$dx,'contact'=>$contact];
    }
    usort($candidates,fn($a,$b)=>($a['contact']<=>$b['contact'])?:(abs($a['dx'])<=>abs($b['dx'])));
    if($candidates){
        $hit=$candidates[0];$isPlayer=$hit['index']===0;
        if($isPlayer){$a=&$s;$otherX=$r['x'];}else{$a=&$r;$otherX=$s['x'];}
        $perfect=abs($hit['dx'])<14;$a['score']++;$a['perfect']+=(int)$perfect;$a['combo']=$perfect?$a['combo']+1:0;$a['bestCombo']=max($a['bestCombo'],$a['combo']);
        $a['lastHit']=$s['tick'];$s['ballHitTick']=$s['tick'];$b['y']=$hit['contact']-1;
        $b['vy']=-min(590,505+max(0,$a['jumpV'])*.14);
        $random=juggleRandom($s);
        $b['vx']=max(-290,min(290,$hit['dx']*4+$a['vx']*.18+($random-.5)*110+($otherX<$a['x']?-65:65)));
        return $isPlayer?($perfect?'perfect':'hit'):($perfect?'rival-perfect':'rival-hit');
    }
    if($b['y']>=546){
        $b['y']=546;$b['vy']=-700;$b['vx']=abs($b['vx'])<80?($b['x']>480?-120:120):$b['vx']*.85;
        $s['combo']=0;$r['combo']=0;$s['bounces']++;return 'ground';
    }
    return null;
}
