import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import Stats from '../../component/component_home/stats';
import Result from '../../pages/result';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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
    gamesPlayed: 3,
    totalScore: 300,
    maxScore: 100,
    totalCoins: 25,
    totalExp: 2050,
    exp: 2050,
    rank: 1
  })),
  recordGameScore: jest.fn().mockResolvedValue({ status: 'success' })
}));

describe('Home Pencapaian (Stats) & Result EXP Synchronization', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    window.sessionStorage.clear();
    window.localStorage.clear();
    mockFirebaseUser = null;
    mockManualUser = null;
    jest.clearAllMocks();
    leaderboardData.fetchUserGameStats.mockImplementation((userId) => Promise.resolve({
      gamesPlayed: 3,
      totalScore: 300,
      maxScore: 100,
      totalCoins: 25,
      totalExp: 2050,
      exp: 2050,
      rank: 1
    }));
    leaderboardData.recordGameScore.mockResolvedValue({ status: 'success' });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders Home Pencapaian using EXP non-linear scaling (2050 EXP = Common 1, 60%)', async () => {
    mockManualUser = { id: 101, username: 'AhmadSyarukan' };

    await act(async () => {
      root.render(<Stats />);
    });

    // 2050 EXP is Common tier (1750 start, 500 per tier): 300/500 = 60%
    const rankElement = container.querySelector('.stats-rank');
    expect(rankElement.textContent).toContain('Common 1');

    const progressValue = container.querySelector('.stats-progress-value');
    expect(progressValue.style.width).toBe('60%');

    const progressLabel = container.querySelector('.stats-progress-label strong');
    expect(progressLabel.textContent).toBe('60%');

    const nextRankLabel = container.querySelector('.stats-progress-label');
    expect(nextRankLabel.textContent).toContain('Common 2');
  });

  it('immediately reflects EXP stored in localStorage in Home Pencapaian even before API responds', async () => {
    mockManualUser = { id: 101, username: 'AhmadSyarukan' };
    // Pre-populate localStorage with 4250 EXP (Beginner 1, 0%)
    window.localStorage.setItem('gamukis_user_exp_101', '4250');

    // Make fetchUserGameStats delay or return older data
    leaderboardData.fetchUserGameStats.mockImplementationOnce(() => new Promise((resolve) => {
      setTimeout(() => resolve({
        gamesPlayed: 1,
        totalScore: 50,
        totalCoins: 10,
        totalExp: 1000,
        exp: 1000
      }), 50);
    }));

    await act(async () => {
      root.render(<Stats />);
    });

    // Should immediately display Beginner 1 based on local storage
    const rankElement = container.querySelector('.stats-rank');
    expect(rankElement.textContent).toContain('Beginner 1');
  });

  it('Result page sends EXP and totalExp to recordGameScore and synchronizes localStorage', async () => {
    mockManualUser = { id: 101, username: 'AhmadSyarukan' };
    window.localStorage.setItem('gamukis_user_exp_101', '1750');

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={[{
            pathname: '/result',
            state: {
              coins: 10, // 50 EXP
              botKills: 2, // 30 EXP
              playerKills: 1, // 30 EXP
              allQuestion: 10,
              sessionAnswers: [{ correct: true }, { correct: true }, { correct: true }, { correct: true }, { correct: true }], // 50 EXP + 40 acc EXP + 20 base = 220 EXP
              isLoggedIn: true
            }
          }]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path="/result" element={<Result />} />
          </Routes>
        </MemoryRouter>
      );
    });

    // Verify recordGameScore was called with exp included
    expect(leaderboardData.recordGameScore).toHaveBeenCalledWith(expect.objectContaining({
      userId: 101,
      exp: expect.any(Number),
      totalExp: expect.any(Number)
    }));

    // Verify localStorage was updated
    const updatedExp = window.localStorage.getItem('gamukis_user_exp_101');
    expect(Number(updatedExp)).toBeGreaterThan(1750);
  });

  it('reacts dynamically to gamukis-exp-updated custom event', async () => {
    mockManualUser = { id: 101, username: 'AhmadSyarukan' };

    await act(async () => {
      root.render(<Stats />);
    });

    // Initially 2050 EXP (Common 1, 60%)
    expect(container.querySelector('.stats-rank').textContent).toContain('Common 1');

    // Simulate level up event to 4750 EXP (Beginner 1, 50%)
    await act(async () => {
      window.dispatchEvent(new CustomEvent('gamukis-exp-updated', { detail: { exp: 4750 } }));
    });

    expect(container.querySelector('.stats-rank').textContent).toContain('Beginner 1');
    expect(container.querySelector('.stats-progress-label strong').textContent).toBe('50%');
  });
});
