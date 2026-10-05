import { useEffect, useRef, useState } from 'react'
import courtBg from '../../assets/game/court-bg.png'
import logoGame from '../../assets/game/logo-game.png'
import ballIcon from '../../assets/game/ball.png'
import idleFront from '../../assets/game/idle-front.png'
import juggleUp from '../../assets/game/juggle-look-up.png'
import runRight1 from '../../assets/game/run-right-1.png'
import runRight2 from '../../assets/game/run-right-2.png'
import runLeft1 from '../../assets/game/run-left-1.png'
import runLeft2 from '../../assets/game/run-left-2.png'
import crestPodpah from '../../assets/vetorescudo.png'
import helicopterImg from '../../assets/game/helicopter.png'
import PixelSnow from './PixelSnow'
import { POINTS_TO_WIN } from '../../data/gameRoster'
import {
  SCORE_PHRASES,
  STREAK_PHRASES,
  COMEBACK_PHRASES,
  STEAL_PHRASES,
  MATCH_POINT_PHRASES,
  OPPONENT_SCORE_PHRASES,
  OPPONENT_STREAK_PHRASES,
  pickPhrase,
} from '../../data/gamePhrases'

const X_MIN = 6
const X_MAX = 94
const APPROACH_DURATION = 500
const PLAYER_START = 9
const OPPONENT_START = 91
const MOVE_SPEED = 34
const GRAVITY = 210
const POP_VELOCITY = 150
const HIT_RANGE = 9
const PLAYER_HIT_RANGE = 13
const HEAD_ZONE_MIN = 24
const HEAD_ZONE_MAX = 62
const MIN_JUMP_TO_HEAD = 4
const DROP_PAUSE = 700
const BALL_MIN_BOTTOM = 16
const BALL_MAX_BOTTOM = 78
const BODY_SEPARATION = 11
const JUMP_GRAVITY = 900
const JUMP_VELOCITY = 240
const JUMP_VELOCITY_BOOST = 150
const JUMP_VELOCITY_MAX = 420
const DOUBLE_TAP_WINDOW = 350

