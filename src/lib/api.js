const BASE_URL = import.meta.env.DEV
  ? 'http://localhost/podpah-api'
  : `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.error || `Erro ${res.status}`)
  }
  return data
}

export function apiGet(path) {
  return request(path, { method: 'GET' })
}

export function apiPost(path, body) {
  return request(path, { method: 'POST', body: JSON.stringify(body) })
}

export function apiPut(path, body) {
  return request(path, { method: 'PUT', body: JSON.stringify(body) })
}

export function apiDelete(path) {
  return request(path, { method: 'DELETE' })
}

export async function apiUpload(file) {
  const form = new FormData()
  form.append('file', file)
  return request('/upload.php', { method: 'POST', body: form })
}
