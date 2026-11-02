let mockCurrentUser = null;
let mockAuthStateReady = jest.fn();
let mockOnAuthStateChanged = jest.fn((authInstance, callback) => {
  callback(mockCurrentUser);
  return jest.fn();
});

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({}))
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    get currentUser() {
      return mockCurrentUser;
    },
    set currentUser(val) {
      mockCurrentUser = val;
    },
    authStateReady: () => mockAuthStateReady()
  })),
  GoogleAuthProvider: jest.fn(),
  onAuthStateChanged: (authInstance, callback) => mockOnAuthStateChanged(authInstance, callback),
  signInWithPopup: jest.fn(),
  signInAnonymously: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn()
}));

const { waitForAuth, auth } = require('../../database/firebaseAuth');
const { getEffectiveToken } = require('../../database/firebaseDatabase');

describe('Google Auth In-Game Session Synchronization & Token Resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = null;
    mockAuthStateReady = jest.fn().mockResolvedValue(null);
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      window.sessionStorage.clear();
    }
  });

  describe('waitForAuth helper', () => {
    test('resolves auth.currentUser immediately when authStateReady resolves', async () => {
      const mockGoogleUser = {
        uid: 'google-user-12345',
        displayName: 'Gamukis Champion',
        email: 'champion@gamukis.com',
        isAnonymous: false,
        getIdToken: jest.fn().mockResolvedValue('mock-google-id-token')
      };

      mockAuthStateReady = jest.fn().mockImplementation(async () => {
        mockCurrentUser = mockGoogleUser;
      });

      const user = await waitForAuth();
      expect(mockAuthStateReady).toHaveBeenCalled();
      expect(user).toEqual(mockGoogleUser);
      expect(user.uid).toBe('google-user-12345');
    });

    test('returns null when user is truly unauthenticated guest', async () => {
      mockAuthStateReady = jest.fn().mockImplementation(async () => {
        mockCurrentUser = null;
      });

      const user = await waitForAuth();
      expect(mockAuthStateReady).toHaveBeenCalled();
      expect(user).toBeNull();
    });
  });

  describe('getEffectiveToken token resolution', () => {
    test('awaits waitForAuth and resolves Google ID token instead of falling back to guest', async () => {
      const mockGoogleUser = {
        uid: 'google-user-999',
        displayName: 'Pro Player',
        email: 'player@gamukis.com',
        isAnonymous: false,
        getIdToken: jest.fn().mockResolvedValue('valid-google-jwt-token')
      };

      // Initially null (simulating async cold mount / SPA navigation)
      mockCurrentUser = null;
      mockAuthStateReady = jest.fn().mockImplementation(async () => {
        mockCurrentUser = mockGoogleUser;
      });

      const token = await getEffectiveToken();
      expect(token).toBe('valid-google-jwt-token');
      expect(mockGoogleUser.getIdToken).toHaveBeenCalled();
    });

    test('prioritizes manual MySQL JWT token if stored in localStorage', async () => {
      window.localStorage.setItem('gamukis_manual_token', 'manual-jwt-token-abc');

      mockCurrentUser = {
        uid: 'some-other-uid',
        isAnonymous: false,
        getIdToken: jest.fn().mockResolvedValue('google-token')
      };

      const token = await getEffectiveToken();
      expect(token).toBe('manual-jwt-token-abc');
    });

    test('returns null if neither manual user nor Google user exists', async () => {
      mockCurrentUser = null;
      mockAuthStateReady = jest.fn().mockResolvedValue(null);

      const token = await getEffectiveToken();
      expect(token).toBeNull();
    });
  });

  describe('InGame Session Auth Guarantees', () => {
    test('Google user session is synchronous when currentUser is already in memory', () => {
      const activeGoogleUser = {
        uid: 'google-mem-123',
        displayName: 'Instant Mount User',
        isAnonymous: false
      };
      mockCurrentUser = activeGoogleUser;

      // Verify that auth.currentUser is ready for 0ms frame-1 mount
      expect(auth.currentUser).not.toBeNull();
      expect(auth.currentUser.isAnonymous).toBe(false);
      expect(auth.currentUser.uid).toBe('google-mem-123');
    });
  });
});
