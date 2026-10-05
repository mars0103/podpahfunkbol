export const RIVAL_LINES = {
  podpah: ['Aqui é Podpah, respeita a camisa!', 'Vai sentir a pressão da torcida!'],
  capim: ['Hoje você vai pastar na marcação!', 'Não vai sobrar espaço nessa quadra!'],
  dendele: ['Segura essa pressão, resenha!', 'Hoje o caldeirão vai ferver!'],
  furia: ['A marcação aqui é na pressão!', 'Entrou na quadra, sentiu a FURIA!'],
  loud: ['A torcida tá fazendo barulho!', 'Quero ver manter essa bola no alto!'],
  g3x: ['Tá achando que aqui é treino?', 'Tem que respeitar essa camisa!'],
  dibrados: ['Vai procurar a bola até amanhã!', 'Aqui o drible vem com resenha!'],
  nyvelados: ['Pode vir, hoje o jogo tá nivelado!', 'Essa camisa não se entrega fácil!'],
  fluxo: ['Entrou no Fluxo, aguenta a pressão!', 'Hoje o urso vai tomar conta da quadra!'],
  desimpain: ['Piscou, o tigre já deu o bote!', 'Respeita a camisa do Desimpain!'],
}
const MOMENTS = {
  header: ['Essa cabeçada foi minha!', 'Cabeça de artilheiro!', 'A bola aqui tem dono!'],
  bump: ['Sentiu a marcação?', 'Aqui não tem corpo mole!', 'Tá pedindo VAR? Segue o jogo!'],
  special: ['Agora aguenta a pressão!', 'Essa jogada não tem no teu repertório!', 'Olha a jogada ensaiada!'],
  perfect: ['Foi sorte! Quero ver repetir!', 'Tá se achando o camisa 10?', 'Bonito… mas ainda tem jogo!'],
  idle: ['Cadê o futebol que prometeram?', 'A torcida quer ver jogo!', 'Não dorme na marcação!'],
}
export function rivalLine(team, moment, index) {
  const lines=moment==='entrance'?RIVAL_LINES[team]:MOMENTS[moment]||MOMENTS.idle
  return lines[Math.abs(index)%lines.length]
}
