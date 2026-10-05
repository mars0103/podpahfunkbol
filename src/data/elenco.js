import cardBack from '../assets/cards/podpah card verso.png'
import cardCaio from '../assets/cards/CAIO.png'
import cardVini from '../assets/cards/VINI ALEXANDRE.png'
import cardWillian from '../assets/cards/WILLIAN JESUS.png'
import cardJuninho from '../assets/cards/JUNINHO ANTUNES.png'
import cardYan from '../assets/cards/YAN CORINGA.png'
import cardChoco from '../assets/cards/CHOCO.png'
import cardDraft from '../assets/cards/DRAFT VAZIO.png'
import cardJuninhoMaestro from '../assets/cards/JUNINHO MAESTRO CARD.png'

import fotoCaio from '../assets/jogadores/caiomiranda.png'
import fotoVini from '../assets/jogadores/vinialexandre.png'
import fotoWillian from '../assets/jogadores/willianjesus.png'
import fotoJuninho from '../assets/jogadores/juninhoantunes.png'
import fotoYan from '../assets/jogadores/yancoringa.png'
import fotoChoco from '../assets/jogadores/choco.webp'
import fotoJuninhoMaestro from '../assets/jogadores/JUNINHO PNG.png'

export const CARD_BACK = cardBack

export const PLAYERS = [
  {
    id: 'p1',
    name: 'Willian Jesus',
    position: 'Fixo',
    front: cardWillian,
    photo: fotoWillian,
    side: 'left',
    comment: 'O Capitão do time da Quebrada na Kings League Brasil.',
  },
  {
    id: 'p2',
    name: 'Juninho Antunes',
    position: 'Ala Direito',
    front: cardJuninho,
    photo: fotoJuninho,
    side: 'left',
    comment: 'O Garçom do nosso time.',
  },
  {
    id: 'p3',
    name: 'Caio Miranda',
    position: 'Ala Esquerdo',
    front: cardCaio,
    photo: fotoCaio,
    side: 'left',
    comment: 'O Homem com chute mais forte da Kings League Brasil.',
  },
  {
    id: 'p4',
    name: 'Vini Alexandre',
    position: 'Fixo',
    front: cardVini,
    photo: fotoVini,
    side: 'left',
    comment: 'O dono do gol do milhão no TST 2026.',
  },
  {
    id: 'p5',
    name: 'Juninho Maestro',
    position: 'Meia',
    front: cardJuninhoMaestro,
    photo: fotoJuninhoMaestro,
    side: 'right',
    comment: 'O maestro do time, do Botafogo para o Podpah Funkbol.',
  },
  {
    id: 'p6',
    name: '???',
    position: 'Mistério',
    front: cardDraft,
    photo: cardDraft,
    side: 'right',
    comment: 'Mais uma contratação surpresa a caminho. Fica de olho!',
  },
  {
    id: 'p7',
    name: 'Yan Coringa',
    position: 'Meia',
    front: cardYan,
    photo: fotoYan,
    side: 'right',
    comment: 'A estrela Draftada pelo Podpah Funkbol.',
  },
  {
    id: 'p8',
    name: 'João Choco',
    position: 'Pivô',
    front: cardChoco,
    photo: fotoChoco,
    side: 'right',
    comment: 'Ele é artilheiro e balança muito.',
  },
]

export const POSITIONS = ['Goleiro', 'Ala Direito', 'Ala Esquerdo', 'Fixo', 'Meia', 'Pivô']

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
