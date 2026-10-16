import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Stats from '../../component/component_home/stats';
import Home from '../../pages/home';
import * as leaderboardData from '../../database/leaderboardData';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let mockFirebaseUser = null;
let mockManualUser = null;

jest.mock('../../database/firebaseAuth', () => ({
  get auth() {
    return { currentUser: mockFirebaseUser };
  },
  onAuthStateChanged: (_auth, callback) => {
    callback(mockFirebaseUser);
    return jest.fn();
  }
}));

jest.mock('../../database/manualAuth', () => ({
  getManualUser: () => mockManualUser,
  getManualProfile: jest.fn().mockResolvedValue({
    profile: { fullName: 'Ahmad Syarukan', school: 'SMA Negeri 1 Cangkringan' }
  })
}));

jest.mock('../../database/firebaseDatabase', () => ({
  getAnswers: jest.fn().mockResolvedValue({}),
  getEffectiveToken: jest.fn().mockResolvedValue('test-token'),
  getBackendAccount: jest.fn().mockResolvedValue({ user: { fullName: 'Ahmad Syarukan', school: 'SMA Negeri 1 Cangkringan' } }),
  getBackendProfile: jest.fn().mockResolvedValue({ profile: { fullName: 'Ahmad Syarukan', school: 'SMA Negeri 1 Cangkringan' } })
}));

jest.mock('../../database/leaderboardData', () => ({
  __esModule: true,
  fetchLeaderboard: jest.fn().mockResolvedValue({ status: 'success', leaderboard: [], userRank: null }),
  fetchUserGameStats: jest.fn().mockImplementation((userId) => Promise.resolve({
    gamesPlayed: 5,
    totalScore: 250,
    maxScore: 100,
    totalCoins: 20,
    totalExp: 2050,
    exp: 2050,
    rank: 3
  })),
  recordGameScore: jest.fn().mockResolvedValue({ status: 'success' })
}));

