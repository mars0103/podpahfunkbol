import podpah from '../assets/vetorescudo.png'
import desimpain from '../assets/desimpain.png'

// Placeholder — the highlighted pill is the upcoming match, the other
// three are past results (same fake 1-1 score, swap for real results later).
export const NEXT_MATCH = {
  date: '09/09/2026',
  home: { name: 'Podpah Funkbol', crest: podpah },
  away: { name: 'Desimpain', crest: desimpain },
}

export const RESULT_PILLS = [
  {
    id: 'r1',
    date: '09/2026',
    home: { name: 'Podpah Funkbol', crest: podpah },
    away: { name: 'Desimpain', crest: desimpain },
    played: false,
    highlight: true,
  },
  {
    id: 'r2',
    date: '09/2026',
    home: { name: 'Podpah Funkbol', crest: podpah },
    away: { name: 'Desimpain', crest: desimpain },
    homeScore: 1,
    awayScore: 1,
    played: true,
  },
  {
    id: 'r3',
    date: '09/2026',
    home: { name: 'Podpah Funkbol', crest: podpah },
    away: { name: 'Desimpain', crest: desimpain },
    homeScore: 1,
    awayScore: 1,
    played: true,
  },
  {
    id: 'r4',
    date: '09/2026',
    home: { name: 'Podpah Funkbol', crest: podpah },
    away: { name: 'Desimpain', crest: desimpain },
    homeScore: 1,
    awayScore: 1,
    played: true,
  },
]
