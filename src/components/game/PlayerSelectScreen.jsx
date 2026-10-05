import { useState } from 'react'
import logoGame from '../../assets/game/logo-game.png'
import idleFront from '../../assets/game/idle-front.png'
import ballIcon from '../../assets/game/ball.png'
import crestBig from '../../assets/vetorescudo.png'
import texturaUrl from '../../assets/textura.svg'
import { PLAYER_ROSTER } from '../../data/gameRoster'

export default function PlayerSelectScreen({ onPlay }) {
  const [selected, setSelected] = useState(PLAYER_ROSTER.find((p) => p.playable))

  return (
    <div className="game-screen game-screen-select">
      <div
        className="game-screen-texture"
        style={{ WebkitMaskImage: `url(${texturaUrl})`, maskImage: `url(${texturaUrl})` }}
        aria-hidden="true"
      />
      <img className="select-crest-bg" src={crestBig} alt="" aria-hidden="true" />

      <div className="select-content">
        <img className="select-logo" src={logoGame} alt="Podpah Funkbol Challenge" />
        <h2 className="select-title">Selecione seu jogador</h2>

        <div className="select-grid">
          {PLAYER_ROSTER.map((p) => (
            <button
              type="button"
              key={p.id}
              className={`select-thumb${p.playable ? ' is-playable' : ' is-locked'}${selected?.id === p.id ? ' is-selected' : ''}`}
              onClick={() => p.playable && setSelected(p)}
              disabled={!p.playable}
              aria-label={p.playable ? p.name : 'Jogador em breve'}
            >
              <img src={p.thumb} alt="" />
              {!p.playable && <span className="select-thumb-lock" aria-hidden="true">🔒</span>}
            </button>
          ))}
        </div>

        {selected && (
          <div className="select-preview">
            <div className="select-preview-sprite">
              <img src={idleFront} alt={selected.name} />
              <img className="select-preview-ball" src={ballIcon} alt="" aria-hidden="true" />
            </div>
            <div className="select-preview-text">
              <strong>{selected.name}</strong>
              <span>{selected.role}</span>
            </div>
          </div>
        )}

        <button
          type="button"
          className="select-play-btn"
          disabled={!selected}
          onClick={() => selected && onPlay(selected)}
        >
          Jogar
        </button>
      </div>
    </div>
  )
}
