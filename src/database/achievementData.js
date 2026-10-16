// Frontend/src/database/achievementData.js
// Sesuai aturan arsitektur PRD: Seluruh data fetching diletakkan di Frontend/src/database/

import { getEffectiveToken } from './firebaseDatabase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Mengambil daftar seluruh badge/prestasi yang ada di dalam permainan.
 *
 * @returns {Promise<Array<object>>} Daftar semua prestasi
 */
export const fetchAllAchievements = async () => {
  const response = await fetch(`${API_URL}/achievements/list`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Gagal memuat katalog prestasi (Status ${response.status})`);
  }

  const result = await response.json();
  return result.achievements || [];
};

/**
 * Mengambil daftar badge/prestasi yang telah diraih oleh pemain saat ini.
 *
 * @param {string} [userId] - Opsional userId jika belum login dengan Bearer token
 * @returns {Promise<Array<object>>} Daftar prestasi yang dimiliki
 */
export const fetchMyAchievements = async (userId = null) => {
  let token = null;
  try {
    token = await getEffectiveToken();
  } catch (e) {
    // Abaikan
  }

  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = userId
    ? `${API_URL}/achievements/my?userId=${encodeURIComponent(userId)}`
    : `${API_URL}/achievements/my`;

  const response = await fetch(url, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    if (response.status === 401) {
      return []; // Tamu atau belum login tidak memiliki prestasi tersimpan
    }
    throw new Error(`Gagal memuat prestasi pemain (Status ${response.status})`);
  }

  const result = await response.json();
  return result.achievements || [];
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchAllAchievements,
    fetchMyAchievements
  };
}
