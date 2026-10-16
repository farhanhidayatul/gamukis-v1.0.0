// Frontend/src/database/questionData.js
// Sesuai aturan arsitektur PRD: Seluruh data fetching diletakkan di Frontend/src/database/

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Mengambil soal acak dari Backend API dengan parameter subject dan count.
 * Mendukung graceful fallback pada pemanggil jika API backend offline/gagal.
 *
 * @param {string} subject - Nama mata pelajaran (e.g. 'indonesia', 'biologi', 'kimia', 'fisika', 'sosiologi', 'matematika')
 * @param {number} count - Jumlah soal yang diminta (default 10)
 * @returns {Promise<Array<object>>} Daftar soal
 */
export const fetchRandomQuestions = async (subject = 'indonesia', count = 10) => {
  const normSubject = String(subject || 'indonesia').trim().toLowerCase();
  const safeCount = Math.max(1, Math.min(Number(count) || 10, 50));

  const url = `${API_URL}/questions/random?subject=${encodeURIComponent(normSubject)}&count=${safeCount}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil soal dari server (Status ${response.status})`);
  }

  const result = await response.json();
  const questions = result.questions || result.data || (Array.isArray(result) ? result : []);
  return questions;
};

/**
 * Mengambil seluruh bank soal untuk mata pelajaran tertentu.
 *
 * @param {string} subject
 * @returns {Promise<Array<object>>}
 */
export const fetchQuestionsBySubject = async (subject = 'indonesia') => {
  const normSubject = String(subject || 'indonesia').trim().toLowerCase();
  const url = `${API_URL}/questions?subject=${encodeURIComponent(normSubject)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil daftar soal (Status ${response.status})`);
  }

  const result = await response.json();
  return result.questions || result.data || (Array.isArray(result) ? result : []);
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchRandomQuestions,
    fetchQuestionsBySubject
  };
}

