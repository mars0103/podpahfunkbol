import { useEffect, useRef, useState } from 'react'
import { gameAudio } from './gameAudio'
import { STEP } from './juggleEngine'
import { createCampaign, advanceCampaign, campaignResult, CARDS, MATCH_TICKS, STAGES } from './footballEngine'
import { rivalLine } from './rivalLines'
import { SPECIALS } from './campaignRules'
import { GAME_TEAMS } from '../../data/gameTeams'
import { campaignCheckpoint, campaignAbandon, campaignPosition, campaignLeaderboard, campaignTeamLeaderboard } from '../../lib/campaignApi'
import courtUrl from '../../assets/game/football-court.png'
import goalFront from '../../assets/game/goal-front.png'
import goalBack from '../../assets/game/goal-back.png'
import ballUrl from '../../assets/game/ball.png'
import logo from '../../assets/game/logo-game.png'
import logo99 from '../../assets/logosparceiros/99.svg'
import logoPhilips from '../../assets/logosparceiros/philips.webp'
import logoAlpha from '../../assets/logosparceiros/alphaconsorcio.png'

const COURT_PARTNERS = [
  {id:'partner99',url:logo99,bg:'#303030',color:'#ffdf35',text:'QUEM CORRE JUNTO SOMA',width:28},
  {id:'partnerPhilips',url:logoPhilips,bg:'#0b5ed7',color:'#ffffff',text:'TECNOLOGIA QUE JOGA JUNTO',width:76},
  {id:'partnerAlpha',url:logoAlpha,bg:'#0a1a3f',color:'#f2cf70',text:'ALPHA CONSÓRCIO · SEU PRÓXIMO SONHO',width:28},
]
function drawPartnerBoard(ctx,assets,tick,reduced){
  ctx.save();ctx.beginPath();ctx.rect(180,375,600,44);ctx.clip()
  ctx.font='21px "Funkbol Pixel"';ctx.textAlign='left';ctx.textBaseline='middle'
  const widths=COURT_PARTNERS.map(p=>p.width+ctx.measureText(p.text).width+62)
  const total=widths.reduce((a,b)=>a+b,0),travel=reduced?0:(tick/120*30)%total
  let x=180-travel
  for(let i=0;i<COURT_PARTNERS.length*2;i++){
    const index=i%COURT_PARTNERS.length,p=COURT_PARTNERS[index],img=assets[p.id],start=x+24
    ctx.fillStyle=p.bg;ctx.fillRect(x,375,widths[index]+1,44)
    if(img?.naturalWidth){
      if(p.id==='partnerPhilips'){ctx.fillStyle='#fff';ctx.fillRect(start-4,387,p.width+8,20)}
      const h=Math.min(34,p.width*img.naturalHeight/img.naturalWidth),w=h*img.naturalWidth/img.naturalHeight
      ctx.drawImage(img,start+(p.width-w)/2,397-h/2,w,h)
    }
    ctx.fillStyle=p.color;ctx.fillText(p.text,start+p.width+14,398)
    x+=widths[index]
  }
  ctx.restore()
}

