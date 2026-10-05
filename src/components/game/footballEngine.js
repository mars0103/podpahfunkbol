import { campaignOrder as orderTeams } from './campaignEngine.js'
import { STAGE_GOALS } from './campaignRules.js'
export const MATCH_TICKS=7200, MAX_TICKS=200000, STEP=1/120, OWN_AREA_END=240, STAGES=STAGE_GOALS.length
export const CARDS={double:{name:'GOL X2',description:'Seus gols valem o dobro por 15s.'},penalty:{name:'PÊNALTI',description:'Uma cobrança, com goleiro e 5s para chutar.'},shootout:{name:'SHOOTOUT',description:'Avance do meio e finalize em até 5s.'},suspend:{name:'SUSPENSÃO',description:'O rival fica fora por 6s.'}}
const cardIds=Object.keys(CARDS)
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n))
const actor=x=>({x,vx:0,jump:0,jumpV:0,jumpHeld:false,previousJump:0,shootHeld:false,shotCooldown:0,specialHeld:false,specialCooldown:0,shield:0,slow:0,boost:0,dash:0,dashDirection:1,push:0,fx:0,hurt:0,suspended:0,double:0,lastHit:-120,direction:x<480?1:-1,score:0})
export const campaignOrder=orderTeams
function rng(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296}
export function createCampaign(seed,team){
 const s={...actor(220),seed:seed>>>0,team,order:orderTeams(seed,team),rival:actor(740),clockTick:0,tick:0,matchTick:0,stage:0,phase:'intro',intro:360,ended:false,outcome:null,points:0,peak:0,normalGoals:0,longGoals:0,blowouts:0,cleanSheets:0,lastGoalPoints:0,matchBonus:0,shotOwner:-1,shotX:480,score:0,totalGoals:0,rivalHeads:0,bounces:0,perfect:0,bestCombo:0,defeated:0,goals:0,against:0,ball:{x:480,y:280,vx:0,vy:0},lastTouch:-1,hitTick:-120,card:null,rivalCard:null,cardHeld:false,cardUsed:false,rivalCardUsed:false,notice:'1 MINUTO · MARQUE MAIS GOLS',noticeUntil:0,chaos:0,globalDouble:0,goalPause:0,goalSide:0,setPiece:null,setTicks:0,setOwner:0,tie:false,tieRound:0,tiePlayer:0,tieRival:0,tieScored:false}
 deal(s);return s
}
function deal(s){s.card=cardIds[Math.floor(rng(s)*4)];s.rivalCard=cardIds[Math.floor(rng(s)*4)];s.cardUsed=false;s.rivalCardUsed=false}
function notice(s,text){s.notice=text;s.noticeUntil=s.tick+360}
function kickoff(s){
 const playerDouble=s.double,rivalDouble=s.rival.double,playerSuspended=s.suspended,rivalSuspended=s.rival.suspended
 const score=s.score;Object.assign(s,actor(220));s.score=score;s.rival=actor(740);s.double=playerDouble;s.rival.double=rivalDouble;s.suspended=playerSuspended;s.rival.suspended=rivalSuspended
 s.ball={x:480,y:280,vx:(rng(s)-.5)*100,vy:0};s.hitTick=-120;s.lastTouch=-1;s.shotOwner=-1;s.shotX=480;s.setPiece=null;s.setTicks=0;s.phase='play'
}
function timers(a){for(const k of ['shotCooldown','specialCooldown','shield','slow','boost','dash','fx','hurt','suspended','double'])a[k]=Math.max(0,a[k]-1);a.push*=.976;if(Math.abs(a.push)<1)a.push=0}
function shove(a,other,force){if(!other.shield&&!other.suspended){other.push=(other.x>=a.x?1:-1)*force;other.hurt=30}}
function special(a,other,team){
 a.specialCooldown=1200;a.fx=120
 const d=Math.abs(a.x-other.x)
 if(team==='podpah'&&d<260)shove(a,other,540)
 if(team==='capim'&&d<140)shove(a,other,850)
 if(team==='dendele'||team==='desimpain'){a.dash=team==='dendele'?120:72;a.dashDirection=a.direction;if(team==='desimpain')a.boost=240}
 if(team==='furia'||team==='nyvelados'){a.shield=team==='furia'?360:240;a.slow=0;a.push=0}
 if(team==='loud'&&d<320&&!other.shield)other.slow=360
 if(team==='g3x')a.boost=360
 if(team==='dibrados'){a.boost=180;a.shield=90;a.push=0}
 if(team==='fluxo'&&d<210){shove(a,other,650);if(!other.shield)other.slow=180}
}
function move(a,input,speed){
 a.previousJump=a.jump
 if(a.suspended){a.vx=0;return}
 const dir=input.target!=null?clamp((input.target-a.x)/40,-1,1):Number(!!input.right)-Number(!!input.left)
 if(Math.abs(dir)>.1)a.direction=dir<0?-1:1
 a.vx+=(dir*speed*(a.slow?.5:1)*(a.boost?1.4:1)-a.vx)*(1-Math.exp(-14*STEP))
 a.x=clamp(a.x+(a.vx+a.push+(a.dash?a.dashDirection*380:0))*STEP,112,848)
 if(input.jump&&!a.jumpHeld&&a.jump===0)a.jumpV=580
 a.jumpHeld=!!input.jump;a.jump=Math.max(0,a.jump+a.jumpV*STEP)
 if(a.jump>0)a.jumpV-=1150*STEP;else a.jumpV=0
}
function bodies(s,oldLeft){
 const r=s.rival;if(s.suspended||r.suspended||Math.abs(s.jump-r.jump)>116)return false
 const left=oldLeft===0?s:r,right=oldLeft===0?r:s,overlap=92-(right.x-left.x)
 if(overlap<=0)return false
 const lm=left.shield?3:1,rm=right.shield?3:1
 left.x-=overlap*rm/(lm+rm);right.x+=overlap*lm/(lm+rm)
 if(left.x<112){right.x+=112-left.x;left.x=112}
 if(right.x>848){left.x-=right.x-848;right.x=848}
 const v=(left.vx*lm+right.vx*rm)/(lm+rm);left.vx=v;right.vx=v
 return true
}
function kick(s,a,input,owner){
 if(!input.shoot||a.shotCooldown||a.suspended)return false
 const b=s.ball,dx=b.x-a.x,dy=b.y-(525-a.jump)
 if(Math.abs(dx)>88||Math.abs(dy)>100)return false
 a.shotCooldown=54;a.lastHit=s.tick;s.lastTouch=owner;s.shotOwner=owner;s.shotX=a.x;s.hitTick=s.tick
 b.vx=(owner===0?1:-1)*(580+Math.abs(a.vx)*.25);b.vy=a.jump>20?-310:-190
 return true
}
function startPiece(s,owner,kind){
 const pscore=s.score;Object.assign(s,actor(owner===0?(kind==='penalty'?650:480):150));s.score=pscore
 s.rival=actor(owner===1?(kind==='penalty'?310:480):810)
 s.setPiece=kind;s.setOwner=owner;s.setTicks=600;s.phase='setpiece';s.hitTick=-120;s.lastTouch=-1;s.shotOwner=-1;s.shotX=480;s.tieScored=false
 s.ball={x:owner===0?s.x+50:s.rival.x-50,y:530,vx:0,vy:0}
 notice(s,(owner===0?'SUA COBRANÇA: ':'RIVAL COBRA: ')+(kind==='penalty'?'PÊNALTI':'SHOOTOUT'))
}
function useCard(s,owner){
 const key=owner===0?'card':'rivalCard',used=owner===0?'cardUsed':'rivalCardUsed'
 if((owner===0?s:s.rival).suspended||s[used]||s.matchTick<1200||s.phase!=='play'||s.matchTick>=6900)return false
 s[used]=true;const a=owner===0?s:s.rival,other=owner===0?s.rival:s
 if(s[key]==='double')a.double=1800
 if(s[key]==='suspend'){other.suspended=720;other.vx=0;other.push=0}
 if(s[key]==='penalty'||s[key]==='shootout')startPiece(s,owner,s[key])
 else notice(s,(owner===0?'SUA CARTA: ':'CARTA DO RIVAL: ')+CARDS[s[key]].name)
 return true
}
function ai(s){
 const b=s.ball,r=s.rival
 let target=clamp(b.x+42+b.vx*.12,130,835)
 if(s.phase==='setpiece'&&s.setOwner===0)target=810
 const attackingPiece=s.phase==='setpiece'&&s.setOwner===1
 const jump=attackingPiece?s.setTicks<540&&r.jump===0:b.y<465&&b.vy>0&&Math.abs(b.x-r.x)<90&&r.jump===0&&s.tick%60<8
 return {target,jump,shoot:attackingPiece?r.jump>25&&r.jump<90:s.tick%(s.stage<2?100:76)<5,special:s.tick%1100===600}
}
function ballStep(s){
 const b=s.ball,r=s.rival,dt=STEP/3
 let event=null
 for(let step=0;step<3;step++){
  const oldX=b.x,oldY=b.y;b.vy+=(s.chaos===1?420:720)*dt;b.x+=b.vx*dt;b.y+=b.vy*dt
  if(b.y<150){b.y=150;b.vy=Math.abs(b.vy)*.8}
  if(b.y>=546){b.y=546;b.vy=-Math.max(150,Math.abs(b.vy)*.65);b.vx*=.94;if(step===0){s.bounces++;event='ground'}}
  // The entire ball must cross the goal line below the crossbar.
  if(b.y-14>=380&&b.y+14<=560){
   if(oldX+14>=80&&b.x+14<80)return 'goal-rival'
   if(oldX-14<=880&&b.x-14>880)return 'goal-player'
  }
  if((b.x<80||b.x>880)&&b.vy>0&&oldY+14<=380&&b.y+14>=380){b.y=366;b.vy=-Math.max(150,Math.abs(b.vy)*.7);b.vx=(b.x<480?1:-1)*Math.max(180,Math.abs(b.vx));event='post'}
  for(const gx of [80,880]){
   if(Math.abs(b.x-gx)<17&&Math.abs(b.y-380)<18){b.x=gx+(gx<480?18:-18);b.vx=(gx<480?1:-1)*Math.max(180,Math.abs(b.vx)*.8);b.vy=-Math.max(150,Math.abs(b.vy)*.65);event='post'}
  }
  if(b.x<25||b.x>935){b.x=clamp(b.x,25,935);b.vx*=-.82}
  for(let owner=0;owner<2;owner++){
   const a=owner===0?s:r;if(a.suspended||(s.lastTouch===owner&&s.tick-s.hitTick<16))continue
   const dx=b.x-a.x,head=450-a.jump
   if(Math.abs(dx)<43&&b.vy>0&&oldY<=head-20&&b.y>=head-29){
    b.y=head-30;b.vx=(owner===0?1:-1)*(340+Math.abs(dx)*3);b.vy=-210-Math.max(0,a.jumpV)*.16
    s.lastTouch=owner;s.shotOwner=owner;s.shotX=a.x;s.hitTick=s.tick;a.lastHit=s.tick;event=owner===0?'hit':'rival-hit';continue
   }
   const nearX=clamp(b.x,a.x-30,a.x+30),nearY=clamp(b.y,head-10,550-a.jump)
   const nx=b.x-nearX,ny=b.y-nearY,dist=Math.sqrt(nx*nx+ny*ny)
   if(dist<14&&dist>.001){
    b.x=nearX+nx/dist*14;b.y=nearY+ny/dist*14
    const dot=b.vx*nx/dist+b.vy*ny/dist
    if(dot<0){s.shotOwner=owner;s.shotX=a.x;b.vx-=1.7*dot*nx/dist;b.vy-=1.7*dot*ny/dist;b.vx+=a.vx*.3}
   }
  }
  b.vx=clamp(b.vx,-950,950);b.vy=clamp(b.vy,-800,800)
 }
 return event
}
function endCampaign(s,outcome){s.ended=true;s.outcome=outcome;s.phase='ended';s.peak=Math.max(s.peak,s.points);return 'end'}
function finishMatch(s,won){
 if(!won)return endCampaign(s,'lose')
 s.matchBonus=0
 if(s.goals-s.against>=3){s.blowouts++;s.matchBonus+=100}
 if(s.against===0){s.cleanSheets++;s.matchBonus+=20}
 s.defeated++;s.points+=s.matchBonus;s.peak=s.points
 if(s.stage===STAGES-1)return endCampaign(s,'win')
 s.stage++;s.goals=0;s.against=0;s.matchTick=0;s.tie=false;s.tieRound=0;s.tiePlayer=0;s.tieRival=0;s.globalDouble=0;s.chaos=0;s.double=0;s.rival.double=0;s.suspended=0;s.rival.suspended=0
 kickoff(s);deal(s);s.phase='intro';s.intro=360;return 'next'
}
function nextTie(s){
 s.tieRound++
 if(s.tieRound%2===0&&s.tieRound>=6&&s.tiePlayer!==s.tieRival)return finishMatch(s,s.tiePlayer>s.tieRival)
 if(s.tieRound>=20)return endCampaign(s,'draw')
 startPiece(s,s.tieRound%2,'shootout');return 'shootout'
}
function scoreGoal(s,owner){
 if(s.tie){if(owner===s.setOwner){if(owner===0)s.tiePlayer++;else s.tieRival++}s.tieScored=true}
 else {
  const mult=s.globalDouble||((owner===0?s:s.rival).double>0)?2:1
  if(owner===0){s.goals+=mult;s.totalGoals++;s.score=s.totalGoals;const long=s.shotOwner===0&&s.shotX<=OWN_AREA_END
   s.lastGoalPoints=long?30:20
   if(long)s.longGoals++;else s.normalGoals++
   s.points+=s.lastGoalPoints;s.peak=s.points}else s.against+=mult
 }
 s.goalSide=owner;s.goalPause=180;s.phase='goal';notice(s,owner===0?'GOOOL!':'GOL DO RIVAL');return owner===0?'goal':'rival-goal'
}
export function advanceCampaign(s,input={}){
 if(s.ended)return null
 s.clockTick++
 if(s.phase==='intro'){if(--s.intro<=0){s.phase='play';return 'ready'}return null}
 s.tick++
 if(!s.tie)s.matchTick++
 let event=null
 if(!s.tie&&s.matchTick>=MATCH_TICKS&&s.phase!=='goal'){
  if(s.goals!==s.against)return finishMatch(s,s.goals>s.against)
  s.tie=true;s.tieRound=0;s.tiePlayer=0;s.tieRival=0;startPiece(s,0,'shootout');notice(s,'EMPATE! SHOOTOUTS · MELHOR DE 3');return 'shootout'
 }
 if(s.matchTick===1200){notice(s,'CARTAS LIBERADAS! USE Q OU O BOTÃO');event='card-ready'}
 if(s.matchTick===2400){s.globalDouble=900;notice(s,'0:20 · GOL X2 PARA OS DOIS POR 7,5s');event='surprise'}
 if(s.matchTick===3600){s.chaos=1+Math.floor(rng(s)*2);notice(s,s.chaos===1?'INTERVALO · BOLA LEVE POR 7,5s':'INTERVALO · TURBO PARA OS DOIS POR 7,5s');event='surprise'}
 if(s.matchTick===4500)s.chaos=0
 if(s.matchTick===4500){deal(s);notice(s,'NOVAS CARTAS PARA O SEGUNDO TEMPO');event='card-ready'}
 if(s.matchTick===5400){s.globalDouble=1800;notice(s,'RETA FINAL · TODOS OS GOLS VALEM X2!');event='surprise'}
 if(s.phase==='goal'){
  s.ball.x=clamp(s.ball.x+s.ball.vx*STEP*.15,30,930);s.ball.vx*=.96
  if(--s.goalPause<=0){if(s.tie)return nextTie(s);kickoff(s);return 'ready'}return null
 }
 timers(s);timers(s.rival)
 if(s.globalDouble>0)s.globalDouble--
 if(input.card&&!s.cardHeld&&useCard(s,0))event='card';s.cardHeld=!!input.card
 if(s.phase==='play'&&((s.matchTick>=3300+s.stage*100&&s.matchTick<9000)||s.matchTick>=9900+s.stage*80)&&useCard(s,1))event='rival-card'
 const r=s.rival,control=ai(s),left=s.x<=r.x?0:1
 const playerInput=s.suspended?{}:input
 move(s,playerInput,360*(s.chaos===2?1.25:1));move(r,control,(260+s.stage*18)*(s.chaos===2?1.25:1))
 if(s.phase==='setpiece'){
  const keeper=s.setOwner===0?r:s;keeper.x=s.setOwner===0?810:150
  if(s.setPiece==='penalty'){const shooter=s.setOwner===0?s:r;shooter.x=s.setOwner===0?650:310}
 }
 if(bodies(s,left)&&s.tick%48===0)event='bump'
 if(input.special&&!s.specialHeld&&!s.specialCooldown&&!s.suspended&&s.phase==='play'){special(s,r,s.team);event='special'}s.specialHeld=!!input.special
 if(control.special&&!r.specialCooldown&&!r.suspended&&s.phase==='play'){special(r,s,s.order[s.stage]);event='rival-special'}
 if(kick(s,s,playerInput,0))event='kick'
 if(kick(s,r,control,1))event='rival-kick'
 const ballEvent=ballStep(s)
 if(ballEvent==='goal-player'||ballEvent==='goal-rival'){
  const owner=ballEvent==='goal-player'?0:1
  if(s.phase==='setpiece'&&owner!==s.setOwner){if(s.tie)return nextTie(s);kickoff(s);return 'ready'}
  return scoreGoal(s,owner)
 }
 if(ballEvent)event=ballEvent
 if(s.phase==='setpiece'&&--s.setTicks<=0){if(s.tie)return nextTie(s);kickoff(s);notice(s,'COBRANÇA ENCERRADA · BOLA EM JOGO');return 'ready'}
 return event
}
export function campaignResult(s){return {normalGoals:s.normalGoals,longGoals:s.longGoals,blowouts:s.blowouts,cleanSheets:s.cleanSheets,score:s.totalGoals,points:s.points,peak:s.peak,defeated:s.defeated,stage:s.stage,outcome:s.outcome,duration:Math.round(s.tick/12)/10,clockTick:s.clockTick,ended:s.ended,goals:s.goals,against:s.against,tiePlayer:s.tiePlayer,tieRival:s.tieRival,matchTick:s.matchTick}}
