import PageIntro from '../components/PageIntro'
import { MATCHES } from '../data/matches'

function MatchRow({ match }) {
  return (
    <li className={`kl-match${match.highlight ? ' is-highlight' : ''}`}>
      <span className="kl-match-stage">{match.competition}</span>
      <div className="kl-match-teams">
        <div className="kl-match-team">
          <img src={match.home.crest} alt={match.home.name} />
          <span>{match.home.name}</span>
        </div>
        <div className="kl-match-score">
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
        <div className="kl-match-team">
          <img src={match.away.crest} alt={match.away.name} />
          <span>{match.away.name}</span>
        </div>
      </div>
      <span className="kl-match-date">{match.date}</span>
      <span className="kl-match-status">{match.played ? 'Encerrado' : 'A definir'}</span>
    </li>
  )
}

export default function KingsLeaguePage() {
  return (
    <>
      <PageIntro eyebrow="Kings Cup Brasil" title="KINGS LEAGUE">
        Acompanhe a campanha do Podpah Funkbol Clube na competição, rodada a rodada.
      </PageIntro>

      <section className="kings-league-content">
        <div className="kl-bracket">
          <div className="kl-bracket-stage">
            <span>Quartas de final</span>
            <div className="kl-bracket-slot">LOUD 1 × 5 PODPAH</div>
            <div className="kl-bracket-slot is-pending">G3X × PODPAH</div>
          </div>
          <div className="kl-bracket-arrow" aria-hidden="true">
            →
          </div>
          <div className="kl-bracket-stage">
            <span>Semifinal</span>
            <div className="kl-bracket-slot is-pending">DESIMPAIN × PODPAH</div>
          </div>
          <div className="kl-bracket-arrow" aria-hidden="true">
            →
          </div>
          <div className="kl-bracket-stage">
            <span>Final</span>
            <div className="kl-bracket-slot is-empty">A definir</div>
          </div>
        </div>

        <ul className="kl-match-list">
          {MATCHES.map((match) => (
            <MatchRow match={match} key={match.id} />
          ))}
        </ul>
      </section>
    </>
  )
}
