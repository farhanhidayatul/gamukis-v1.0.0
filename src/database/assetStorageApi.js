/**
 * Frontend Asset Storage API & Masked CDN Resolver
 * 
 * Bertanggung jawab memuat aset gambar dari CDN bertopeng (Masked CDN).
 * Sama sekali tidak membocorkan nama bucket iDrive E2 ke client.
 * Memiliki mekanisme Smart Fallback ke aset lokal jika offline / gagal koneksi.
 */

const CDN_BASE_URL = process.env.REACT_APP_ASSET_STORAGE_URL || 'https://cdn.gamukis.site/assets';

/**
 * Mendapatkan URL aset dari Masked CDN
 * @param {string} relativePath - path relatif aset (contoh: 'characters/char_man_1.svg' atau 'asset_game/character/...')
 * @returns {string} URL CDN bertopeng
 */
export function getMaskedAssetUrl(relativePath) {
  if (!relativePath) return '';
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  const cleanPath = relativePath.replace(/^\/+/, '');
  return `${CDN_BASE_URL.replace(/\/+$/, '')}/${cleanPath}`;
}

/**
 * Smart Asset Image Loader dengan Graceful Fallback
 * Mencoba memuat gambar dari CDN. Jika gagal, otomatis beralih ke fallback lokal bawaan.
 * @param {string} cdnRelativePath - path pada CDN
 * @param {string} localFallbackModule - hasil import aset lokal (webpack bundled)
 * @returns {Promise<string>} URL gambar yang siap digunakan
 */
export function resolveAssetWithFallback(cdnRelativePath, localFallbackModule) {
  return new Promise((resolve) => {
    if (!cdnRelativePath) {
      return resolve(localFallbackModule);
    }

    const cdnUrl = getMaskedAssetUrl(cdnRelativePath);
    
    // Cek apakah gambar di CDN dapat dimuat
    const img = new Image();
    img.onload = () => {
      resolve(cdnUrl);
    };
    img.onerror = () => {
      // Fallback anggun ke lokal jika gagal
      resolve(localFallbackModule);
    };
    img.src = cdnUrl;
  });
}
