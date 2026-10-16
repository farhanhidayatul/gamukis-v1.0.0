import { auth } from "./firebaseAuth";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const MANUAL_TOKEN_KEY = "gamukis_manual_token";

/**
 * Safely retrieves manual JWT token from localStorage or sessionStorage.
 * @returns {string|null}
 */
export const getStoredManualToken = () => {
  try {
    if (typeof window === "undefined") return null;
    return (
      window.localStorage?.getItem(MANUAL_TOKEN_KEY) ||
      window.sessionStorage?.getItem(MANUAL_TOKEN_KEY) ||
      null
    );
  } catch (e) {
    return null;
  }
};

/**
 * Resolves the effective authentication token:
 * 1. Manual JWT token for registered MySQL users.
 * 2. Firebase ID token for Google/anonymous users.
 * 3. Returns null if unauthenticated.
 * @returns {Promise<string|null>}
 */
export const getEffectiveToken = async () => {
  const user = auth?.currentUser;
  if (user && !user.isAnonymous && typeof user.getIdToken === "function") {
    try {
      const idToken = await user.getIdToken();
      if (idToken) return idToken;
    } catch (e) {
      // fallback
    }
  }

  const manualToken = getStoredManualToken();
  if (manualToken) {
    return manualToken;
  }

  if (user && typeof user.getIdToken === "function") {
    try {
      return await user.getIdToken();
    } catch (e) {
      return null;
    }
  }

  return null;
};

/**
 * Normalizes playerId parameter by stripping "manual_" prefix.
 * This guarantees that backend requireSelfOr (which compares against req.account.userId)
 * correctly matches for manual users, e.g. "manual_1:session" -> "1:session".
 * @param {string} playerId
 * @returns {string}
 */
export const normalizePlayerId = (playerId) => {
  if (!playerId) return playerId;
  return String(playerId).replace(/^manual_/, "");
};

/**
 * Sends authenticated HTTP request to backend API.
 */
const request = async (path, options = {}) => {
  const token = await getEffectiveToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Permintaan ke backend gagal.");
  }

  return response.json();
};

const createBackendSession = async () => request('/auth/session', { method: 'POST' });
const getBackendAccount = async () => request('/access/me');
const getBackendProfile = async () => request('/auth/profile');
const saveBackendProfile = (profile) => request('/auth/profile', {
  method: 'POST',
  body: JSON.stringify(profile)
});
const saveFirebaseCompleteProfile = (profile) => request('/auth/complete-profile', {
  method: 'PUT',
  body: JSON.stringify(profile)
});

const updateBackendRole = (data) => request('/auth/role', {
  method: 'PATCH',
  body: JSON.stringify(data)
});

const updatePlayerData = (playerId, data) => request(`/players/${normalizePlayerId(playerId)}`, {
  method: "PUT",
  body: JSON.stringify(data)
});

const patchPlayerData = (playerId, data) => request(`/players/${normalizePlayerId(playerId)}`, {
  method: "PATCH",
  body: JSON.stringify(data)
});

const getPlayers = () => request("/players");
const getCoins = () => request("/players/coins");
const setCoin = (coinId, data) => request(`/players/coins/${coinId}`, {
  method: "PUT",
  body: JSON.stringify(data)
});
const removeCoin = (coinId) => request(`/players/coins/${coinId}`, {
  method: "DELETE"
});

const getAnswers = (playerId) => request(`/players/answers/${normalizePlayerId(playerId)}`);

const addAnswer = (playerId, data) => request(`/players/answers/${normalizePlayerId(playerId)}`, {
  method: "POST",
  body: JSON.stringify(data)
});

/**
 * Persists session metrics into MySQL history table via POST /api/players/history.
 * @param {object} history - Session history summary
 * @param {string} history.time_playing - Duration in HH:MM:SS format
 * @param {number} history.answer_true - Total correct answers
 * @param {number} history.answer_false - Total incorrect answers
 * @param {string} [history.desc_answer_true] - List of correct questions
 * @param {string} [history.desc_answer_false] - List of incorrect questions
 * @param {number} history.all_question - Total questions in set
 * @param {number} history.coin - Total coins collected
 * @param {number} history.death - 1 if died, 0 if survived
 * @returns {Promise<{success: boolean, id_history: number}>}
 */
const saveGameHistory = (history) => request('/players/history', {
  method: 'POST',
  body: JSON.stringify(history)
});

const getPlayerData = async (playerId) => {
  try {
    return await request(`/players/${normalizePlayerId(playerId)}`);
  } catch (error) {
    if (error.message === "Player tidak ditemukan.") return null;
    throw error;
  }
};

const removePlayer = (playerId) => request(`/players/${normalizePlayerId(playerId)}`, {
  method: "DELETE"
});

const observePlayers = (callback, interval = 5000) => {
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      callback(await request("/players"));
    } catch (error) {
      console.error("Error observing players:", error);
    }
  };

  poll();
  const timer = window.setInterval(poll, interval);
  return () => {
    active = false;
    window.clearInterval(timer);
  };
};

const setPlayerOfflineOnDisconnect = (playerId) => {
  window.addEventListener("beforeunload", () => {
    request(`/players/${normalizePlayerId(playerId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "offline" })
    }).catch(() => {});
  }, { once: true });
};

export {
  updatePlayerData,
  patchPlayerData,
  getPlayerData,
  getPlayers,
  getCoins,
  setCoin,
  removeCoin,
  getAnswers,
  addAnswer,
  saveGameHistory,
  removePlayer,
  observePlayers,
  setPlayerOfflineOnDisconnect,
  createBackendSession,
  getBackendAccount,
  getBackendProfile,
  saveBackendProfile,
  saveFirebaseCompleteProfile,
  updateBackendRole
};
