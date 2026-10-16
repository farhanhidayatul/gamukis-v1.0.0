import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import RankSection from '../../component/component_result/rankSelection';
import Result from '../../pages/result';
import * as leaderboardData from '../../database/leaderboardData';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock Firebase & Manual Auth for predictable tests
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
  getManualUser: () => mockManualUser
}));

jest.mock('../../database/firebaseDatabase', () => ({
  __esModule: true,
  getAnswers: jest.fn().mockResolvedValue({})
}));

jest.mock('../../database/leaderboardData', () => ({
  __esModule: true,
  fetchLeaderboard: jest.fn().mockImplementation(() => Promise.resolve({ status: 'success', leaderboard: [], userRank: null })),
  fetchUserGameStats: jest.fn().mockImplementation((userId) => Promise.resolve({
    gamesPlayed: 5,
    totalScore: 250,
    maxScore: 100,
    totalCoins: 20,
    totalExp: 2200,
    rank: 3
  })),
  recordGameScore: jest.fn().mockImplementation(() => Promise.resolve({ status: 'success' }))
}));

const LocationSpy = () => {
  const location = useLocation();
  return <div data-testid="location-spy">{location.pathname}</div>;
};

describe('Result Rank Feature - Guest Blur & Login Button Integration', () => {
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

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        leaderboard: [],
        userRank: null,
        stats: {
          gamesPlayed: 5,
          totalScore: 250,
          maxScore: 100,
          totalCoins: 20,
          totalExp: 2200,
          rank: 3
        }
      })
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    jest.clearAllMocks();
  });

  describe('RankSection Component Unit Tests', () => {
    it('blurs the ranking section and displays login button overlay when player is a guest', () => {
      const handleLogin = jest.fn();

      act(() => {
        root.render(
          <RankSection
            coins={10}
            botKills={3}
            playerKills={2}
            currentExp={2050}
            previousExp={1750}
            isGuest={true}
            isLoggedIn={false}
            onLoginClick={handleLogin}
          />
        );
      });

      // 1. Ranking body has blur applied
      const rankingBody = container.querySelector('.rank-ranking-body');
      expect(rankingBody).not.toBeNull();
      expect(rankingBody.classList.contains('is-blurred')).toBe(true);

      // 2. Guest overlay is present with lock pill, title, and login button
      const overlay = container.querySelector('[data-testid="rank-guest-overlay"]');
      expect(overlay).not.toBeNull();
      expect(container.textContent).toContain('Fitur Rank Terkunci');
      expect(container.textContent).toContain('Login untuk Meningkatkan Ranking');

      const loginBtn = container.querySelector('[data-testid="rank-login-button"]');
      expect(loginBtn).not.toBeNull();
      expect(loginBtn.textContent).toContain('Login untuk Meningkatkan Ranking');

      // 3. Clicking login button triggers onLoginClick handler
      act(() => {
        loginBtn.click();
      });
      expect(handleLogin).toHaveBeenCalledTimes(1);

      // 4. Clicking the card does NOT trigger celebration in guest mode
      const card = container.querySelector('[data-testid="rank-card"]');
      act(() => {
        card.click();
      });
      expect(card.classList.contains('rank-celebrating')).toBe(false);

      // 5. CRITICAL: Match stats footer BELOW ranking is NOT blurred and displays clearly
      const matchFooter = container.querySelector('[data-testid="rank-match-footer"]');
      expect(matchFooter).not.toBeNull();
      expect(matchFooter.classList.contains('is-blurred')).toBe(false);
      expect(container.querySelector('.game-score-total').textContent).toBe('155'); // 10*5 + 3*15 + 2*30 = 155
      expect(container.textContent).toContain('Total Poin Game');
      expect(container.textContent).toContain('Koin (+50)');
      expect(container.textContent).toContain('Monster (+45)');
      expect(container.textContent).toContain('Player (+60)');
    });

    it('renders normal unblurred ranking section when player is logged in', () => {
      act(() => {
        root.render(
          <RankSection
            coins={8}
            botKills={2}
            playerKills={1}
            currentExp={2050}
            previousExp={1750}
            isGuest={false}
            isLoggedIn={true}
          />
        );
      });

      // 1. Ranking body is NOT blurred
      const rankingBody = container.querySelector('.rank-ranking-body');
      expect(rankingBody).not.toBeNull();
      expect(rankingBody.classList.contains('is-blurred')).toBe(false);

      // 2. Overlay is NOT rendered
      const overlay = container.querySelector('[data-testid="rank-guest-overlay"]');
      expect(overlay).toBeNull();

      // 3. Clicking card triggers celebration animation
      const card = container.querySelector('[data-testid="rank-card"]');
      act(() => {
        card.click();
      });
      expect(card.classList.contains('rank-celebrating')).toBe(true);

      // 4. Match stats footer below ranking is intact
      const matchFooter = container.querySelector('[data-testid="rank-match-footer"]');
      expect(matchFooter).not.toBeNull();
      expect(container.textContent).toContain('Total Poin Game');
    });

    it('defaults to backwards-compatible unblurred mode when auth props are omitted', () => {
      act(() => {
        root.render(
          <RankSection
            coins={5}
            botKills={1}
            playerKills={0}
          />
        );
      });

      const rankingBody = container.querySelector('.rank-ranking-body');
      expect(rankingBody.classList.contains('is-blurred')).toBe(false);
      expect(container.querySelector('[data-testid="rank-guest-overlay"]')).toBeNull();
    });
  });

  describe('Result Page Integration Tests', () => {
    it('automatically applies blur and renders login button when player is an unregistered guest', async () => {
      // Guest state: no firebase user and no manual user
      mockFirebaseUser = { isAnonymous: true, uid: 'anon_123' };
      mockManualUser = null;

      await act(async () => {
        root.render(
          <MemoryRouter
            initialEntries={[{
              pathname: '/result',
              state: { coins: 7, botKills: 4, playerKills: 0, isGuest: true }
            }]}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route path="/result" element={<Result />} />
              <Route path="/login" element={<div data-testid="login-page">Halaman Login</div>} />
            </Routes>
          </MemoryRouter>
        );
      });

      // Rank section is blurred with guest overlay
      const rankingBody = container.querySelector('.rank-ranking-body');
      expect(rankingBody.classList.contains('is-blurred')).toBe(true);

      const overlay = container.querySelector('[data-testid="rank-guest-overlay"]');
      expect(overlay).not.toBeNull();
      expect(container.textContent).toContain('Login untuk Meningkatkan Ranking');

      // The points below ranking ("Total Poin Game") remain completely visible
      expect(container.querySelector('.game-score-total').textContent).toBe('95'); // 7*5 + 4*15 = 95
      expect(container.textContent).toContain('Total Poin Game');
      expect(container.textContent).toContain('Koin (+35)');
      expect(container.textContent).toContain('Monster (+60)');
      expect(container.textContent).toContain('Player (+0)');

      // Clicking login button navigates to /login
      const loginBtn = container.querySelector('[data-testid="rank-login-button"]');
      await act(async () => {
        loginBtn.click();
      });
      expect(container.querySelector('[data-testid="login-page"]')).not.toBeNull();
    });

    it('renders normal rank without blur and connects to Home pencapaian when logged in via manual auth', async () => {
      // Manual registered user
      mockFirebaseUser = null;
      mockManualUser = { id: 42, username: 'AhmadSyarukan', email: 'ahmad@gamukis.com' };

      await act(async () => {
        root.render(
          <MemoryRouter
            initialEntries={[{
              pathname: '/result',
              state: { coins: 10, botKills: 2, playerKills: 1, isLoggedIn: true }
            }]}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route path="/result" element={<Result />} />
              <Route path="*" element={<LocationSpy />} />
            </Routes>
          </MemoryRouter>
        );
      });

      // No blur, no overlay
      const rankingBody = container.querySelector('.rank-ranking-body');
      expect(rankingBody.classList.contains('is-blurred')).toBe(false);
      expect(container.querySelector('[data-testid="rank-guest-overlay"]')).toBeNull();

      // Verified connection with user stats / Home pencapaian
      expect(leaderboardData.fetchUserGameStats).toHaveBeenCalledWith(42);

      // Total Poin Game below ranking displays properly
      expect(container.querySelector('.game-score-total').textContent).toBe('110'); // 10*5 + 2*15 + 1*30 = 110
      expect(container.textContent).toContain('Total Poin Game');
    });

    it('renders normal rank without blur when logged in via Firebase', async () => {
      // Firebase authenticated user
      mockFirebaseUser = { isAnonymous: false, uid: 'fb_user_99', displayName: 'Budi Santoso' };
      mockManualUser = null;

      await act(async () => {
        root.render(
          <MemoryRouter
            initialEntries={[{
              pathname: '/result',
              state: { coins: 5, botKills: 1, playerKills: 0, isLoggedIn: true }
            }]}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route path="/result" element={<Result />} />
            </Routes>
          </MemoryRouter>
        );
      });

      // No blur
      const rankingBody = container.querySelector('.rank-ranking-body');
      expect(rankingBody.classList.contains('is-blurred')).toBe(false);
      expect(container.querySelector('[data-testid="rank-guest-overlay"]')).toBeNull();

      // Verified connection with user stats
      expect(leaderboardData.fetchUserGameStats).toHaveBeenCalledWith('fb_user_99');

      // Points below ranking display clearly
      expect(container.querySelector('.game-score-total').textContent).toBe('40'); // 5*5 + 1*15 = 40
      expect(container.textContent).toContain('Total Poin Game');
    });

    it('correctly synchronizes with Home pencapaian when a new player has 0 accumulated EXP', async () => {
      // Mock fetchUserGameStats returning 0 EXP (new account)
      leaderboardData.fetchUserGameStats.mockResolvedValueOnce({
        gamesPlayed: 0,
        totalScore: 0,
        maxScore: 0,
        totalCoins: 0,
        totalExp: 0,
        rank: null
      });

      mockFirebaseUser = { isAnonymous: false, uid: 'newbie_01', displayName: 'Pemain Baru' };
      mockManualUser = null;

      await act(async () => {
        root.render(
          <MemoryRouter
            initialEntries={[{
              pathname: '/result',
              state: { coins: 0, botKills: 0, playerKills: 0, isLoggedIn: true }
            }]}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route path="/result" element={<Result />} />
            </Routes>
          </MemoryRouter>
        );
      });

      // Verification that fetchUserGameStats was called
      expect(leaderboardData.fetchUserGameStats).toHaveBeenCalledWith('newbie_01');
      // Should show Newbie rank for 0 + matchExp (e.g. 20 base EXP = Newbie 1)
      expect(container.querySelector('.rank-pill-badge').textContent).toBe('Newbie');
      expect(container.textContent).toContain('Pemain Baru');
    });

    it('displays manual user username when Firebase auth is null', async () => {
      mockFirebaseUser = null;
      mockManualUser = { id: 77, username: 'ManualHero', email: 'hero@gamukis.com' };

      await act(async () => {
        root.render(
          <MemoryRouter
            initialEntries={[{ pathname: '/result', state: { isLoggedIn: true } }]}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route path="/result" element={<Result />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(container.textContent).toContain('ManualHero');
    });

    it('displays Tamu for unauthenticated guest when both Firebase and manual auth are null', async () => {
      mockFirebaseUser = null;
      mockManualUser = null;

      await act(async () => {
        root.render(
          <MemoryRouter
            initialEntries={[{ pathname: '/result', state: { isGuest: true } }]}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route path="/result" element={<Result />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(container.textContent).toContain('Tamu');
      expect(container.querySelector('[data-testid="rank-guest-overlay"]')).not.toBeNull();
    });
  });
});
