describe('Google Auth vs Manual Auth Player ID Resolution', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  const resolvePid = (signedInManualUser, user, guestId) => {
    const hasManualToken = typeof window !== 'undefined'
      && Boolean(window.localStorage?.getItem('gamukis_manual_token') || window.sessionStorage?.getItem('gamukis_manual_token'));
    const isGoogleAuth = Boolean(user && !user.isAnonymous) || signedInManualUser?.authType === 'google';
    const isManualUser = Boolean(hasManualToken && !isGoogleAuth && (signedInManualUser?.id || signedInManualUser?.userId));

    return isManualUser
      ? `manual_${signedInManualUser.id || signedInManualUser.userId}`
      : (user?.uid || signedInManualUser?.id || guestId);
  };

  test('1. Google user resolves pid as user.uid without manual_ prefix', () => {
    // When Google user logs in, session is saved in gamukis_manual_user without gamukis_manual_token
    const googleUser = {
      uid: 'google-firebase-uid-789',
      isAnonymous: false
    };
    const savedSessionUser = {
      id: 'google-firebase-uid-789',
      email: 'student@gmail.com',
      username: 'Budi Santoso',
      authType: 'google'
    };

    const pid = resolvePid(savedSessionUser, googleUser, 'guest_123');
    expect(pid).toBe('google-firebase-uid-789');
    expect(pid.startsWith('manual_')).toBe(false);
  });

  test('2. Manual MySQL user with gamukis_manual_token resolves pid as manual_${id}', () => {
    window.localStorage.setItem('gamukis_manual_token', 'jwt.valid.token');
    const manualUser = {
      id: 42,
      email: 'guru@gamukis.com',
      username: 'Pak Guru',
      authType: 'manual'
    };

    const pid = resolvePid(manualUser, null, 'guest_123');
    expect(pid).toBe('manual_42');
  });

  test('3. True guest user resolves pid as guestId', () => {
    const pid = resolvePid(null, null, 'guest_9999');
    expect(pid).toBe('guest_9999');
  });
});
