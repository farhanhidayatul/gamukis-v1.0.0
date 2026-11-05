/**
 * Unit Test Suite for Coin Milestone Question Modal Trigger
 * Ensures modal appears STRICTLY when coins reach positive multiples of 5 (5, 10, 15, 20...)
 * and avoids firing on non-multiples (1, 2, 3, 4, 6, 7, 8, 9...).
 */

describe('Coin Milestone Question Modal Trigger Rules', () => {
  const POINT_THRESHOLD = 5;

  // Exact function logic extracted from inGame.js
  const createMilestoneChecker = () => {
    let lastQuestionMilestone = 0;
    let pendingQuestion = null;
    let questionsTriggered = [];

    const checkCoinMilestone = (playerData) => {
      if (!playerData) return;
      const coins = Math.max(0, Number(playerData.coins) || 0);

      // Rule: strictly only positive multiples of POINT_THRESHOLD (5, 10, 15, ...)
      if (coins === 0 || coins % POINT_THRESHOLD !== 0) return;

      const milestone = Math.floor(coins / POINT_THRESHOLD);
      if (milestone <= lastQuestionMilestone || pendingQuestion) return;

      const reachedCoinCount = milestone * POINT_THRESHOLD;
      pendingQuestion = { milestone, reachedCoinCount };
      questionsTriggered.push({ milestone, reachedCoinCount, coinsAtTrigger: coins });
    };

    const answerQuestion = () => {
      if (pendingQuestion) {
        lastQuestionMilestone = Math.max(lastQuestionMilestone, pendingQuestion.milestone);
        pendingQuestion = null;
      }
    };

    const closeModal = () => {
      if (pendingQuestion) {
        lastQuestionMilestone = Math.max(lastQuestionMilestone, pendingQuestion.milestone);
      }
      pendingQuestion = null;
    };

    return {
      checkCoinMilestone,
      answerQuestion,
      closeModal,
      getLastMilestone: () => lastQuestionMilestone,
      getPendingQuestion: () => pendingQuestion,
      getQuestionsTriggered: () => questionsTriggered
    };
  };

  test('does not trigger on coins 0, 1, 2, 3, 4', () => {
    const checker = createMilestoneChecker();
    [0, 1, 2, 3, 4].forEach((c) => {
      checker.checkCoinMilestone({ coins: c });
    });
    expect(checker.getQuestionsTriggered()).toHaveLength(0);
    expect(checker.getPendingQuestion()).toBeNull();
  });

  test('triggers question modal at exactly 5 coins (5 * 1)', () => {
    const checker = createMilestoneChecker();
    checker.checkCoinMilestone({ coins: 5 });
    expect(checker.getQuestionsTriggered()).toHaveLength(1);
    expect(checker.getQuestionsTriggered()[0]).toEqual({
      milestone: 1,
      reachedCoinCount: 5,
      coinsAtTrigger: 5
    });
    expect(checker.getPendingQuestion()).toEqual({ milestone: 1, reachedCoinCount: 5 });
  });

  test('does NOT trigger again on coins 6, 7, 8, 9 even after answering modal at 5', () => {
    const checker = createMilestoneChecker();
    checker.checkCoinMilestone({ coins: 5 });
    checker.answerQuestion(); // Modal answered and closed

    // Now player collects coins 6, 7, 8, 9
    [6, 7, 8, 9].forEach((c) => {
      checker.checkCoinMilestone({ coins: c });
    });

    expect(checker.getQuestionsTriggered()).toHaveLength(1);
    expect(checker.getPendingQuestion()).toBeNull();
  });

  test('triggers next question modal at exactly 10 coins (5 * 2) and 15 coins (5 * 3)', () => {
    const checker = createMilestoneChecker();

    // Milestone 1 (5 coins)
    checker.checkCoinMilestone({ coins: 5 });
    expect(checker.getQuestionsTriggered()).toHaveLength(1);
    checker.answerQuestion();

    // Next coins before 10
    [6, 7, 8, 9].forEach((c) => checker.checkCoinMilestone({ coins: c }));
    expect(checker.getQuestionsTriggered()).toHaveLength(1);

    // Milestone 2 (10 coins)
    checker.checkCoinMilestone({ coins: 10 });
    expect(checker.getQuestionsTriggered()).toHaveLength(2);
    expect(checker.getQuestionsTriggered()[1]).toEqual({
      milestone: 2,
      reachedCoinCount: 10,
      coinsAtTrigger: 10
    });
    checker.answerQuestion();

    // Next coins before 15
    [11, 12, 13, 14].forEach((c) => checker.checkCoinMilestone({ coins: c }));
    expect(checker.getQuestionsTriggered()).toHaveLength(2);

    // Milestone 3 (15 coins)
    checker.checkCoinMilestone({ coins: 15 });
    expect(checker.getQuestionsTriggered()).toHaveLength(3);
    expect(checker.getQuestionsTriggered()[2]).toEqual({
      milestone: 3,
      reachedCoinCount: 15,
      coinsAtTrigger: 15
    });
  });

  test('closing modal without answering updates lastQuestionMilestone to prevent re-opening on next non-multiple coin', () => {
    const checker = createMilestoneChecker();
    checker.checkCoinMilestone({ coins: 5 });
    expect(checker.getPendingQuestion()).not.toBeNull();

    // Player closes modal
    checker.closeModal();
    expect(checker.getLastMilestone()).toBe(1);
    expect(checker.getPendingQuestion()).toBeNull();

    // Player picks up coin 6 & 7
    checker.checkCoinMilestone({ coins: 6 });
    checker.checkCoinMilestone({ coins: 7 });

    // Must not trigger again!
    expect(checker.getQuestionsTriggered()).toHaveLength(1);
  });
});
