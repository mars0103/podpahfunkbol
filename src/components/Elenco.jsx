import { useEffect, useRef } from 'react'
import texturaUrl from '../assets/textura.svg'
import crest from '../assets/vetorescudo.png'
import PlayerCard from './PlayerCard'
import PlayerBubble from './PlayerBubble'
import Sticker from './Sticker'
import { PLAYERS, CARD_LAYOUT } from '../data/elenco'
import { useRevealBubble } from '../hooks/useRevealBubble'
import dinoAdesivo from '../assets/adesivos/dino 1.png'

const INTRO_MESSAGE = {
  id: 'intro',
  name: 'Dino',
  photo: crest,
  comment: 'Bora descobrir nosso elenco? Aqui é igual raspadinha, raspou achou!',
}

export default function Elenco() {
  const { crestRef, activePlayer, handleReveal, handleClose } = useRevealBubble()
  const sectionRef = useRef(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return undefined

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          handleReveal(INTRO_MESSAGE)
          io.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="elenco" id="elenco" aria-label="Elenco Podpah Funkbol Clube" ref={sectionRef}>
      <div
        className="elenco-texture"
        style={{ WebkitMaskImage: `url(${texturaUrl})`, maskImage: `url(${texturaUrl})` }}
        aria-hidden="true"
      />

      <h2 className="elenco-title">NOSSA SELEÇÃO</h2>

      <div className="elenco-stage">
        <div className="elenco-mascot">
          <img ref={crestRef} src={crest} className="elenco-mascot-crest" alt="Escudo Podpah Funkbol Clube" />
          <PlayerBubble player={activePlayer} onClose={handleClose} />
        </div>

        <div className="elenco-cards">
          {PLAYERS.map((player, index) => (
            <PlayerCard
              key={player.id}
              player={player}
              layout={CARD_LAYOUT[player.id]}
              index={index}
              onReveal={handleReveal}
            />
          ))}
        </div>
      </div>

      <Sticker image={dinoAdesivo} corner="top-right" size={120} rotate={12} />
    </section>
  )
}
