import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import KingsLeagueTable from './KingsLeagueTable'
import CRTWarp from './CRTWarp'
import { DINO_POSES } from '../data/dinoPoses'
import { GAME_TEAMS } from '../data/gameTeams'
import { STAGES } from './game/footballEngine'
import crest from '../assets/vetorescudo.png'
import cardDraft from '../assets/cards/DRAFT VAZIO.png'
import kingsLeagueLogo from '../assets/hero2/kingsleague-logo.png'
import kingsCupLogo from '../assets/hero2/kingscup-logo.png'
import kingsCupTrio from '../assets/hero2/kingscup-trio.png'
import gameLogo from '../assets/game/logo-game.png'
import { apiGet } from '../lib/api'

const POSE_ROTATE_MS = 5000
const PHRASE_ROTATE_MS = 6000
const SLIDE_ROTATE_MS = 6000
const FALLBACK_PHRASE = {
  heading: 'E aí meu parceiro!',
  text: 'Tamo te esperando no próximo jogo do PFC, tu pode acompanhar pelo nosso youtube.',
}

function mapMatch(m) {
  return {
    id: m.id,
    date: m.match_date,
    home: { name: m.home_name, crest: m.home_crest_url || crest },
    away: { name: m.away_name, crest: m.away_crest_url || crest },
    homeScore: m.home_score,
    awayScore: m.away_score,
    played: !!Number(m.played),
    highlight: !!Number(m.highlight),
  }
}

