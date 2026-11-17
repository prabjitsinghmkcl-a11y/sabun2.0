const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` : '/api'
export const TOKEN_KEY = 'sabun-token'

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  let token = null
  try {
    token = localStorage.getItem(TOKEN_KEY)
  } catch {
    /* storage unavailable */
  }
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    const err = new Error('Could not reach the server. Is the backend running? (npm run server)')
    err.status = 0
    throw err
  }

  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    // Got HTML instead of JSON → the /api backend isn't deployed at this address
    const err = new Error(
      res.ok || res.status === 404 || res.status === 405
        ? 'API not found at /api — the backend is not deployed at this address.'
        : `Request failed (${res.status})`,
    )
    err.status = res.status
    throw err
  }

  // Empty 500/502/503/504 from the dev proxy = the backend server isn't running
  if (!res.ok && !text && res.status >= 500) {
    const err = new Error(
      import.meta.env.DEV
        ? 'Backend server is not running. Start it with "npm run dev:all" (or "npm run server" in a second terminal).'
        : 'The server is not responding right now. Please try again in a minute.',
    )
    err.status = res.status
    throw err
  }

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`)
    err.status = res.status
    err.data = data
    if (res.status === 401) {
      err.name = 'SessionExpiredError'
      if (token && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sabun:unauthorized'))
      }
    }
    throw err
  }
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  del: (path, body) => request(path, body === undefined ? { method: 'DELETE' } : { method: 'DELETE', body: JSON.stringify(body) }),
}

// Multipart upload (product images). Uses fetch directly because the request
// body is FormData, not JSON.
export async function uploadImage(file) {
  const form = new FormData()
  form.append('image', file)

  let token = null
  try {
    token = localStorage.getItem(TOKEN_KEY)
  } catch {
    /* storage unavailable */
  }

  let res
  try {
    res = await fetch(`${API_BASE}/admin/uploads/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
  } catch {
    const err = new Error('Could not reach the server. Is the backend running?')
    err.status = 0
    throw err
  }

  const data = await res.json().catch(() => ({}))
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('sabun:unauthorized'))
    const err = new Error(data.error || 'Upload failed')
    err.status = 401
    err.name = 'SessionExpiredError'
    throw err
  }
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`)
  return data
}
