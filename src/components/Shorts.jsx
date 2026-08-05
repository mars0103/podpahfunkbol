import { useRef, useState } from 'react'
import Sticker from './Sticker'
import { SHORTS, SHORTS_CHANNEL_URL } from '../data/shorts'
import quemCorreAdesivo from '../assets/adesivos/quemcorrejuntosoma adesivo.png'

const DOT_COUNT = 4

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function ArrowIcon({ flip }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={flip ? { transform: 'rotate(180deg)' } : undefined}
      aria-hidden="true"
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export default function Shorts() {
  const trackRef = useRef(null)
  const [activeDot, setActiveDot] = useState(0)

  function handleScroll() {
    const el = trackRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    const frac = maxScroll > 0 ? el.scrollLeft / maxScroll : 0
    setActiveDot(Math.min(DOT_COUNT - 1, Math.round(frac * (DOT_COUNT - 1))))
  }

  function scrollByCards(direction) {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector('.short-card')
    const step = card ? card.offsetWidth + 16 : 220
    el.scrollBy({ left: direction * step * 3, behavior: 'smooth' })
  }

  return (
    <section className="shorts" id="shorts" aria-label="Podpah Funkbol Shorts">
      <div className="shorts-head">
        <h2>
          FUNKBOL <span>SHORTS</span>
        </h2>
        <a className="shorts-channel-link" href={SHORTS_CHANNEL_URL} target="_blank" rel="noreferrer">
          Ver canal
        </a>
      </div>

      <div className="shorts-track" ref={trackRef} onScroll={handleScroll}>
        {SHORTS.map((short) => (
          <a
            key={short.id}
            className="short-card"
            href={`https://www.youtube.com/shorts/${short.id}`}
            target="_blank"
            rel="noreferrer"
          >
            <img src={`https://i.ytimg.com/vi/${short.id}/frame0.jpg`} alt={short.title} loading="lazy" />
            <span className="short-play">
              <PlayIcon />
            </span>
            <span className="short-caption">
              <strong>{short.title}</strong>
              <em>{short.views}</em>
            </span>
          </a>
        ))}
      </div>

      <div className="shorts-controls">
        <div className="shorts-dots" aria-hidden="true">
          {Array.from({ length: DOT_COUNT }).map((_, i) => (
            <span key={i} className={i === activeDot ? 'is-active' : ''} />
          ))}
        </div>
        <div className="shorts-arrows">
          <button type="button" aria-label="Anterior" onClick={() => scrollByCards(-1)}>
            <ArrowIcon flip />
          </button>
          <button type="button" aria-label="Próximo" onClick={() => scrollByCards(1)}>
            <ArrowIcon />
          </button>
        </div>
      </div>

      <Sticker image={quemCorreAdesivo} corner="top-left" size={110} rotate={-8} />
    </section>
  )
}
