// Original arcade effects synthesized locally. No downloads or external audio services.
class GameAudio {
  constructor() {
    this.enabled = true
    try { this.enabled = localStorage.getItem('funkbol-sound') !== 'off' } catch {}
    this.nodes = new Set()
    this.last = new Map()
  }
  unlock() {
    if (!this.enabled) return
    try {
      if (!this.context) {
        const Audio = window.AudioContext || window.webkitAudioContext
        if (!Audio) return
        this.context = new Audio()
        this.master = this.context.createGain()
        this.master.gain.value = .28
        const limiter = this.context.createDynamicsCompressor()
        this.master.connect(limiter); limiter.connect(this.context.destination)
        this.noise = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate)
        const data = this.noise.getChannelData(0)
        let value = 0
        for (let i = 0; i < data.length; i++) {
          if (i % 6 === 0) value = Math.random() * 2 - 1
          data[i] = value
        }
      }
      if (this.context.state === 'suspended') this.context.resume().catch(() => {})
    } catch { /* Unsupported or blocked audio must never interrupt a match. */ }
  }
  setEnabled(value) {
    this.enabled = value
    try { localStorage.setItem('funkbol-sound', value ? 'on' : 'off') } catch {}
    if (value) this.unlock()
    else this.stop()
  }
  stop() {
    for (const node of this.nodes) { try { node.stop() } catch {} }
    this.nodes.clear()
  }
  tone(frequency, duration = .1, volume = .15, delay = 0, end = frequency, type = 'square') {
    if (!this.enabled || document.hidden || this.context?.state !== 'running') return
    const ctx = this.context, time = ctx.currentTime + delay
    const source = type === 'noise' ? ctx.createBufferSource() : ctx.createOscillator()
    const gain = ctx.createGain()
    if (type === 'noise') source.buffer = this.noise
    else { source.type = type; source.frequency.setValueAtTime(frequency, time); source.frequency.exponentialRampToValueAtTime(Math.max(20, end), time + duration) }
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(volume, time + .008)
    gain.gain.exponentialRampToValueAtTime(.001, time + duration)
    source.connect(gain); gain.connect(this.master)
    this.nodes.add(source)
    source.onended = () => { this.nodes.delete(source); source.disconnect(); gain.disconnect() }
    source.start(time); source.stop(time + duration + .015)
  }
  melody(notes, step = .1, volume = .13) {
    notes.forEach((note, i) => this.tone(note, step * .9, volume, i * step))
  }
  play(event, team = 'podpah') {
    if (!this.enabled || document.hidden || !event) return
    const now = performance.now()
    if (now - (this.last.get(event) ?? -Infinity) < 70) return
    this.last.set(event, now)
    switch (event) {
      case 'click': this.tone(660, .045, .1, 0, 880); break
      case 'transition': this.melody([262, 392, 523], .065, .08); break
      case 'kick': case 'rival-kick': case 'hit': this.tone(180, .12, .23, 0, 70, 'triangle'); this.tone(700, .045, .05); break
      case 'perfect': this.tone(180, .1, .2, 0, 80, 'triangle'); this.melody([784, 1047], .07, .12); break
      case 'rival-hit': case 'rival-perfect': this.tone(135, .12, .2, 0, 55, 'triangle'); this.tone(330, .06, .06); break
      case 'ground': this.tone(90, .18, .25, 0, 260, 'triangle'); break
      case 'post': case 'bump': this.tone(70, .1, .16, 0, 40, 'triangle'); this.tone(0, .07, .1, 0, 0, 'noise'); break
      case 'special-warning': this.melody([440, 440, 622], .12, .1); break
      case 'special': case 'rival-special': {
        const index = ['podpah','capim','dendele','furia','loud','g3x','dibrados','nyvelados','fluxo','desimpain'].indexOf(team)
        const base = 196 * 2 ** (Math.max(0, index) / 12)
        this.melody([base, base * 1.5, base * 2, base * 3], .065, .15)
        this.tone(0, .22, .12, 0, 0, 'noise'); break
      }
      case 'ready': this.melody([523, 523, 1047], .14); break
      case 'card-ready': case 'card': case 'rival-card': case 'surprise': case 'shootout': case 'next': this.melody([392, 523, 659, 784], .12); this.cheer(); break
      case 'goal': case 'rival-goal': case 'win': this.melody([523, 659, 784, 1047, 784, 1047], .14, .18); this.cheer(); break
      case 'lose': this.melody([392, 330, 262, 196], .18); break
      case 'draw': this.melody([392, 330, 392], .18); break
    }
  }
  cheer() { this.tone(0, .7, .16, 0, 0, 'noise'); this.melody([196, 262, 294], .18, .045) }
  crowd(beat) {
    // Quiet, rhythmic claps and a low two-note chant behind the action.
    this.tone(0, .085, .045, 0, 0, 'noise')
    if (beat % 4 < 2) this.tone(beat % 4 === 0 ? 147 : 165, .28, .024, .04, 147, 'triangle')
    if (beat % 8 === 7) this.tone(0, .5, .035, .12, 0, 'noise')
  }
  dispose() {
    this.stop()
    this.context?.close().catch(() => {})
    this.context = null; this.master = null; this.noise = null; this.last.clear()
  }
}
export const gameAudio = new GameAudio()
