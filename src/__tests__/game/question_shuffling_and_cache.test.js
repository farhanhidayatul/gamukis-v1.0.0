import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import CoinModal from '../../component/component_game/modal';
import {
  getAnonymousSessionCache,
  ANONYMOUS_SESSION_KEY,
  GAME_DURATION_MS
} from '../../component/component_game/inGame';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('Question Shuffling, Option Randomization & Anonymous Device Cache', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    window.localStorage.clear();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.localStorage.clear();
  });

  describe('CoinModal Option Shuffling & Correctness', () => {
    it('renders all options dynamically shuffled and verifies correct answer', () => {
      const onQuestionAnswered = jest.fn();
      const onRequestClose = jest.fn();
      const questionData = {
        question: 'Apa ibukota Indonesia?',
        options: ['Bandung', 'Jakarta', 'Surabaya', 'Medan'],
        correct: 'Jakarta'
      };

      act(() => {
        root.render(
          <CoinModal
            isOpen={true}
            onRequestClose={onRequestClose}
            onQuestionAnswered={onQuestionAnswered}
            playerId="test-player"
            questionData={questionData}
          />
        );
      });

      const buttons = document.querySelectorAll('.option-button');
      expect(buttons.length).toBe(4);
      const renderedTexts = Array.from(buttons).map((b) => b.textContent);
      expect(renderedTexts.sort()).toEqual([...questionData.options].sort());

      // Find the correct button and click it
      const correctBtn = Array.from(buttons).find((b) => b.textContent === 'Jakarta');
      expect(correctBtn).toBeTruthy();
      act(() => {
        correctBtn.click();
      });

      expect(onQuestionAnswered).toHaveBeenCalledWith(
        'Apa ibukota Indonesia?',
        'Jakarta',
        true
      );
    });

    it('verifies incorrect answer detection when distractor is clicked', () => {
      const onQuestionAnswered = jest.fn();
      const onRequestClose = jest.fn();
      const questionData = {
        question: '2 + 2 = ?',
        options: ['3', '4', '5'],
        correct: '4'
      };

      act(() => {
        root.render(
          <CoinModal
            isOpen={true}
            onRequestClose={onRequestClose}
            onQuestionAnswered={onQuestionAnswered}
            playerId="test-player"
            questionData={questionData}
          />
        );
      });

      const wrongBtn = Array.from(document.querySelectorAll('.option-button')).find(
        (b) => b.textContent === '3'
      );
      expect(wrongBtn).toBeTruthy();
      act(() => {
        wrongBtn.click();
      });

      expect(onQuestionAnswered).toHaveBeenCalledWith(
        '2 + 2 = ?',
        '3',
        false
      );
    });
  });

  describe('Anonymous Device Session Cache (getAnonymousSessionCache)', () => {
    it('returns cached session when game was started less than 5 minutes ago', () => {
      const activeStartedAt = Date.now() - 120 * 1000; // 2 minutes ago
      const cachedData = {
        sessionId: 'anon-session-123',
        coins: 15,
        health: 2,
        lastQuestionCoins: 15,
        gameStartedAt: activeStartedAt,
        sessionAnswers: [{ question: 'Q1', correct: true }]
      };
      window.localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(cachedData));

      const result = getAnonymousSessionCache();
      expect(result).not.toBeNull();
      expect(result.sessionId).toBe('anon-session-123');
      expect(result.coins).toBe(15);
      expect(result.health).toBe(2);
      expect(result.gameStartedAt).toBe(activeStartedAt);
    });

    it('returns null and purges cache when game started >= 5 minutes ago', () => {
      const expiredStartedAt = Date.now() - (GAME_DURATION_MS + 1000); // 5 mins + 1 sec
      const cachedData = {
        sessionId: 'expired-session-456',
        coins: 25,
        health: 3,
        gameStartedAt: expiredStartedAt
      };
      window.localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(cachedData));

      const result = getAnonymousSessionCache();
      expect(result).toBeNull();
      expect(window.localStorage.getItem(ANONYMOUS_SESSION_KEY)).toBeNull();
    });

    it('returns null and purges cache when health is 0 (player died)', () => {
      const cachedData = {
        sessionId: 'dead-player-session',
        coins: 10,
        health: 0,
        gameStartedAt: Date.now() - 60000
      };
      window.localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(cachedData));

      const result = getAnonymousSessionCache();
      expect(result).toBeNull();
      expect(window.localStorage.getItem(ANONYMOUS_SESSION_KEY)).toBeNull();
    });

    it('returns null when no anonymous cache exists in localStorage', () => {
      expect(getAnonymousSessionCache()).toBeNull();
    });
  });

  describe('Session Cache Preservation across Refresh/Navigation (getAnyActiveSessionCache)', () => {
    it('preserves registered user active session across page reloads', () => {
      const activeStartedAt = Date.now() - 30 * 1000; // 30 seconds ago
      const registeredData = {
        sessionId: 'reg-session-789',
        coins: 20,
        health: 3,
        lastQuestionCoins: 20,
        gameStartedAt: activeStartedAt,
        sessionAnswers: [{ question: 'Q1', correct: true }]
      };
      window.localStorage.setItem('gamukis_registered_game_session', JSON.stringify(registeredData));

      const { getAnyActiveSessionCache } = require('../../component/component_game/inGame');
      const result = getAnyActiveSessionCache();
      expect(result).not.toBeNull();
      expect(result.sessionId).toBe('reg-session-789');
      expect(result.coins).toBe(20);
      expect(result.health).toBe(3);
    });

    it('falls back between anonymous and registered session if user state is in flux during refresh', () => {
      const activeStartedAt = Date.now() - 45 * 1000;
      const anonData = {
        sessionId: 'anon-session-fallback',
        coins: 10,
        health: 2,
        gameStartedAt: activeStartedAt
      };
      window.localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(anonData));

      const { getAnyActiveSessionCache } = require('../../component/component_game/inGame');
      const result = getAnyActiveSessionCache();
      expect(result).not.toBeNull();
      expect(result.sessionId).toBe('anon-session-fallback');
      expect(result.coins).toBe(10);
      expect(result.health).toBe(2);
    });
  });

  describe('Rank Progression and Sub-tier Calculation (calculateTierProgress)', () => {
    const { calculateTierProgress } = require('../../component/component_home/stats');

    it('calculates Newbie sub-tiers correctly (Newbie 1 to 5)', () => {
      const step0 = calculateTierProgress(0);
      expect(step0.fullRankName).toBe('Newbie 1');
      expect(step0.themeClass).toBe('newbie');
      expect(step0.percent).toBe(0);

      const step1 = calculateTierProgress(1);
      expect(step1.fullRankName).toBe('Newbie 2');
      expect(step1.percent).toBe(0);

      const step4 = calculateTierProgress(4);
      expect(step4.fullRankName).toBe('Newbie 5');
    });

    it('transitions to Rookie rank with sub-tiers (Rookie 1 to 5)', () => {
      const rookieStart = calculateTierProgress(5);
      expect(rookieStart.rankName).toBe('Rookie');
      expect(rookieStart.subTier).toBe(1);
      expect(rookieStart.fullRankName).toBe('Rookie 1');
      expect(rookieStart.themeClass).toBe('rookie');

      const rookieMid = calculateTierProgress(10);
      expect(rookieMid.rankName).toBe('Rookie');
      expect(rookieMid.subTier).toBe(3);
      expect(rookieMid.fullRankName).toBe('Rookie 3');
    });

    it('advances through Common, Beginner, and Legendary ranks', () => {
      const common = calculateTierProgress(15);
      expect(common.rankName).toBe('Common');
      expect(common.fullRankName).toBe('Common 1');
      expect(common.themeClass).toBe('common');

      const beginner = calculateTierProgress(30);
      expect(beginner.rankName).toBe('Beginner');
      expect(beginner.fullRankName).toBe('Beginner 1');
      expect(beginner.themeClass).toBe('beginner');

      const legendary = calculateTierProgress(55);
      expect(legendary.rankName).toBe('Legendary');
      expect(legendary.fullRankName).toBe('Legendary 1');
      expect(legendary.themeClass).toBe('legendary');
    });
  });
});

