/**
 * secureStorageCipher.js
 * 
 * Lightweight client-side stream obfuscator & encryption cipher for Gamukis browser storage.
 * 
 * Objectives:
 * 1. Obfuscates session caches (coins, health, question IDs, session metadata) in localStorage/sessionStorage.
 * 2. Prevents inspection via DevTools F12 (Application -> Local Storage).
 * 3. Fast symmetric stream XOR + dynamic session key + Base64 encoding.
 * 4. Backward-compatible: gracefully detects legacy plaintext JSON and migrates to encrypted format.
 */

const CIPHER_PREFIX = 'enc::';
const FALLBACK_SEED = 'gamukis_anti_tamper_f12_salt_v1';

/**
 * Derives a dynamic key stream from a base salt and optional session identifier.
 */
function deriveKey(sessionSecret = '') {
  const seed = `${FALLBACK_SEED}_${sessionSecret || 'default_entropy'}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Encrypts / obfuscates a JavaScript object or string into an opaque Base64 string.
 */
export function encryptPayload(data, sessionSecret = '') {
  if (data === null || data === undefined) return '';
  try {
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
    const key = deriveKey(sessionSecret);
    const keyLen = key.length;

    let output = '';
    for (let i = 0; i < jsonStr.length; i++) {
      const charCode = jsonStr.charCodeAt(i);
      const keyChar = key.charCodeAt(i % keyLen);
      // Bitwise XOR stream
      output += String.fromCharCode(charCode ^ keyChar);
    }

    // Convert to UTF-8 safe Base64
    const base64 = btoa(unescape(encodeURIComponent(output)));
    return `${CIPHER_PREFIX}${base64}`;
  } catch (_err) {
    // Graceful fallback to plaintext if btoa fails
    return typeof data === 'string' ? data : JSON.stringify(data);
  }
}

/**
 * Decrypts / deobfuscates an opaque cipher string back into original JSON or string.
 * Gracefully handles legacy unencrypted JSON strings for 100% backward compatibility.
 */
export function decryptPayload(raw, sessionSecret = '') {
  if (!raw || typeof raw !== 'string') return null;

  // 1. Check if payload is encrypted with our prefix
  if (raw.startsWith(CIPHER_PREFIX)) {
    try {
      const base64 = raw.slice(CIPHER_PREFIX.length);
      const decoded = decodeURIComponent(escape(atob(base64)));
      const key = deriveKey(sessionSecret);
      const keyLen = key.length;

      let jsonStr = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i);
        const keyChar = key.charCodeAt(i % keyLen);
        jsonStr += String.fromCharCode(charCode ^ keyChar);
      }

      return JSON.parse(jsonStr);
    } catch (_) {
      return null;
    }
  }

  // 2. Legacy fallback: parse raw plaintext JSON
  try {
    return JSON.parse(raw);
  } catch (_) {
    return raw;
  }
}
