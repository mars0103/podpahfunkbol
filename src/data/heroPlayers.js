import playerSuperbet from '../assets/hero2/player-superbet.png'
import fotoLuan from '../assets/jogadores/luanmestre.png'
import fotoVini from '../assets/jogadores/vinialexandre.png'
import fotoCaio from '../assets/jogadores/caiomiranda.png'

// Rotates every 4s in the hero. Only the first photo matches the exact
// Figma cutout style (transparent/black bg) — the rest reuse our existing
// roster headshots until matching cutout photos are supplied for them.
export const HERO_PLAYERS = [
  { id: 'h1', name: 'Matheus Teteu', photo: playerSuperbet },
  { id: 'h2', name: 'Luan Mestre', photo: fotoLuan },
  { id: 'h3', name: 'Vini Alexandre', photo: fotoVini },
  { id: 'h4', name: 'Caio Miranda', photo: fotoCaio },
]
