export default function ResultPill({ match }) {
  return (
    <div className="result-pill-wrap">
      <div className={`result-pill${match.highlight ? ' is-highlight' : ''}`}>
        <div className="result-pill-shape" aria-hidden="true" />

        <div className="result-pill-body">
          <div className="result-pill-team">
            <img src={match.home.crest} alt="" />
            <span>{match.home.name}</span>
          </div>

          <div className="result-pill-score-wrap">
            {match.played ? (
              <span className="result-pill-score">
                {match.homeScore}
                <em>×</em>
                {match.awayScore}
              </span>
            ) : (
              <span className="result-pill-vs">x</span>
            )}
          </div>

          <div className="result-pill-team">
            <img src={match.away.crest} alt="" />
            <span>{match.away.name}</span>
          </div>
        </div>
      </div>

      <span className="result-pill-date">{match.date}</span>
    </div>
  )
}
