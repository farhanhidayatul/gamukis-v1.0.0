import {
  createDynamicCryptoToken,
  resolveSectionFromDynamicToken,
  buildDynamicAdminUrl
} from '../../utils/adminCryptoRouter';

describe('Admin Crypto Router (Pure Dynamic Nonce Session Routing)', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('generates unique, dynamic crypto tokens on every invocation', () => {
    const token1 = createDynamicCryptoToken('bug-detector');
    const token2 = createDynamicCryptoToken('bug-detector');

    expect(token1).not.toBe(token2);
    expect(token1).toMatch(/^[0-9a-f-]{36}$/);
    expect(token2).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('correctly resolves section from active session storage', () => {
    const token = createDynamicCryptoToken('monitoring');
    const section = resolveSectionFromDynamicToken(token);

    expect(section).toBe('monitoring');
  });

  it('falls back gracefully to overview when token is unknown or expired', () => {
    const fallback = resolveSectionFromDynamicToken('invalid-fake-token-xyz');
    expect(fallback).toBe('overview');
  });

  it('builds full dynamic URL with /admin/s/<uuid>', () => {
    const url = buildDynamicAdminUrl('ai-soal');
    expect(url).toMatch(/^\/admin\/s\/[0-9a-f-]{36}$/);
  });
});
