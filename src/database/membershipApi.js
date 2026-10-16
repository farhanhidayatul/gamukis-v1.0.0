
const API_BASE_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL
  : 'http://localhost:5000/api';

const CLEAN_API_URL = API_BASE_URL.replace(/\/+$/, '');
const MEMBERSHIPS_PREFIX = '/memberships';
const MEMBERSHIP_API_URL = `${CLEAN_API_URL}${MEMBERSHIPS_PREFIX}`;
const MANUAL_TOKEN_KEY = 'gamukis_manual_token';

let cachedAuth = null;

/**
 * Resolves Firebase auth instance lazily to avoid test-environment issues
 * with eager undici/TextEncoder imports in jsdom.
 */
const getFirebaseAuthInstance = async () => {
  if (cachedAuth) return cachedAuth;
  try {
    const fb = await import('./firebaseAuth');
    cachedAuth = fb.auth || fb.default?.auth || fb;
    return cachedAuth;
  } catch (err) {
    return null;
  }
};

/**
 * Extracts manual JWT authentication token from localStorage or sessionStorage.
 * @returns {string|null}
 */
const getStoredManualToken = () => {
  try {
    if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
      const token = localStorage.getItem(MANUAL_TOKEN_KEY);
      if (token) return token;
    }
  } catch (err) {
    // Ignore storage access errors
  }
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage && typeof sessionStorage.getItem === 'function') {
      const token = sessionStorage.getItem(MANUAL_TOKEN_KEY);
      if (token) return token;
    }
  } catch (err) {
    // Ignore storage access errors
  }
  return null;
};

/**
 * Extracts Firebase ID token from auth.currentUser if logged in via Google/Firebase.
 * @returns {Promise<string|null>}
 */
const getFirebaseAuthToken = async () => {
  try {
    const auth = await getFirebaseAuthInstance();
    if (auth && auth.currentUser && typeof auth.currentUser.getIdToken === 'function') {
      const token = await auth.currentUser.getIdToken();
      if (token) return token;
    }
  } catch (err) {
    // Ignore token acquisition errors
  }
  return null;
};

/**
 * Dynamically resolves authentication token:
 * 1. Checks localStorage / sessionStorage for 'gamukis_manual_token'.
 * 2. Checks Firebase currentUser and calls getIdToken().
 * 3. Returns null if unauthenticated.
 * @returns {Promise<string|null>}
 */
export const getAuthToken = async () => {
  const manualToken = getStoredManualToken();
  if (manualToken) {
    return manualToken;
  }
  const firebaseToken = await getFirebaseAuthToken();
  if (firebaseToken) {
    return firebaseToken;
  }
  return null;
};

/**
 * Base HTTP request wrapper for membership endpoints.
 * @param {string} path - Endpoint path (e.g. '/plans', '/me')
 * @param {RequestInit} [options={}] - Fetch options
 * @returns {Promise<any>}
 */
export const membershipRequest = async (path, options = {}) => {
  const token = await getAuthToken();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${MEMBERSHIP_API_URL}${normalizedPath}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (data && data.message) || `Permintaan membership gagal (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/**
 * Creates an enhanced collection object that behaves both as a standard response
 * object ({ [key]: array }) and exposes array-like iteration and methods.
 * @param {object} data - Raw response object
 * @param {string} key - Array property key ('plans' or 'history')
 * @returns {object}
 */
const createEnhancedCollection = (data, key) => {
  const list = Array.isArray(data?.[key]) ? data[key] : (Array.isArray(data) ? data : []);
  const result = {
    [key]: list,
    ...(data && typeof data === 'object' ? data : {})
  };

  Object.defineProperty(result, Symbol.iterator, {
    enumerable: false,
    value: function* () {
      yield* list;
    }
  });
  Object.defineProperty(result, 'length', {
    enumerable: false,
    get() { return list.length; }
  });
  Object.defineProperty(result, 'map', {
    enumerable: false,
    value: function(...args) { return list.map(...args); }
  });
  Object.defineProperty(result, 'filter', {
    enumerable: false,
    value: function(...args) { return list.filter(...args); }
  });
  Object.defineProperty(result, 'forEach', {
    enumerable: false,
    value: function(...args) { return list.forEach(...args); }
  });
  Object.defineProperty(result, 'find', {
    enumerable: false,
    value: function(...args) { return list.find(...args); }
  });
  Object.defineProperty(result, 'some', {
    enumerable: false,
    value: function(...args) { return list.some(...args); }
  });

  return result;
};

/**
 * Retrieves membership plans filtered by user role.
 * GET /api/memberships/plans
 * @param {RequestInit} [options={}]
 * @returns {Promise<{ plans: Array<object> }>}
 */
export const getPlans = async (options = {}) => {
  const data = await membershipRequest('/plans', {
    method: 'GET',
    ...options
  });
  return createEnhancedCollection(data, 'plans');
};

/**
 * Retrieves current active membership and pending orders for the logged-in user.
 * GET /api/memberships/me
 * @param {RequestInit} [options={}]
 * @returns {Promise<{ membership: object, pending: object|null }>}
 */
export const getMyMembership = async (options = {}) => {
  return await membershipRequest('/me', {
    method: 'GET',
    ...options
  });
};

/**
 * Retrieves membership transaction and plan history for the logged-in user.
 * GET /api/memberships/history
 * @param {RequestInit} [options={}]
 * @returns {Promise<{ history: Array<object> }>}
 */
export const getMembershipHistory = async (options = {}) => {
  const data = await membershipRequest('/history', {
    method: 'GET',
    ...options
  });
  return createEnhancedCollection(data, 'history');
};

/**
 * Alias for getMembershipHistory.
 */
export const getHistory = getMembershipHistory;

/**
 * Subscribes user to a membership plan by plan code.
 * POST /api/memberships/subscribe
 * @param {string|{ planCode: string, code?: string }} planOrCode
 * @param {RequestInit} [options={}]
 * @returns {Promise<{ message: string, membershipId: number, status: string, paymentUrl?: string|null }>}
 */
export const subscribePlan = async (planOrCode, options = {}) => {
  const planCode = (typeof planOrCode === 'object' && planOrCode !== null)
    ? (planOrCode.planCode || planOrCode.code)
    : planOrCode;

  return await membershipRequest('/subscribe', {
    method: 'POST',
    body: JSON.stringify({ planCode }),
    ...options
  });
};

/**
 * Cancels user's active/pending membership subscription.
 * POST /api/memberships/cancel
 * @param {RequestInit} [options={}]
 * @returns {Promise<{ success: boolean, cancelled: number }>}
 */
export const cancelMembership = async (options = {}) => {
  return await membershipRequest('/cancel', {
    method: 'POST',
    body: JSON.stringify({}),
    ...options
  });
};

/**
 * Retries an outstanding pending membership payment by calling the Midtrans
 * checkout retry endpoint. The contract returns the pending status and a
 * checkout URL to redirect the user to.
 * POST /api/memberships/pending/retry
 * @param {RequestInit} [options={}]
 * @returns {Promise<{ status: string, paymentUrl?: string, paymentToken?: string }>}
 */
export const retryPendingMembership = async (options = {}) => {
  return await membershipRequest('/pending/retry', {
    method: 'POST',
    body: JSON.stringify({}),
    ...options
  });
};

const membershipApi = {
  getAuthToken,
  membershipRequest,
  getPlans,
  getMyMembership,
  getMembershipHistory,
  getHistory,
  subscribePlan,
  cancelMembership,
  retryPendingMembership
};

export default membershipApi;
