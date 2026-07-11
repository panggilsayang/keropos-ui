/**
 * Secure Storage
 *
 * Encrypt/decrypt data sebelum disimpan ke localStorage menggunakan
 * Web Crypto API (AES-GCM). Key di-derive dari app secret + salt via PBKDF2.
 *
 * Ini bukan pengganti HTTPS atau server-side security, tapi mencegah
 * data sensitif (token, user info) terbaca langsung dari DevTools / XSS dump.
 */

const STORAGE_PREFIX = 'purdia_'
const APP_SECRET = 'purdia-client-secret-v1' // static passphrase for key derivation
const ITERATIONS = 100_000

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function encode(text: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(text)
}

function decode(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer)
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

function fromBase64(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function deriveKey(salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey('raw', encode(APP_SECRET), 'PBKDF2', false, [
    'deriveKey',
  ])

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Encrypt & store a value in localStorage.
 */
export async function secureSet(key: string, value: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cryptoKey = await deriveKey(salt)

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encode(value))

  // Store as: salt(base64) . iv(base64) . ciphertext(base64)
  const payload = [
    toBase64(salt.buffer as ArrayBuffer),
    toBase64(iv.buffer as ArrayBuffer),
    toBase64(encrypted),
  ].join('.')

  localStorage.setItem(STORAGE_PREFIX + key, payload)
}

/**
 * Retrieve & decrypt a value from localStorage.
 * Returns null if key doesn't exist or decryption fails.
 */
export async function secureGet(key: string): Promise<string | null> {
  const raw = localStorage.getItem(STORAGE_PREFIX + key)
  if (!raw) return null

  try {
    const [saltB64, ivB64, dataB64] = raw.split('.')
    if (!saltB64 || !ivB64 || !dataB64) return null

    const salt = fromBase64(saltB64)
    const iv = fromBase64(ivB64)
    const data = fromBase64(dataB64)
    const cryptoKey = await deriveKey(salt)

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, data)

    return decode(decrypted)
  } catch {
    // Decryption failed — corrupted or tampered data
    secureRemove(key)
    return null
  }
}

/**
 * Remove an encrypted value from localStorage.
 */
export function secureRemove(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key)
}

/**
 * Remove all purdia-prefixed items from localStorage.
 */
export function secureClearAll(): void {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(STORAGE_PREFIX)) keys.push(k)
  }
  keys.forEach((k) => localStorage.removeItem(k))
}
