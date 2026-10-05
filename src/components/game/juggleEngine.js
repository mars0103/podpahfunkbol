// Fixed 120 Hz simulation shared by the browser and ranking server.
export const STEP = 1 / 120
export const WIDTH = 960
export const HEIGHT = 640
export const MAX_TICKS = 120 * 180
export function createMatch(seed = 1) {
  return { tick: 0, x: 480, vx: 0, jump: 0, jumpV: 0, ball: { x: 480, y: 135, vx: 0, vy: 0 }, score: 0, perfect: 0, combo: 0, bestCombo: 0, points: 0, ended: false, seed: seed >>> 0, lastHit: -120, jumpHeld: false }
}
function random(s) { s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0; return s.seed / 4294967296 }
export function advance(s, input = {}, options = {}) {
  if (s.ended) return null
  s.tick++
  const previousJump = s.jump
  const direction = input.target != null ? Math.max(-1, Math.min(1, (input.target - s.x) / 55)) : (Number(!!input.right) - Number(!!input.left))
  s.vx += (direction * 410 * (options.speed ?? 1) - s.vx) * (1 - Math.exp(-14 * STEP))
  s.x = Math.max(38, Math.min(WIDTH - 38, s.x + s.vx * STEP))
  if (input.jump && !s.jumpHeld && s.jump === 0) s.jumpV = 330
  s.jumpHeld = !!input.jump
  s.jump = Math.max(0, s.jump + s.jumpV * STEP)
  if (s.jump > 0) s.jumpV -= 1150 * STEP
  else s.jumpV = 0
  const b = s.ball
  const oldY = b.y
  b.vy += (600 + Math.min(s.score, 80) * 1.4) * STEP
  b.x += b.vx * STEP
  b.y += b.vy * STEP
  if (b.x < 18 || b.x > WIDTH - 18) { b.x = Math.max(18, Math.min(WIDTH - 18, b.x)); b.vx *= -0.88 }
  const headY = 464 - s.jump
  const dx = b.x - s.x
  const contactY = headY - Math.sqrt(Math.max(0, 44 * 44 - dx * dx))
  const previousContactY = contactY + s.jump - previousJump
  let event = null
  if (Math.abs(dx) < 44 && b.vy > 0 && oldY <= previousContactY + 5 && b.y >= contactY && s.tick - s.lastHit > 18) {
    const perfect = Math.abs(dx) < 14
    s.score++
    s.perfect += Number(perfect)
    s.combo = perfect ? s.combo + 1 : 0
    s.bestCombo = Math.max(s.bestCombo, s.combo)
    s.points += 100 + (perfect ? 50 : 0) + Math.min(s.combo, 10) * 10
    s.lastHit = s.tick
    b.y = contactY - 1
    b.vy = -Math.min(590, 505 + Math.max(0, s.jumpV) * 0.14)
    b.vx = Math.max(-290, Math.min(290, dx * 5 + s.vx * 0.22 + (random(s) - 0.5) * (65 + Math.min(s.score * 3, 110))))
    event = perfect ? 'perfect' : 'hit'
  }
  if (b.y >= 546 || s.tick >= (options.maxTicks ?? MAX_TICKS)) { b.y = Math.min(b.y, 546); s.ended = true; event = 'end' }
  return event
}
export function resultOf(s) { return { score: s.score, points: s.points, perfect: s.perfect, bestCombo: s.bestCombo, duration: Math.round(s.tick * STEP * 10) / 10 } }
