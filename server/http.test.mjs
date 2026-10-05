import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, rmdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'

test('ranking API verifies points, prevents reuse, keeps one best per player and persists results', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'funkbol-test-'))
  process.env.GAME_DATA_FILE = join(directory, 'ranking.json')
  const { server } = await import('./game-ranking.mjs')
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  const post = (path, data) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  try {
    const playerId = randomUUID()
    const session = await (await post('/sessions', { playerId })).json()
    const inputs = [{ tick: 0, left: true, right: false, jump: false, target: null }]
    const payload = { sessionId: session.id, name: 'QA', team: 'podpah', inputs, points: 999999999 }
    const response = await post('/scores', payload)
    assert.equal(response.status, 201)
    assert.equal((await response.json()).points, 0, 'client-supplied points are ignored')
    assert.equal((await post('/scores', payload)).status, 400, 'session cannot be reused')
    const second = await (await post('/sessions', { playerId })).json()
    assert.equal((await post('/scores', { ...payload, sessionId: second.id })).status, 200)
    const rows = await (await fetch(base + '/leaderboard')).json()
    assert.equal(rows.length, 1)
    assert.equal(rows[0].name, 'QA')
    assert.equal(rows[0].playerId, undefined, 'private identity is not listed publicly')
    assert.equal(JSON.parse(readFileSync(process.env.GAME_DATA_FILE)).length, 1)
    const invalid = await (await post('/sessions', { playerId })).json()
    assert.equal((await post('/scores', { ...payload, sessionId: invalid.id, inputs: [{ ...inputs[0], target: 10000 }] })).status, 400)
    assert.equal((await fetch(base + '/leaderboard', { headers: { Origin: 'https://unconfigured.example' } })).status, 403)
  } finally {
    await new Promise(resolve => server.close(resolve))
    rmSync(join(directory, 'ranking.json'), { force: true })
    rmdirSync(directory)
  }
})
