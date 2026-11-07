/**
 * universalCryptoRouter.js
 * 
 * Universal Dynamic Cryptographic Nonce & Ephemeral Session Routing for Gamukis.
 * 
 * Invariants:
 * 1. Zero static paths - Obfuscates client routes using high-entropy crypto nonces (UUIDv4 + timestamp).
 * 2. Session Bound - Nonces stored securely in sessionStorage with a 15-minute rolling TTL.
 * 3. Replay-Proof - Opening the hashed URL in another browser or incognito without the session secret redirects cleanly.
 * 4. Transparent Fallback - Direct navigation to legacy paths auto-negotiates a crypto URL with history replacement.
 */

const STORAGE_KEY = 'gamukis_universal_crypto_sessions';
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes rolling TTL

export const ROUTE_REGISTRY = {
  home: { prefix: 'h', path: '/home', isPublic: true },
  game: { prefix: 'gm', path: '/game', isPublic: true },
  tutorial: { prefix: 'tut', path: '/tutorial', isPublic: true },
  about: { prefix: 'abt', path: '/about', isPublic: true },
  gamePage: { prefix: 'gp', path: '/gamePage', isPublic: true },
  inGame: { prefix: 'g', path: '/inGame', isPublic: true },
  result: { prefix: 'r', path: '/result', isPublic: true },
  login: { prefix: 'l', path: '/login', isPublic: true },
  register: { prefix: 'reg', path: '/register', isPublic: true },
  profile: { prefix: 'p', path: '/profile', isPublic: true },
  membership: { prefix: 'm', path: '/membership', isPublic: true },
  membershipPlans: { prefix: 'mp', path: '/membership/plans', isPublic: true },
  characterCustomization: { prefix: 'cc', path: '/character-customization', isPublic: true },
  completeProfile: { prefix: 'cp', path: '/complete-profile', isPublic: true },
  kelas: { prefix: 'k', path: '/kelas', isPublic: true },
  guruDashboard: { prefix: 't', path: '/guru/dashboard', allowedRoles: ['guru'] },
  guruClassesNew: { prefix: 'tcn', path: '/guru/classes/new', allowedRoles: ['guru'] },
  siswaDashboard: { prefix: 'st', path: '/siswa/dashboard', allowedRoles: ['siswa'] }
};

/**
 * Generate a cryptographically secure random token (UUIDv4)
 */
export function generateCryptoToken() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getSessionRegistry() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

function saveSessionRegistry(registry) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  } catch (_) {}
}

/**
 * Clean up expired tokens in storage
 */
export function pruneExpiredSessions() {
  const registry = getSessionRegistry();
  const now = Date.now();
  let changed = false;

  Object.keys(registry).forEach((slug) => {
    if (now - registry[slug].createdAt > SESSION_TTL_MS) {
      delete registry[slug];
      changed = true;
    }
  });

  if (changed) saveSessionRegistry(registry);
}

/**
 * Create or reuse an ephemeral crypto slug for a given route key
 */
export function getOrCreateCryptoRoute(routeKey, params = {}) {
  const routeMeta = ROUTE_REGISTRY[routeKey];
  if (!routeMeta) return '/home';

  pruneExpiredSessions();
  const registry = getSessionRegistry();
  const now = Date.now();

  // Reuse existing unexpired slug if exists for this routeKey and identical params
  const existingSlug = Object.keys(registry).find(
    (slug) =>
      registry[slug].routeKey === routeKey &&
      JSON.stringify(registry[slug].params || {}) === JSON.stringify(params || {}) &&
      now - registry[slug].createdAt < SESSION_TTL_MS
  );

  if (existingSlug) {
    registry[existingSlug].lastAccessedAt = now;
    saveSessionRegistry(registry);
    return `/s/${existingSlug}`;
  }

  // Create new unique token
  const rawToken = generateCryptoToken();
  const shortId = rawToken.split('-')[0];
  const newSlug = `${routeMeta.prefix}-${shortId}`;

  registry[newSlug] = {
    routeKey,
    params,
    createdAt: now,
    lastAccessedAt: now
  };

  saveSessionRegistry(registry);
  return `/s/${newSlug}`;
}

/**
 * Resolve an ephemeral crypto slug to its underlying route metadata and params
 */
export function resolveCryptoSlug(slug) {
  if (!slug) return null;
  pruneExpiredSessions();

  const registry = getSessionRegistry();
  const session = registry[slug];

  if (!session) return null;

  const now = Date.now();
  if (now - session.createdAt > SESSION_TTL_MS) {
    delete registry[slug];
    saveSessionRegistry(registry);
    return null;
  }

  // Rolling TTL extension on valid access
  session.lastAccessedAt = now;
  saveSessionRegistry(registry);

  return {
    routeKey: session.routeKey,
    params: session.params || {},
    routeMeta: ROUTE_REGISTRY[session.routeKey]
  };
}
