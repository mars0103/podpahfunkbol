import { useEffect, useState } from 'react'
import kingsLeagueLogo from '../assets/hero2/kingsleague-logo.png'
import crestFallback from '../assets/vetorescudo.png'
import { STANDINGS as FALLBACK_STANDINGS } from '../data/standings'
import { apiGet } from '../lib/api'

function mapRow(row) {
  return {
    pos: row.position,
    team: row.team_name,
    crest: row.crest_url || crestFallback,
    vd: row.wd,
    gp: row.gp,
    gc: row.gc,
    sg: row.sg,
  }
}

export default function KingsLeagueTable() {
  const [rows, setRows] = useState(FALLBACK_STANDINGS)

  useEffect(() => {
    apiGet('/standings.php')
      .then((data) => {
        if (data.length) setRows(data.map(mapRow))
      })
      .catch(() => {})
  }, [])

  return (
    <div className="kl-table">
      <div className="kl-table-head-row">
        <img className="kl-table-logo" src={kingsLeagueLogo} alt="Kings League Brazil" />
        <span className="kl-split-badge">SPLIT 02</span>
      </div>

      <div className="kl-table-row kl-table-head">
        <span className="kl-col-pos">Pos</span>
        <span className="kl-col-team">Time</span>
        <span className="kl-col-stat">V-D</span>
        <span className="kl-col-stat">GP</span>
        <span className="kl-col-stat">GC</span>
        <span className="kl-col-stat">SG</span>
      </div>

      <div className="kl-table-rows">
        {rows.map((row) => (
          <div className="kl-table-row" key={row.pos}>
            <span className="kl-col-pos">{row.pos}</span>
            <span className="kl-col-team">
              <img src={row.crest} alt="" />
              <strong>{row.team}</strong>
            </span>
            <span className="kl-col-stat kl-stat">{row.vd}</span>
            <span className="kl-col-stat kl-stat">{row.gp}</span>
            <span className="kl-col-stat kl-stat">{row.gc}</span>
            <span className="kl-col-stat kl-stat">{row.sg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
