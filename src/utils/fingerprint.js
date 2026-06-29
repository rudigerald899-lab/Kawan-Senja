// Generate browser fingerprint dari karakteristik HP
export async function generateFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || '',
    navigator.deviceMemory || '',
    canvasFingerprint(),
  ]
  const str = components.join('|')
  return await sha256(str)
}

function canvasFingerprint() {
  try {
    const c = document.createElement('canvas')
    const ctx = c.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#FF585D'
    ctx.fillText('KawanSenja2026', 2, 2)
    return c.toDataURL().slice(-50)
  } catch { return 'no-canvas' }
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// LocalStorage token management
const TOKEN_KEY = 'ks_claimed_2026'

export function hasClaimedToken() {
  try { return !!localStorage.getItem(TOKEN_KEY) } catch { return false }
}

export function setClaimedToken(kode) {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ kode, timestamp: new Date().toISOString() }))
  } catch { }
}

export function getClaimedToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
