import { useEffect, useRef, useState } from 'react'
import { gameAudio } from './gameAudio'
import { STEP } from './juggleEngine'
import { createCampaign, advanceCampaign, campaignResult } from './campaignEngine'
import { rivalLine } from './rivalLines'
import { STAGE_GOALS, SPECIALS } from './campaignRules'
import { GAME_TEAMS } from '../../data/gameTeams'
import { campaignCheckpoint, campaignAbandon, campaignPosition, campaignLeaderboard, campaignTeamLeaderboard } from '../../lib/campaignApi'
import ballUrl from '../../assets/game/ball.png'
import logo from '../../assets/game/logo-game.png'

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
function render(ctx, s, team, assets, camera, size, particles, reduced) {
  const { width, height, dpr } = size
  ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)
  const scale = Math.min(Math.max(width / 960, Math.min(height / 760, width / 500)), height / 650)
  const visible = width / scale
  const left = visible >= 960 ? (960-visible)/2 : Math.max(0, Math.min(960-visible, (s.x+s.ball.x)/2-visible/2))
  camera.current = { left, scale }
  ctx.setTransform(dpr*scale,0,0,dpr*scale,-left*scale*dpr,(height*.87-560*scale)*dpr)
  ctx.imageSmoothingEnabled=false
  if (s.stage>=0) {
    const rivalTeam=GAME_TEAMS.find(t=>t.id===s.order[s.stage])
    mascot(ctx,assets[rivalTeam.id],rivalTeam,s.rival.x,s.rival.jump,s.rival.direction,s.tick,Math.abs(s.rival.vx)>30,s.tick-s.rival.lastHit<12,reduced)
    powerEffect(ctx,s.rival,'#E91176')
    if(s.rival.specialWarning) {ctx.fillStyle='#F5BA00';ctx.font='bold 22px "Funkbol Pixel"';ctx.textAlign='center';ctx.fillText(SPECIALS[rivalTeam.id].name,s.rival.x,380)}
    if(s.rival.warning) { ctx.fillStyle='#F5BA00';ctx.font='bold 40px "Funkbol Pixel"';ctx.textAlign='center';ctx.fillText('!',s.rival.x,408) }
    if(s.rival.charging) { ctx.fillStyle='#E9117680';ctx.fillRect(s.rival.x-40,565,80,4) }
  }
  mascot(ctx,assets[team.id],team,s.x,s.jump,s.vx < -30 ? -1:1,s.tick,Math.abs(s.vx)>30,s.tick-s.lastHit<12,reduced)
  powerEffect(ctx,s,'#F5BA00')
  if(assets.ball?.naturalWidth) {ctx.save();ctx.translate(Math.round(s.ball.x),Math.round(s.ball.y));ctx.rotate(Math.floor(s.tick/10)*Math.PI/2);ctx.drawImage(assets.ball,-20,-20,40,40);ctx.restore()}
  if(!reduced) particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(Math.round(p.x),Math.round(p.y),5,5)})
  ctx.globalAlpha=1
}
export default function JuggleArena({team,session,nickname,userId,suspended=false,onEnd,onExit}) {
  const canvas=useRef(), camera=useRef({left:0,scale:1}), controls=useRef({left:false,right:false,jump:false,special:false,target:null})
  const suspendedRef=useRef(suspended); suspendedRef.current=suspended
  const pauseRef=useRef(false), callbacks=useRef({onEnd}); callbacks.current={onEnd}
  const [paused,setPaused]=useState(false), [assetState,setAssetState]=useState('loading'), [attempt,setAttempt]=useState(0)
  const [hud,setHud]=useState({points:0,score:0,stageScore:0,rivalScore:0,stage:0,stagePoints:0,health:100,rivalHealth:200,rivalMaxHealth:200,hurt:0,rivalHurt:0,stageGoal:STAGE_GOALS[0],specialCooldown:0,slow:0,shield:0,boost:0,phase:'intro',intro:360,defeated:0,time:0})
  const [feedback,setFeedback]=useState('Fique embaixo da bola'), [rank,setRank]=useState(session.rank), [best,setBest]=useState(session.best)
  const [rankMode,setRankMode]=useState('players'),[teamLeaders,setTeamLeaders]=useState([])
  const [taunt,setTaunt]=useState(null)
  const [sync,setSync]=useState('online'), [leaders,setLeaders]=useState([]), [rankingLoaded,setRankingLoaded]=useState(false)
  useEffect(()=>{
    if(paused||suspended||assetState!=='ready'||hud.phase!=='play'){if(paused||suspended)gameAudio.stop();return}
    let beat=0
    const timer=setInterval(()=>gameAudio.crowd(beat++),600)
    return()=>clearInterval(timer)
  },[paused,suspended,assetState,hud.phase])
  function pause(value) {pauseRef.current=value;setPaused(value);controls.current={left:false,right:false,jump:false,special:false,target:null}}
  useEffect(()=>{if(suspended)pause(true)},[suspended])
  useEffect(()=>{
    const s=createCampaign(session.seed,team.id), inputs=[], assets={}, particles=[]
    let nextTaunt=0,tauntUntil=0,tauntIndex=0
    let raf,last=0,accumulator=0,disposed=false,ready=false,finished=false,endingTime=0,previous='',inFlight=null,lastSync=0
    const ctx=canvas.current.getContext('2d'), size={width:1,height:1,dpr:1}
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches
    const resize=()=>{const r=canvas.current.getBoundingClientRect();size.width=r.width;size.height=r.height;size.dpr=Math.min(devicePixelRatio||1,2);canvas.current.width=Math.round(r.width*size.dpr);canvas.current.height=Math.round(r.height*size.dpr)}
    const observer=new ResizeObserver(resize);observer.observe(canvas.current);resize()
    const load=(id,url)=>new Promise((resolve,reject)=>{const img=new Image();assets[id]=img;img.onload=resolve;img.onerror=reject;img.src=url})
    setAssetState('loading')
    Promise.all([...GAME_TEAMS.map(t=>load(t.id,t.mascot)),load('ball',ballUrl)]).then(()=>{if(!disposed){ready=true;setAssetState('ready')}}).catch(()=>{if(!disposed)setAssetState('error')})
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
      if(ready&&!pauseRef.current&&!suspendedRef.current){
        if(!s.ended){
          accumulator+=dt
          while(accumulator>=STEP&&!s.ended){
            const input={...controls.current}, serialized=JSON.stringify(input)
            if(serialized!==previous){inputs.push({tick:s.clockTick,...input});previous=serialized}
            const event=advanceCampaign(s,input);accumulator-=STEP
            if(event)gameAudio.play(event==='end'?s.outcome:event,event==='rival-special'?s.order[s.stage]:team.id)
            if(s.stage>=0&&s.phase==='play'&&s.tick>=nextTaunt&&(event==='ready'||event==='bump'||event==='rival-special'||event==='rival-perfect'||event==='perfect'||s.tick>=nextTaunt+360)){
              const moment=event==='ready'?'entrance':event==='bump'?'bump':event==='rival-special'?'special':event==='perfect'?'perfect':event==='rival-perfect'?'header':'idle'
              setTaunt({text:rivalLine(s.order[s.stage],moment,tauntIndex++ + session.seed),team:s.order[s.stage]})
              tauntUntil=s.tick+360;nextTaunt=s.tick+1200
            }
            if(event==='next'){setTaunt(null);nextTaunt=s.tick}
            if(tauntUntil&&s.tick>=tauntUntil){setTaunt(null);tauntUntil=0}
            particles.forEach(p=>{p.x+=p.vx*STEP;p.y+=p.vy*STEP;p.life-=STEP*2});while(particles[0]?.life<=0)particles.shift()
            if(event==='hit'||event==='perfect'){
              setFeedback(event==='perfect'?'PERFEITA!':'BOA! CONTINUA')
              for(let i=0;i<8;i++)particles.push({x:s.ball.x,y:s.ball.y+15,vx:(i-4)*35,vy:-100+Math.abs(i-4)*15,life:1,color:event==='perfect'?'#F5BA00':'#FFFFFF'})
            }
            if(event==='rival-hit'||event==='rival-perfect'){
              setFeedback('CABEÇADA DO RIVAL!')
              for(let i=0;i<8;i++)particles.push({x:s.ball.x,y:s.ball.y+15,vx:(i-4)*35,vy:-100+Math.abs(i-4)*15,life:1,color:'#E91176'})
            }
            if(event==='ground'){
              setFeedback('QUICOU! A DISPUTA CONTINUA')
              for(let i=0;i<8;i++)particles.push({x:s.ball.x,y:546,vx:(i-4)*45,vy:-130+Math.abs(i-4)*15,life:1,color:'#F5BA00'})
            }
            if(event==='bump')setFeedback('EMPURRÃO! RECUPERA A BOLA')
            if(event==='special')setFeedback(SPECIALS[team.id].name+'!')
            if(event==='rival-special')setFeedback(SPECIALS[s.order[s.stage]].name+' DO RIVAL!')
            if(s.rival.specialWarning)setFeedback('ESPECIAL CHEGANDO: '+SPECIALS[s.order[s.stage]].name)
            if(event==='next')setFeedback('NOVO ADVERSÁRIO')
            if(event==='ready')setFeedback('DISPUTE A BOLA! SÓ CABEÇADA TIRA VIDA')
            if(s.rival.warning&&!s.rival.specialWarning)setFeedback('CUIDADO! PREPARA O PULO')
            if(s.clockTick%12===0||event)setHud({points:s.points,score:s.score,stageScore:s.stageScore,rivalScore:s.rival.score,stage:s.stage,stagePoints:s.stagePoints,health:s.health,rivalHealth:s.rival.health,rivalMaxHealth:s.rival.maxHealth,hurt:s.hurt,rivalHurt:s.rival.hurt,stageGoal:s.stageGoal,specialCooldown:s.specialCooldown,slow:s.slow,shield:s.shield,boost:s.boost,phase:s.phase,intro:s.intro,defeated:s.defeated,time:Math.floor(s.tick/120)})
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
      if(pauseRef.current||suspendedRef.current)return
      if(['arrowleft','a','arrowright','d',' ','w','arrowup','e'].includes(k)){
        e.preventDefault()
        if(k==='arrowleft'||k==='a'){controls.current.left=down;controls.current.target=null}
        else if(k==='arrowright'||k==='d'){controls.current.right=down;controls.current.target=null}
        else if(k==='e') controls.current.special=down
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
    if(pauseRef.current||suspendedRef.current||e.pointerType==='touch'||(e.type==='pointermove'&&!e.currentTarget.hasPointerCapture(e.pointerId)))return
    if(e.type==='pointerdown')e.currentTarget.setPointerCapture(e.pointerId)
    const r=e.currentTarget.getBoundingClientRect();controls.current.target=Math.round(Math.max(38,Math.min(922,(e.clientX-r.left)/camera.current.scale+camera.current.left)))
  }
  function buttonControl(action) {
    return {
      onPointerDown: e => {e.preventDefault();if(pauseRef.current||suspendedRef.current)return;e.currentTarget.setPointerCapture(e.pointerId);controls.current[action]=true;if(action==='left'||action==='right')controls.current.target=null},
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
  return <section className="cp-arena" data-phase={hud.phase}>
    <canvas ref={canvas} onPointerDown={point} onPointerMove={point} data-phase={hud.phase} data-stage={hud.stage} aria-label="Quadra. Setas ou A e D movem, espaço pula. E usa o especial. No celular, use os botões na quadra." />
    <aside className="cp-mini-ranking" aria-label="Ranking ao vivo">
      <div className="cp-mini-tabs" role="group" aria-label="Ranking ao vivo"><button aria-pressed={rankMode==='players'} onClick={()=>setRankMode('players')}>JOGADORES</button><button aria-pressed={rankMode==='teams'} onClick={()=>setRankMode('teams')}>TIMES</button></div>
      {rankMode==='teams'?<div className="cp-mini-team-scroll" tabIndex={0} aria-label="Tabela de times" onKeyDown={e=>e.stopPropagation()}><table><caption>FORÇA DAS TORCIDAS</caption><colgroup><col className="cp-mini-pos"/><col/><col className="cp-mini-heads"/><col className="cp-mini-best"/></colgroup><thead><tr><th>POS.</th><th>TIME</th><th aria-label="Jogadores">JOG.</th><th>PONTOS</th></tr></thead><tbody>{teamLeaders.map((r,i)=>{const t=GAME_TEAMS.find(t=>t.id===r.team);return <tr key={r.team} className={r.team===team.id?'cp-mini-own':''}><td>{i+1}</td><td><div className="cp-mini-player"><img src={t?.crest} alt=""/><strong title={t?.name}>{t?.short}</strong></div></td><td>{r.players}</td><td>{r.points}</td></tr>})}</tbody></table></div>:<table><caption>RANKING AO VIVO</caption><colgroup><col className="cp-mini-pos"/><col/><col className="cp-mini-heads"/><col className="cp-mini-best"/></colgroup><thead><tr><th scope="col">POS.</th><th scope="col">JOGADOR / TIME</th><th scope="col" aria-label="Cabeçadas"><span className="cp-mini-long">CABEÇADAS</span><span className="cp-mini-short">CAB.</span></th><th scope="col">RECORDE</th></tr></thead><tbody>
      {visibleLeaders.map(row=>{const club=GAME_TEAMS.find(t=>t.id===row.team);return <tr key={row.id} className={row.id===userId?'cp-mini-own':''} aria-current={row.id===userId?'true':undefined}><td>{row.position}</td><td><div className="cp-mini-player">{club&&<img src={club.crest} alt=""/>}<div><strong title={row.name}>{row.name}</strong><small>{club?.name||'Seu recorde'}</small></div></div></td><td>{row.score??'—'}</td><td>{row.points}</td></tr>})}
      {!visibleLeaders.length&&<tr><td colSpan={4} className="cp-mini-empty">{rankingLoaded?'Marque pontos para entrar!':sync==='offline'?'Ranking indisponível':'Carregando…'}</td></tr>}
      </tbody></table>}<small className="cp-mini-status">{sync==='offline'?'Reconectando…':rankMode==='teams'?'Melhores resultados de cada torcida':!rank?'Seu lugar está esperando!':'Atualiza a cada 5s'}</small>
    </aside>
    <div className="cp-scoreboard"><img src={team.crest} alt={team.name}/><div><strong>{hud.points}</strong><span>PONTOS · {hud.score} CABEÇADAS</span></div><img src={logo} alt="Podpah Funkbol"/>{opponent&&<img src={opponent.crest} alt={opponent.name}/>}</div>
    <div className="cp-health-hud">
      <div className="cp-health player" data-hit={hud.hurt>0} data-low={hud.health<=25}><label><span>SUA VIDA</span><b>{Math.ceil(hud.health)} / 100</b></label><div role="progressbar" aria-label="Sua vida" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.ceil(hud.health)}><i style={{width:hud.health+'%'}} /></div></div>
      {opponent&&<div className="cp-health enemy" data-hit={hud.rivalHurt>0} data-low={hud.rivalHealth<=hud.rivalMaxHealth*.25}><label><span>{opponent.name}</span><b>{Math.ceil(hud.rivalHealth)} / {hud.rivalMaxHealth}</b></label><div role="progressbar" aria-label="Vida do adversário" aria-valuemin={0} aria-valuemax={hud.rivalMaxHealth} aria-valuenow={Math.ceil(hud.rivalHealth)}><i style={{width:(hud.rivalHealth/hud.rivalMaxHealth*100)+'%'}} /></div></div>}
    </div>
    <button className="fb-secondary cp-pause-button" onClick={()=>pause(true)} aria-label="Pausar jogo">Ⅱ</button>
    <div className="cp-stage-hud"><span>{opponent?(hud.stage===4?'CHEFÃO · ':'FASE '+(hud.stage+1)+' · ')+opponent.name:'ROUND 01'}</span><strong className="cp-duel-count" aria-label="Cabeçadas na fase">VOCÊ {hud.stageScore} <span>×</span> {hud.rivalScore} RIVAL</strong><small>CABEÇADAS NA FASE · {Math.floor(hud.time/60)}:{String(hud.time%60).padStart(2,'0')} / 10:00</small></div>
    {taunt&&hud.phase==='play'&&<div className="cp-rival-talk"><img src={GAME_TEAMS.find(t=>t.id===taunt.team)?.crest} alt=""/><p><strong>{GAME_TEAMS.find(t=>t.id===taunt.team)?.short}</strong>{taunt.text}</p></div>}
    {hud.phase==='play'&&<p className="cp-play-feedback" key={feedback}>{feedback}</p>}
    <div className="cp-field-controls">
      <button className="fb-secondary cp-special-button" aria-label={'Especial '+SPECIALS[team.id].name} aria-disabled={hud.specialCooldown>0} {...buttonControl('special')}><small>ESPECIAL · E</small><strong>{SPECIALS[team.id].name}</strong><span>{hud.specialCooldown ? Math.ceil(hud.specialCooldown/120)+'s' : 'PRONTO'}</span></button>
      <p>← → / A D: mover · ESPAÇO: cabeça · E: especial</p>
      <div className="cp-movement"><button className="fb-primary cp-arrow" aria-label="Andar para a esquerda" {...buttonControl('left')}>←</button><button className="fb-primary cp-arrow" aria-label="Andar para a direita" {...buttonControl('right')}>→</button><button className="fb-primary cp-head" aria-label="Cabeça" {...buttonControl('jump')}>CABEÇA ↑</button></div>
    </div>
    {hud.phase==='play'&&<div className="cp-effects">{hud.shield>0?'BLINDAGEM ATIVA':hud.slow>0?'LAÇADO! MOVIMENTO LENTO':hud.boost>0?'ARRANCADA ATIVA':''}</div>}
    {assetState!=='ready'&&<div className="cp-match-overlay"><h2>{assetState==='error'?'Não foi possível carregar os mascotes.':'CARREGANDO A QUADRA…'}</h2>{assetState==='error'&&<button className="fb-primary" onClick={()=>setAttempt(v=>v+1)}>Tentar novamente</button>}</div>}
    {assetState==='ready'&&hud.phase==='intro'&&!paused&&<div className={`cp-versus ${hud.stage===4?'boss':''}`} key={hud.stage}><img className="cp-versus-logo" src={logo} alt=""/>
      <div className="cp-versus-player"><img className="cp-versus-crest" src={team.crest} alt=""/><img className="cp-versus-mascot" src={team.mascot} alt=""/><strong>{nickname}</strong></div>
      <div className="cp-versus-title"><span>{opponent?(hud.stage===4?'O CHEFÃO ESTÁ CHEGANDO':'ADVERSÁRIO CHEGANDO'):'PREPARA A CABEÇA'}</span><h2>{opponent?'ROUND '+String(hud.stage+1).padStart(2,'0'):'ROUND 01'}</h2><b>{Math.ceil(hud.intro/120)}</b><p>{opponent?'Dispute a bola e cabeceie para tirar vida. No chão, a bola quica e volta!':'Prepare a cabeça para o primeiro rival.'}</p></div>
      <div className="cp-versus-opponent">{opponent?<><img className="cp-versus-crest" src={opponent.crest} alt=""/><img className="cp-versus-mascot" src={opponent.mascot} alt=""/><strong>{opponent.name}</strong><small>{SPECIALS[opponent.id].name}</small><small>DIFICULDADE {'■'.repeat(hud.stage+1)}</small></>:<><img className="cp-versus-mascot" src={team.mascot} alt=""/><strong>DOMINE A BOLA</strong></>}</div>
    </div>}
    {paused&&<div className="cp-match-overlay" role="dialog" aria-modal="true" aria-label="Jogo pausado" onKeyDown={e=>{if(e.key==='Tab'){const b=e.currentTarget.querySelectorAll('button');if(e.shiftKey&&document.activeElement===b[0]){e.preventDefault();b[1].focus()}else if(!e.shiftKey&&document.activeElement===b[1]){e.preventDefault();b[0].focus()}}}}><span className="fb-eyebrow">A BOLA ESPERA POR VOCÊ</span><h2>JOGO PAUSADO</h2><button autoFocus className="fb-primary" onClick={()=>pause(false)}>CONTINUAR ↗</button><button className="fb-text-button" onClick={onExit}>Sair da tentativa</button><small>Seu recorde salvo é preservado.</small></div>}
  </section>
}