function mascot(ctx, img, team, x, jump, direction, tick, moving, impact, reduced) {
  if (!img?.naturalWidth) return
  const size = 122 / (team.foot - team.crown)
  const bob = !reduced && moving && !jump ? Math.floor(tick / 12) % 2 * 2 : 0
  ctx.fillStyle = '#0008'; ctx.fillRect(x - 34, 555, 68, 7)
  ctx.save(); ctx.translate(Math.round(x), Math.round(560 - jump + bob)); ctx.scale(direction, !reduced && impact ? .97 : 1)
  ctx.drawImage(img, Math.round(-team.headX * size), Math.round(-team.foot * size), Math.round(img.naturalWidth * size), Math.round(img.naturalHeight * size)); ctx.restore()
}
function powerEffect(ctx, actor, color) {
  const y = 490 - actor.jump
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 4
  if (actor.shield) { ctx.strokeRect(actor.x-48,y-70,96,138); ctx.strokeStyle='#FFFFFF'; ctx.strokeRect(actor.x-42,y-64,84,126) }
  if (actor.slow) { ctx.strokeStyle='#F5BA00'; for(let i=0;i<3;i++)ctx.strokeRect(actor.x-40,y+20+i*13,80,7) }
  if (actor.fx) { const radius=45+Math.floor((120-actor.fx)/8)*5;ctx.globalAlpha=actor.fx/120;ctx.strokeRect(actor.x-radius,y-radius,radius*2,radius*2) }
  if (actor.dash||actor.boost||Math.abs(actor.push)>80) {
    ctx.globalAlpha=.8;ctx.fillStyle=color
    for(let i=0;i<3;i++)ctx.fillRect(actor.x-65-i*12,y-20+i*24,20,5)
  }
  ctx.restore()
}
function drawGoals(ctx, assets, front) {
  const img=front?assets.goalFront:assets.goalBack
  if(!img?.naturalWidth)return
  for(const side of [0,1]){ctx.save();if(side){ctx.translate(960,0);ctx.scale(-1,1)}
    if(front)ctx.drawImage(img,0,330,86,240)
    else ctx.drawImage(img,65,350,22,174)
    ctx.restore()
  }
}
function render(ctx, s, team, assets, camera, size, particles, reduced) {
  const { width, height, dpr } = size
  ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)
  const scale = Math.min(width / 1000, height / 650)
  const visible = width / scale
  const left = (960-visible)/2
  camera.current = { left, scale }
  ctx.setTransform(dpr*scale,0,0,dpr*scale,-left*scale*dpr,(height*.77-560*scale)*dpr)
  ctx.imageSmoothingEnabled=false
  drawPartnerBoard(ctx,assets,s.clockTick,reduced)
  drawGoals(ctx,assets,false)
  if (s.stage>=0) {
    const rivalTeam=GAME_TEAMS.find(t=>t.id===s.order[s.stage])
    ctx.globalAlpha=s.rival.suspended?.18:1
    mascot(ctx,assets[rivalTeam.id],rivalTeam,s.rival.x,s.rival.jump,s.rival.direction,s.tick,Math.abs(s.rival.vx)>30,s.tick-s.rival.lastHit<12,reduced)
    ctx.globalAlpha=1
    powerEffect(ctx,s.rival,'#E91176')
    if(s.rival.specialWarning) {ctx.fillStyle='#F5BA00';ctx.font='bold 22px "Funkbol Pixel"';ctx.textAlign='center';ctx.fillText(SPECIALS[rivalTeam.id].name,s.rival.x,380)}
    if(s.rival.warning) { ctx.fillStyle='#F5BA00';ctx.font='bold 40px "Funkbol Pixel"';ctx.textAlign='center';ctx.fillText('!',s.rival.x,408) }
    if(s.rival.charging) { ctx.fillStyle='#E9117680';ctx.fillRect(s.rival.x-40,565,80,4) }
  }
  ctx.globalAlpha=s.suspended?.18:1
  mascot(ctx,assets[team.id],team,s.x,s.jump,s.vx < -30 ? -1:1,s.tick,Math.abs(s.vx)>30,s.tick-s.lastHit<12,reduced)
  ctx.globalAlpha=1
  powerEffect(ctx,s,'#F5BA00')
  if(assets.ball?.naturalWidth) {ctx.save();ctx.translate(Math.round(s.ball.x),Math.round(s.ball.y));ctx.rotate(Math.floor(s.tick/10)*Math.PI/2);ctx.drawImage(assets.ball,-14,-14,28,28);ctx.restore()}
  drawGoals(ctx,assets,true)
  if(!reduced) particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(Math.round(p.x),Math.round(p.y),5,5)})
  ctx.globalAlpha=1
}
const MATCH_OPENINGS = {
  1200: {time:'0:10',title:'CARTAS LIBERADAS',icon:'Q',text:'Sua carta secreta está pronta. Use Q ou toque na carta para virar o jogo.'},
  2400: {time:'0:20',title:'GOL EM DOBRO',icon:'×2',text:'Agora vale dois! Os gols dos dois times valem o dobro por 7,5 segundos.'},
  3600: {time:'0:30',title:'SURPRESA NA QUADRA',icon:'?',text:''},
  4500: {time:'0:37',title:'NOVA CARTA',icon:'Q',text:'Uma nova carta secreta chegou. Mais uma chance de mudar a partida!'},
  5400: {time:'0:45',title:'RETA FINAL',icon:'×2',text:'É tudo ou nada! Todos os gols valem o dobro até o apito final.'},
}
export default function FootballArena({team,session,nickname,userId,suspended=false,onEnd,onExit}) {
  const canvas=useRef(), camera=useRef({left:0,scale:1}), controls=useRef({left:false,right:false,jump:false,special:false,shoot:false,card:false,target:null})
  const suspendedRef=useRef(suspended); suspendedRef.current=suspended
  const pauseRef=useRef(false), callbacks=useRef({onEnd}); callbacks.current={onEnd}
  const [paused,setPaused]=useState(false), [assetState,setAssetState]=useState('loading'), [attempt,setAttempt]=useState(0)
  const [hud,setHud]=useState({points:0,score:0,stage:0,goals:0,against:0,phase:'intro',intro:360,time:0,specialCooldown:0,shield:0,slow:0,boost:0,notice:'',noticeUntil:0,tick:0,card:null,cardUsed:false,globalDouble:0,double:0,suspended:0,rivalSuspended:0,setPiece:null,setTicks:0,setOwner:0,tie:false,tiePlayer:0,tieRival:0,tieRound:0})
  const [feedback,setFeedback]=useState('MARQUE MAIS GOLS!'), [rank,setRank]=useState(session.rank), [best,setBest]=useState(session.best)
  const [rankMode,setRankMode]=useState('players'),[teamLeaders,setTeamLeaders]=useState([])
  const [taunt,setTaunt]=useState(null)
  const openingRef=useRef(null), [opening,setOpening]=useState(null)
  const [sync,setSync]=useState('online'), [leaders,setLeaders]=useState([]), [rankingLoaded,setRankingLoaded]=useState(false)
  useEffect(()=>{
    if(opening||paused||suspended||assetState!=='ready'||!['play','setpiece'].includes(hud.phase)){if(paused||suspended)gameAudio.stop();return}
    let beat=0
    const timer=setInterval(()=>gameAudio.crowd(beat++),600)
    return()=>clearInterval(timer)
  },[opening,paused,suspended,assetState,hud.phase])
  function pause(value) {pauseRef.current=value;setPaused(value);controls.current={left:false,right:false,jump:false,special:false,shoot:false,card:false,target:null}}
  useEffect(()=>{if(suspended)pause(true)},[suspended])
  useEffect(()=>{
    const s=createCampaign(session.seed,team.id), inputs=[], assets={}, particles=[]
    openingRef.current=null;setOpening(null)
    const shownOpenings=new Set()
    let nextTaunt=900,tauntUntil=0,tauntIndex=0
    let raf,last=0,accumulator=0,disposed=false,ready=false,finished=false,endingTime=0,previous='',inFlight=null,lastSync=0
    const ctx=canvas.current.getContext('2d'), size={width:1,height:1,dpr:1}
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches
    const resize=()=>{const r=canvas.current.getBoundingClientRect();size.width=r.width;size.height=r.height;size.dpr=Math.min(devicePixelRatio||1,2);canvas.current.width=Math.round(r.width*size.dpr);canvas.current.height=Math.round(r.height*size.dpr)}
    const observer=new ResizeObserver(resize);observer.observe(canvas.current);resize()
    const load=(id,url)=>new Promise((resolve,reject)=>{const img=new Image();assets[id]=img;img.onload=resolve;img.onerror=reject;img.src=url})
    setAssetState('loading')
    Promise.all([...GAME_TEAMS.map(t=>load(t.id,t.mascot)),load('ball',ballUrl),load('goalFront',goalFront),load('goalBack',goalBack),...COURT_PARTNERS.map(p=>load(p.id,p.url))]).then(()=>{if(!disposed){ready=true;setAssetState('ready')}}).catch(()=>{if(!disposed)setAssetState('error')})
    function snapshot(){return {id:session.id,tick:s.clockTick,inputs:inputs.map(e=>({...e}))}}
    let leaderboardPending=false
    async function refreshLeaderboard(){
      if(leaderboardPending)return
      leaderboardPending=true
      try {const [rows,teams]=await Promise.all([campaignLeaderboard(),campaignTeamLeaderboard()]);if(!disposed){setLeaders(rows);setTeamLeaders(teams);setRankingLoaded(true)}}
      catch {if(!disposed)setSync('offline')}
      finally {leaderboardPending=false}
    }
    refreshLeaderboard()
    function updateRank(data){if(disposed)return;setRank(data.rank);setBest(data.best);setSync('online');refreshLeaderboard()}
    function checkpoint(now){
      if(inFlight||s.clockTick<1||now-lastSync<5000)return
      lastSync=now;inFlight=campaignCheckpoint(snapshot()).then(updateRank).catch(()=>{if(!disposed)setSync('offline')}).finally(()=>{inFlight=null})
    }
    function frame(now){
      const dt=last?Math.min((now-last)/1000,.05):0;last=now
      if(openingRef.current&&!pauseRef.current&&!suspendedRef.current){
        openingRef.current.remaining-=dt
        if(openingRef.current.remaining<=0){openingRef.current=null;setOpening(null);accumulator=0;gameAudio.play('card-ready')}
      }
      if(ready&&!pauseRef.current&&!suspendedRef.current&&!openingRef.current){
        if(!s.ended){
          accumulator+=dt
          while(accumulator>=STEP&&!s.ended){
            const input={...controls.current}, serialized=JSON.stringify(input)
            if(serialized!==previous){inputs.push({tick:s.clockTick,...input});previous=serialized}
            const event=advanceCampaign(s,input);accumulator-=STEP
            if(event)gameAudio.play(event==='end'?s.outcome:event,event==='rival-special'?s.order[s.stage]:team.id)
            if(s.phase==='play'&&s.tick>=nextTaunt){setTaunt({text:rivalLine(s.order[s.stage],'idle',tauntIndex++ + session.seed),team:s.order[s.stage]});tauntUntil=s.tick+300;nextTaunt=s.tick+1800}
            if(event==='next'){setTaunt(null);nextTaunt=s.tick}
            if(tauntUntil&&s.tick>=tauntUntil){setTaunt(null);tauntUntil=0}
            particles.forEach(p=>{p.x+=p.vx*STEP;p.y+=p.vy*STEP;p.life-=STEP*2});while(particles[0]?.life<=0)particles.shift()
            if(event==='goal'||event==='rival-goal'){
              setFeedback(event==='goal'?(s.tie?'CONVERTEU!':s.lastGoalPoints===30?'GOLAÇO DE LONGE! +30':'GOOOL! +20'):'GOL DO RIVAL')
              for(let i=0;i<24;i++)particles.push({x:s.ball.x,y:s.ball.y,vx:(i%8-4)*40,vy:-80-i*4,life:1,color:i%2?'#F5BA00':'#E91176'})
            }
            if(s.clockTick%12===0||event)setHud({points:s.points,matchBonus:s.matchBonus,score:s.totalGoals,stage:s.stage,goals:s.goals,against:s.against,phase:s.phase,intro:s.intro,time:Math.floor(s.matchTick/120),specialCooldown:s.specialCooldown,shield:s.shield,slow:s.slow,boost:s.boost,notice:s.notice,noticeUntil:s.noticeUntil,tick:s.tick,card:s.card,cardUsed:s.cardUsed,globalDouble:s.globalDouble,double:s.double,suspended:s.suspended,rivalSuspended:s.rival.suspended,setPiece:s.setPiece,setTicks:s.setTicks,setOwner:s.setOwner,tie:s.tie,tiePlayer:s.tiePlayer,tieRival:s.tieRival,tieRound:s.tieRound})
            const openingKey=s.stage+':'+s.matchTick, announcement=MATCH_OPENINGS[s.matchTick]
            if(announcement&&!s.tie&&!shownOpenings.has(openingKey)){
              shownOpenings.add(openingKey)
              const next={...announcement,key:openingKey,text:s.matchTick===3600?(s.chaos===1?'BOLA LEVE! A gravidade diminuiu. Domine a bola pelos próximos 7,5 segundos.':'TURBO! Os dois jogadores ficam mais rápidos por 7,5 segundos.'):announcement.text,remaining:4}
              openingRef.current=next;setOpening(next);setTaunt(null);accumulator=0
              controls.current={left:false,right:false,jump:false,special:false,shoot:false,card:false,target:null}
              gameAudio.play('surprise');break
            }
          }
          if(!s.ended)checkpoint(now)
        } else {
          endingTime+=dt
          if(endingTime>.8&&!finished){finished=true;const payload=snapshot();Promise.resolve(inFlight).then(()=>{if(!disposed)callbacks.current.onEnd(campaignResult(s),payload)})}
        }
      }
      render(ctx,s,team,assets,camera,size,particles,reduced);raf=requestAnimationFrame(frame)
    }
    function key(e,down){
      if(e.target.closest?.('input,textarea,select,[contenteditable="true"],.cp-chat'))return
      const k=e.key.toLowerCase()
      if(down&&!e.repeat&&(k==='escape'||k==='p')){pause(!pauseRef.current);return}
      if(openingRef.current||pauseRef.current||suspendedRef.current)return
      if(['arrowleft','a','arrowright','d',' ','w','arrowup','e','j','q'].includes(k)){
        e.preventDefault()
        if(k==='arrowleft'||k==='a'){controls.current.left=down;controls.current.target=null}
        else if(k==='arrowright'||k==='d'){controls.current.right=down;controls.current.target=null}
        else if(k==='e') controls.current.special=down
        else if(k==='j') controls.current.shoot=down
        else if(k==='q') controls.current.card=down
        else controls.current.jump=down
      }
    }
    const down=e=>key(e,true),up=e=>key(e,false),blur=()=>pause(true),visibility=()=>{if(document.hidden)pause(true)}
    const unload=()=>{if(!s.ended)campaignAbandon(session.id).catch(()=>{})}
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',unload)
    const positionTimer=setInterval(()=>{if(pauseRef.current)campaignPosition().then(updateRank).catch(()=>{})},10000)
    raf=requestAnimationFrame(frame)
    return()=>{disposed=true;cancelAnimationFrame(raf);observer.disconnect();clearInterval(positionTimer);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',unload)}
  },[session,team,attempt])
  function point(e){
    if(openingRef.current||pauseRef.current||suspendedRef.current||e.pointerType==='touch'||(e.type==='pointermove'&&!e.currentTarget.hasPointerCapture(e.pointerId)))return
    if(e.type==='pointerdown')e.currentTarget.setPointerCapture(e.pointerId)
    const r=e.currentTarget.getBoundingClientRect();controls.current.target=Math.round(Math.max(38,Math.min(922,(e.clientX-r.left)/camera.current.scale+camera.current.left)))
  }
  function buttonControl(action) {
    return {
      onPointerDown: e => {e.preventDefault();if(openingRef.current||pauseRef.current||suspendedRef.current)return;e.currentTarget.setPointerCapture(e.pointerId);controls.current[action]=true;if(action==='left'||action==='right')controls.current.target=null},
      onPointerUp: () => {controls.current[action]=false},
      onPointerCancel: () => {controls.current[action]=false},
      onLostPointerCapture: () => {controls.current[action]=false},
      onContextMenu: e => e.preventDefault(),
    }
  }
  const opponent=hud.stage>=0?GAME_TEAMS.find(t=>t.id===session.order[hud.stage]):null
  const visibleLeaders=leaders.slice(0,3).map((row,i)=>({...row,position:i+1}))
  const ownIndex=leaders.findIndex(row=>row.id===userId)
  if(ownIndex>=3)visibleLeaders.push({...leaders[ownIndex],position:ownIndex+1})
  if(ownIndex<0&&rank)visibleLeaders.push({id:userId,name:nickname,position:rank,points:best,score:null,team:null})
  return <section className="cp-arena fp-arena" style={{'--court-image':`url(${courtUrl})`}} data-phase={hud.phase}>
    <canvas ref={canvas} onPointerDown={point} onPointerMove={point} data-phase={hud.phase} data-stage={hud.stage} aria-label="Quadra de futebol. Setas ou A e D movem, espaço pula e cabeceia, J chuta, E usa o especial, Q usa a carta." />
    <details key={hud.stage} className="cp-mini-ranking" aria-label="Ranking ao vivo" onKeyDown={e=>e.stopPropagation()}>
      <summary className="cp-ranking-toggle">RANKING <span aria-hidden="true">?</span></summary>
      <div className="cp-mini-tabs" role="group" aria-label="Ranking ao vivo"><button aria-pressed={rankMode==='players'} onClick={()=>setRankMode('players')}>JOGADORES</button><button aria-pressed={rankMode==='teams'} onClick={()=>setRankMode('teams')}>TIMES</button></div>
      {rankMode==='teams'?<div className="cp-mini-team-scroll" tabIndex={0} aria-label="Tabela de times" onKeyDown={e=>e.stopPropagation()}><table><caption>FORÇA DAS TORCIDAS</caption><colgroup><col className="cp-mini-pos"/><col/><col className="cp-mini-heads"/><col className="cp-mini-best"/></colgroup><thead><tr><th>POS.</th><th>TIME</th><th aria-label="Jogadores">JOG.</th><th>PONTOS</th></tr></thead><tbody>{teamLeaders.map((r,i)=>{const t=GAME_TEAMS.find(t=>t.id===r.team);return <tr key={r.team} className={r.team===team.id?'cp-mini-own':''}><td>{i+1}</td><td><div className="cp-mini-player"><img src={t?.crest} alt=""/><strong title={t?.name}>{t?.short}</strong></div></td><td>{r.players}</td><td>{r.points}</td></tr>})}</tbody></table></div>:<table><caption>RANKING AO VIVO</caption><colgroup><col className="cp-mini-pos"/><col/><col className="cp-mini-heads"/><col className="cp-mini-best"/></colgroup><thead><tr><th scope="col">POS.</th><th scope="col">JOGADOR / TIME</th><th scope="col" aria-label="Gols"><span className="cp-mini-long">GOLS</span><span className="cp-mini-short">GOLS</span></th><th scope="col">RECORDE</th></tr></thead><tbody>
      {visibleLeaders.map(row=>{const club=GAME_TEAMS.find(t=>t.id===row.team);return <tr key={row.id} className={row.id===userId?'cp-mini-own':''} aria-current={row.id===userId?'true':undefined}><td>{row.position}</td><td><div className="cp-mini-player">{club&&<img src={club.crest} alt=""/>}<div><strong title={row.name}>{row.name}</strong><small>{club?.name||'Seu recorde'}</small></div></div></td><td>{row.score??'—'}</td><td>{row.points}</td></tr>})}
      {!visibleLeaders.length&&<tr><td colSpan={4} className="cp-mini-empty">{rankingLoaded?'Marque pontos para entrar!':sync==='offline'?'Ranking indisponível':'Carregando…'}</td></tr>}
      </tbody></table>}<small className="cp-mini-status">{sync==='offline'?'Reconectando…':rankMode==='teams'?'Melhores resultados de cada torcida':!rank?'Seu lugar está esperando!':'Atualiza a cada 5s'}</small>
    </details>
    <div className="fp-scoreboard"><img src={team.crest} alt={team.name}/><strong>{hud.goals}</strong><div><b className="fp-clock" aria-label="Tempo restante">{hud.tie?'SHOOTOUTS':`${Math.floor(Math.max(0,MATCH_TICKS/120-hud.time)/60)}:${String(Math.max(0,MATCH_TICKS/120-hud.time)%60).padStart(2,'0')}`}</b><small>PARTIDA {hud.stage+1} / {STAGES}</small></div><strong>{hud.against}</strong>{opponent&&<img src={opponent.crest} alt={opponent.name}/>}</div>
    <button className="fb-secondary cp-pause-button" onClick={()=>pause(true)} aria-label="Pausar jogo">Ⅱ</button>
    <div className="fp-match-status">{hud.tie?`SHOOTOUTS: VOCÊ ${hud.tiePlayer} × ${hud.tieRival} RIVAL`:hud.globalDouble?'GOL X2 PARA OS DOIS':hud.double?'SEUS GOLS VALEM X2':`${hud.points} PONTOS NA CAMPANHA`}{hud.setPiece&&<b>{hud.setOwner===0?'SUA COBRANÇA':'DEFENDA SEU GOL'} · {Math.ceil(hud.setTicks/120)}s</b>}{hud.suspended>0&&<b>SUSPENSO · {Math.ceil(hud.suspended/120)}s</b>}{hud.rivalSuspended>0&&<b>RIVAL SUSPENSO · {Math.ceil(hud.rivalSuspended/120)}s</b>}</div>
    {!opening&&hud.noticeUntil>hud.tick&&hud.phase!=='intro'&&hud.phase!=='goal'&&<p className="fp-notice" role="status">{hud.notice}</p>}
    {hud.phase==='goal'&&<div className="fp-goal" aria-live="polite">{feedback}<small>{hud.goals} × {hud.against}</small></div>}
    {taunt&&hud.phase==='play'&&<div className="cp-rival-talk"><img src={GAME_TEAMS.find(t=>t.id===taunt.team)?.crest} alt=""/><p><strong>{GAME_TEAMS.find(t=>t.id===taunt.team)?.short}</strong>{taunt.text}</p></div>}
    <div className="cp-field-controls">
      <div className="fp-abilities"><button className="fb-secondary cp-special-button" aria-label={'Especial '+SPECIALS[team.id].name} aria-disabled={hud.specialCooldown>0} {...buttonControl('special')}><small>ESPECIAL · E</small><strong>{SPECIALS[team.id].name}</strong><span>{hud.specialCooldown ? Math.ceil(hud.specialCooldown/120)+'s' : 'PRONTO'}</span></button><button className="fp-card" aria-label={hud.card?'Usar carta '+CARDS[hud.card].name:'Carta secreta'} title={hud.card?CARDS[hud.card].description:''} aria-description={hud.card?CARDS[hud.card].description:''} aria-disabled={hud.cardUsed||hud.time<10||hud.suspended>0||hud.phase!=='play'} {...buttonControl('card')}><small>CARTA · Q</small><strong>{hud.card?CARDS[hud.card].name:'SORTEANDO'}</strong><span>{hud.cardUsed?'USADA':hud.time<10?'LIBERA EM '+(10-hud.time)+'s':'USAR CARTA'}</span></button></div>
      <p>A/D: mover · ESPAÇO: pular · J: chute · E: especial · Q: carta</p>
      <div className="cp-movement"><button className="fb-primary cp-arrow" aria-label="Andar para a esquerda" {...buttonControl('left')}>←</button><button className="fb-primary cp-arrow" aria-label="Andar para a direita" {...buttonControl('right')}>→</button><button className="fb-primary cp-head" aria-label="Pular e cabecear" {...buttonControl('jump')}>PULAR ↑</button><button className="fb-primary fp-shoot" aria-label="Chutar" {...buttonControl('shoot')}>CHUTAR</button></div>
    </div>
    {hud.phase==='play'&&<div className="cp-effects">{hud.shield>0?'BLINDAGEM ATIVA':hud.slow>0?'LAÇADO! MOVIMENTO LENTO':hud.boost>0?'ARRANCADA ATIVA':''}</div>}
    {assetState!=='ready'&&<div className="cp-match-overlay"><h2>{assetState==='error'?'Não foi possível carregar os mascotes.':'CARREGANDO A QUADRA…'}</h2>{assetState==='error'&&<button className="fb-primary" onClick={()=>setAttempt(v=>v+1)}>Tentar novamente</button>}</div>}
    {assetState==='ready'&&hud.phase==='intro'&&!paused&&<div className={`cp-versus ${hud.stage===STAGES-1?'boss':''}`} key={hud.stage}><img className="cp-versus-logo" src={logo} alt=""/>
      <div className="cp-versus-player"><img className="cp-versus-crest" src={team.crest} alt=""/><img className="cp-versus-mascot" src={team.mascot} alt=""/><strong>{nickname}</strong></div>
      <div className="cp-versus-title"><span>{opponent?(hud.stage===STAGES-1?'O CHEFÃO ESTÁ CHEGANDO':'ADVERSÁRIO CHEGANDO'):'PREPARA O CHUTE'}</span><h2>{opponent?'JOGO '+String(hud.stage+1).padStart(2,'0'):'ROUND 01'}</h2><b>{Math.ceil(hud.intro/120)}</b><p>{opponent?hud.stage>0?`+${hud.matchBonus||0} pontos de bônus na última vitória. A pontuação da temporada continua!`:'Defenda à esquerda. Gol: 20; da própria área: 30. Goleada: +100; vitória sem sofrer gol: +20.':'Prepare seu chute para o primeiro rival.'}</p></div>
      <div className="cp-versus-opponent">{opponent?<><img className="cp-versus-crest" src={opponent.crest} alt=""/><img className="cp-versus-mascot" src={opponent.mascot} alt=""/><strong>{opponent.name}</strong><small>{SPECIALS[opponent.id].name}</small><small>DIFICULDADE {'■'.repeat(hud.stage+1)}</small></>:<><img className="cp-versus-mascot" src={team.mascot} alt=""/><strong>DOMINE A BOLA</strong></>}</div>
    </div>}
    {opening&&<div className="fp-opening" role="status" aria-live="assertive" key={opening.key} style={{animationPlayState:paused||suspended?'paused':'running'}}>
      <div className="fp-opening-stripe" aria-hidden="true"/>
      <div className="fp-opening-content">
        <span className="fp-opening-label">CHECKPOINT · PARTIDA {hud.stage+1}</span>
        <time>{opening.time}</time><div className="fp-opening-icon" aria-hidden="true">{opening.icon}</div>
        <h2>{opening.title}</h2><p>{opening.text}</p>
        <small>BOLA PARADA · PREPARE-SE PARA VOLTAR</small>
        <div className="fp-opening-progress" aria-hidden="true"><i style={{animationPlayState:paused||suspended?'paused':'running'}}/></div>
      </div>
    </div>}
    {paused&&<div className="cp-match-overlay" role="dialog" aria-modal="true" aria-label="Jogo pausado" onKeyDown={e=>{if(e.key==='Tab'){const b=e.currentTarget.querySelectorAll('button');if(e.shiftKey&&document.activeElement===b[0]){e.preventDefault();b[1].focus()}else if(!e.shiftKey&&document.activeElement===b[1]){e.preventDefault();b[0].focus()}}}}><span className="fb-eyebrow">A BOLA ESPERA POR VOCÊ</span><h2>JOGO PAUSADO</h2><button autoFocus className="fb-primary" onClick={()=>pause(false)}>CONTINUAR ↗</button><button className="fb-text-button" onClick={onExit}>Sair da tentativa</button><small>Seu recorde salvo é preservado.</small></div>}
  </section>
}
