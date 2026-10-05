import logoGame from '../../assets/game/logo-game.png'
import mascotDinoBoss from '../../assets/game/mascot-dino-boss.png'
import texturaUrl from '../../assets/textura.svg'

export default function GameEndScreen({ result, onRestart }) {
  const isWin = result === 'win'

  return (
    <div className={`game-screen game-screen-end${isWin ? ' is-win' : ' is-lose'}`}>
      <div
        className="game-screen-texture"
        style={{ WebkitMaskImage: `url(${texturaUrl})`, maskImage: `url(${texturaUrl})` }}
        aria-hidden="true"
      />
      <img className="end-logo luzpulsante" src={logoGame} alt="Podpah Funkbol Challenge" />
      {isWin && <img className="end-boss" src={mascotDinoBoss} alt="" aria-hidden="true" />}
      <h2 className="end-title">{isWin ? 'VOCÊ É CAMPEÃO!' : 'GAME OVER'}</h2>
      <p className="end-subtitle">
        {isWin
          ? 'O Podpah Funkbol Clube venceu todos os desafios!'
          : 'O adversário levou a melhor dessa vez.'}
      </p>
      <button type="button" className="end-restart-btn" onPointerDown={onRestart}>
        Voltar ao início
      </button>
    </div>
  )
}
