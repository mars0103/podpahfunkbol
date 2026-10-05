import crestPodpah from '../assets/vetorescudo.png'
import crestCapim from '../assets/game/crest-capim.png'
import crestDendele from '../assets/game/crest-dendele.png'
import crestFuria from '../assets/game/crest-furia.png'
import crestG3x from '../assets/game/crest-g3x.png'
import crestLoud from '../assets/game/crest-loud.png'

import mascotCapim from '../assets/game/mascot-capim.png'
import mascotDendele from '../assets/game/mascot-dendele.png'
import mascotFuria from '../assets/game/mascot-furia.png'
import mascotG3x from '../assets/game/mascot-g3x.png'
import mascotLoud from '../assets/game/mascot-loud.png'
import mascotDinoBoss from '../assets/game/mascot-dino-boss.png'

import thumbMichel from '../assets/game/thumbs/michel-elias.png'
import thumbHariel from '../assets/game/thumbs/hariel.png'
import thumbIgao from '../assets/game/thumbs/igao.png'
import thumbLock1 from '../assets/game/thumbs/lock-1.png'
import thumbLock2 from '../assets/game/thumbs/lock-2.png'
import thumbLock3 from '../assets/game/thumbs/lock-3.png'
import thumbLock4 from '../assets/game/thumbs/lock-4.png'
import thumbLock5 from '../assets/game/thumbs/lock-5.png'
import thumbLock6 from '../assets/game/thumbs/lock-6.png'
import thumbLock7 from '../assets/game/thumbs/lock-7.png'

export const OPPONENTS = [
  { id: 'capim', name: 'Capim FC', crest: crestCapim, mascot: mascotCapim, color: '#1b7a3d' },
  { id: 'dendele', name: 'Dendele FC', crest: crestDendele, mascot: mascotDendele, color: '#1c3f8f' },
  { id: 'furia', name: 'Furia FC', crest: crestFuria, mascot: mascotFuria, color: '#141414' },
  { id: 'g3x', name: 'G3X FC', crest: crestG3x, mascot: mascotG3x, color: '#0d4ea6' },
  { id: 'loud', name: 'LOUD Sports Club', crest: crestLoud, mascot: mascotLoud, color: '#0c2b1f' },
  { id: 'dino', name: 'Podpah Funkbol Challenge', crest: crestPodpah, mascot: mascotDinoBoss, color: '#33176d', isBoss: true },
]

export const PLAYER_ROSTER = [
  { id: 'michel', name: 'Michel Elias', role: 'PRESIDENTE', thumb: thumbMichel, playable: true },
  { id: 'hariel', name: 'Hariel', role: 'EM BREVE', thumb: thumbHariel, playable: false },
  { id: 'igao', name: 'Igão', role: 'EM BREVE', thumb: thumbIgao, playable: false },
  { id: 'lock-1', name: 'Em breve', role: 'EM BREVE', thumb: thumbLock1, playable: false },
  { id: 'lock-2', name: 'Em breve', role: 'EM BREVE', thumb: thumbLock2, playable: false },
  { id: 'lock-3', name: 'Em breve', role: 'EM BREVE', thumb: thumbLock3, playable: false },
  { id: 'lock-4', name: 'Em breve', role: 'EM BREVE', thumb: thumbLock4, playable: false },
  { id: 'lock-5', name: 'Em breve', role: 'EM BREVE', thumb: thumbLock5, playable: false },
  { id: 'lock-6', name: 'Em breve', role: 'EM BREVE', thumb: thumbLock6, playable: false },
  { id: 'lock-7', name: 'Em breve', role: 'EM BREVE', thumb: thumbLock7, playable: false },
]

export const POINTS_TO_WIN = 5
