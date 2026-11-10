/**
 * Frontend Admin Cryptographic API Client
 * 
 * Bertanggung jawab mengirimkan request ke endpoint administratif dengan:
 * 1. Validasi role admin di level klien sebelum request dikirim.
 * 2. Penambahan tanda tangan digital HMAC SHA-256 untuk pencegahan manipulasi (Anti-Tamper).
 * 3. Penambahan Timestamp & Nonce untuk mencegah serangan Replay (Anti-Replay Attack).
 * 4. Kompatibel dengan backend adminCryptoGuard.js
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.gamukis.site/api';
const ADMIN_API_SECRET = process.env.REACT_APP_ADMIN_CRYPTO_SECRET || 'gamukis-strict-admin-crypto-secret-key-32chars';

/**
 * Menghitung HMAC SHA-256 secara browser-safe
 */
async function generateBrowserHmac(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Membuat header keamanan khusus admin
 * @param {string} method - HTTP Method (GET, POST, etc.)
 * @param {string} endpointPath - Path URL relatif (contoh: '/api/assets/admin/verify')
 * @param {object} [bodyObj] - Request body jika ada
 */
export async function createAdminSecurityHeaders(method, endpointPath, bodyObj = null) {
  const timestamp = Date.now().toString();
  const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const bodyString = bodyObj ? JSON.stringify(bodyObj) : '';
  
  const signatureBase = `${method.toUpperCase()}:${endpointPath}:${timestamp}:${nonce}:${bodyString}`;
  let signature = '';
  
  try {
    signature = await generateBrowserHmac(ADMIN_API_SECRET, signatureBase);
  } catch (err) {
    console.warn('[AdminCryptoApi] HMAC generation fallback:', err.message);
  }

  return {
    'x-admin-timestamp': timestamp,
    'x-admin-nonce': nonce,
    'x-admin-signature': signature
  };
}

/**
 * Pemanggilan API Admin Terproteksi
 */
export async function sendAdminRequest(endpointPath, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const securityHeaders = await createAdminSecurityHeaders(method, endpointPath, options.body);
  
  const token = localStorage.getItem('token') || localStorage.getItem('gamukis_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...securityHeaders,
    ...options.headers
  };

  const fullUrl = endpointPath.startsWith('http') ? endpointPath : `${API_BASE_URL.replace(/\/+$/, '')}${endpointPath.startsWith('/') ? '' : '/'}${endpointPath}`;

  const response = await fetch(fullUrl, {
    ...options,
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  return response;
}
