// Frontend/src/database/leaderboardData.js
// Sesuai aturan arsitektur PRD: Seluruh data fetching diletakkan di Frontend/src/database/

import { getEffectiveToken } from './firebaseDatabase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Mengambil data leaderboard (peringkat) dari Backend API.
 *
 * @param {string} period - 'alltime' | 'daily' | 'weekly'
 * @param {number} limit - Jumlah peringkat teratas yang diambil (default: 10)
 * @returns {Promise<object>} Objek berisi { period, leaderboard, userRank, source }
 */
export const fetchLeaderboard = async (period = 'alltime', limit = 10) => {
  const normPeriod = String(period || 'alltime').trim().toLowerCase();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 100));

  let token = null;
  try {
    token = await getEffectiveToken();
  } catch (e) {
    // Abaikan jika gagal mendapatkan token
  }

  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_URL}/leaderboard?period=${encodeURIComponent(normPeriod)}&limit=${safeLimit}`;

  const response = await fetch(url, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    throw new Error(`Gagal memuat papan peringkat (Status ${response.status})`);
  }

  const result = await response.json();
  return result;
};

/**
 * Mencatat hasil permainan ke backend untuk memperbarui leaderboard dan evaluasi badge.
 *
 * @param {object} scoreData - { score, coins, accuracy, timeRemaining, userId?, username? }
 * @returns {Promise<object>} Hasil penyimpanan & badge baru yang diraih
 */
export const recordGameScore = async (scoreData = {}) => {
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

  const payload = {
    score: Number(scoreData.score) || 0,
    coins: Number(scoreData.coins) || 0,
    accuracy: Number(scoreData.accuracy) || 0,
    timeRemaining: Number(scoreData.timeRemaining) || 0,
    userId: scoreData.userId,
    username: scoreData.username
  };

  if (scoreData.exp !== undefined && scoreData.exp !== null) {
    payload.exp = Number(scoreData.exp) || 0;
  }
  if (scoreData.totalExp !== undefined && scoreData.totalExp !== null) {
    payload.totalExp = Number(scoreData.totalExp) || 0;
  }
  if (scoreData.botKills !== undefined && scoreData.botKills !== null) {
    payload.botKills = Number(scoreData.botKills) || 0;
  }
  if (scoreData.playerKills !== undefined && scoreData.playerKills !== null) {
    payload.playerKills = Number(scoreData.playerKills) || 0;
  }
  if (scoreData.correctAnswers !== undefined && scoreData.correctAnswers !== null) {
    payload.correctAnswers = Number(scoreData.correctAnswers) || 0;
  }

  const response = await fetch(`${API_URL}/leaderboard/record`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Gagal mencatat skor permainan (Status ${response.status})`);
  }

  const result = await response.json();

  // Sinkronkan cache lokal secara instan
  if (typeof window !== 'undefined' && scoreData.userId) {
    try {
      const expKey = `gamukis_user_exp_${scoreData.userId}`;
      const stored = window.localStorage.getItem(expKey) || window.localStorage.getItem('gamukis_user_accumulated_exp');
      const prev = stored !== null ? Math.max(0, parseInt(stored, 10) || 0) : 0;
      const nextExp = scoreData.totalExp !== undefined && scoreData.totalExp !== null
        ? Number(scoreData.totalExp)
        : (scoreData.exp !== undefined ? prev + Number(scoreData.exp) : prev);

      if (nextExp > 0) {
        window.localStorage.setItem(expKey, String(nextExp));
        window.localStorage.setItem('gamukis_user_accumulated_exp', String(nextExp));
      }
    } catch (e) {}
  }

  return result;
};

/**
 * Mengambil ringkasan statistik permainan pengguna (jumlah bermain, total skor, akurasi, rank, totalExp).
 *
 * @param {string} [userId] - User ID pengguna
 * @returns {Promise<object>}
 */
export const fetchUserGameStats = async (userId = null) => {
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
    ? `${API_URL}/leaderboard/user-stats?userId=${encodeURIComponent(userId)}`
    : `${API_URL}/leaderboard/user-stats`;

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers
    });
  } catch (networkErr) {
    response = null;
  }

  let fallbackExp = 0;
  if (typeof window !== 'undefined') {
    try {
      const stored = (userId && window.localStorage.getItem(`gamukis_user_exp_${userId}`))
        || window.localStorage.getItem('gamukis_user_accumulated_exp');
      if (stored !== null) {
        fallbackExp = Math.max(0, parseInt(stored, 10) || 0);
      }
    } catch (e) {}
  }

  if (!response || !response.ok) {
    return {
      gamesPlayed: 0,
      totalScore: 0,
      maxScore: 0,
      totalCoins: 0,
      avgAccuracy: 0,
      totalExp: fallbackExp,
      exp: fallbackExp,
      rank: null,
      topScore: 0
    };
  }

  const result = await response.json();
  const stats = result.stats || {};

  let resolvedExp = stats.totalExp !== undefined && stats.totalExp !== null
    ? Number(stats.totalExp)
    : (stats.exp !== undefined && stats.exp !== null ? Number(stats.exp) : null);

  if (resolvedExp === null || isNaN(resolvedExp)) {
    if (fallbackExp > 0) {
      resolvedExp = fallbackExp;
    } else {
      resolvedExp = (Number(stats.totalScore) || 0) + (Number(stats.totalCoins) ? Number(stats.totalCoins) * 5 : 0);
    }
  }

  return {
    ...stats,
    totalExp: resolvedExp,
    exp: resolvedExp
  };
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchLeaderboard,
    recordGameScore,
    fetchUserGameStats
  };
}
