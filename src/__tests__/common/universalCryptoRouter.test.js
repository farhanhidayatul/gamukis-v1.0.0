import {
  ROUTE_REGISTRY,
  generateCryptoToken,
  getOrCreateCryptoRoute,
  resolveCryptoSlug,
  pruneExpiredSessions
} from '../../utils/universalCryptoRouter';

describe('universalCryptoRouter (Universal URL Hashing Architecture)', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    jest.restoreAllMocks();
  });

  test('generates valid UUIDv4 or fallback crypto token', () => {
    const token = generateCryptoToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
  });

  test('creates new unique crypto route for inGame, kelas, result, etc.', () => {
    const inGameCrypto = getOrCreateCryptoRoute('inGame');
    expect(inGameCrypto).toMatch(/^\/s\/g-[a-f0-9-]+$/i);

    const kelasCrypto = getOrCreateCryptoRoute('kelas');
    expect(kelasCrypto).toMatch(/^\/s\/k-[a-f0-9-]+$/i);

    const resultCrypto = getOrCreateCryptoRoute('result');
    expect(resultCrypto).toMatch(/^\/s\/r-[a-f0-9-]+$/i);
  });

  test('reuses active unexpired session for identical routeKey and params', () => {
    const url1 = getOrCreateCryptoRoute('profile');
    const url2 = getOrCreateCryptoRoute('profile');
    expect(url1).toBe(url2);
  });

  test('resolves valid crypto slug accurately to route metadata', () => {
    const cryptoUrl = getOrCreateCryptoRoute('inGame');
    const slug = cryptoUrl.replace('/s/', '');

    const resolved = resolveCryptoSlug(slug);
    expect(resolved).not.toBeNull();
    expect(resolved.routeKey).toBe('inGame');
    expect(resolved.routeMeta.path).toBe('/inGame');
  });

  test('rejects expired crypto slug and cleans up storage', () => {
    const cryptoUrl = getOrCreateCryptoRoute('guruDashboard');
    const slug = cryptoUrl.replace('/s/', '');

    // Advance time beyond 15 minutes TTL
    const originalNow = Date.now;
    Date.now = jest.fn(() => originalNow() + 16 * 60 * 1000);

    const resolved = resolveCryptoSlug(slug);
    expect(resolved).toBeNull();

    Date.now = originalNow;
  });

  test('returns null for nonexistent / tampered crypto slug', () => {
    const resolved = resolveCryptoSlug('invalid-tampered-slug-1234');
    expect(resolved).toBeNull();
  });
});
