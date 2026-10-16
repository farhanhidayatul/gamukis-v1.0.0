import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { fetchLeaderboard, recordGameScore } from '../../database/leaderboardData';
import { fetchAllAchievements, fetchMyAchievements } from '../../database/achievementData';
import LeaderboardSection from '../../component/component_result/LeaderboardSection';
import ProfileAchievements from '../../component/component_profile/profileAchievements';
import RankSection from '../../component/component_result/rankSelection';
import Result from '../../pages/result';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mocks
jest.mock('../../database/firebaseAuth', () => ({
  auth: { currentUser: null },
  onAuthStateChanged: (_auth, callback) => {
    callback(null);
    return jest.fn();
  }
}));

jest.mock('../../database/firebaseDatabase', () => ({
  getAnswers: jest.fn().mockResolvedValue({}),
  getEffectiveToken: jest.fn().mockResolvedValue('mock-token')
}));

jest.mock('../../database/manualAuth', () => ({
  getManualUser: () => ({ id: 'manual_1', username: 'TestPlayer' })
}));

describe('Phase 3 - Frontend Competitive Leaderboard & Achievement Badges', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    jest.restoreAllMocks();
  });

  describe('Leaderboard Data Fetchers (Frontend/src/database/leaderboardData.js)', () => {
    it('fetchLeaderboard calls GET with period and limit query params', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          period: 'daily',
          leaderboard: [
            { rank: 1, userId: 'u1', username: 'TopGamer', score: 250, coins: 40, accuracy: 100 }
          ]
        })
      });

      const data = await fetchLeaderboard('daily', 5);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/leaderboard?period=daily&limit=5'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(data.leaderboard).toHaveLength(1);
      expect(data.leaderboard[0].username).toBe('TopGamer');
    });

    it('recordGameScore calls POST /leaderboard/record with payload', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          record: { score: 100, coins: 35 },
          newAchievements: []
        })
      });

      const res = await recordGameScore({
        score: 100,
        coins: 35,
        accuracy: 100,
        timeRemaining: 90,
        userId: 'u1',
        username: 'Juara'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/leaderboard/record'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"score":100')
        })
      );
      expect(res.status).toBe('success');
    });
  });

  describe('Achievement Data Fetchers (Frontend/src/database/achievementData.js)', () => {
    it('fetchAllAchievements fetches achievement catalog', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          achievements: [
            { id: 'first_game', name: 'Pemain Pemula' },
            { id: 'coin_collector', name: 'Kolektor Koin' }
          ]
        })
      });

      const list = await fetchAllAchievements();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/achievements/list'),
        expect.anything()
      );
      expect(list).toHaveLength(2);
      expect(list[0].id).toBe('first_game');
    });

    it('fetchMyAchievements fetches user badges', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          achievements: [{ id: 'first_game', name: 'Pemain Pemula' }]
        })
      });

      const my = await fetchMyAchievements('u123');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/achievements/my?userId=u123'),
        expect.anything()
      );
      expect(my).toHaveLength(1);
    });
  });

  describe('LeaderboardSection Component', () => {
    it('renders leaderboard table and switches period tabs', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'success',
          leaderboard: [
            { rank: 1, userId: 'u1', username: 'ProPlayer', score: 300, coins: 60, accuracy: 100 }
          ],
          userRank: { rank: 1, score: 300 }
        })
      });

      await act(async () => {
        root.render(<LeaderboardSection currentUserName="ProPlayer" />);
      });

      expect(container.textContent).toContain('Papan Peringkat Global');
      expect(container.textContent).toContain('ProPlayer');
      expect(container.textContent).toContain('300');

      // Click weekly tab
      const weeklyBtn = Array.from(container.querySelectorAll('.leaderboard-tab')).find(
        (b) => b.textContent.includes('Mingguan')
      );
      expect(weeklyBtn).toBeTruthy();

      await act(async () => {
        weeklyBtn.click();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('period=weekly'),
        expect.anything()
      );
    });
  });

  describe('ProfileAchievements Component', () => {
    it('renders badges and identifies unlocked vs locked state', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            achievements: [
              { id: 'first_game', name: 'Pemain Pemula', description: 'Main pertama', icon: '🎮' },
              { id: 'coin_collector', name: 'Kolektor Koin', description: '30 koin', icon: '🪙' }
            ]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            achievements: [
              { id: 'first_game', name: 'Pemain Pemula', unlocked_at: '2026-10-11T12:00:00Z' }
            ]
          })
        });

      await act(async () => {
        root.render(<ProfileAchievements user={{ id: 'user_test' }} />);
      });

      expect(container.textContent).toContain('Lencana Pencapaian');
      expect(container.textContent).toContain('1 / 2 Terbuka');

      const firstBadge = container.querySelector('[data-testid="achievement-badge-first_game"]');
      expect(firstBadge.className).toContain('unlocked');

      const coinBadge = container.querySelector('[data-testid="achievement-badge-coin_collector"]');
      expect(coinBadge.className).toContain('locked');
    });
  });

  describe('RankSection Component', () => {
    it('computes rank tier correctly according to score', () => {
      act(() => {
        root.render(<RankSection score={90} rank={1} />);
      });

      expect(container.textContent).toContain('Master');
      expect(container.textContent).toContain('#1');
    });
  });

  describe('Result Page Integration', () => {
    it('includes LeaderboardSection in Result page', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'success',
          leaderboard: [],
          userRank: null
        })
      });

      await act(async () => {
        root.render(
          <MemoryRouter initialEntries={['/result']}>
            <Routes>
              <Route path="/result" element={<Result />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(container.querySelector('[data-testid="leaderboard-section"]')).toBeTruthy();
      expect(container.querySelector('.result-action-home')).toBeTruthy();
      expect(container.querySelector('.result-action-replay')).toBeTruthy();
    });
  });
});
