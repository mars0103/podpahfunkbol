import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createCampaign, campaignOrder, advanceCampaign, campaignResult, CAMPAIGN_TEAMS, CAMPAIGN_MAX_TICKS } from '../src/components/game/campaignEngine.js'
import { moveDuel, advanceDuelBall, BODY_GAP } from '../src/components/game/duelPhysics.js'
function simulate(seed,team,strategy='follow'){
 const s=createCampaign(seed,team),inputs=[],events=new Set();let previous=''
 while(!s.ended&&s.clockTick<CAMPAIGN_MAX_TICKS){
  const c={left:strategy==='left',right:false,jump:strategy==='follow'&&s.rival.charging&&Math.abs(s.rival.x-s.x)<140&&s.jump===0,
   special:strategy==='follow'&&Math.abs(s.rival.x-s.x)<200&&!s.specialCooldown,target:strategy==='follow'?Math.round(Math.max(38,Math.min(922,s.ball.x))):null}
  const json=JSON.stringify(c);if(json!==previous){inputs.push({tick:s.clockTick,...c});previous=json}
  events.add(advanceCampaign(s,c))
 }
 return {s,inputs,events}
}
test('five distinct rivals from all ten clubs, including each possible boss',()=>{
 const bosses=new Set()
 for(let seed=1;seed<=200;seed++)for(const chosen of CAMPAIGN_TEAMS){
  const order=campaignOrder(Math.imul(seed,2654435761)>>>0,chosen)
  assert.equal(order.length,5);assert.equal(new Set(order).size,5);assert.ok(!order.includes(chosen));bosses.add(order[4])
 }
 assert.equal(bosses.size,10)
})
test('starts directly in first duel and freezes both players during introduction',()=>{
 const s=createCampaign(8,'podpah')
 for(let i=0;i<359;i++)advanceCampaign(s,{right:true})
 assert.equal(s.stage,0);assert.equal(s.tick,0);assert.equal(s.x,360);assert.equal(s.rival.x,600);assert.equal(s.ball.y,135)
 assert.equal(advanceCampaign(s,{}),'ready')
})
test('floor rebounds strongly without losing health, points or awarding a header',()=>{
 const s=createCampaign(1,'podpah');s.phase='play';s.points=300;s.peak=300
 s.ball={x:54,y:545,vy:400,vx:0}
 s.tick++;assert.equal(advanceDuelBall(s),'ground');assert.equal(s.ball.vy,-700)
 assert.equal(s.ball.y,546);assert.equal(s.points,300);assert.equal(s.health,100);assert.equal(s.rival.health,200);assert.equal(s.score,0);assert.equal(s.rival.score,0);assert.equal(s.ended,false)
 for(let i=0;i<40;i++){s.tick++;advanceDuelBall(s)}
 assert.ok(s.ball.y<360,'rebound goes back up into playable air')
})
test('solid bodies push in both directions without crossing, including walls and jumps',()=>{
 for(const direction of [-1,1]){
  const s=createCampaign(1,'podpah');s.x=direction===1?300:410;s.rival.x=direction===1?410:300
  s.rival.specialWarning=999;s.rival.target=s.rival.x
  const old=s.rival.x
  for(let i=0;i<120;i++){
   moveDuel(s,{left:direction<0,right:direction>0,jump:i===0})
   assert.ok((s.rival.x-s.x)*direction>=BODY_GAP-1e-8)
  }
  assert.ok((s.rival.x-old)*direction>50,'walking moves the other body')
  s.x=direction===1?798:162;s.rival.x=direction===1?906:54;s.dash=100;s.dashDirection=direction;s.boost=100
  for(let i=0;i<120;i++){moveDuel(s,{left:direction<0,right:direction>0});assert.ok(Math.abs(s.rival.x-s.x)>=BODY_GAP-1e-8);assert.ok(s.x>=54&&s.rival.x<=906&&s.rival.x>=54&&s.x<=906)}
 }
})
test('both players use head collisions; only the owner receives the header',()=>{
 for(const owner of ['player','rival']){
  const s=createCampaign(1,'podpah');s.phase='play';s.ball={x:owner==='player'?s.x:s.rival.x,y:419,vy:300,vx:0}
  const event=advanceCampaign(s,{})
  assert.equal(event,owner==='player'?'perfect':'rival-perfect')
  assert.equal(s.score,owner==='player'?1:0);assert.equal(s.rival.score,owner==='rival'?1:0)
  assert.ok(s.ball.vy<0)
  assert.equal(s.health<100,owner==='rival');assert.equal(s.rival.health<200,owner==='player')
  for(let i=0;i<10;i++)advanceCampaign(s,{})
  assert.equal(s.score+s.rival.score,1)
 }
})
test('all specials work without winning through contact or direct damage',()=>{
 for(const team of CAMPAIGN_TEAMS){
  const s=createCampaign(7,team);s.phase='play';s.rival.x=s.x+180;s.health=50
  advanceCampaign(s,{special:true});assert.equal(s.specialCooldown,1200)
  assert.equal(s.health,team==='nyvelados'?62:50);assert.equal(s.rival.health,200);assert.equal(s.ended,false)
  s.specialCooldown=0;advanceCampaign(s,{special:true});assert.equal(s.specialCooldown,0,'held key does not retrigger')
  advanceCampaign(s,{special:false});advanceCampaign(s,{special:true});assert.equal(s.specialCooldown,1200)
  const r=createCampaign(7,'podpah');r.phase='play';r.order[0]=team;r.rival.x=r.x+100;r.rival.specialWarning=1
  advanceCampaign(r,{});assert.equal(r.rival.specialCooldown,1200);assert.equal(r.health,100)
 }
})
test('only headers decide knockouts and losses preserve the historical peak',()=>{
 const s=createCampaign(1,'podpah');s.phase='play';s.health=.1;s.peak=300;s.points=300
 s.rival.x=s.x+110;s.rival.specialWarning=1;s.order[0]='capim'
 advanceCampaign(s,{});assert.equal(s.ended,false);assert.equal(s.health,.1)
 s.ball={x:s.rival.x,y:419,vy:300,vx:0}
 assert.equal(advanceCampaign(s,{}),'end');assert.equal(s.outcome,'lose');assert.equal(s.points,0);assert.equal(s.peak,300);assert.ok(s.rival.score>0)
 const win=createCampaign(1,'podpah');win.phase='play';win.rival.health=.1;win.ball={x:win.x,y:419,vy:300,vx:0}
 assert.equal(advanceCampaign(win,{}),'next');assert.equal(win.stage,1);assert.equal(win.health,100);assert.equal(win.stageScore,0)
})
test('ten-minute limit is a draw, never a win for a rival with no headers',()=>{
 const s=createCampaign(1,'podpah');s.phase='play';s.tick=71999
 advanceCampaign(s,{});assert.equal(s.outcome,'draw');assert.equal(s.rival.score,0)
})
test('a skilled player can win while an idle player loses to actual rival headers',()=>{
 const win=simulate(1,'podpah'),loss=simulate(2,'podpah','left')
 assert.equal(win.s.outcome,'win');assert.equal(win.s.defeated,5);assert.ok(win.s.rivalHeads>0);assert.ok(win.s.bounces>0)
 assert.equal(loss.s.outcome,'lose');assert.ok(loss.s.rivalHeads>0);assert.ok(loss.events.has('ground'))
})
test('PHP reproduces complete duels, floor bounces, solid collisions and all ten specials',()=>{
 const fixtures=[],expected=[]
 for(let i=0;i<12;i++){
  const team=i>=10?'podpah':CAMPAIGN_TEAMS[i],seed=i>=10?i-9:i*12345+1
  const {s,inputs}=simulate(seed,team,i===11?'left':'follow')
  fixtures.push({seed,team,inputs,tick:s.clockTick});expected.push(campaignResult(s))
 }
 const php=spawnSync(process.env.PHP_BIN||'php',['-d','memory_limit=512M','server/php/campaign-fixtures.php'],{input:JSON.stringify(fixtures),encoding:'utf8',maxBuffer:30_000_000})
 assert.equal(php.status,0,php.error?.message||php.stderr)
 assert.deepEqual(JSON.parse(php.stdout),expected)
})
