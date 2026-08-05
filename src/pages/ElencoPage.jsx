import PageIntro from '../components/PageIntro'
import PlayerCard from '../components/PlayerCard'
import PlayerBubble from '../components/PlayerBubble'
import crest from '../assets/vetorescudo.png'
import { PLAYERS } from '../data/elenco'
import { useRevealBubble } from '../hooks/useRevealBubble'

export default function ElencoPage() {
  const { crestRef, activePlayer, handleReveal, handleClose } = useRevealBubble()

  return (
    <>
      <PageIntro eyebrow="Temporada 2026" title="NOSSO ELENCO">
        Raspe as cartas com a moedinha e conheça quem veste a camisa do Podpah Funkbol Clube.
      </PageIntro>

      <section className="elenco-page-content">
        <div className="elenco-page-crest">
          <img ref={crestRef} src={crest} alt="Escudo Podpah Funkbol Clube" />
          <PlayerBubble player={activePlayer} onClose={handleClose} />
        </div>

        <div className="elenco-page-grid">
          {PLAYERS.map((player, index) => (
            <PlayerCard key={player.id} player={player} index={index} onReveal={handleReveal} />
          ))}
        </div>
      </section>
    </>
  )
}
