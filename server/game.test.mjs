import test from 'node:test'
import assert from 'node:assert/strict'
import { advance, createMatch, MAX_TICKS, resultOf } from '../src/components/game/juggleEngine.js'
import { verifyReplay } from './game-ranking.mjs'

test('a falling ball hits the head once and rebounds upward', () => {
  const s = createMatch(42)
  while (!s.score && !s.ended) advance(s)
  assert.equal(s.score, 1)
  assert.equal(s.perfect, 1)
  assert.equal(s.points, 160)
  assert.ok(s.ball.vy < 0)
  for (let i = 0; i < 30; i++) advance(s)
  assert.equal(s.score, 1)
})
test('moving away drops the ball without awarding points', () => {
  const s = createMatch(42)
  while (!s.ended) advance(s, { left: true })
  assert.equal(s.score, 0)
  assert.ok(s.tick < 240)
  const tick = s.tick
  advance(s)
  assert.equal(s.tick, tick)
})
test('holding jump does not create repeated or midair jumps', () => {
  const s = createMatch(1)
  for (let i = 0; i < 100; i++) advance(s, { jump: true })
  assert.equal(s.jump, 0)
  advance(s, { jump: false }); advance(s, { jump: true })
  assert.ok(s.jump > 0)
})
test('replay produces exactly the same score as live fixed-step simulation', () => {
  const seed = 123, s = createMatch(seed), inputs = []
  while (!s.ended) {
    const control = { tick: s.tick, left: false, right: false, jump: false, target: Math.round(Math.max(38, Math.min(922, s.ball.x))) }
    inputs.push(control); advance(s, control)
  }
  assert.deepEqual(verifyReplay(seed, inputs), resultOf(s))
  assert.ok(s.score > 10)
  assert.ok(s.tick <= MAX_TICKS)
})
test('replay rejects impossible targets, reordered controls and oversized histories', () => {
  const control = { tick: 0, left: false, right: false, jump: false, target: null }
  assert.throws(() => verifyReplay(1, [{ ...control, target: 99999 }]))
  assert.throws(() => verifyReplay(1, [control, control]))
  assert.throws(() => verifyReplay(1, [{ ...control, tick: -1 }]))
  assert.throws(() => verifyReplay(1, Array(MAX_TICKS + 1).fill(control)))
})
