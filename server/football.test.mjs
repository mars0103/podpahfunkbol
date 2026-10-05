import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {createCampaign,advanceCampaign,campaignResult,MATCH_TICKS} from '../src/components/game/footballEngine.js'
const neutral={left:false,right:false,jump:false,special:false,shoot:false,card:false,target:null}
const live=()=>{const s=createCampaign(1,'podpah');s.phase='play';return s}
for(const [x,goal] of [[67,'against'],[893,'goals']]){const s=live();s.ball={x,y:480,vx:x<480?-600:600,vy:0};advanceCampaign(s,neutral);assert.equal(s[goal],1);for(let i=0;i<30;i++)advanceCampaign(s,neutral);assert.equal(s[goal],1)}
for(const x of [65,895]){const s=live();s.ball={x,y:250,vx:0,vy:0};advanceCampaign(s,neutral);assert.equal(s.goals+s.against,0)}
{const s=live();s.double=100;s.ball={x:893,y:480,vx:600,vy:0};advanceCampaign(s,neutral);assert.equal(s.goals,2);for(let i=0;i<181;i++)advanceCampaign(s,neutral);assert.ok(s.double>0)}
for(const card of ['double','suspend','penalty','shootout']){const s=live();s.matchTick=2600;s.card=card;advanceCampaign(s,{...neutral,card:true});assert.equal(s.cardUsed,true);if(card==='suspend')assert.ok(s.rival.suspended>0);if(card==='double')assert.ok(s.double>0);if(card==='penalty'||card==='shootout'){assert.equal(s.phase,'setpiece');assert.equal(s.goals,0)}}
{const s=live();s.matchTick=MATCH_TICKS-1;s.goals=1;advanceCampaign(s,neutral);assert.equal(s.stage,1);assert.equal(s.defeated,1)}
{const s=live();s.matchTick=MATCH_TICKS-1;advanceCampaign(s,neutral);assert.ok(s.tie);assert.equal(s.phase,'setpiece')}
// Scoring is season-based; cards alter the scoreboard, not the award per ball.
for(const [origin,expected] of [[220,30],[240,30],[241,20],[700,20]]){
 const s=live();s.x=origin;s.rival.suspended=10000;s.ball={x:origin+50,y:525,vx:0,vy:0}
 advanceCampaign(s,{...neutral,shoot:true});assert.equal(s.shotX,origin)
 s.x=500;s.suspended=10000
 for(let i=0;i<500&&s.phase==='play';i++)advanceCampaign(s,neutral)
 assert.equal(s.points,expected,'kick origin '+origin)
 assert.equal(s.longGoals,expected===30?1:0);assert.equal(s.normalGoals,expected===20?1:0)
}
for(const [goals,against,bonus] of [[3,0,120],[4,1,100],[2,0,20],[2,1,0],[1,3,0]]){
 const s=live();s.points=60;s.peak=60;s.goals=goals;s.against=against;s.matchTick=MATCH_TICKS-1
 advanceCampaign(s,neutral);assert.equal(s.points,60+bonus)
 for(let i=0;i<10;i++)advanceCampaign(s,neutral);assert.equal(s.points,60+bonus,'no duplicate bonus')
 if(goals<against){assert.equal(s.outcome,'lose');assert.equal(s.peak,60)}
}
{const s=live();s.globalDouble=100;s.shotOwner=0;s.shotX=220;s.ball={x:893,y:480,vx:600,vy:0};advanceCampaign(s,neutral);assert.equal(s.goals,2);assert.equal(s.points,30)}
{const s=live();s.shotOwner=1;s.shotX=200;s.ball={x:893,y:480,vx:600,vy:0};advanceCampaign(s,neutral);assert.equal(s.points,20);assert.equal(s.longGoals,0)}
{const s=live();s.points=60;s.goals=3;s.stage=4;s.matchTick=MATCH_TICKS-1;advanceCampaign(s,neutral);assert.equal(s.points,180);assert.equal(s.outcome,'win');assert.equal(createCampaign(1,'podpah').points,0)}
{const s=live();s.tie=true;s.tiePlayer=1;s.tieRival=0;s.tieRound=5;s.setTicks=1;s.phase='setpiece';s.setOwner=1;s.ball={x:480,y:280,vx:0,vy:0};advanceCampaign(s,neutral);assert.equal(s.cleanSheets,1);assert.equal(s.points,20)}
assert.equal(MATCH_TICKS,120*120)
for(const tick of [2400,4800,7200,9000,10800]){const s=live();s.matchTick=tick-1;s.rival.cardUsed=true;s.rival.suspended=1000;advanceCampaign(s,neutral);assert.equal(s.matchTick,tick);if(tick===4800)assert.equal(s.globalDouble,1799);if(tick===7200)assert.ok(s.chaos===1||s.chaos===2);if(tick===9000){assert.equal(s.chaos,0);assert.equal(s.cardUsed,false)}if(tick===10800)assert.equal(s.globalDouble,3599)}
// A stationary ball on either roof must return to the playable court.
for(const x of [25,60,79,80,880,881,900,935]){const s=live();s.ball={x,y:366,vx:0,vy:0};s.suspended=1000;s.rival.suspended=1000;for(let i=0;i<240;i++)advanceCampaign(s,neutral);assert.ok(s.ball.x>98&&s.ball.x<862,'roof escape '+x);assert.equal(s.goals+s.against,0)}
const cases=[],expected=[]
for(let seed=1;seed<=10;seed++){
 const team=['podpah','capim','dendele','furia','loud','g3x','dibrados','nyvelados','fluxo','desimpain'][seed-1],s=createCampaign(seed,team),inputs=[];let last=''
 while(!s.ended&&s.clockTick<45000){const input={...neutral,target:Math.round(Math.max(112,Math.min(848,s.ball.x-42))),jump:s.tick%170<5,shoot:s.tick%70<8,special:s.tick%1300<4,card:s.tick%1500<4};const serial=JSON.stringify(input);if(serial!==last){inputs.push({tick:s.clockTick,...input});last=serial}advanceCampaign(s,input)}
 cases.push({seed,team,inputs,tick:s.clockTick});expected.push(campaignResult(s));assert.equal(s.points,s.normalGoals*20+s.longGoals*30+s.blowouts*100+s.cleanSheets*20)
 console.log('simulation',seed,s.goals,s.against,s.stage,s.totalGoals,s.outcome)
}
for(const seed of [2,7]){
 const s=createCampaign(seed,'podpah'),inputs=[];let last=''
 while(!s.ended&&s.clockTick<190000){const input={...neutral,target:Math.round(Math.max(112,Math.min(848,s.ball.x-70))),shoot:true,jump:s.ball.y<460&&s.ball.vy>0&&Math.abs(s.ball.x-s.x)<85,special:s.tick%1300<4,card:s.tick%1500<5};const serial=JSON.stringify(input);if(serial!==last){inputs.push({tick:s.clockTick,...input});last=serial}advanceCampaign(s,input)}
 assert.equal(s.outcome,'win');assert.equal(s.defeated,5);assert.ok(s.tick>=MATCH_TICKS*5)
 cases.push({seed,team:'podpah',inputs,tick:s.clockTick});expected.push(campaignResult(s));assert.equal(s.points,s.normalGoals*20+s.longGoals*30+s.blowouts*100+s.cleanSheets*20)
}
const php=spawnSync('php',['-d','memory_limit=512M','server/football-replay-cli.php'],{input:JSON.stringify(cases),encoding:'utf8',maxBuffer:10*1024*1024});assert.equal(php.status,0,php.stderr+' '+php.stdout.slice(0,1000));assert.equal(php.stderr,'');assert.deepEqual(JSON.parse(php.stdout),expected)
console.log('PASS goal crossing, no duplicate goals, double, all cards, 2-minute match, shootout and 12 full JS/PHP replays including two 5-match championships')

