import podpah from '../assets/vetorescudo.png'
import capim from '../assets/game/crest-capim.png'
import dendele from '../assets/game/crest-dendele.png'
import furia from '../assets/game/crest-furia.png'
import g3x from '../assets/game/crest-g3x.png'
import loud from '../assets/game/crest-loud.png'
import desimpain from '../assets/game/crest-desimpain.png'
import mascotPodpah from '../assets/game/mascot-dino-boss.png'
import mascotCapim from '../assets/game/mascot-capim.png'
import mascotDendele from '../assets/game/mascot-dendele.png'
import mascotFuria from '../assets/game/mascot-furia.png'
import mascotG3x from '../assets/game/mascot-g3x.png'
import mascotLoud from '../assets/game/mascot-loud.png'
import dibrados from '../assets/game/crest-dibrados.png'
import mascotDibrados from '../assets/game/mascot-dibrados.png'
import nyvelados from '../assets/game/crest-nyvelados.png'
import mascotNyvelados from '../assets/game/mascot-nyvelados.png'
import fluxo from '../assets/game/crest-fluxo.png'
import mascotFluxo from '../assets/game/mascot-fluxo.png'
import mascotDesimpain from '../assets/game/mascot-desimpain.png'
// Original assets from /game assets. Crown/foot align the
// visible forehead and floor to the shared collider; ears/horns are decorative.
export const GAME_TEAMS = [
  { id: 'podpah', name: 'Podpah Funkbol', short: 'PFC', crest: podpah, color: '#E91176', mascot: mascotPodpah, crown: 50, foot: 441, headX: 235 },
  { id: 'capim', name: 'Capim FC', short: 'CAP', crest: capim, color: '#54407D', mascot: mascotCapim, crown: 56, foot: 464, headX: 235 },
  { id: 'dendele', name: 'Dendele FC', short: 'DEN', crest: dendele, color: '#F5BA00', mascot: mascotDendele, crown: 43, foot: 457, headX: 235 },
  { id: 'furia', name: 'FURIA FC', short: 'FUR', crest: furia, color: '#54407D', mascot: mascotFuria, crown: 28, foot: 457, headX: 237 },
  { id: 'loud', name: 'LOUD', short: 'LOUD', crest: loud, color: '#E91176', mascot: mascotLoud, crown: 37, foot: 442, headX: 237 },
  { id: 'g3x', name: 'G3X FC', short: 'G3X', crest: g3x, color: '#F5BA00', mascot: mascotG3x, crown: 64, foot: 463, headX: 233 },
  { id: 'dibrados', name: 'Dibrados', short: 'DIB', crest: dibrados, color: '#54407D', mascot: mascotDibrados, crown: 50, foot: 727, headX: 380 },
  { id: 'nyvelados', name: 'Nyvelados', short: 'NYV', crest: nyvelados, color: '#FFFFFF', mascot: mascotNyvelados, crown: 40, foot: 757, headX: 380 },
  { id: 'fluxo', name: 'Fluxo', short: 'FLX', crest: fluxo, color: '#E91176', mascot: mascotFluxo, crown: 34, foot: 768, headX: 395 },
  { id: 'desimpain', name: 'Desimpain', short: 'DES', crest: desimpain, color: '#54407D', mascot: mascotDesimpain, crown: 34, foot: 768, headX: 397 },
]
// Preserve labels for any historical results from the earlier selection.
export const RANKING_TEAMS = GAME_TEAMS
