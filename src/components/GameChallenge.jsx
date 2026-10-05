import { Link } from 'react-router-dom'
import courtBg from '../assets/game/court-bg.png'
import logoGame from '../assets/game/logo-game.png'

export default function GameChallenge() {
  return (
    <section
      className="game-challenge"
      aria-label="Podpah Funkbol Challenge"
      style={{ backgroundImage: `url(${courtBg})` }}
    >
      <div className="game-challenge-body">
        <img src={logoGame} alt="Podpah Funkbol Challenge" className="game-challenge-logo luzpulsante" />
        <Link to="/jogo" className="game-challenge-cta">
          INICIAR O DESAFIO
        </Link>
      </div>
    </section>
  )
}
