import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createMatch, advance, resultOf } from '../src/components/game/juggleEngine.js'

test('PHP and browser agree on full replays across seeds, jumps, pointer and keyboard controls', () => {
  const fixtures = [], expected = []
  for (let i = 0; i < 32; i++) {
    const seed = Math.imul(i + 1, 123456789) >>> 0
    const s = createMatch(seed), inputs = []
    let previous = ''
    while (!s.ended) {
      const control = i % 4 === 0
        ? { left: s.tick % 480 < 240, right: s.tick % 480 >= 240, jump: s.tick % 90 < 10, target: null }
        : { left: false, right: false, jump: i % 3 === 0 && s.tick % 180 < 20, target: Math.round(Math.max(38, Math.min(922, s.ball.x + (i % 3 - 1) * 8))) }
      const serialized = JSON.stringify(control)
      if (previous !== serialized) { inputs.push({ tick: s.tick, ...control }); previous = serialized }
      advance(s, control)
    }
    fixtures.push({ seed, inputs }); expected.push(resultOf(s))
  }
  for (const inputs of [[{ tick: 0, left: false, right: false, jump: false, target: 9999 }], [{ tick: -1 }], null]) {
    fixtures.push({ seed: 1, inputs }); expected.push({ invalid: true })
  }
  const php = spawnSync(process.env.PHP_BIN || 'php', ['server/php/verify-fixtures.php'], { input: JSON.stringify(fixtures), encoding: 'utf8', maxBuffer: 20_000_000 })
  assert.equal(php.status, 0, php.error?.message || php.stderr)
  assert.deepEqual(JSON.parse(php.stdout), expected)
})
