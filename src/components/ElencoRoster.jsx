import { useState } from 'react'
import { PLAYERS, POSITIONS } from '../data/elenco'
import crest from '../assets/vetorescudo.png'

const LABELS = {
  Goleiro: 'Goleiros',
  'Ala Direito': 'Alas Direitos',
  'Ala Esquerdo': 'Alas Esquerdos',
  Fixo: 'Fixos',
  Meia: 'Meias',
  Pivô: 'Pivôs',
}

export default function ElencoRoster() {
  const [active, setActive] = useState(POSITIONS[0])
  const players = PLAYERS.filter((p) => p.position === active)

  return (
    <div className="elenco-roster">
      <nav className="elenco-roster-tabs" aria-label="Filtrar por posição">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            type="button"
            className={`elenco-roster-tab${pos === active ? ' is-active' : ''}`}
            onClick={() => setActive(pos)}
          >
            {LABELS[pos]}
          </button>
        ))}
      </nav>

      <div className="elenco-roster-grid">
        {players.map((player) => {
          const [firstName, ...rest] = player.name.split(' ')
          return (
            <div className="elenco-roster-card" key={player.id}>
              <img className="elenco-roster-crest" src={crest} alt="" aria-hidden="true" />
              {player.photo && (
                <img className="elenco-roster-photo" src={player.photo} alt={player.name} />
              )}
              <span className="elenco-roster-position">{player.position}</span>
              <span className="elenco-roster-name">
                {firstName}
                {rest.length > 0 && (
                  <>
                    <br />
                    {rest.join(' ')}
                  </>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
