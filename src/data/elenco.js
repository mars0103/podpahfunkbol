import cardBack from '../assets/cards/podpah card verso.png'
import caio from '../assets/cards/CAIO.png'
import gustavo from '../assets/cards/GUSTAVO SILVA.png'
import leleo from '../assets/cards/LELÉO.png'
import luan from '../assets/cards/LUAN MESTRE.png'
import reis from '../assets/cards/REIS.png'
import romarinho from '../assets/cards/ROMARINHO.png'
import vini from '../assets/cards/VINI ALEXANDRE.png'
import matheus from '../assets/cards/podpah.png'

import fotoGustavo from '../assets/jogadores/gustavosilva.png'
import fotoLuan from '../assets/jogadores/luanmestre.png'
import fotoCaio from '../assets/jogadores/caiomiranda.png'
import fotoVini from '../assets/jogadores/vinialexandre.png'
import fotoMatheus from '../assets/jogadores/matheusteteu.png'
import fotoLeleo from '../assets/jogadores/leléomoura.png'
import fotoReis from '../assets/jogadores/ronaldinhoreis.png'
import fotoRomarinho from '../assets/jogadores/AndsonRomarinho.png'

export const CARD_BACK = cardBack

export const PLAYERS = [
  {
    id: 'p1',
    name: 'Gustavo Silva',
    front: gustavo,
    photo: fotoGustavo,
    side: 'left',
    comment: 'Debaixo das traves ninguém passa — nem proposta indecente!',
  },
  {
    id: 'p2',
    name: 'Luan Mestre',
    front: luan,
    photo: fotoLuan,
    side: 'left',
    comment: 'Artilheiro de tanto gol que já virou aula de matemática pro adversário.',
  },
  {
    id: 'p3',
    name: 'Caio',
    front: caio,
    photo: fotoCaio,
    side: 'left',
    comment: 'Marca tão perto que o atacante esquece até o próprio nome.',
  },
  {
    id: 'p4',
    name: 'Vini Alexandre',
    front: vini,
    photo: fotoVini,
    side: 'left',
    comment: 'Perna curta, jogo comprido: resolve na categoria e sai de letra.',
  },
  {
    id: 'p5',
    name: 'Matheus',
    front: matheus,
    photo: fotoMatheus,
    side: 'right',
    comment: 'Cara de bonzinho, mas corta o jogo do adversário igual tesoura.',
  },
  {
    id: 'p6',
    name: 'Leléo',
    front: leleo,
    photo: fotoLeleo,
    side: 'right',
    comment: 'Camisa suada e sorriso fácil — o carisma da Kings League.',
  },
  {
    id: 'p7',
    name: 'Reis',
    front: reis,
    photo: fotoReis,
    side: 'right',
    comment: 'Joga com nome de rei e finaliza como se fosse decreto.',
  },
  {
    id: 'p8',
    name: 'Romarinho',
    front: romarinho,
    photo: fotoRomarinho,
    side: 'right',
    comment: 'Não é o Ronaldinho, mas o drible engana igualzinho.',
  },
]

// Hand-placed jitter so the cards read as scattered but stay legible —
// percentages are relative to the section box, rotation in degrees.
// Generous spacing keeps cards from overlapping at the section's own aspect ratio.
export const CARD_LAYOUT = {
  p1: { top: 16, left: 13, rotate: -7 },
  p2: { top: 42, left: 22, rotate: 6 },
  p3: { top: 66, left: 11, rotate: -5 },
  p4: { top: 86, left: 27, rotate: 5 },
  p5: { top: 16, left: 87, rotate: 6 },
  p6: { top: 42, left: 78, rotate: -6 },
  p7: { top: 66, left: 89, rotate: 5 },
  p8: { top: 86, left: 73, rotate: -5 },
}
