import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import EnemyBot from '../../component/component_game/EnemyBot';
import { BOT_RESPAWN_COOLDOWN_MS } from '../../component/component_game/inGame';
import Result, {
  RESULT_REPLAY_COOLDOWN_SECONDS,
  RESULT_REPLAY_COOLDOWN_STORAGE_KEY,
  formatReplayCooldown
} from '../../pages/result';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../database/firebaseAuth', () => ({
  auth: { currentUser: null },
  onAuthStateChanged: (_auth, callback) => {
    callback(null);
    return jest.fn();
  }
}));

jest.mock('../../database/firebaseDatabase', () => ({ getAnswers: jest.fn() }));
jest.mock('../../database/manualAuth', () => ({ getManualUser: () => null }));
jest.mock('../../component/component_result/accuracySection', () => () => null);
jest.mock('../../component/component_result/answerList', () => () => null);
jest.mock('../../component/component_result/rankSelection', () => () => null);
jest.mock('../../component/component_result/scoreBox', () => () => null);
jest.mock('../../component/component_result/subjectSelection', () => () => null);
jest.mock('../../component/component_result/molecules/PerformanceSummary', () => () => null);
jest.mock('../../component/component_result/LeaderboardSection', () => () => null);

const Destination = () => {
  const location = useLocation();
  return <output data-testid="destination">{location.pathname}</output>;
};

describe('R7 Enemy Bot 20s Respawn & R8 Result 5-Minute Retry Cooldown', () => {
  let container;
  let root;

  beforeEach(() => {
    jest.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    jest.useRealTimers();
  });

  test('R7: BOT_RESPAWN_COOLDOWN_MS is 20000ms (20s) and EnemyBot clears dying state when respawned', () => {
    expect(BOT_RESPAWN_COOLDOWN_MS).toBe(20000);

    const deadBot = {
      id: 'bot_1',
      name: 'Blood Monster',
      variant: 'blood',
      x: 15,
      y: 15,
      health: 0,
      maxHealth: 3,
      state: 'dead',
      isDying: true
    };

    act(() => {
      root.render(<EnemyBot bot={deadBot} onDeathComplete={jest.fn()} />);
    });
    expect(container.querySelector('.EnemyBot.dead')).toBeTruthy();

    // When bot respawns after 20 seconds with full health, dead class must be cleared
    const respawnedBot = {
      ...deadBot,
      health: 3,
      state: 'idle',
      isDying: false
    };
    act(() => {
      root.render(<EnemyBot bot={respawnedBot} onDeathComplete={jest.fn()} />);
    });
    expect(container.querySelector('.EnemyBot.dead')).toBeNull();
    expect(container.querySelector('.EnemyBot')).toBeTruthy();
  });

  test('R8: Result page disables replay button for 5 minutes (300s) and enables it after 5 minutes', () => {
    expect(RESULT_REPLAY_COOLDOWN_SECONDS).toBe(300);
    expect(formatReplayCooldown(300)).toBe('05:00');

    act(() => {
      root.render(
        <MemoryRouter initialEntries={[{ pathname: '/result', state: { subject: 'Biologi' } }]}>
          <Routes>
            <Route path="/result" element={<Result />} />
            <Route path="*" element={<Destination />} />
          </Routes>
        </MemoryRouter>
      );
    });

    const replayBtn = container.querySelector('.result-action-replay');
    expect(replayBtn).toBeTruthy();
    expect(replayBtn.disabled).toBe(true);
    expect(replayBtn.textContent).toContain('05:00');

    // Clicking while disabled during 5-minute cooldown must NOT navigate
    act(() => {
      replayBtn.click();
    });
    expect(container.querySelector('[data-testid="destination"]')).toBeNull();

    // Advance 4 minutes (240s) -> 60s remaining, still disabled
    act(() => {
      jest.advanceTimersByTime(240 * 1000);
    });
    expect(replayBtn.disabled).toBe(true);
    expect(replayBtn.textContent).toContain('01:00');

    // Advance remaining 60s (total 5 minutes = 300s) -> button becomes enabled and clickable
    act(() => {
      jest.advanceTimersByTime(60 * 1000);
    });
    expect(replayBtn.disabled).toBe(false);
    expect(replayBtn.textContent).toBe('Bermain lagi?');

    act(() => {
      replayBtn.click();
    });
    const dest = container.querySelector('[data-testid="destination"]')?.textContent || '';
    expect(dest === '/gamePage' || dest.startsWith('/s/gp-')).toBe(true);
    expect(window.sessionStorage.getItem(RESULT_REPLAY_COOLDOWN_STORAGE_KEY)).toBeNull();
  });
});
