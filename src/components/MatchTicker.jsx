import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { MATCHES } from '../data/matches'

function MatchCard({ match }) {
  return (
    <li className={`match-card${match.highlight ? ' is-highlight' : ''}`}>
      <div className="match-card-label">
        <span>
          {match.competition} · {match.date}
        </span>
      </div>
      <div className="match-card-body">
        <div className="match-team">
          <img src={match.home.crest} alt={match.home.name} />
        </div>
        <div className="match-score">
          {match.played ? (
            <span>
              {match.homeScore}
              <em>×</em>
              {match.awayScore}
            </span>
          ) : (
            <span>X</span>
          )}
        </div>
        <div className="match-team">
          <img src={match.away.crest} alt={match.away.name} />
        </div>
      </div>
    </li>
  )
}

export default function MatchTicker() {
  const listRef = useRef(null)

  useEffect(() => {
    const cards = listRef.current?.querySelectorAll('.match-card')
    if (!cards?.length) return

    gsap.fromTo(
      cards,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out', delay: 0.15 },
    )
  }, [])

  return (
    <section className="match-ticker" aria-label="Próximos jogos">
      <ul ref={listRef}>
        {MATCHES.map((match) => (
          <MatchCard match={match} key={match.id} />
        ))}
      </ul>
    </section>
  )
}
