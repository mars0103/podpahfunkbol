import http from 'node:http'
import { randomBytes, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { advance, createMatch, resultOf, MAX_TICKS } from '../src/components/game/juggleEngine.js'

const port = Number(process.env.GAME_PORT || 3001)
const file = resolve(process.env.GAME_DATA_FILE || 'server/data/ranking.json')
const origins = (process.env.GAME_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',')
const teams = new Set(['podpah', 'capim', 'dendele', 'furia', 'g3x', 'loud', 'desimpain'])
const sessions = new Map()
let scores = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : []
const ttl = 30 * 60 * 1000
function send(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)) }
async function body(req) {
  let data = ''
  for await (const chunk of req) { data += chunk; if (data.length > 2_000_000) throw new Error('Corpo muito grande') }
  return JSON.parse(data || '{}')
}
export function verifyReplay(seed, inputs) {
  if (!Array.isArray(inputs) || inputs.length > MAX_TICKS) throw new Error('Replay inválido')
  let lastTick = -1
  for (const entry of inputs) {
    if (!entry || !Number.isInteger(entry.tick) || entry.tick <= lastTick || entry.tick >= MAX_TICKS ||
      ['left', 'right', 'jump'].some(k => typeof entry[k] !== 'boolean') ||
      (entry.target !== null && (!Number.isInteger(entry.target) || entry.target < 38 || entry.target > 922))) throw new Error('Controle inválido')
    lastTick = entry.tick
  }
  const match = createMatch(seed)
  let index = 0, input = {}
  while (!match.ended) {
    if (inputs[index]?.tick === match.tick) input = inputs[index++]
    advance(match, input)
  }
  if (index !== inputs.length) throw new Error('Controles após o fim da partida')
  return resultOf(match)
}
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin
  if (origin && !origins.includes(origin)) return send(res, 403, { error: 'Origem não autorizada' })
  if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin') }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }
  const now = Date.now()
  for (const [id, session] of sessions) if (now - session.created > ttl) sessions.delete(id)
  try {
    if (req.method === 'GET' && req.url === '/leaderboard') return send(res, 200, scores.slice(0, 50).map(({ playerId, ...row }) => row))
    if (req.method === 'POST' && req.url === '/sessions') {
      const data = await body(req)
      if (typeof data.playerId !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.playerId)) return send(res, 400, { error: 'Identidade inválida' })
      if (sessions.size >= 10000) return send(res, 503, { error: 'Tente novamente em instantes' })
      const ip = req.socket.remoteAddress
      if ([...sessions.values()].filter(s => s.ip === ip && now - s.created < 60000).length >= 30) return send(res, 429, { error: 'Muitas tentativas' })
      const session = { id: randomUUID(), seed: randomBytes(4).readUInt32LE(), created: now, ip, playerId: data.playerId }
      sessions.set(session.id, session)
      return send(res, 201, { id: session.id, seed: session.seed })
    }
    if (req.method === 'POST' && req.url === '/scores') {
      const data = await body(req)
      const session = sessions.get(data.sessionId)
      if (!session) return send(res, 400, { error: 'Sessão inválida ou expirada' })
      if (typeof data.name !== 'string' || data.name.trim().length < 2 || data.name.trim().length > 20 || /[\u0000-\u001f\u007f]/.test(data.name) || !teams.has(data.team)) return send(res, 400, { error: 'Nome ou time inválido' })
      const result = verifyReplay(session.seed, data.inputs)
      if (now - session.created + 1500 < result.duration * 1000) return send(res, 400, { error: 'Duração inválida' })
      const record = { ...result, name: data.name.trim(), team: data.team, id: randomUUID(), playerId: session.playerId, created: new Date().toISOString() }
      const previous = scores.find(row => row.playerId === session.playerId)
      if (previous && (previous.points > record.points || (previous.points === record.points && previous.score >= record.score))) {
        sessions.delete(session.id)
        return send(res, 200, { saved: true, improved: false })
      }
      const next = [...scores.filter(row => row.playerId !== session.playerId), record].sort((a, b) => b.points - a.points || b.score - a.score || a.created.localeCompare(b.created)).slice(0, 500)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file + '.tmp', JSON.stringify(next, null, 2))
      renameSync(file + '.tmp', file)
      scores = next
      sessions.delete(session.id)
      return send(res, 201, record)
    }
    send(res, 404, { error: 'Rota não encontrada' })
  } catch (error) { send(res, 400, { error: 'Não foi possível validar ou salvar a partida' }); console.error(error.message) }
})
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(port, process.env.GAME_HOST || '127.0.0.1', () => console.log(`Ranking Funkbol: http://localhost:${port}`))
}
export { server }
