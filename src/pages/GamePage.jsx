import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { GAME_TEAMS } from '../data/gameTeams'
import FootballArena from '../components/game/FootballArena'
import GameChat from '../components/game/GameChat'
import GameAccount from '../components/game/GameAccount'
import useGameOrientation from '../components/game/useGameOrientation'
import { gameAudio } from '../components/game/gameAudio'
import useGameZoomLock from '../components/game/useGameZoomLock'
import { SPECIALS } from '../components/game/campaignRules'
import { getGameAccount, gameAuth, campaignStart, campaignFinish, campaignAbandon, campaignLeaderboard, campaignTeamLeaderboard } from '../lib/campaignApi'
import { STAGES } from '../components/game/footballEngine'
import court from '../assets/game/court-bg.png'
import logo from '../assets/game/logo-game.png'
import '../styles/juggle.css'
import '../styles/campaign.css'

export default function GamePage() {
  const portrait = useGameOrientation()
  useGameZoomLock()
  const [sound,setSound]=useState(gameAudio.enabled)
  useEffect(()=>{
    const unlock=()=>gameAudio.unlock()
    const visibility=()=>{if(document.hidden)gameAudio.stop()}
    document.addEventListener('pointerdown',unlock)
    document.addEventListener('keydown',unlock)
    document.addEventListener('visibilitychange',visibility)
    return()=>{document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);document.removeEventListener('visibilitychange',visibility);gameAudio.dispose()}
  },[])
  function toggleSound(){const enabled=!sound;gameAudio.setEnabled(enabled);setSound(enabled);if(enabled)gameAudio.play('click')}

  const [rankingPage,setRankingPage]=useState(0)
  const [chatOpen,setChatOpen]=useState(false),[rankingMode,setRankingMode]=useState('players'),[teamRanking,setTeamRanking]=useState([])
  useEffect(()=>setRankingPage(0),[rankingMode])
  const reset = useRef(new URLSearchParams(window.location.hash.slice(1)).get('reset') || '')
  const [screen, setScreen] = useState(reset.current ? 'account' : 'home')
  const [user, setUser] = useState(null), [accountLoading, setAccountLoading] = useState(true)
  const [team, setTeam] = useState(GAME_TEAMS[0]), [session, setSession] = useState(null)
  const [result, setResult] = useState(null), [ranking, setRanking] = useState([])
  const [status, setStatus] = useState(''), [error, setError] = useState('')
  const [busy, setBusy] = useState(false), [saved, setSaved] = useState(false)
  const [transition, setTransition] = useState(false), [loadingRanking, setLoadingRanking] = useState(false)
  const timer = useRef(), lock = useRef(false), submission = useRef(null), root = useRef(null)
  useEffect(()=>{
    const node=root.current
    if(screen!=='play'||!node)return
    const blockBrowserGesture=e=>{
      if(!matchMedia('(any-pointer: coarse)').matches&&navigator.maxTouchPoints===0)return
      if(e.target.closest?.('input,textarea,select,[contenteditable="true"]'))return
      e.preventDefault()
    }
    const events=['contextmenu','selectstart','dragstart']
    events.forEach(event=>node.addEventListener(event,blockBrowserGesture))
    if(matchMedia('(any-pointer: coarse)').matches||navigator.maxTouchPoints>0)window.getSelection()?.removeAllRanges()
    return()=>events.forEach(event=>node.removeEventListener(event,blockBrowserGesture))
  },[screen])

  useEffect(() => {
    let active = true
    if (reset.current) history.replaceState(null, '', window.location.pathname + window.location.search)
    getGameAccount().then(d => { if (active) setUser(d.user) }).catch(() => {}).finally(() => { if (active) setAccountLoading(false) })
    return () => { active = false; clearTimeout(timer.current) }
  }, [])
  useEffect(() => { root.current?.scrollTo(0, 0) }, [screen])
  function go(next) {
    if (lock.current) return
    gameAudio.play('transition'); lock.current = true; setTransition(true); setError('')
    timer.current = setTimeout(() => { setScreen(next); setTransition(false); lock.current = false }, 220)
  }
  function play() { go(user ? 'select' : 'account') }
  async function start() {
    if (busy) return
    setBusy(true); setError('')
    try { const data = await campaignStart(team.id); setSession(data); go('bracket') }
    catch (e) { setError(e.message); if (e.status === 401) { setUser(null); go('account') } }
    finally { setBusy(false) }
  }
  async function publish() {
    if (!submission.current) return
    setBusy(true); setSaved(false); setStatus('Validando sua partida e salvando o recorde…')
    try { const data = await campaignFinish(submission.current); setSaved(true); setStatus(`Recorde da conta: ${data.best.toLocaleString('pt-BR')} pontos${data.rank ? ' · posição #' + data.rank : ''}.`) }
    catch (e) { setStatus(e.message + ' Você pode tentar salvar novamente.'); }
    finally { setBusy(false) }
  }
  function finish(stats, payload) { setResult(stats); submission.current = payload; go('result'); publish() }
  async function leave() { if (session) await campaignAbandon(session.id).catch(() => {}); go('select') }
  async function showRanking() {
    setRankingPage(0); go('ranking'); setLoadingRanking(true); setError('')
    try { const [players,teams]=await Promise.all([campaignLeaderboard(),campaignTeamLeaderboard()]);setRanking(players);setTeamRanking(teams) } catch (e) { setError(e.message) }
    finally { setLoadingRanking(false) }
  }
  async function logout() {
    try { await gameAuth('logout', {}); setUser(null); go('home') } catch (e) { setError(e.message) }
  }
  const rivals = session?.order.map(id => GAME_TEAMS.find(t => t.id === id)) || []
  const soundButton = <button type="button" className="cp-sound-toggle" aria-label={sound?'Desligar som':'Ligar som'} aria-pressed={sound} onClick={toggleSound}>{sound?'♪ SOM ON':'♪ SOM OFF'}</button>
  return <><main onClick={e=>{if(e.target.closest('button,a')&&!e.target.closest('.cp-sound-toggle,.cp-field-controls'))gameAudio.play('click')}} ref={root} inert={transition || portrait ? "" : undefined} className={`fb-game cp-game cp-screen-${screen}`} style={{ '--court-image': `url(${court})` }}>
    {screen !== 'play' && <header className="cp-header"><Link to="/">↖ VOLTAR AO CLUBE</Link><span>PODPAH <b>ARCADE</b></span><div className="cp-header-account">{soundButton}{user ? <><span title={user.username}>@{user.username}</span><button onClick={logout}>Sair</button></> : <button onClick={() => go('account')}>{accountLoading ? 'Conectando…' : 'Entrar / cadastrar'}</button>}</div></header>}
    {screen === 'home' && <section className="cp-lobby">
      <h1 className="cp-sr-only">Podpah Funkbol Copa Arcade</h1>
      <img className="cp-lobby-logo" src={logo} alt="Podpah Funkbol Challenge" />
      <div className="fb-actions"><button className="fb-primary" disabled={accountLoading} onClick={play}>BORA JOGAR</button><button className="fb-secondary" onClick={showRanking}>RANKING</button></div>
      <p className="cp-lobby-tag">{STAGES} PARTIDAS. 1 MINUTO. VENCE QUEM FAZ MAIS GOLS.</p>
      <div className="cp-logo-carousel" aria-label="Times do campeonato"><div className="cp-logo-track">{[0,1].map(copy=><div className="cp-logo-group" key={copy} aria-hidden={copy===1 ? "true" : undefined}>{GAME_TEAMS.map(t=><img key={t.id} src={t.crest} alt={copy===0?t.name:""} draggable="false" />)}</div>)}</div></div>
    </section>}
    {screen === 'account' && <GameAccount resetToken={reset.current} onBack={() => { reset.current = ''; go('home') }} onSuccess={u => { setUser(u); reset.current = ''; go('select') }} />}
    {screen === 'select' && <section className="cp-selection"><span className="fb-eyebrow">VISTA A CAMISA, {user?.username}</span><h1>QUAL É O <em>SEU TIME?</em></h1><p>Escolha entre os dez times. {STAGES} adversários serão sorteados, incluindo o chefão.</p>
      <div className="fb-team-grid" role="group" aria-label="Escolha seu time">{GAME_TEAMS.map(t => <button className={`fb-team ${team.id === t.id ? 'selected' : ''}`} key={t.id} aria-pressed={team.id === t.id} onClick={() => setTeam(t)}><span className="fb-team-check">{team.id === t.id ? '✓' : '↗'}</span><img className="fb-team-mascot" src={t.mascot} alt={`Mascote do ${t.name}`} /><strong>{t.name}</strong><small><img src={t.crest} alt="" />{t.short}</small></button>)}</div>
      <div className="cp-selection-bottom"><p><span className="cp-control-help">Setas / A e D: mover · Espaço: pular · J: chutar · E: especial · Q: carta<br />No celular: botões na quadra, com o aparelho deitado.</span><strong>{SPECIALS[team.id].name}: {SPECIALS[team.id].description}</strong><b className="cp-control-help">Ataque à direita, defenda à esquerda. Seu recorde fica salvo.</b></p><button className="fb-primary" onClick={start} disabled={busy}>{busy ? 'SORTEANDO…' : 'SORTEAR MEU DESAFIO'} ↗</button></div>
      <button className="fb-text-button" onClick={() => go('home')}>← Voltar</button>
    </section>}
    {screen === 'bracket' && <section className="cp-bracket"><span className="fb-eyebrow">CHAVEAMENTO SORTEADO</span><h1>SEU CAMINHO <em>ATÉ O TOPO.</em></h1><p>{STAGES} partidas de um minuto. Vença para avançar; empate vai aos shootouts.</p>
      <div className="cp-bracket-list">{rivals.map((t, i) => <article key={t.id} className={i === STAGES - 1 ? 'boss' : ''}><span>{i === STAGES - 1 ? 'CHEFÃO FINAL' : 'FASE ' + (i + 1)}</span><img src={t.mascot} alt="" /><strong>{t.name}</strong><small>1 MINUTO · GOLS</small><div className="cp-difficulty" aria-label={`Dificuldade ${i + 1} de ${STAGES}`}>{'■'.repeat(i + 1)}{'□'.repeat(STAGES - 1 - i)}</div></article>)}</div>
      <ol className="fp-checkpoints" aria-label="Checkpoints da partida">
        <li><time>0:10</time><strong>CARTAS LIBERADAS</strong><span>Use sua carta com Q</span></li>
        <li><time>0:20</time><strong>GOL EM DOBRO</strong><span>Para os dois · 7,5s</span></li>
        <li><time>0:30</time><strong>SURPRESA</strong><span>Bola leve ou turbo · 7,5s</span></li>
        <li><time>0:37</time><strong>NOVA CARTA</strong><span>Mais uma chance de virar</span></li>
        <li><time>0:45</time><strong>RETA FINAL</strong><span>Gols x2 até o apito</span></li>
      </ol>
      <div className="fp-rule-notes"><p><b>CARTAS</b> Gol x2: 15s · Suspensão: 6s · Pênalti ou shootout: 5s</p><p><b>CONTROLES</b> J: chute · Espaço: pulo · E: especial · Q: carta</p></div>
      <div className="fb-actions"><button className="fb-primary" onClick={() => go('play')}>ENTRAR NA QUADRA ↗</button><button className="fb-text-button" onClick={leave}>Trocar time</button></div>
    </section>}
    {screen === 'play' && <FootballArena key={session.id} team={team} session={session} nickname={user.username} userId={user.id} suspended={portrait||chatOpen} onEnd={finish} onExit={leave} />}
    {screen === 'result' && result && <section className="cp-result"><span className="fb-eyebrow">{result.outcome === 'win' ? 'CAMPANHA COMPLETA!' : result.outcome === 'draw' ? 'EMPATE NOS SHOOTOUTS' : 'SEU RECORDE CONTINUA COM VOCÊ'}</span><h1>{result.outcome === 'win' ? 'VENCEU O ' : result.outcome === 'draw' ? 'DEU ' : 'BORA '}<em>{result.outcome === 'win' ? 'CHEFÃO!' : result.outcome === 'draw' ? 'EMPATE!' : 'DE NOVO?'}</em></h1><img className="fb-result-mascot" src={team.mascot} alt="" /><div className="fb-result-score">{result.points}<span>PONTOS NA TENTATIVA</span></div>
      <div className="fb-stats"><span><b>{result.peak}</b>Pontos na campanha</span><span><b>{result.score}</b>Gols marcados</span><span><b>{result.defeated}/{STAGES}</b>Rivais vencidos</span><span><b>{result.duration}s</b>Tempo de jogo</span></div>
      <p className="fp-points-breakdown">{result.normalGoals||0} gols × 20 · {result.longGoals||0} de longe × 30 · {result.blowouts||0} goleadas × 100 · {result.cleanSheets||0} vitórias sem sofrer gol × 20</p><p className="fb-save-status" role="status">{status}</p>{!saved && !busy && <button className="fb-secondary" onClick={publish}>TENTAR SALVAR NOVAMENTE</button>}
      <div className="fb-actions"><button className="fb-primary" disabled={busy} onClick={start}>NOVO DESAFIO ↗</button><button className="fb-secondary" onClick={showRanking}>VER RANKING</button><button className="fb-text-button" onClick={() => go('select')}>Trocar time</button></div>
    </section>}
    {screen === 'ranking' && <section className="cp-ranking"><span className="fb-eyebrow">RECORDES DA CAMPANHA</span><h1>OS DONOS <em>DO JOGO.</em></h1><small className="fp-ranking-note">RANKING DA COPA DE GOLS</small><div className="cp-ranking-tabs" role="group" aria-label="Tipo de ranking"><button aria-pressed={rankingMode==='players'} onClick={()=>setRankingMode('players')}>JOGADORES</button><button aria-pressed={rankingMode==='teams'} onClick={()=>setRankingMode('teams')}>TIMES</button></div><p>{rankingMode==='players'?'Gol: 20 · Da própria área: 30 · Vitória por 3+ gols: +100 · Vitória sem sofrer gol: +20. A temporada soma até a derrota ou o título; uma nova começa do zero.':'Cada jogador soma seu melhor resultado com cada time. A torcida inteira conta!'}</p><div className="fb-leaderboard" aria-live="polite">{loadingRanking ? <p className="cp-loading">Carregando ranking…</p> : rankingMode==='teams'?<table><thead><tr><th>POS.</th><th>TIME</th><th>JOGADORES</th><th>PONTOS</th></tr></thead><tbody>{teamRanking.slice(rankingPage*5,rankingPage*5+5).map((r,i)=>{const t=GAME_TEAMS.find(t=>t.id===r.team);return <tr key={r.team} className={r.team===team.id?'cp-own-row':''}><td>{rankingPage*5+i+1}</td><td><div className="fb-ranking-player"><img src={t?.crest} alt=""/><span><strong>{t?.name}</strong></span></div></td><td>{r.players}</td><td>{r.points.toLocaleString('pt-BR')}</td></tr>})}</tbody></table>: ranking.length ? <table><thead><tr><th>POS.</th><th>JOGADOR / TIME</th><th>GOLS</th><th>RECORDE</th></tr></thead><tbody>{ranking.slice(rankingPage*5,rankingPage*5+5).map((r,i) => {const t=GAME_TEAMS.find(t=>t.id===r.team);return <tr key={r.id} className={r.id===user?.id?'cp-own-row':''}><td>{rankingPage*5+i+1}</td><td><div className="fb-ranking-player"><img src={t?.crest} alt="" /><span><strong>{r.name}</strong><small>{t?.name}</small></span></div></td><td>{r.score}</td><td>{r.points}</td></tr>})}</tbody></table> : <div className="fb-empty"><h2>Seja o primeiro a marcar!</h2><p>Crie sua conta, escolha seu time e entre na quadra.</p></div>}</div><div className="cp-ranking-pages"><button disabled={rankingPage===0} onClick={()=>setRankingPage(p=>p-1)}>← Anterior</button><span>{rankingPage+1} / {Math.max(1,Math.ceil((rankingMode==='teams'?teamRanking.length:ranking.length)/5))}</span><button disabled={(rankingPage+1)*5>=(rankingMode==='teams'?teamRanking.length:ranking.length)} onClick={()=>setRankingPage(p=>p+1)}>Próxima →</button></div><div className="fb-actions"><button className="fb-primary" onClick={play}>BORA JOGAR</button><button className="fb-text-button" onClick={showRanking}>Atualizar</button><button className="fb-text-button" onClick={()=>go('home')}>← Início</button></div></section>}
    {screen === 'play' && soundButton}
    <GameChat user={user} open={chatOpen} onOpen={setChatOpen} playing={screen==='play'} onLogin={()=>go('account')} />
    {error && <p className="cp-page-error" role="alert">{error}</p>}
    <div className={`fb-wipe ${transition ? 'active' : ''}`} aria-hidden="true"><span>VAI PRA CIMA ↗</span></div>
  </main>{portrait && <div className="cp-rotate" role="dialog" aria-modal="true" aria-label="Vire o celular"><div className="cp-rotate-phone" aria-hidden="true">↻</div><h1>VIRE O CELULAR</h1><p>A quadra é horizontal.<br />Deite o celular para entrar no jogo.</p><small>{screen === "play" ? "Sua partida está pausada." : "A mesma quadra do PC, com os controles na tela."}</small></div>}</>
}
