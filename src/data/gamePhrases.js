export const SCORE_PHRASES = ['BRABOOOO!', 'AÍ SIM MEU PARCEIRO!', 'MANDOU BEM!', 'ISSO AÍ!', 'QUE PONTO!']

export const STREAK_PHRASES = ['3 SEGUIDOS!', 'TÁ PEGANDO FOGO!', 'IMPARÁVEL!']

export const COMEBACK_PHRASES = ['DE VIRADAAA!', 'VIROU O JOGO!']

export const STEAL_PHRASES = ['ROUBOU A BOLA!', 'PEGA ELE!', 'TIROU DELE!']

export const MATCH_POINT_PHRASES = ['PONTO DO JOGO!', 'FECHA ELE!']

export const OPPONENT_SCORE_PHRASES = ['TOMOU UM!', 'CUIDADO AÍ!', 'ACORDA, PARCEIRO!', 'VAI DEIXAR?']

export const OPPONENT_STREAK_PHRASES = ['ADVERSÁRIO EMBALOU!', 'REAGE, PODPAH!']

export function pickPhrase(pool) {
  return pool[Math.floor(Math.random() * pool.length)]
}
