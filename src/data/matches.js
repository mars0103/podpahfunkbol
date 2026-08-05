import crest from '../assets/vetorescudo.png'
import desimpain from '../assets/desimpain.png'
import g3x from '../assets/g3x.png'
import loud from '../assets/loud.png'

export const MATCHES = [
  {
    id: 'm1',
    competition: 'KINGS LEAGUE · QUARTAS',
    date: '11 DE MAIO',
    home: { name: 'LOUD', crest: loud },
    away: { name: 'PODPAH FUNKBOL', crest },
    homeScore: 1,
    awayScore: 5,
    played: true,
    highlight: false,
  },
  {
    id: 'm2',
    competition: 'KINGS LEAGUE · SEMIFINAL',
    date: '15 DE MAIO',
    home: { name: 'DESIMPAIN', crest: desimpain },
    away: { name: 'PODPAH FUNKBOL', crest },
    homeScore: null,
    awayScore: null,
    played: false,
    highlight: true,
  },
  {
    id: 'm3',
    competition: 'KINGS LEAGUE · QUARTAS',
    date: '11 DE MAIO',
    home: { name: 'G3X', crest: g3x },
    away: { name: 'PODPAH FUNKBOL', crest },
    homeScore: null,
    awayScore: null,
    played: false,
    highlight: false,
  },
]

export const HIGHLIGHT_MATCH = MATCHES.find((m) => m.highlight) ?? MATCHES[0]
