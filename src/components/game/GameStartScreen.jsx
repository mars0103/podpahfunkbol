import logoGame from '../../assets/game/logo-game.png'
import texturaUrl from '../../assets/textura.svg'

export default function GameStartScreen({ onStart }) {
  return (
    <div className="game-screen game-screen-start">
      <div
        className="game-screen-texture"
        style={{ WebkitMaskImage: `url(${texturaUrl})`, maskImage: `url(${texturaUrl})` }}
        aria-hidden="true"
      />
      <img className="game-start-logo luzpulsante" src={logoGame} alt="Podpah Funkbol Challenge" />
      <button type="button" className="game-start-btn" onPointerDown={onStart}>
        Toque para começar
      </button>
    </div>
  )
}