describe('Home Pencapaian (Stats) - Guest Blur & Login/Register Integration', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mockFirebaseUser = null;
    mockManualUser = null;
    window.sessionStorage.clear();
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  describe('Stats Component Unit Tests (Guest vs Authenticated)', () => {
    it('applies blur effect and displays login/register overlay when user is not logged in', async () => {
      const handleLogin = jest.fn();
      const handleRegister = jest.fn();

      await act(async () => {
        root.render(
          <Stats
            onLoginClick={handleLogin}
            onRegisterClick={handleRegister}
          />
        );
      });

      // 1. Card body has blur class applied
      const cardBody = container.querySelector('.stats-card-body');
      expect(cardBody).not.toBeNull();
      expect(cardBody.classList.contains('is-blurred')).toBe(true);

      // 2. Guest overlay is rendered
      const overlay = container.querySelector('[data-testid="stats-guest-overlay"]');
      expect(overlay).not.toBeNull();
      expect(container.textContent).toContain('Fitur Pencapaian Terkunci');
      expect(container.textContent).toContain('Login untuk Melihat Pencapaian');

      // 3. Login button is present and triggers onLoginClick
      const loginBtn = container.querySelector('[data-testid="stats-login-button"]');
      expect(loginBtn).not.toBeNull();
      act(() => {
        loginBtn.click();
      });
      expect(handleLogin).toHaveBeenCalledTimes(1);

      // 4. Register button is present and triggers onRegisterClick
      const registerBtn = container.querySelector('[data-testid="stats-register-button"]');
      expect(registerBtn).not.toBeNull();
      act(() => {
        registerBtn.click();
      });
      expect(handleRegister).toHaveBeenCalledTimes(1);
    });

    it('blurs when Firebase user is anonymous', async () => {
      mockFirebaseUser = { isAnonymous: true, uid: 'anon_456' };
      mockManualUser = null;

      await act(async () => {
        root.render(<Stats />);
      });

      const cardBody = container.querySelector('.stats-card-body');
      expect(cardBody.classList.contains('is-blurred')).toBe(true);
      expect(container.querySelector('[data-testid="stats-guest-overlay"]')).not.toBeNull();
    });

    it('blurs when isGuest prop is explicitly set to true', async () => {
      mockManualUser = { id: 10, username: 'TestUser' };

      await act(async () => {
        root.render(<Stats isGuest={true} />);
      });

      const cardBody = container.querySelector('.stats-card-body');
      expect(cardBody.classList.contains('is-blurred')).toBe(true);
      expect(container.querySelector('[data-testid="stats-guest-overlay"]')).not.toBeNull();
    });

    it('blurs when isLoggedIn prop is explicitly set to false', async () => {
      mockManualUser = { id: 10, username: 'TestUser' };

      await act(async () => {
        root.render(<Stats isLoggedIn={false} />);
      });

      const cardBody = container.querySelector('.stats-card-body');
      expect(cardBody.classList.contains('is-blurred')).toBe(true);
      expect(container.querySelector('[data-testid="stats-guest-overlay"]')).not.toBeNull();
    });

    it('renders normal unblurred card when user is logged in via manual auth', async () => {
      mockManualUser = { id: 101, username: 'AhmadSyarukan' };

      await act(async () => {
        root.render(<Stats />);
      });

      const cardBody = container.querySelector('.stats-card-body');
      expect(cardBody.classList.contains('is-blurred')).toBe(false);
      expect(container.querySelector('[data-testid="stats-guest-overlay"]')).toBeNull();
      expect(container.querySelector('.stats-rank')).not.toBeNull();
    });

    it('renders normal unblurred card when user is logged in via Firebase', async () => {
      mockFirebaseUser = { isAnonymous: false, uid: 'fb_user_88', displayName: 'Budi' };

      await act(async () => {
        root.render(<Stats />);
      });

      const cardBody = container.querySelector('.stats-card-body');
      expect(cardBody.classList.contains('is-blurred')).toBe(false);
      expect(container.querySelector('[data-testid="stats-guest-overlay"]')).toBeNull();
      expect(cardBody.getAttribute('aria-hidden')).toBeNull();
    });

    it('dynamically toggles blur state when user logs in and logs out without page reload', async () => {
      // 1. Initial guest state: blurred
      mockManualUser = null;
      await act(async () => {
        root.render(<Stats />);
      });

      let cardBody = container.querySelector('.stats-card-body');
      expect(cardBody.classList.contains('is-blurred')).toBe(true);
      expect(cardBody.getAttribute('aria-hidden')).toBe('true');
      expect(container.querySelector('[data-testid="stats-guest-overlay"]')).not.toBeNull();

      // 2. User logs in dynamically
      mockManualUser = { id: 101, username: 'AhmadSyarukan' };
      await act(async () => {
        window.dispatchEvent(new Event('gamukis-manual-auth-change'));
      });

      cardBody = container.querySelector('.stats-card-body');
      expect(cardBody.classList.contains('is-blurred')).toBe(false);
      expect(cardBody.getAttribute('aria-hidden')).toBeNull();
      expect(container.querySelector('[data-testid="stats-guest-overlay"]')).toBeNull();

      // 3. User logs out dynamically
      mockManualUser = null;
      await act(async () => {
        window.dispatchEvent(new Event('gamukis-manual-auth-change'));
      });

      cardBody = container.querySelector('.stats-card-body');
      expect(cardBody.classList.contains('is-blurred')).toBe(true);
      expect(cardBody.getAttribute('aria-hidden')).toBe('true');
      expect(container.querySelector('[data-testid="stats-guest-overlay"]')).not.toBeNull();
    });

    it('safely handles login and register button clicks when fallback navigation is invoked', async () => {
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '' };

      await act(async () => {
        root.render(<Stats />);
      });

      const loginBtn = container.querySelector('[data-testid="stats-login-button"]');
      const registerBtn = container.querySelector('[data-testid="stats-register-button"]');

      act(() => {
        loginBtn.click();
      });
      expect(window.location.href).toBe('/login');

      act(() => {
        registerBtn.click();
      });
      expect(window.location.href).toBe('/register');

      window.location = originalLocation;
    });
  });

  describe('Home Page Full Integration Tests', () => {
    it('blurs Pencapaian on Home page for guests and navigates to /login when login button is clicked', async () => {
      mockFirebaseUser = null;
      mockManualUser = null;

      await act(async () => {
        root.render(
          <MemoryRouter
            initialEntries={['/home']}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<div data-testid="login-page">Halaman Login</div>} />
              <Route path="/register" element={<div data-testid="register-page">Halaman Register</div>} />
            </Routes>
          </MemoryRouter>
        );
      });

      // Card is blurred with overlay
      const cardBody = container.querySelector('.stats-card-body');
      expect(cardBody.classList.contains('is-blurred')).toBe(true);
      expect(container.querySelector('[data-testid="stats-guest-overlay"]')).not.toBeNull();

      // Click login button
      const loginBtn = container.querySelector('[data-testid="stats-login-button"]');
      await act(async () => {
        loginBtn.click();
      });

      expect(container.querySelector('[data-testid="login-page"]')).not.toBeNull();
    });

    it('blurs Pencapaian on Home page for guests and navigates to /register when register button is clicked', async () => {
      mockFirebaseUser = null;
      mockManualUser = null;

      await act(async () => {
        root.render(
          <MemoryRouter
            initialEntries={['/home']}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<div data-testid="login-page">Halaman Login</div>} />
              <Route path="/register" element={<div data-testid="register-page">Halaman Register</div>} />
            </Routes>
          </MemoryRouter>
        );
      });

      // Click register button
      const registerBtn = container.querySelector('[data-testid="stats-register-button"]');
      await act(async () => {
        registerBtn.click();
      });

      expect(container.querySelector('[data-testid="register-page"]')).not.toBeNull();
    });

    it('shows unblurred Pencapaian on Home page when user is logged in with synchronized EXP', async () => {
      mockManualUser = { id: 777, username: 'SyarukanGamukis' };
      window.localStorage.setItem('gamukis_user_exp_777', '2050');

      await act(async () => {
        root.render(
          <MemoryRouter
            initialEntries={['/home']}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </MemoryRouter>
        );
      });

      // Unblurred, no overlay
      const cardBody = container.querySelector('.stats-card-body');
      expect(cardBody.classList.contains('is-blurred')).toBe(false);
      expect(container.querySelector('[data-testid="stats-guest-overlay"]')).toBeNull();

      // Synchronized rank & EXP displays
      expect(container.querySelector('.stats-rank').textContent).toContain('Common 1');
      expect(container.querySelector('.stats-progress-label strong').textContent).toBe('60%');
    });
  });
});
