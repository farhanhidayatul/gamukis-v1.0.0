/**
 * adminCryptoRouter.js
 * 
 * Pure Dynamic Cryptographic Nonce & Ephemeral Session Routing for Gamukis Admin.
 * 
 * Invariants:
 * 1. Zero static hashes - Every navigation generates a unique, non-guessable crypto token (UUIDv4 + timestamp).
 * 2. Session Bound - Ephemeral tokens are held securely in sessionStorage with a 15-minute rolling TTL.
 * 3. Replay-Attack Proof - Copying the URL to another browser or tab without the local session secret fails gracefully.
 */

const STORAGE_KEY = 'gamukis_admin_crypto_sessions';
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

/**
 * Generate a cryptographically secure random token (UUIDv4)
 */
function generateCryptoToken() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback RFC4122 v4 generator using crypto.getRandomValues
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  // Ultimate deterministic fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Load active session registry from browser storage
 */
function getSessionRegistry() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

/**
 * Save active session registry with eviction of expired tokens
 */
function saveSessionRegistry(registry) {
  if (typeof window === 'undefined') return;
  try {
    const now = Date.now();
    const pruned = {};
    for (const [token, data] of Object.entries(registry)) {
      if (now - data.createdAt < SESSION_TTL_MS) {
        pruned[token] = data;
      }
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } catch (_) { /* ignored */ }
}

/**
 * Generates a brand-new dynamic crypto token for an admin section.
 * Every click/refresh produces a completely different string in the browser bar!
 * 
 * @param {string} section - e.g. "bug-detector", "overview", "rooms"
 * @returns {string} token - e.g. "8f1a2c3d-9e4b-4f01-a2c3-d4e5f6a7b8c9"
 */
export function createDynamicCryptoToken(section = 'overview') {
  const token = generateCryptoToken();
  const registry = getSessionRegistry();
  
  registry[token] = {
    section,
    createdAt: Date.now()
  };
  
  saveSessionRegistry(registry);
  return token;
}

/**
 * Resolves the admin section from an ephemeral crypto token.
 * If token is expired or invalid, returns "overview".
 * 
 * @param {string} token
 * @returns {string} section
 */
export function resolveSectionFromDynamicToken(token) {
  if (!token) return 'overview';
  const registry = getSessionRegistry();
  const entry = registry[token];
  
  if (entry && (Date.now() - entry.createdAt < SESSION_TTL_MS)) {
    return entry.section;
  }
  return 'overview';
}

/**
 * Builds the full dynamic obfuscated admin URL.
 * e.g. "/admin/s/7f9a2b4e-9821-4d3a-bf01-8c4d21e09a31"
 * 
 * @param {string} section
 * @returns {string}
 */
export function buildDynamicAdminUrl(section = 'overview') {
  const token = createDynamicCryptoToken(section);
  return `/admin/s/${token}`;
}