export default function HeroV2() {
  const navigate = useNavigate()
  const [slide, setSlide] = useState(0)
  const [activePose, setActivePose] = useState(0)
  const [bubbleOpen, setBubbleOpen] = useState(true)
  const [tableOpen, setTableOpen] = useState(false)
  const [phrases, setPhrases] = useState([FALLBACK_PHRASE])
  const [activePhrase, setActivePhrase] = useState(0)
  const [nextMatch, setNextMatch] = useState(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((v) => (v === 0 ? 1 : 0))
    }, SLIDE_ROTATE_MS)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePose((v) => (v + 1) % DINO_POSES.length)
    }, POSE_ROTATE_MS)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    function loadData() {
      apiGet('/dino_phrases.php')
        .then((data) => {
          const active = data.filter((p) => Number(p.is_active))
          if (active.length) setPhrases(active.map((p) => ({ heading: p.heading, text: p.text })))
        })
        .catch(() => {})

      apiGet('/matches.php')
        .then((data) => {
          if (!data.length) return
          const mapped = data.map(mapMatch)
          const highlighted = mapped.find((m) => m.highlight)
          setNextMatch(highlighted || null)
        })
        .catch(() => {})
    }

    loadData()
    window.addEventListener('focus', loadData)
    return () => window.removeEventListener('focus', loadData)
  }, [])

  useEffect(() => {
    if (phrases.length < 2) return undefined
    const timer = setInterval(() => {
      setActivePhrase((v) => (v + 1) % phrases.length)
    }, PHRASE_ROTATE_MS)
    return () => clearInterval(timer)
  }, [phrases])

  return (
    <section className="hero2" aria-label="Podpah Funkbol Clube">
      <div className="hero2-stage">
        <div className={`hero2-slide hero2-slide-main${slide === 0 ? ' is-active' : ''}`}>
          <div className="hero2-crt-bg" aria-hidden="true">
            <CRTWarp
              color="#ffd759"
              backgroundColor="#05010a"
              speed={0.5}
              curvature={0.25}
              scanlineStrength={0.25}
              scanlineFrequency={200}
              waveAmplitude={0.3}
              waveFrequency={2.5}
              bloom={1.5}
              bloomRadius={1}
              noise={0.1}
              vignette={0}
              brightness={1.25}
              pixelation={1}
              rgbShift={0.015}
              mouseReact
              mouseStrength={0.5}
              dpr={1}
              fps={30}
              paused={false}
            />
          </div>

          <img className="hero2-crest-bg" src={crest} alt="" aria-hidden="true" />

          <div className="hero2-kingscup">
            <div className="hero2-kingscup-logo">
              <img src={kingsCupLogo} alt="Kings Cup Brazil" />
            </div>
            <p className="hero2-kingscup-line1">VEM AÍ A</p>
            <p className="hero2-kingscup-line2">KINGS CUP</p>
          </div>

          <div className="hero2-player">
            <img src={kingsCupTrio} alt="Igão, Hariel e Michel Elias" />
          </div>

          <div className="hero2-glow" aria-hidden="true" />

          <div className="hero2-bottom-bar" />

          <div className="hero2-wildcard-inline">
            <img className="hero2-wildcard-inline-crest" src={cardDraft} alt="" aria-hidden="true" />
            <div className="hero2-wildcard-inline-body">
              <span className="hero2-wildcard-inline-eyebrow">Fique de olho</span>
              <h3 className="hero2-wildcard-inline-title">Quem serão os novos Wildcards?</h3>
              <p className="hero2-wildcard-inline-text">
                Um wildcard na Kings League é um jogador contratado diretamente pelo clube, sem
                precisar passar pelo evento de seleção oficial (o draft).
              </p>
            </div>
          </div>

          {nextMatch && (
            <div className="hero2-nextmatch">
              <span className="hero2-nextmatch-label">PRÓXIMO JOGO</span>
              <div className="hero2-nextmatch-body">
                <img src={nextMatch.home.crest} alt={nextMatch.home.name} />
                <span>x</span>
                <img src={nextMatch.away.crest} alt={nextMatch.away.name} />
              </div>
              <span className="hero2-nextmatch-date">{nextMatch.date}</span>
            </div>
          )}

          <div className="hero2-table">
            <button
              type="button"
              className="hero2-table-toggle"
              onClick={() => setTableOpen((v) => !v)}
              aria-expanded={tableOpen}
            >
              <span className="hero2-table-toggle-label">
                <img className="hero2-table-toggle-logo" src={kingsLeagueLogo} alt="" aria-hidden="true" />
                <span>Tabela Kings League Split 2 2026</span>
              </span>
              <span className={`hero2-table-chevron${tableOpen ? ' is-open' : ''}`} aria-hidden="true">
                ▾
              </span>
            </button>
            <div className={`hero2-table-body${tableOpen ? ' is-open' : ''}`}>
              <KingsLeagueTable />
            </div>
          </div>

          {bubbleOpen && (
            <div className="hero2-bubble">
              <button
                type="button"
                className="hero2-bubble-close"
                onClick={() => setBubbleOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
              <img className="hero2-bubble-crest" src={crest} alt="" />
              <div className="hero2-bubble-text">
                <strong>{phrases[activePhrase].heading}</strong>
                <p>{phrases[activePhrase].text}</p>
              </div>
              <span className="hero2-bubble-tail" aria-hidden="true" />
            </div>
          )}

          <div className="hero2-dino">
            {DINO_POSES.map((pose, i) => (
              <img
                key={pose}
                src={pose}
                alt={i === 0 ? 'Mascote Podpah Funkbol Clube' : ''}
                aria-hidden={i !== 0}
                className={i === activePose ? 'is-active' : ''}
              />
            ))}
          </div>
        </div>

        <div className={`hero2-slide hero2-slide-game${slide === 1 ? ' is-active' : ''}`}>
          <div className="hero2-game-texture" aria-hidden="true" />
          <img className="hero2-game-logo luzpulsante" src={gameLogo} alt="Podpah Funkbol Challenge" />
          <p className="hero2-game-tag">
            {STAGES} PARTIDAS. 1 MINUTO. VENCE QUEM FAZ MAIS GOLS.
          </p>
          <div className="hero2-game-teams" aria-hidden="true">
            {GAME_TEAMS.map((team) => (
              <img key={team.id} src={team.crest} alt="" />
            ))}
          </div>
          <div className="hero2-game-actions">
            <button type="button" className="hero2-game-btn hero2-game-btn-primary" onClick={() => navigate('/jogo')}>
              BORA JOGAR
            </button>
            <button type="button" className="hero2-game-btn hero2-game-btn-secondary" onClick={() => navigate('/jogo')}>
              RANKING
            </button>
          </div>
        </div>

        <div className="hero2-carousel-dots" role="tablist" aria-label="Selecionar destaque">
          <button
            type="button"
            role="tab"
            aria-selected={slide === 0}
            aria-label="Ver Kings Cup"
            className={`hero2-carousel-dot${slide === 0 ? ' is-active' : ''}`}
            onClick={() => setSlide(0)}
          />
          <button
            type="button"
            role="tab"
            aria-selected={slide === 1}
            aria-label="Ver Podpah Funkbol Challenge"
            className={`hero2-carousel-dot${slide === 1 ? ' is-active' : ''}`}
            onClick={() => setSlide(1)}
          />
        </div>
      </div>
    </section>
  )
}
