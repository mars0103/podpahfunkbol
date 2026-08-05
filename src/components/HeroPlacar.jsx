import { HIGHLIGHT_MATCH } from '../data/matches'

export default function HeroPlacar() {
  const match = HIGHLIGHT_MATCH

  return (
    <div className="hero-placar">
      <div className="hero-placar-label">
        <span>
          {match.competition} · {match.date}
        </span>
      </div>
      <div className="hero-placar-body">
        <div className="hero-placar-team">
          <img src={match.home.crest} alt={match.home.name} />
        </div>
        <span className="hero-placar-vs">
          {match.played ? (
            <>
              {match.homeScore}
              <em>×</em>
              {match.awayScore}
            </>
          ) : (
            'X'
          )}
        </span>
        <div className="hero-placar-team">
          <img src={match.away.crest} alt={match.away.name} />
        </div>
      </div>
    </div>
  )
}
