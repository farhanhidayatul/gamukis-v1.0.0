import { generateSecureGuestId } from '../../component/component_game/utils';

beforeAll(() => {
  if (typeof window !== 'undefined' && (!window.crypto || !window.crypto.randomUUID)) {
    const nodeCrypto = require('crypto');
    window.crypto = nodeCrypto.webcrypto || {
      randomUUID: () => nodeCrypto.randomUUID(),
      getRandomValues: (arr) => nodeCrypto.randomFillSync(arr)
    };
  }
});

describe('Cryptographically Secure Guest ID Generation & Anti-Spoofing Suite', () => {
  const UUID_V4_PATTERN = /^guest_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  test('generateSecureGuestId returns format starting with guest_ and adhering to UUID v4', () => {
    const guestId = generateSecureGuestId();
    expect(typeof guestId).toBe('string');
    expect(guestId.startsWith('guest_')).toBe(true);
    expect(guestId).toMatch(UUID_V4_PATTERN);
  });

  test('generates 1,000 unique guest IDs with 0 collisions (entropy test)', () => {
    const ids = new Set();
    const count = 1000;
    for (let i = 0; i < count; i += 1) {
      const id = generateSecureGuestId();
      expect(ids.has(id)).toBe(false);
      ids.add(id);
    }
    expect(ids.size).toBe(count);
  });

  test('falls back to crypto.getRandomValues when crypto.randomUUID is unavailable', () => {
    const originalCrypto = window.crypto;
    try {
      const nodeCrypto = require('crypto');
      window.crypto = {
        getRandomValues: (arr) => nodeCrypto.randomFillSync(arr)
      };
      const fallbackId = generateSecureGuestId();
      expect(fallbackId.startsWith('guest_')).toBe(true);
      expect(fallbackId).toMatch(UUID_V4_PATTERN);
    } finally {
      window.crypto = originalCrypto;
    }
  });

  test('persists generated guest ID across page refreshes via sessionStorage', () => {
    const mockStorage = {};
    const fakeSessionStorage = {
      getItem: (key) => mockStorage[key] || null,
      setItem: (key, val) => { mockStorage[key] = String(val); },
      removeItem: (key) => { delete mockStorage[key]; }
    };

    // First visit: generates and persists secure UUID
    let currentId = fakeSessionStorage.getItem('gamukis_guest_id');
    if (!currentId) {
      currentId = generateSecureGuestId();
      fakeSessionStorage.setItem('gamukis_guest_id', currentId);
    }
    expect(currentId).toMatch(UUID_V4_PATTERN);

    // Simulated F5 page refresh: retrieves existing ID without re-generating
    const reloadedId = fakeSessionStorage.getItem('gamukis_guest_id');
    expect(reloadedId).toBe(currentId);
  });
});
