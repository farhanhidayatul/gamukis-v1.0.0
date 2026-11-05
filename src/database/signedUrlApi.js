/**
 * API client helper for HMAC Signed URLs in Gamukis
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Requests backend to generate a signed URL with HMAC-SHA256 signature and TTL
 * @param {string} targetPath 
 * @param {Record<string, any>} [params] 
 * @param {number} [ttlSeconds=300] 
 * @returns {Promise<{ signedUrl: string, targetPath: string, ttlSeconds: number }>}
 */
export async function generateSignedUrl(targetPath, params = {}, ttlSeconds = 300) {
  const res = await fetch(`${API_BASE_URL}/security/signed-url/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: targetPath, params, ttlSeconds })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal membuat signed URL.');
  }
  return data.data;
}

/**
 * Access a resource using a signed URL
 * @param {string} signedUrl 
 * @returns {Promise<any>}
 */
export async function accessSignedUrl(signedUrl) {
  const url = signedUrl.startsWith('http') ? signedUrl : `${API_BASE_URL.replace('/api', '')}${signedUrl}`;
  const res = await fetch(url, {
    method: 'GET'
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Akses ditolak pada signed URL.');
  }
  return data;
}
