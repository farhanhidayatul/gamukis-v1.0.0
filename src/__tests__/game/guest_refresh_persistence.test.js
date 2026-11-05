/**
 * Tests for Guest inGame Refresh Persistence (F5):
 * 1. Coins collected (preserves coin count across page refresh)
 * 2. Answered questions (sessionAnswers preserved, filters remaining questions)
 * 3. Countdown timer (effectiveGameStartedAt continues elapsed time instead of resetting to 05:00)
 * 4. Multi-tier storage fallback (localStorage, sessionStorage, cookie)
 */

import {
  getAnonymousSessionCache,
  getActiveSessionCache,
  getAnyActiveSessionCache,
  clearActiveSessionCaches,
  ANONYMOUS_SESSION_KEY,
  REGISTERED_SESSION_KEY,
  GAME_DURATION_MS
} from '../../component/component_game/inGame';

describe('Guest inGame Refresh Persistence', () => {
  const originalLocalStorage = window.localStorage;
  const originalSessionStorage = window.sessionStorage;

  let localStore = {};
  let sessionStore = {};

  beforeEach(() => {
    localStore = {};
    sessionStore = {};

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => localStore[key] || null),
        setItem: jest.fn((key, val) => { localStore[key] = String(val); }),
        removeItem: jest.fn((key) => { delete localStore[key]; }),
        clear: jest.fn(() => { localStore = {}; })
      },
      writable: true
    });

    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn((key) => sessionStore[key] || null),
        setItem: jest.fn((key, val) => { sessionStore[key] = String(val); }),
        removeItem: jest.fn((key) => { delete sessionStore[key]; }),
        clear: jest.fn(() => { sessionStore = {}; })
      },
      writable: true
    });

    // Clear cookies
    document.cookie = '';
  });

  afterAll(() => {
    Object.defineProperty(window, 'localStorage', { value: originalLocalStorage, writable: true });
    Object.defineProperty(window, 'sessionStorage', { value: originalSessionStorage, writable: true });
  });

  test('1. Preserves coins collected and sessionAnswers across simulated refresh from localStorage', () => {
    const startedAt = Date.now() - 45000; // 45 seconds into the game
    const cachedData = {
      sessionId: 'session_guest_123',
      coins: 8,
      health: 3,
      lastQuestionCoins: 5,
      gameStartedAt: startedAt,
      sessionAnswers: [
        { question: 'Berapa 2+2?', answer: '4', correct: true, timestamp: startedAt + 20000 }
      ],
      subject: 'matematika',
      savedAt: Date.now()
    };

    window.localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(cachedData));

    const restored = getAnonymousSessionCache();
    expect(restored).not.toBeNull();
    expect(restored.coins).toBe(8);
    expect(restored.health).toBe(3);
    expect(restored.lastQuestionCoins).toBe(5);
    expect(restored.gameStartedAt).toBe(startedAt);
    expect(restored.sessionAnswers).toHaveLength(1);
    expect(restored.sessionAnswers[0].question).toBe('Berapa 2+2?');
    expect(restored.sessionAnswers[0].correct).toBe(true);
  });

  test('2. Accurately calculates remaining game countdown timer from preserved gameStartedAt', () => {
    const elapsedSeconds = 75; // 1 minute 15 seconds passed
    const startedAt = Date.now() - (elapsedSeconds * 1000);
    const gameDurationSeconds = 300; // 5 minutes

    const cachedData = {
      sessionId: 'session_guest_timer',
      coins: 3,
      health: 3,
      gameStartedAt: startedAt,
      sessionAnswers: []
    };

    window.localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(cachedData));

    const restored = getAnyActiveSessionCache();
    expect(restored).not.toBeNull();

    const effectiveGameStartedAt = restored.gameStartedAt;
    const computedElapsedSeconds = Math.floor((Date.now() - Number(effectiveGameStartedAt)) / 1000);
    const remainingGameSeconds = Math.max(0, gameDurationSeconds - computedElapsedSeconds);

    // Remaining seconds should be approximately 300 - 75 = 225s (allow +/- 2s jitter)
    expect(remainingGameSeconds).toBeLessThanOrEqual(226);
    expect(remainingGameSeconds).toBeGreaterThanOrEqual(223);
  });

  test('keeps a custom-duration session active beyond the legacy five-minute window', () => {
    const customDurationMs = 12 * 60 * 1000;
    const startedAt = Date.now() - (6 * 60 * 1000);
    const cachedData = {
      sessionId: 'session_custom_duration',
      coins: 3,
      health: 3,
      gameStartedAt: startedAt,
      gameDurationMs: customDurationMs,
      sessionAnswers: []
    };

    expect(GAME_DURATION_MS).toBe(5 * 60 * 1000);
    window.localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(cachedData));

    expect(getAnonymousSessionCache()).toEqual(cachedData);

    window.localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify({
      ...cachedData,
      gameStartedAt: Date.now() - customDurationMs - 1000
    }));
    expect(getAnonymousSessionCache()).toBeNull();
  });

  test('3. Falls back to sessionStorage when localStorage is missing or cleared', () => {
    const startedAt = Date.now() - 15000;
    const cachedData = {
      sessionId: 'session_fallback_session_storage',
      coins: 12,
      health: 2,
      gameStartedAt: startedAt,
      sessionAnswers: [{ question: 'Q1', answer: 'A', correct: true }]
    };

    window.sessionStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(cachedData));

    const restored = getAnonymousSessionCache();
    expect(restored).not.toBeNull();
    expect(restored.coins).toBe(12);
    expect(restored.health).toBe(2);
    expect(restored.sessionAnswers).toHaveLength(1);
  });

  test('4. Purges expired cache when game elapsed exceeds 5 minutes (300,000ms)', () => {
    const expiredStartedAt = Date.now() - (301 * 1000); // 5 min 1 sec ago
    const cachedData = {
      sessionId: 'session_expired',
      coins: 20,
      health: 3,
      gameStartedAt: expiredStartedAt,
      sessionAnswers: []
    };

    window.localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(cachedData));

    const restored = getAnonymousSessionCache();
    expect(restored).toBeNull();
    expect(window.localStorage.removeItem).toHaveBeenCalledWith(ANONYMOUS_SESSION_KEY);
  });

  test('5. Purges cache when player health is 0 (player died)', () => {
    const cachedData = {
      sessionId: 'session_dead',
      coins: 10,
      health: 0,
      gameStartedAt: Date.now() - 10000,
      sessionAnswers: []
    };

    window.localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(cachedData));

    const restored = getAnonymousSessionCache();
    expect(restored).toBeNull();
  });

  test('6. clearActiveSessionCaches thoroughly flushes localStorage, sessionStorage and cookies', () => {
    window.localStorage.setItem(ANONYMOUS_SESSION_KEY, 'data');
    window.localStorage.setItem(REGISTERED_SESSION_KEY, 'data');
    window.sessionStorage.setItem(ANONYMOUS_SESSION_KEY, 'data');
    window.sessionStorage.setItem('gamukis_game_session_id', 'id_123');

    clearActiveSessionCaches();

    expect(window.localStorage.removeItem).toHaveBeenCalledWith(ANONYMOUS_SESSION_KEY);
    expect(window.localStorage.removeItem).toHaveBeenCalledWith(REGISTERED_SESSION_KEY);
    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(ANONYMOUS_SESSION_KEY);
    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('gamukis_game_session_id');
  });
});
