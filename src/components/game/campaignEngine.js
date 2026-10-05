import { createMatch } from './juggleEngine.js'
import { moveDuel, advanceDuelBall } from './duelPhysics.js'
import { STAGE_GOALS, PLAY_TICKS, SPECIAL_COOLDOWN, SPECIALS } from './campaignRules.js'

export const CAMPAIGN_TEAMS = ['podpah', 'capim', 'dendele', 'furia', 'loud', 'g3x', 'dibrados', 'nyvelados', 'fluxo', 'desimpain']
export const CAMPAIGN_MAX_TICKS = PLAY_TICKS + 360 + 4 * 420
const powers = () => ({ health: 100, hurt: 0, push: 0, shield: 0, slow: 0, boost: 0, dash: 0, dashDirection: 1, fx: 0, specialCooldown: 0 })
const rival = stage => ({ ...powers(), health: 200 + stage * 75, maxHealth: 200 + stage * 75, x: 600, vx: 0, jump: 0, jumpV: 0, jumpHeld: false, previousJump: 0, target: 480,
  score: 0, perfect: 0, combo: 0, bestCombo: 0, lastHit: -120, stagePoints: 0, direction: -1, cooldown: 0, charging: false, warning: false, specialWarning: 0, specialCooldown: 720 })
export function campaignOrder(seed, team) {
  const order = CAMPAIGN_TEAMS.filter(id => id !== team)
  let state = seed >>> 0
  for (let i = order.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    const j = Math.floor(state / 4294967296 * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order.slice(0, STAGE_GOALS.length)
}
export function createCampaign(seed, team) {
  return { ...createMatch(seed), ...powers(), x: 360, previousJump: 0, stageScore: 0, rivalHeads: 0, bounces: 0, ballHitTick: -120, team, order: campaignOrder(seed, team), clockTick: 0,
    stage: 0, stagePoints: 0, stageGoal: STAGE_GOALS[0], peak: 0, defeated: 0,
    phase: 'intro', intro: 360, outcome: null, stageStart: 0, specialHeld: false,
    rival: rival(0) }
}
function timers(a) {
  for (const key of ['hurt', 'shield', 'slow', 'boost', 'dash', 'fx', 'specialCooldown']) a[key] = Math.max(0, a[key] - 1)
  a.push *= .976
  if (Math.abs(a.push) < 1) a.push = 0
}
function push(a, source, force) {
  if (a.shield || a.jump > 30) return false
  a.hurt = 36
  a.push = (a.x >= source.x ? 1 : -1) * force
  return true
}
function special(a, other, team) {
  a.specialCooldown = SPECIAL_COOLDOWN; a.fx = 120
  const distance = Math.abs(a.x - other.x)
  if (team === 'podpah' && distance <= 260) push(other, a, 540)
  if (team === 'capim' && distance <= 140) push(other, a, 850)
  if (team === 'dendele') { a.dash = 120; a.dashDirection = other.x < a.x ? -1 : 1 }
  if (team === 'furia') { a.shield = 360; a.slow = 0; a.push = 0 }
  if (team === 'loud' && distance <= 320 && !other.shield && other.jump <= 30) other.slow = 360
  if (team === 'g3x') a.boost = 360
  if (team === 'dibrados') { a.boost = 180; a.shield = 90; a.push = 0 }
  if (team === 'nyvelados') { a.health = Math.min(a.maxHealth ?? 100, a.health + 12); a.shield = 120; a.push = 0; a.slow = 0 }
  if (team === 'fluxo' && distance <= 210 && push(other, a, 650)) other.slow = 180
  if (team === 'desimpain') { a.dash = 72; a.dashDirection = other.x < a.x ? -1 : 1; a.boost = 240 }
}
export function advanceCampaign(s, input = {}) {
  if (s.ended) return null
  s.clockTick++
  if (s.phase === 'intro') {
    s.intro--
    if (s.intro <= 0) { s.phase = 'play'; s.stageStart = s.tick; return 'ready' }
    return null
  }
  s.tick++
  let r = s.rival
  timers(s); timers(r)
  let event = null
  if (input.special && !s.specialHeld && !s.specialCooldown) { special(s,r,s.team); event='special' }
  s.specialHeld=!!input.special
  const enemy=s.order[s.stage],cycleLength=540-s.stage*40,cycle=(s.tick-s.stageStart)%cycleLength
  r.warning=cycle>=cycleLength-156&&cycle<cycleLength-84
  r.charging=cycle>=cycleLength-84
  r.direction=r.target<r.x?-1:1
  if(r.specialWarning>0){
    r.specialWarning--
    if(!r.specialWarning){special(r,s,enemy);event='rival-special'}
  }else if(!r.specialCooldown&&Math.abs(r.x-s.x)<=SPECIALS[enemy].range){r.specialWarning=96;event='special-warning'}
  r.cooldown=Math.max(0,r.cooldown-1)
  if(moveDuel(s,input)&&!r.cooldown){
    if(s.dash||s.shield)push(r,s,s.dash?780:440)
    else if(r.dash)push(s,r,780)
    r.cooldown=72;event='bump'
  }
  const hit=advanceDuelBall(s)
  if(hit==='hit'||hit==='perfect'){
    const gain=(10+(hit==='perfect'?5:0)+Math.min(s.combo,5))*(s.stage+2)
    s.points+=gain;s.peak=s.points;s.stagePoints+=gain;s.stageScore++
    r.health=Math.max(0,r.health-gain*r.maxHealth/s.stageGoal);r.hurt=36
    event=hit
  }else if(hit==='rival-hit'||hit==='rival-perfect'){
    const gain=(10+(hit==='rival-perfect'?5:0)+Math.min(r.combo,5))*(s.stage+2)
    r.stagePoints+=gain;s.rivalHeads++
    s.health=Math.max(0,s.health-gain*100/s.stageGoal);s.hurt=36
    event=hit
  }else if(hit)event=hit
  if(s.health<=0&&r.score>0){
    s.ended=true;s.outcome='lose';s.phase='ended';s.points=0;return 'end'
  }
  if(r.health<=0&&s.stageScore>0){
    s.defeated++
    if(s.stage===4){s.ended=true;s.outcome='win';s.phase='ended';return 'end'}
    s.stage++;s.stagePoints=0;s.stageScore=0;s.stageGoal=STAGE_GOALS[s.stage]
    s.phase='intro';s.intro=420
    s.ball={x:480,y:135,vx:0,vy:0};s.ballHitTick=-120
    s.x=360;s.jump=0;s.jumpV=0;s.vx=0;s.jumpHeld=false
    Object.assign(s,powers());s.specialHeld=false;s.rival=rival(s.stage)
    return 'next'
  }
  if(s.tick>=PLAY_TICKS){s.ended=true;s.outcome='draw';s.phase='ended';return 'end'}
  return event
}
export function campaignResult(s) {
  return { rivalHeads: s.rivalHeads, bounces: s.bounces, health: Math.ceil(s.health), rivalHealth: Math.ceil(s.rival.health), score: s.score, points: s.points, peak: s.peak, perfect: s.perfect,
    bestCombo: s.bestCombo, defeated: s.defeated, stage: s.stage, outcome: s.outcome,
    duration: Math.round(s.tick / 12) / 10, clockTick: s.clockTick, ended: s.ended }
}