export default function MatchPlayScreen({ player, opponent, roundIndex, onMatchEnd }) {
  const [render, setRender] = useState({
    playerX: PLAYER_START,
    opponentX: OPPONENT_START,
    playerJumpY: 0,
    ballX: 50,
    ballBottom: BALL_MAX_BOTTOM,
    playerScore: 0,
    opponentScore: 0,
    countdown: '3',
    playerFrame: 'idle',
    opponentMoving: false,
    dropped: false,
  })
  const [popup, setPopup] = useState(null)

  const phaseRef = useRef('countdown')
  const playerXRef = useRef(PLAYER_START)
  const opponentXRef = useRef(OPPONENT_START)
  const ballXRef = useRef(50)
  const ballYRef = useRef(100)
  const ballVyRef = useRef(0)
  const droppedUntilRef = useRef(0)
  const scoresRef = useRef({ player: 0, opponent: 0 })
  const endedRef = useRef(false)
  const lastHitByRef = useRef(null)
  const playerStreakRef = useRef(0)
  const opponentStreakRef = useRef(0)
  const popupIdRef = useRef(0)
  const popupTimeoutRef = useRef(null)

  const movingLeftRef = useRef(false)
  const movingRightRef = useRef(false)
  const playerJumpYRef = useRef(0)
  const playerJumpVyRef = useRef(0)
  const lastHitPressRef = useRef(-Infinity)
  const jumpPressCountRef = useRef(0)

  const oppTargetXRef = useRef(50)
  const oppRetargetTimerRef = useRef(0)
  const oppAccuracy = 0.6 + roundIndex * 0.07

  function setHit() {
    if (endedRef.current || phaseRef.current === 'countdown') return

    const now = performance.now()
    if (jumpPressCountRef.current === 0) {
      playerJumpVyRef.current = JUMP_VELOCITY
      jumpPressCountRef.current = 1
      lastHitPressRef.current = now
    } else if (jumpPressCountRef.current === 1 && now - lastHitPressRef.current < DOUBLE_TAP_WINDOW) {
      playerJumpVyRef.current = Math.min(JUMP_VELOCITY_MAX, playerJumpVyRef.current + JUMP_VELOCITY_BOOST)
      jumpPressCountRef.current = 2
    }
  }
  function setMoveLeft(v) {
    movingLeftRef.current = v
  }
  function setMoveRight(v) {
    movingRightRef.current = v
  }

  function showPopup(text, variant = 'positive') {
    popupIdRef.current += 1
    setPopup({ text, variant, id: popupIdRef.current })
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current)
    popupTimeoutRef.current = setTimeout(() => setPopup(null), 1500)
  }

  function awardPoint(who, previousHitter) {
    const beforePlayer = scoresRef.current.player
    const beforeOpponent = scoresRef.current.opponent
    scoresRef.current[who] += 1

    if (who === 'player') {
      opponentStreakRef.current = 0
      playerStreakRef.current += 1

      const wasBehind = beforePlayer < beforeOpponent
      const nowAhead = scoresRef.current.player > scoresRef.current.opponent
      let phrase
      if (wasBehind && nowAhead) {
        phrase = pickPhrase(COMEBACK_PHRASES)
      } else if (previousHitter === 'opponent') {
        phrase = pickPhrase(STEAL_PHRASES)
      } else if (playerStreakRef.current >= 3) {
        phrase = pickPhrase(STREAK_PHRASES)
      } else if (scoresRef.current.player === POINTS_TO_WIN - 1) {
        phrase = pickPhrase(MATCH_POINT_PHRASES)
      } else {
        phrase = pickPhrase(SCORE_PHRASES)
      }
      showPopup(phrase, 'positive')
    } else {
      playerStreakRef.current = 0
      opponentStreakRef.current += 1

      const phrase =
        opponentStreakRef.current >= 3 ? pickPhrase(OPPONENT_STREAK_PHRASES) : pickPhrase(OPPONENT_SCORE_PHRASES)
      showPopup(phrase, 'negative')
    }

    if (scoresRef.current[who] >= POINTS_TO_WIN) {
      endedRef.current = true
      phaseRef.current = 'ended'
    }
  }

  function serveBall() {
    ballXRef.current = 50
    ballYRef.current = 100
    ballVyRef.current = 0
    lastHitByRef.current = null
  }

  useEffect(() => {
    return () => {
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    function onKeyDown(e) {
      const k = e.key.toLowerCase()
      if (k === 'a' || k === 'arrowleft') setMoveLeft(true)
      else if (k === 'd' || k === 'arrowright') setMoveRight(true)
      else if (k === 'w' || k === 'arrowup' || k === ' ') setHit()
    }
    function onKeyUp(e) {
      const k = e.key.toLowerCase()
      if (k === 'a' || k === 'arrowleft') setMoveLeft(false)
      else if (k === 'd' || k === 'arrowright') setMoveRight(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    const steps = ['3', '2', '1', 'VAI!']
    let i = 0
    setRender((r) => ({ ...r, countdown: steps[0] }))
    const interval = setInterval(() => {
      i += 1
      if (i >= steps.length) {
        clearInterval(interval)
        phaseRef.current = 'approaching'
        serveBall()
        setRender((r) => ({ ...r, countdown: null }))
        setTimeout(() => {
          if (phaseRef.current === 'approaching') phaseRef.current = 'playing'
        }, APPROACH_DURATION)
        return
      }
      setRender((r) => ({ ...r, countdown: steps[i] }))
    }, 650)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let raf
    let last = performance.now()

    function updateOpponentAi(dt) {
      oppRetargetTimerRef.current -= dt
      if (oppRetargetTimerRef.current <= 0) {
        oppRetargetTimerRef.current = 0.25 + Math.random() * 0.3
        const noise = (1 - oppAccuracy) * (Math.random() * 24 - 12)
        oppTargetXRef.current = Math.min(X_MAX, Math.max(X_MIN, ballXRef.current + noise))
      }
      const aiSpeed = MOVE_SPEED * (0.55 + roundIndex * 0.07)
      if (opponentXRef.current < oppTargetXRef.current) {
        opponentXRef.current = Math.min(oppTargetXRef.current, opponentXRef.current + aiSpeed * dt)
      } else if (opponentXRef.current > oppTargetXRef.current) {
        opponentXRef.current = Math.max(oppTargetXRef.current, opponentXRef.current - aiSpeed * dt)
      }
    }

    function tick(dt) {
      if (movingLeftRef.current) playerXRef.current = Math.max(X_MIN, playerXRef.current - MOVE_SPEED * dt)
      if (movingRightRef.current) playerXRef.current = Math.min(X_MAX, playerXRef.current + MOVE_SPEED * dt)

      updateOpponentAi(dt)

      if (playerJumpYRef.current > 0 || playerJumpVyRef.current !== 0) {
        playerJumpVyRef.current -= JUMP_GRAVITY * dt
        playerJumpYRef.current += playerJumpVyRef.current * dt
        if (playerJumpYRef.current <= 0) {
          playerJumpYRef.current = 0
          playerJumpVyRef.current = 0
          jumpPressCountRef.current = 0
        }
      }

      const separation = opponentXRef.current - playerXRef.current
      const gap = Math.abs(separation)
      if (gap < BODY_SEPARATION) {
        const push = (BODY_SEPARATION - gap) / 2
        const sign = separation >= 0 ? 1 : -1
        playerXRef.current = Math.max(X_MIN, Math.min(X_MAX, playerXRef.current - push * sign))
        opponentXRef.current = Math.max(X_MIN, Math.min(X_MAX, opponentXRef.current + push * sign))
      }

      if (phaseRef.current === 'dropped') {
        if (performance.now() >= droppedUntilRef.current) {
          phaseRef.current = 'playing'
          serveBall()
        }
        return
      }

      if (phaseRef.current === 'approaching') {
        return
      }

      ballVyRef.current -= GRAVITY * dt
      ballYRef.current += ballVyRef.current * dt

      if (ballYRef.current <= HEAD_ZONE_MAX && ballYRef.current >= HEAD_ZONE_MIN && ballVyRef.current <= 0) {
        const distToPlayer = Math.abs(ballXRef.current - playerXRef.current)
        const distToOpponent = Math.abs(ballXRef.current - opponentXRef.current)
        const playerHeading = playerJumpYRef.current >= MIN_JUMP_TO_HEAD

        if (playerHeading && distToPlayer <= PLAYER_HIT_RANGE) {
          const previousHitter = lastHitByRef.current
          ballVyRef.current = POP_VELOCITY
          ballXRef.current = Math.min(X_MAX, Math.max(X_MIN, playerXRef.current + (Math.random() * 8 - 4)))
          lastHitByRef.current = 'player'
          awardPoint('player', previousHitter)
        } else if (distToOpponent <= HIT_RANGE && Math.random() < oppAccuracy) {
          ballVyRef.current = POP_VELOCITY
          ballXRef.current = Math.min(X_MAX, Math.max(X_MIN, opponentXRef.current + (Math.random() * 8 - 4)))
          lastHitByRef.current = 'opponent'
          awardPoint('opponent')
        }
      }

      if (ballYRef.current <= 0 && phaseRef.current === 'playing') {
        ballYRef.current = 0
        phaseRef.current = 'dropped'
        droppedUntilRef.current = performance.now() + DROP_PAUSE
      }
    }

    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      if (phaseRef.current === 'playing' || phaseRef.current === 'dropped' || phaseRef.current === 'approaching') {
        tick(dt)
      }

      const now2 = performance.now()
      const runToggle = Math.floor(now2 / 130) % 2 === 0
      const idleToggle = Math.floor(now2 / 260) % 2 === 0

      let playerFrame = 'idle'
      if (movingLeftRef.current) playerFrame = runToggle ? 'left1' : 'left2'
      else if (movingRightRef.current) playerFrame = runToggle ? 'right1' : 'right2'
      else if (playerJumpYRef.current > 2) playerFrame = 'juggle'
      else if (ballYRef.current < 45) playerFrame = idleToggle ? 'idle' : 'juggle'

      const opponentMoving = Math.abs(opponentXRef.current - oppTargetXRef.current) > 0.5

      setRender((r) => ({
        ...r,
        playerX: playerXRef.current,
        opponentX: opponentXRef.current,
        playerJumpY: playerJumpYRef.current,
        ballX: ballXRef.current,
        ballBottom: BALL_MIN_BOTTOM + (Math.max(0, ballYRef.current) / 100) * (BALL_MAX_BOTTOM - BALL_MIN_BOTTOM),
        playerScore: scoresRef.current.player,
        opponentScore: scoresRef.current.opponent,
        playerFrame,
        opponentMoving,
        dropped: phaseRef.current === 'dropped',
      }))

      if (endedRef.current) {
        const result = scoresRef.current.player >= POINTS_TO_WIN ? 'win' : 'lose'
        setTimeout(() => onMatchEnd(result), 900)
        return
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const playerSpriteMap = {
    idle: idleFront,
    juggle: juggleUp,
    right1: runRight1,
    right2: runRight2,
    left1: runLeft1,
    left2: runLeft2,
  }

  return (
    <div className="game-screen game-screen-play" style={{ backgroundImage: `url(${courtBg})` }}>
      <img className="play-helicopter" src={helicopterImg} alt="" aria-hidden="true" />

      <div className="play-scoreboard">
        <img className="play-scoreboard-crest" src={crestPodpah} alt="" />
        <span className="play-scoreboard-score">{render.playerScore}</span>
        <img className="play-scoreboard-logo" src={logoGame} alt="" />
        <span className="play-scoreboard-score">{render.opponentScore}</span>
        <img className="play-scoreboard-crest" src={opponent.crest} alt="" />
      </div>

      {render.dropped && <div className="play-dropped-msg">A BOLA CAIU!</div>}

      {popup && (
        <div className={`play-popup play-popup-${popup.variant}`} key={popup.id}>
          {popup.text}
        </div>
      )}

      {render.countdown && (
        <>
          <div className="game-snow-overlay" aria-hidden="true">
            <PixelSnow
              color="#f5ba00"
              flakeSize={0.006}
              minFlakeSize={0.8}
              pixelResolution={200}
              speed={1.4}
              density={0.22}
              direction={125}
              brightness={1}
              depthFade={8}
              farPlane={20}
              gamma={0.4545}
              variant="square"
            />
          </div>
          <div className="play-countdown">{render.countdown}</div>
        </>
      )}

      <img
        className="play-ball"
        style={{ left: `${render.ballX}%`, bottom: `${render.ballBottom}%` }}
        src={ballIcon}
        alt=""
        aria-hidden="true"
      />

      <img
        className="play-player-sprite"
        style={{
          left: `${render.playerX}%`,
          transform: `translateX(-50%) translateY(-${render.playerJumpY}px)`,
        }}
        src={playerSpriteMap[render.playerFrame]}
        alt={player.name}
      />

      <img
        className={`play-opponent-sprite${render.opponentMoving ? ' is-moving' : ''}`}
        style={{ left: `${render.opponentX}%` }}
        src={opponent.mascot}
        alt={opponent.name}
      />

      <div className="play-controls">
        <button
          type="button"
          className="play-move-btn"
          onPointerDown={() => setMoveLeft(true)}
          onPointerUp={() => setMoveLeft(false)}
          onPointerLeave={() => setMoveLeft(false)}
          aria-label="Mover para a esquerda"
        >
          ◀
        </button>
        <button type="button" className="play-hit-btn" onPointerDown={setHit} aria-label="Pular para cabecear">
          <img src={ballIcon} alt="" aria-hidden="true" />
          <span className="play-hit-btn-arrow" aria-hidden="true">
            ▲
          </span>
        </button>
        <button
          type="button"
          className="play-move-btn"
          onPointerDown={() => setMoveRight(true)}
          onPointerUp={() => setMoveRight(false)}
          onPointerLeave={() => setMoveRight(false)}
          aria-label="Mover para a direita"
        >
          ▶
        </button>
      </div>
    </div>
  )
}
