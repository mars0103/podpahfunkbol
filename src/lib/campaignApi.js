const ROOT = import.meta.env.DEV ? '/game-api' : `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`
let csrf = '', mePromise
async function request(file, route, body, options = {}) {
  const response = await fetch(`${ROOT}/${file}.php?route=${route}`, {
    credentials: 'include', method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json', 'X-Game-CSRF': csrf } : {},
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(12000), ...options,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) { const error = new Error(data.error || 'Não foi possível conectar. Tente novamente.'); error.status = response.status; throw error }
  if (data.csrf) csrf = data.csrf
  return data
}
export function getGameAccount() {
  if (!mePromise) mePromise = request('game-auth', 'me').finally(() => { mePromise = null })
  return mePromise
}
export async function gameAuth(route, fields) {
  if (!csrf) await getGameAccount()
  return request('game-auth', route, fields)
}
export const campaignLeaderboard = () => request('game-football', 'leaderboard')
export const campaignPosition = () => request('game-football', 'position')
export async function campaignStart(team) { if (!csrf) await getGameAccount(); return request('game-football', 'start', { team, version: 9 }) }
export const campaignCheckpoint = payload => request('game-football', 'checkpoint', payload)
export const campaignFinish = payload => request('game-football', 'finish', payload)
export const campaignAbandon = id => request('game-football', 'abandon', { id }, { keepalive: true })

export const campaignTeamLeaderboard = () => request('game-football', 'teams')
export const gameChatRead = (after = '0') => request('game-chat', 'messages&after=' + encodeURIComponent(after))
export async function gameChatSend(body, nonce) {
  if (!csrf) await getGameAccount()
  return request('game-chat', 'send', { body, nonce })
}
