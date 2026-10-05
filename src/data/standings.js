import podpah from '../assets/vetorescudo.png'
import desimpain from '../assets/desimpain.png'
import loud from '../assets/loud.png'
import g3x from '../assets/g3x.png'

// Placeholder standings — same shape as https://kingsleague.pro/pt/brazil/classificacao.
// Swap for the real feed once we wire up that source.
export const STANDINGS = [
  { pos: 1, team: 'Podpah Funkbol Clube', crest: podpah, vd: '7-2', gp: 10, gc: 2, sg: 8 },
  { pos: 2, team: 'Desimpain', crest: desimpain, vd: '7-2', gp: 10, gc: 2, sg: 8 },
  { pos: 3, team: 'Dendele FC', crest: g3x, vd: '7-2', gp: 10, gc: 2, sg: 8 },
  { pos: 4, team: 'LOUD SC', crest: loud, vd: '7-2', gp: 10, gc: 2, sg: 8 },
  { pos: 5, team: 'Furia FC', crest: podpah, vd: '7-2', gp: 10, gc: 2, sg: 8 },
]

export const STANDINGS_SOURCE_URL = 'https://kingsleague.pro/pt/brazil/classificacao'
