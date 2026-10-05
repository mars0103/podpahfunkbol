import { useEffect } from 'react'
import courtBg from '../../assets/game/court-bg.png'
import logoGame from '../../assets/game/logo-game.png'
import idleFront from '../../assets/game/idle-front.png'
import ballIcon from '../../assets/game/ball.png'
import crestPodpah from '../../assets/vetorescudo.png'

const PRESENT_DURATION = 1800

export default function MatchIntroScreen({ player, opponent, roundNumber, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, PRESENT_DURATION)
    return () => clearTimeout(t)
  }, [onDone])

  const label = opponent.isBoss ? 'CHEFÃO' : `ROUND 0${roundNumber}`

  return (
    <div className="game-screen game-screen-intro" style={{ backgroundImage: `url(${courtBg})` }}>
      <div className="intro-stripe intro-stripe-home">
        <img className="intro-crest" src={crestPodpah} alt="Podpah Funkbol Clube" />
        <span className="intro-team-name">PODPAH FUNKBOL</span>
        <div className="intro-sprite">
          <img src={idleFront} alt={player.name} />
          <img className="intro-sprite-ball" src={ballIcon} alt="" aria-hidden="true" />
        </div>
      </div>

      <div className="intro-center">
        <img className="intro-logo" src={logoGame} alt="Podpah Funkbol Challenge" />
        <span className="intro-round">{label}</span>
      </div>

      <span className="intro-vs">VS</span>

      <div className="intro-stripe intro-stripe-away" style={{ background: opponent.color }}>
        <img className="intro-crest" src={opponent.crest} alt={opponent.name} />
        <span className="intro-team-name">{opponent.name.toUpperCase()}</span>
        <img className="intro-mascot" src={opponent.mascot} alt={opponent.name} />
      </div>
    </div>
  )
}
