import { STEP } from './juggleEngine.js'
export const BODY_GAP = 108
const bound = x => Math.max(54, Math.min(906, x))
const unit = x => Math.max(-1, Math.min(1, x))
export function rivalControl(s) {
  const r=s.rival
  if(s.tick%Math.max(12,30-s.stage*4)===0){
    const error=(Math.floor(s.tick/120)%2?1:-1)*(24-s.stage*4)
    r.target=bound(s.ball.x+s.ball.vx*(s.ball.vy>0?.18:.3)+error)
  }
  return {target:r.target,jump:s.stage>0&&s.ball.vy>100&&s.ball.y>320&&s.ball.y<420&&Math.abs(s.ball.x-r.x)<60}
}
function move(a,input,speed,acceleration) {
  a.previousJump=a.jump
  const dir=input.target!=null?unit((input.target-a.x)/55):Number(!!input.right)-Number(!!input.left)
  a.vx+=(dir*speed*(a.slow?.45:1)*(a.boost?1.6:1)-a.vx)*(1-Math.exp(-acceleration*STEP))
  a.x+=(a.vx+a.push+(a.dash?a.dashDirection*430:0))*STEP
  if(input.jump&&!a.jumpHeld&&a.jump===0)a.jumpV=330
  a.jumpHeld=!!input.jump
  a.jump=Math.max(0,a.jump+a.jumpV*STEP)
  if(a.jump>0)a.jumpV-=1150*STEP;else a.jumpV=0
}
export function moveDuel(s,input) {
  const r=s.rival,left=s.x<=r.x?s:r,right=left===s?r:s
  move(s,input,410,14)
  const control=rivalControl(s)
  move(r,control,r.warning||r.specialWarning?0:(260+s.stage*20)*(r.charging?1.25:1),10)
  s.x=bound(s.x);r.x=bound(r.x)
  const overlap=BODY_GAP-(right.x-left.x)
  if(overlap<=0)return false
  const lm=left.shield?3:1,rm=right.shield?3:1
  left.x-=overlap*rm/(lm+rm);right.x+=overlap*lm/(lm+rm)
  if(left.x<54){right.x+=54-left.x;left.x=54}
  if(right.x>906){left.x-=right.x-906;right.x=906}
  const shared=(left.vx*lm+right.vx*rm)/(lm+rm)
  left.vx=shared;right.vx=shared
  return true
}
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296}
export function advanceDuelBall(s) {
  const b=s.ball,r=s.rival,oldY=b.y
  b.vy+=(600+Math.min(s.score+r.score,80)*1.4)*STEP;b.x+=b.vx*STEP;b.y+=b.vy*STEP
  if(b.x<18||b.x>942){b.x=Math.max(18,Math.min(942,b.x));b.vx*= -.88}
  const candidates=[]
  if(s.tick-s.ballHitTick>18)for(const a of [s,r]){
    const dx=b.x-a.x,contact=464-a.jump-Math.sqrt(Math.max(0,44*44-dx*dx))
    if(Math.abs(dx)<44&&b.vy>0&&oldY<=contact+a.jump-a.previousJump+5&&b.y>=contact)
      candidates.push({a,dx,contact})
  }
  // The first surface crossed owns the contact. A ball can score only once per tick.
  candidates.sort((a,b)=>a.contact-b.contact||Math.abs(a.dx)-Math.abs(b.dx))
  if(candidates.length){
    const {a,dx,contact}=candidates[0],other=a===s?r:s,perfect=Math.abs(dx)<14
    a.score++;a.perfect+=Number(perfect);a.combo=perfect?a.combo+1:0;a.bestCombo=Math.max(a.bestCombo,a.combo)
    a.lastHit=s.tick;s.ballHitTick=s.tick
    b.y=contact-1;b.vy=-Math.min(590,505+Math.max(0,a.jumpV)*.14)
    b.vx=Math.max(-290,Math.min(290,dx*4+a.vx*.18+(random(s)-.5)*110+(other.x<a.x?-65:65)))
    return a===s?(perfect?'perfect':'hit'):(perfect?'rival-perfect':'rival-hit')
  }
  if(b.y>=546){
    b.y=546;b.vy=-700
    b.vx=Math.abs(b.vx)<80?(b.x>480?-120:120):b.vx*.85
    s.combo=0;r.combo=0;s.bounces++
    return 'ground'
  }
  return null
}
