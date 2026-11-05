import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import Leaderboard, { calculateStarCount, formatLeaderboardPlayerName } from '../../component/component_game/leaderboard';
import MiniMap from '../../component/component_game/miniMap';

global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock dependencies
jest.mock('../../database/firebaseAuth', () => ({
  auth: { currentUser: null },
  onAuthStateChanged: jest.fn((auth, cb) => {
    cb(null);
    return () => {};
  })
}));

jest.mock('../../database/manualAuth', () => ({
  getManualUser: jest.fn(() => ({ id: 42, username: 'Ahmad dani' }))
}));

jest.mock('../../database/leaderboardData', () => ({
  fetchLeaderboard: jest.fn(() => Promise.resolve({ leaderboard: [] }))
}));

const mount = async (element) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return {
    container,
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  };
};

describe('InGame Leaderboard Mockup & Map Refinement Tests', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('1. 5-Star Accuracy Calculation Formula (1 Star per 20%)', () => {
    test('calculates exact star counts from accuracy percentage', () => {
      // 0% - 19.9% -> 0 stars
      expect(calculateStarCount(0)).toBe(0);
      expect(calculateStarCount(10)).toBe(0);
      expect(calculateStarCount(19.9)).toBe(0);

      // 20% - 39.9% -> 1 star
      expect(calculateStarCount(20)).toBe(1);
      expect(calculateStarCount(35)).toBe(1);

      // 40% - 59.9% -> 2 stars
      expect(calculateStarCount(40)).toBe(2);
      expect(calculateStarCount(55)).toBe(2);

      // 60% - 79.9% -> 3 stars
      expect(calculateStarCount(60)).toBe(3);
      expect(calculateStarCount(75)).toBe(3);

      // 80% - 99.9% -> 4 stars
      expect(calculateStarCount(80)).toBe(4);
      expect(calculateStarCount(95)).toBe(4);

      // 100% -> 5 stars
      expect(calculateStarCount(100)).toBe(5);

      // Clamped bounds for null/negative/overflow
      expect(calculateStarCount(null)).toBe(0);
      expect(calculateStarCount(-10)).toBe(0);
      expect(calculateStarCount(120)).toBe(5);
    });
  });

  describe('2. InGame Leaderboard UI Structure Matching Mockup', () => {
    const mockPlayers = [
      { id: 'p1', name: 'No flores', coins: 2980, accuracy: 100 },
      { id: 'p2', name: 'Gojo', coins: 2721, accuracy: 80 },
      { id: 'p3', name: 'Strange', coins: 2579, accuracy: 80 },
      { id: 'p4', name: 'Wanda', coins: 1874, accuracy: 40 },
      { id: 'p5', name: 'Pute', coins: 1756, accuracy: 40 }
    ];

    test('renders Score title and top 5 players with medals & numbers', async () => {
      const { container, unmount } = await mount(
        <Leaderboard
          page="inGame"
          playersData={mockPlayers}
          playerId="p_self"
          playerName="Ahmad dani"
        />
      );

      // Verify Score title
      expect(container.querySelector('h2').textContent).toBe('Score');

      // Top 3 players have medals
      const medals = container.querySelectorAll('.medal');
      expect(medals.length).toBe(3);

      // Ranks 4 and 5 display numbers 4 and 5
      const rankNumbers = Array.from(container.querySelectorAll('.rank-number')).map((el) => el.textContent);
      expect(rankNumbers).toContain('4');
      expect(rankNumbers).toContain('5');

      // Names & scores
      expect(container.textContent).toContain('No flores');
      expect(container.textContent).toContain('2980');
      expect(container.textContent).toContain('Gojo');
      expect(container.textContent).toContain('2721');
      expect(container.textContent).toContain('Strange');
      expect(container.textContent).toContain('2579');
      expect(container.textContent).toContain('Wanda');
      expect(container.textContent).toContain('1874');
      expect(container.textContent).toContain('Pute');
      expect(container.textContent).toContain('1756');

      await unmount();
    });

    test('renders player self card with yellow border container at bottom', async () => {
      const { container, unmount } = await mount(
        <Leaderboard
          page="inGame"
          playersData={mockPlayers}
          playerId="p_self"
          playerName="Ahmad dani"
          sessionAnswers={[{ correct: true }, { correct: true }, { correct: false }]} // 66.6% = 3 stars
        />
      );

      const selfCard = container.querySelector('.self-card-wrapper');
      expect(selfCard).not.toBeNull();
      expect(selfCard.textContent).toContain('Ahmad dani');
      expect(selfCard.textContent).toContain('?'); // Outside top 5

      // Check stars inside self card
      const selfStars = selfCard.querySelectorAll('.star-filled');
      expect(selfStars.length).toBe(3); // 2 out of 3 correct = 66% = 3 stars

      await unmount();
    });

    test('inGame solo or initial state: renders self as Rank 1 with actual coins instead of ? and 0', async () => {
      const { container, unmount } = await mount(
        <Leaderboard
          page="inGame"
          playersData={[]}
          playerId="player_hyuuu"
          playerName="HYUUU"
          playerCoins={15}
          sessionAnswers={[{ correct: true }]}
        />
      );

      // Verify the list contains the player with Rank 1 (Gold Medal)
      const listItems = container.querySelectorAll('.leaderboard-item');
      expect(listItems.length).toBeGreaterThanOrEqual(1);
      expect(container.textContent).toContain('HYUUU');
      expect(container.textContent).toContain('15');

      // Verify self card displays Rank 1 and actual coins (15), NOT '?' and NOT '0'
      const selfCard = container.querySelector('.self-card-wrapper');
      expect(selfCard).not.toBeNull();
      expect(selfCard.textContent).toContain('HYUUU');
      expect(selfCard.textContent).toContain('15');
      const rankNumber = selfCard.querySelector('.rank-number');
      expect(rankNumber.textContent).toBe('1');

      await unmount();
    });

    test('matches self by player name when id is in transition (e.g. guest to registered)', async () => {
      const { container, unmount } = await mount(
        <Leaderboard
          page="inGame"
          playersData={[{ id: 'server_uid_99', name: 'HYUUU', coins: 25 }]}
          playerId="temp_local_id"
          playerName="HYUUU"
          playerCoins={25}
        />
      );

      const selfCard = container.querySelector('.self-card-wrapper');
      expect(selfCard).not.toBeNull();
      expect(selfCard.textContent).toContain('HYUUU');
      expect(selfCard.textContent).toContain('25');
      const rankNumber = selfCard.querySelector('.rank-number');
      expect(rankNumber.textContent).toBe('1');

      await unmount();
    });

    test('formats guest names cleanly without raw ID leak', () => {
      expect(formatLeaderboardPlayerName({ name: 'guest_1792345678', isGuest: true })).toBe('Guest');
      expect(formatLeaderboardPlayerName({ name: 'Budi Santoso', isGuest: false })).toBe('Budi Santoso');
      expect(formatLeaderboardPlayerName({ name: 'NinjaPro', isGuest: true, hasCustomName: true })).toBe('NinjaPro');
    });
  });

  describe('3. Clean Map Refinement (AI Slop Radar Removal)', () => {
    test('renders MAP label without radar scanline sweep', async () => {
      const { container, unmount } = await mount(
        <MiniMap
          player={{ id: 'p1', x: 20, y: 15 }}
          coins={{ c1: { x: 22, y: 15 } }}
          bots={{ b1: { x: 25, y: 18, health: 100 } }}
        />
      );

      // Verify header displays "MAP" and not "RADAR"
      expect(container.querySelector('.gamukis-minimap-title').textContent).toContain('MAP');
      expect(container.textContent).not.toContain('RADAR');

      // Verify that radar sweep animation container is completely removed
      expect(container.querySelector('.gamukis-minimap-sweep')).toBeNull();

      // Verify entities are still correctly rendered on map
      expect(container.querySelector('.gamukis-minimap-coin')).not.toBeNull();
      expect(container.querySelector('.gamukis-minimap-bot')).not.toBeNull();

      await unmount();
    });
  });

  describe('4. Mobile Landscape Responsiveness & Collision Prevention', () => {
    const originalInnerHeight = window.innerHeight;

    afterEach(() => {
      window.innerHeight = originalInnerHeight;
    });

    test('auto-collapses on short mobile landscape viewports to prevent skill button collision', async () => {
      // Simulate mobile landscape (e.g. iPhone SE 667x375)
      window.innerHeight = 375;

      const { container, unmount } = await mount(
        <Leaderboard
          page="inGame"
          playersData={[{ id: 'p1', name: 'Tester', coins: 10, accuracy: 80 }]}
          playerId="p1"
          playerName="Tester"
        />
      );

      const leaderboardEl = container.querySelector('.leaderboard-inGame');
      expect(leaderboardEl).not.toBeNull();
      // Should default to collapsed on short mobile landscape
      expect(leaderboardEl.classList.contains('is-collapsed')).toBe(true);

      // Clicking header expands the leaderboard
      const headerRow = container.querySelector('.leaderboard-header-row');
      await act(async () => {
        headerRow.click();
      });
      expect(leaderboardEl.classList.contains('is-collapsed')).toBe(false);

      await unmount();
    });
  });
});
