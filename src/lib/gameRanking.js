const BASE = import.meta.env.VITE_GAME_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/game.php`)
const KEY = 'funkbol-records-v1'
let identity
export function playerIdentity() {
  if (identity) return identity
  try { identity = localStorage.getItem('funkbol-player-id') } catch { /* Private mode. */ }
  if (!identity || !/^[0-9a-f-]{36}$/i.test(identity)) {
    identity = crypto.randomUUID()
    try { localStorage.setItem('funkbol-player-id', identity) } catch { /* Session identity only. */ }
  }
  return identity
}
export function localRecords() {
  try { const rows = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(rows) ? rows.filter(r => r && typeof r.name === 'string' && Number.isFinite(r.points)).slice(0, 50) : [] } catch { return [] }
}
export function saveLocal(record) {
  const rows = localRecords()
  const previous = rows.find(r => r.playerId === record.playerId)
  if (previous && (previous.points > record.points || (previous.points === record.points && previous.score >= record.score))) return true
  const records = [...rows.filter(r => r.playerId !== record.playerId), record].sort((a, b) => b.points - a.points || b.score - a.score).slice(0, 50)
  try { localStorage.setItem(KEY, JSON.stringify(records)); return true } catch { return false }
}
async function request(path, body) {
  if (!BASE) throw new Error('Ranking online não configurado')
  const url = BASE.endsWith('.php') ? `${BASE}?route=${encodeURIComponent(path.slice(1))}` : `${BASE}${path}`
  const response = await fetch(url, { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(6000) })
  if (!response.ok) throw new Error('Ranking indisponível')
  return response.json()
}
export const fetchRanking = () => request('/leaderboard')
export const startRankedMatch = () => request('/sessions', { playerId: playerIdentity() })
export const submitMatch = (record) => request('/scores', record)
