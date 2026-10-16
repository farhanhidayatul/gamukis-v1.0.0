import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  calculateExpTierProgress,
  calculateMatchExp,
  RANK_CONFIG
} from '../../utils/expRankSystem';
import RankSection from '../../component/component_result/rankSelection';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('EXP & Rank Difficulty Scaling System', () => {
  describe('Non-linear Thresholds & Progressive Difficulty', () => {
    it('verifies Newbie tiers scale at 100 EXP per sub-tier (500 EXP total)', () => {
      // 0 EXP -> Newbie 1, 0%
      const t0 = calculateExpTierProgress(0);
      expect(t0.rankName).toBe('Newbie');
      expect(t0.subTier).toBe(1);
      expect(t0.percent).toBe(0);
      expect(t0.nextMajorRankName).toBe('Rookie');

      // 50 EXP -> Newbie 1, 50%
      const t50 = calculateExpTierProgress(50);
      expect(t50.subTier).toBe(1);
      expect(t50.percent).toBe(50);

      // 100 EXP -> Newbie 2, 0%
      const t100 = calculateExpTierProgress(100);
      expect(t100.subTier).toBe(2);
      expect(t100.percent).toBe(0);

      // 450 EXP -> Newbie 5, 50%
      const t450 = calculateExpTierProgress(450);
      expect(t450.subTier).toBe(5);
      expect(t450.percent).toBe(50);
    });

    it('verifies Rookie tiers scale at 250 EXP per sub-tier (1250 EXP total, cumulative 500-1750 EXP)', () => {
      // 500 EXP -> Rookie 1, 0%
      const rStart = calculateExpTierProgress(500);
      expect(rStart.rankName).toBe('Rookie');
      expect(rStart.subTier).toBe(1);
      expect(rStart.percent).toBe(0);
      expect(rStart.nextMajorRankName).toBe('Common');

      // 750 EXP -> Rookie 2, 0%
      const r2 = calculateExpTierProgress(750);
      expect(r2.rankName).toBe('Rookie');
      expect(r2.subTier).toBe(2);

      // 1000 EXP -> Rookie 3, 0%
      const r3 = calculateExpTierProgress(1000);
      expect(r3.subTier).toBe(3);

      // 1625 EXP -> Rookie 5, 50% (1500 + 125)
      const r5Mid = calculateExpTierProgress(1625);
      expect(r5Mid.subTier).toBe(5);
      expect(r5Mid.percent).toBe(50);
    });

    it('verifies Common tiers scale at 500 EXP per sub-tier (2500 EXP total, cumulative 1750-4250 EXP)', () => {
      // 1750 EXP -> Common 1, 0%
      const cStart = calculateExpTierProgress(1750);
      expect(cStart.rankName).toBe('Common');
      expect(cStart.subTier).toBe(1);
      expect(cStart.percent).toBe(0);
      expect(cStart.nextMajorRankName).toBe('Beginner');

      // 2050 EXP -> Common 1, 60% (matches user mockup!)
      const c60 = calculateExpTierProgress(2050);
      expect(c60.rankName).toBe('Common');
      expect(c60.subTier).toBe(1);
      expect(c60.percent).toBe(60);
      expect(c60.nextMajorRankName).toBe('Beginner');

      // 2250 EXP -> Common 2, 0%
      const c2 = calculateExpTierProgress(2250);
      expect(c2.subTier).toBe(2);
    });

    it('verifies Beginner tiers scale at 1000 EXP per sub-tier (5000 EXP total, cumulative 4250-9250 EXP)', () => {
      // 4250 EXP -> Beginner 1, 0%
      const bStart = calculateExpTierProgress(4250);
      expect(bStart.rankName).toBe('Beginner');
      expect(bStart.subTier).toBe(1);
      expect(bStart.percent).toBe(0);
      expect(bStart.nextMajorRankName).toBe('Legendary');

      // 5250 EXP -> Beginner 2, 0%
      const b2 = calculateExpTierProgress(5250);
      expect(b2.subTier).toBe(2);
    });

    it('verifies Legendary tiers scale at 2000 EXP per sub-tier (10000 EXP total, cumulative 9250-19250 EXP)', () => {
      // 9250 EXP -> Legendary 1, 0%
      const lStart = calculateExpTierProgress(9250);
      expect(lStart.rankName).toBe('Legendary');
      expect(lStart.subTier).toBe(1);
      expect(lStart.nextMajorRankName).toBe('Max');

      // 19250+ EXP -> Max level capped at 100%
      const maxExp = calculateExpTierProgress(20000);
      expect(maxExp.rankName).toBe('Legendary');
      expect(maxExp.subTier).toBe(5);
      expect(maxExp.percent).toBe(100);
      expect(maxExp.isMaxLevel).toBe(true);
    });
  });

  describe('Match EXP Calculation Formula', () => {
    it('calculates EXP based on coins, kills, accuracy, and quiz answers', () => {
      // 10 coins (50) + 2 bot kills (30) + 1 player kill (30) + 5 correct (50) + 80% acc (40) + base (20) = 220 EXP
      const exp = calculateMatchExp({
        coins: 10,
        botKills: 2,
        playerKills: 1,
        correctAnswers: 5,
        accuracy: 80
      });
      expect(exp).toBe(220);
    });

    it('ensures minimum baseline EXP of at least 10 for any played match', () => {
      const minExp = calculateMatchExp({
        coins: 0,
        botKills: 0,
        playerKills: 0,
        accuracy: 0,
        correctAnswers: 0
      });
      expect(minExp).toBeGreaterThanOrEqual(10);
    });
  });

  describe('RankSection Component Rendering & UI Spec', () => {
    let container;
    let root;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
      root = createRoot(container);
    });

    afterEach(() => {
      act(() => root.unmount());
      container.remove();
    });

    it('renders deep navy card with circular badge, pill, progress bar, and status row matching mockup', () => {
      // Pass 2050 EXP (Common 1, 60% progress)
      act(() => {
        root.render(
          <RankSection
            coins={10}
            botKills={2}
            playerKills={1}
            currentExp={2050}
            previousExp={1750}
          />
        );
      });

      // 1. Title "Rank" in header
      expect(container.querySelector('.rank-title').textContent).toBe('Rank');

      // 2. Circular badge avatar and pill label "Common"
      expect(container.querySelector('.rank-badge-circle')).not.toBeNull();
      expect(container.querySelector('.rank-pill-badge').textContent).toBe('Common');

      // 3. Progress bar with aria attributes
      const progressTrack = container.querySelector('.rank-exp-track');
      expect(progressTrack).not.toBeNull();
      expect(progressTrack.getAttribute('role')).toBe('progressbar');

      // 4. Next major rank medal wrap ("TO Beginner")
      expect(container.querySelector('.rank-next-medal-wrap')).not.toBeNull();
      expect(container.textContent).toContain('TO Beginner');

      // 5. Status row: "Level up!" and green up arrows
      expect(container.textContent).toContain('Level up!');
      expect(container.querySelector('.rank-arrow-up').textContent).toBe('↑↑');

      // 6. Match score breakdown preserved
      expect(container.querySelector('.game-score-total').textContent).toBe('110');
      expect(container.textContent).toContain('Total Poin Game');
      expect(container.textContent).toContain('Koin (+50)');
      expect(container.textContent).toContain('Monster (+30)');
      expect(container.textContent).toContain('Player (+30)');
    });

    it('triggers interactive celebration when rank card is clicked', () => {
      act(() => {
        root.render(
          <RankSection
            coins={5}
            botKills={1}
            playerKills={0}
            currentExp={500}
            previousExp={450}
          />
        );
      });

      const card = container.querySelector('.result-card.rank');
      act(() => {
        card.click();
      });

      expect(card.className).toContain('rank-celebrating');
    });
  });
});

