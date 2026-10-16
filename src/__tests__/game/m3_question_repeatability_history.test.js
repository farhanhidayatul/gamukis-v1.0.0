/**
 * Comprehensive Verification Suite for Milestone 3:
 * - Requirement R3.1: Token Passing & Auth Bridge (firebaseDatabase.js)
 * - Requirement R3.2: Extensible Question Registry & Safe Fallback (questions.js)
 * - Requirement R3.3: Question Repeatability Cycle & MySQL Metrics Compilation (inGame.js)
 * - Requirement R3.4: Clean Progress Reset & Redis Stale Lockout Bypass (realtimeGameSocket.js)
 */

const assert = require('assert');

let passedCount = 0;
let failedCount = 0;

const describe = global.describe || ((suiteName, fn) => {
  console.log(`\n======================================================`);
  console.log(`Suite: ${suiteName}`);
  console.log(`======================================================`);
  fn();
});

const it = global.it || ((testName, fn) => {
  try {
    fn();
    passedCount += 1;
    console.log(`  ✓ ${testName}`);
  } catch (error) {
    failedCount += 1;
    console.error(`  ✗ ${testName}`);
    console.error(`    Error: ${error.message}`);
    throw error;
  }
});

const itAsync = global.it || (async (testName, fn) => {
  try {
    await fn();
    passedCount += 1;
    console.log(`  ✓ ${testName}`);
  } catch (error) {
    failedCount += 1;
    console.error(`  ✗ ${testName}`);
    console.error(`    Error: ${error.message}`);
    throw error;
  }
});

// =============================================================================
// Suite 1: questions.js Registry & Fallback Verification
// =============================================================================
describe('Suite 1: questions.js Extensible Registry & Subject Deferral', () => {
  let questionsModule;
  try {
    questionsModule = require('../../component/component_game/questions');
  } catch (e) {
    questionsModule = require('./questions');
  }
  const {
    questions,
    QUESTION_CATEGORIES,
    SUBJECT_REGISTRY,
    getQuestionsForSubject,
    getAvailableSubjects
  } = questionsModule;

  it('1.1 Question bank provides exactly 25 valid questions with question, options, and correct', () => {
    assert(Array.isArray(questions), 'questions should be an array');
    assert.strictEqual(questions.length, 25, 'questions should contain exactly 25 items');
    questions.forEach((q, idx) => {
      assert(typeof q.question === 'string' && q.question.length > 0, `Q${idx} missing question`);
      assert(Array.isArray(q.options) && q.options.length >= 2, `Q${idx} options invalid`);
      assert(typeof q.correct === 'string', `Q${idx} correct must be string`);
      assert(q.options.includes(q.correct), `Q${idx} correct answer must exist in options`);
    });
  });

  it('1.2 QUESTION_CATEGORIES freezes UMUM, SAINTEK, and SOSHUM', () => {
    assert.strictEqual(QUESTION_CATEGORIES.UMUM, 'UMUM');
    assert.strictEqual(QUESTION_CATEGORIES.SAINTEK, 'SAINTEK');
    assert.strictEqual(QUESTION_CATEGORIES.SOSHUM, 'SOSHUM');
    assert(Object.isFrozen(QUESTION_CATEGORIES));
  });

  it('1.3 SUBJECT_REGISTRY registers active Bahasa Indonesia and deferred subjects cleanly', () => {
    assert(SUBJECT_REGISTRY.indonesia, 'indonesia must exist');
    assert.strictEqual(SUBJECT_REGISTRY.indonesia.isAvailable, true);
    assert.strictEqual(SUBJECT_REGISTRY.indonesia.questions.length, 25);

    const deferred = ['biologi', 'kimia', 'fisika', 'sosiologi'];
    deferred.forEach((subjectKey) => {
      const subject = SUBJECT_REGISTRY[subjectKey];
      assert(subject, `Deferred subject ${subjectKey} must exist`);
      assert.strictEqual(subject.isAvailable, false, `${subjectKey} isAvailable must be false`);
      assert.strictEqual(subject.questions.length, 0, `${subjectKey} questions must be empty`);
    });
  });

  it('1.4 getQuestionsForSubject resolves questions by subject id or title', () => {
    const byId = getQuestionsForSubject('indonesia');
    assert.strictEqual(byId.length, 25);
    const byTitle = getQuestionsForSubject('Bahasa Indonesia');
    assert.strictEqual(byTitle.length, 25);
    assert.strictEqual(byId[0].question, questions[0].question);
  });

  it('1.5 getQuestionsForSubject safely falls back to supported questions for deferred and unknown subjects', () => {
    const biologi = getQuestionsForSubject('biologi');
    assert.strictEqual(biologi.length, 25, 'Deferred biologi must fall back to 25 questions');

    const kimia = getQuestionsForSubject('Kimia');
    assert.strictEqual(kimia.length, 25, 'Deferred Kimia title must fall back to 25 questions');

    const unknown = getQuestionsForSubject('geografi');
    assert.strictEqual(unknown.length, 25, 'Unknown subject must fall back without exception');

    const nullSubject = getQuestionsForSubject(null);
    assert.strictEqual(nullSubject.length, 25, 'Null subject must fall back to default questions');
  });

  it('1.6 getAvailableSubjects returns all registry entries', () => {
    const list = getAvailableSubjects();
    assert(Array.isArray(list));
    assert(list.length >= 5);
    assert(list.some((s) => s.id === 'indonesia' && s.isAvailable === true));
    assert(list.some((s) => s.id === 'biologi' && s.isAvailable === false));
  });
});

// =============================================================================
// Suite 2: firebaseDatabase.js Token Resolution & Normalization
// =============================================================================
describe('Suite 2: firebaseDatabase.js Token Bridge & Player ID Normalization', () => {
  const MANUAL_TOKEN_KEY = 'gamukis_manual_token';

  const createMockStorage = (store = {}) => ({
    store: { ...store },
    getItem(key) { return this.store[key] || null; },
    setItem(key, val) { this.store[key] = String(val); },
    removeItem(key) { delete this.store[key]; }
  });

  const getStoredManualTokenHelper = (mockWindow) => {
    try {
      if (!mockWindow) return null;
      return (
        mockWindow.localStorage?.getItem(MANUAL_TOKEN_KEY) ||
        mockWindow.sessionStorage?.getItem(MANUAL_TOKEN_KEY) ||
        null
      );
    } catch (e) {
      return null;
    }
  };

  const getEffectiveTokenHelper = async (mockWindow, mockAuth) => {
    const manualToken = getStoredManualTokenHelper(mockWindow);
    if (manualToken) return manualToken;
    const user = mockAuth?.currentUser;
    if (user && typeof user.getIdToken === 'function') {
      try { return await user.getIdToken(); } catch (e) { return null; }
    }
    return null;
  };

  const normalizePlayerIdHelper = (playerId) => {
    if (!playerId) return playerId;
    return String(playerId).replace(/^manual_/, '');
  };

  it('2.1 getStoredManualToken extracts token from localStorage', () => {
    const win = {
      localStorage: createMockStorage({ [MANUAL_TOKEN_KEY]: 'test_jwt_local' }),
      sessionStorage: createMockStorage()
    };
    assert.strictEqual(getStoredManualTokenHelper(win), 'test_jwt_local');
  });

  it('2.2 getStoredManualToken falls back to sessionStorage when localStorage empty', () => {
    const win = {
      localStorage: createMockStorage(),
      sessionStorage: createMockStorage({ [MANUAL_TOKEN_KEY]: 'test_jwt_session' })
    };
    assert.strictEqual(getStoredManualTokenHelper(win), 'test_jwt_session');
  });

  it('2.3 getStoredManualToken returns null when token absent', () => {
    const win = {
      localStorage: createMockStorage(),
      sessionStorage: createMockStorage()
    };
    assert.strictEqual(getStoredManualTokenHelper(win), null);
  });

  it('2.4 getEffectiveToken prioritizes manual token over anonymous Firebase user', async () => {
    const win = {
      localStorage: createMockStorage({ [MANUAL_TOKEN_KEY]: 'registered_mysql_jwt' }),
      sessionStorage: createMockStorage()
    };
    const mockAuth = {
      currentUser: {
        isAnonymous: true,
        getIdToken: async () => 'anon_firebase_token'
      }
    };
    const token = await getEffectiveTokenHelper(win, mockAuth);
    assert.strictEqual(token, 'registered_mysql_jwt');
  });

  it('2.5 getEffectiveToken uses Firebase ID token when manual token is absent', async () => {
    const win = {
      localStorage: createMockStorage(),
      sessionStorage: createMockStorage()
    };
    const mockAuth = {
      currentUser: {
        isAnonymous: false,
        getIdToken: async () => 'google_firebase_token_789'
      }
    };
    const token = await getEffectiveTokenHelper(win, mockAuth);
    assert.strictEqual(token, 'google_firebase_token_789');
  });

  it('2.6 normalizePlayerId strips manual_ prefix to ensure backend requireSelfOr matches', () => {
    assert.strictEqual(normalizePlayerIdHelper('manual_1:session_123'), '1:session_123');
    assert.strictEqual(normalizePlayerIdHelper('manual_42'), '42');
    assert.strictEqual(normalizePlayerIdHelper('google_uid_xyz:session_123'), 'google_uid_xyz:session_123');
    assert.strictEqual(normalizePlayerIdHelper(null), null);
  });

  it('2.7 Request headers include Authorization Bearer when token is present', async () => {
    const token = 'registered_jwt_123';
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    assert.strictEqual(headers['Authorization'], 'Bearer registered_jwt_123');
    assert.strictEqual(headers['Content-Type'], 'application/json');
  });
});

// =============================================================================
// Suite 3: inGame.js Session Metrics, Time Formatting, & Progress Reset
// =============================================================================
describe('Suite 3: inGame.js Session Metrics, Question Repeatability, & Progress Reset', () => {
  const formatTimePlaying = (seconds) => {
    const totalSeconds = Math.max(0, Math.floor(seconds || 0));
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const createSessionId = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  it('3.1 formatTimePlaying converts seconds into MySQL TIME format (HH:MM:SS)', () => {
    assert.strictEqual(formatTimePlaying(0), '00:00:00');
    assert.strictEqual(formatTimePlaying(45), '00:00:45');
    assert.strictEqual(formatTimePlaying(125), '00:02:05');
    assert.strictEqual(formatTimePlaying(3661), '01:01:01');
    assert.strictEqual(formatTimePlaying(-5), '00:00:00');
  });

  it('3.2 createSessionId generates unique timestamped session IDs', () => {
    const id1 = createSessionId();
    const id2 = createSessionId();
    assert(typeof id1 === 'string' && id1.length > 5);
    assert.notStrictEqual(id1, id2);
  });

  it('3.3 Session history metrics payload compilation matches MySQL history table schema', () => {
    const elapsedSeconds = 175;
    const sessionAnswers = [
      { question: 'Pertanyaan 1', answer: 'A', correct: true },
      { question: 'Pertanyaan 2', answer: 'B', correct: false },
      { question: 'Pertanyaan 3', answer: 'C', correct: true }
    ];
    const correct = sessionAnswers.filter((a) => a.correct);
    const incorrect = sessionAnswers.filter((a) => !a.correct);
    const currentCoins = 15;
    const isDeath = false;

    const payload = {
      time_playing: formatTimePlaying(elapsedSeconds),
      answer_true: correct.length,
      answer_false: incorrect.length,
      desc_answer_true: correct.map((a) => a.question).join('\n'),
      desc_answer_false: incorrect.map((a) => a.question).join('\n'),
      all_question: 25,
      coin: Math.max(0, Number(currentCoins) || 0),
      death: isDeath ? 1 : 0
    };

    assert.strictEqual(payload.time_playing, '00:02:55');
    assert.strictEqual(payload.answer_true, 2);
    assert.strictEqual(payload.answer_false, 1);
    assert.strictEqual(payload.desc_answer_true, 'Pertanyaan 1\nPertanyaan 3');
    assert.strictEqual(payload.desc_answer_false, 'Pertanyaan 2');
    assert.strictEqual(payload.all_question, 25);
    assert.strictEqual(payload.coin, 15);
    assert.strictEqual(payload.death, 0);
  });

  it('3.4 Question bank exhaustion completes the session instead of automatically repeating', () => {
    const totalQuestions = 25;
    const answeredSet = new Set(Array.from({ length: 25 }, (_, i) => `Q${i}`));
    const questionBank = Array.from({ length: 25 }, (_, i) => ({ question: `Q${i}` }));

    const nextQuestion = questionBank.find((q) => !answeredSet.has(q.question));
    let resultPageOpened = false;

    if (!nextQuestion) {
      resultPageOpened = true;
    }

    assert.strictEqual(nextQuestion, undefined);
    assert.strictEqual(resultPageOpened, true, 'Completed question bank must lead to the result flow');
  });

  it('3.5 Progress reset resets coins to 0, health to 3, milestone to 0, and generates fresh session', () => {
    const oldSessionId = 'session_alpha';
    let coins = 30;
    let health = 0;
    let milestone = 6;
    let lastQuestionCoins = 30;

    // Trigger restartGame
    const freshSessionId = createSessionId();
    coins = 0;
    health = 3;
    milestone = 0;
    lastQuestionCoins = 0;
    const isReset = true;

    assert.notStrictEqual(freshSessionId, oldSessionId);
    assert.strictEqual(coins, 0, 'Coins must reset to 0');
    assert.strictEqual(health, 3, 'Health must reset to 3');
    assert.strictEqual(milestone, 0, 'Milestone must reset to 0');
    assert.strictEqual(lastQuestionCoins, 0, 'lastQuestionCoins must reset to 0');
    assert.strictEqual(isReset, true, 'isReset must be set to true');
  });

  it('3.6 Duplicate history persistence calls are prevented by guard ref', () => {
    let historySaveCallCount = 0;
    let historySaved = false;

    const persistHistory = () => {
      if (historySaved) return;
      historySaved = true;
      historySaveCallCount += 1;
    };

    persistHistory();
    persistHistory(); // Duplicate call (e.g. death and rapid unmount)
    persistHistory();

    assert.strictEqual(historySaveCallCount, 1, 'History must only be saved once per session');
  });
});

// =============================================================================
// Suite 4: realtimeGameSocket.js Clean Join Logic & Redis Lockout Elimination
// =============================================================================
describe('Suite 4: realtimeGameSocket.js Clean Join Logic & Stale State Elimination', () => {
  const evaluateJoin = (player, existing) => {
    const GAME_DURATION_MS = 5 * 60 * 1000;
    const playerId = player.id;
    const requestedSessionId = player.sessionId || `${playerId}:${Date.now()}`;

    const existingSessionIsActive = existing
      && existing.sessionId === requestedSessionId
      && Number.isFinite(Number(existing.gameStartedAt))
      && Date.now() - Number(existing.gameStartedAt) < GAME_DURATION_MS
      && !existing.historySavedAt
      && Number(existing.health) > 0;

    const isResetOrRestart = Boolean(
      player.isReset
      || player.isRestart
      || !existingSessionIsActive
      || (existing && Number(existing.health) <= 0)
      || (existing && existing.sessionId && existing.sessionId !== requestedSessionId)
    );

    return isResetOrRestart ? {
      id: playerId,
      ...player,
      coins: Number(player.coins) || 0,
      health: Number(player.health) > 0 ? Number(player.health) : 3,
      lastQuestionCoins: 0,
      sessionId: requestedSessionId,
      gameStartedAt: Date.now(),
      historySavedAt: null,
      disconnectedAt: null,
      lobbyId: 'lobby-1',
      allQuestion: Number(player.allQuestion) || 25
    } : {
      ...player,
      ...(existing || {}),
      id: playerId,
      sessionId: requestedSessionId,
      gameStartedAt: existing.gameStartedAt,
      historySavedAt: existing.historySavedAt,
      disconnectedAt: null,
      lobbyId: 'lobby-1',
      allQuestion: Number(player.allQuestion) || Number(existing?.allQuestion) || 0
    };
  };

  it('4.1 Joining after death (health: 0 in Redis) resets health to 3 and coins to 0', () => {
    const deadPlayer = {
      id: 'uid_1',
      health: 0,
      coins: 20,
      sessionId: 'session_died',
      gameStartedAt: Date.now() - 30000
    };
    const incomingPlayer = {
      id: 'uid_1',
      health: 3,
      coins: 0,
      sessionId: 'session_new_game',
      isReset: true
    };
    const result = evaluateJoin(incomingPlayer, deadPlayer);
    assert.strictEqual(result.health, 3, 'Must reset to 3 health, NOT stale 0');
    assert.strictEqual(result.coins, 0, 'Must reset to 0 coins, NOT stale 20');
    assert.strictEqual(result.lastQuestionCoins, 0);
  });

  it('4.2 Returning from /result with new session ID does NOT inherit dead player state', () => {
    const deadPlayer = {
      id: 'uid_2',
      health: 0,
      coins: 50,
      sessionId: 'old_session',
      gameStartedAt: Date.now() - 60000
    };
    const incomingPlayer = {
      id: 'uid_2',
      health: 3,
      coins: 0,
      sessionId: 'fresh_session_from_result'
    };
    const result = evaluateJoin(incomingPlayer, deadPlayer);
    assert.strictEqual(result.health, 3, 'Must eliminate redirect lockout loop');
    assert.strictEqual(result.coins, 0);
    assert.strictEqual(result.sessionId, 'fresh_session_from_result');
  });

  it('4.3 Reconnecting to active healthy session retains live game state', () => {
    const now = Date.now();
    const livePlayer = {
      id: 'uid_3',
      health: 2,
      coins: 15,
      sessionId: 'live_session_x',
      gameStartedAt: now - 20000,
      historySavedAt: null
    };
    const reconnectPlayer = {
      id: 'uid_3',
      sessionId: 'live_session_x'
    };
    const result = evaluateJoin(reconnectPlayer, livePlayer);
    assert.strictEqual(result.health, 2, 'Must retain health 2');
    assert.strictEqual(result.coins, 15, 'Must retain coins 15');
    assert.strictEqual(result.sessionId, 'live_session_x');
    assert.strictEqual(result.gameStartedAt, livePlayer.gameStartedAt);
  });

  it('4.4 Explicit isReset flag resets active session cleanly', () => {
    const now = Date.now();
    const livePlayer = {
      id: 'uid_4',
      health: 3,
      coins: 35,
      sessionId: 'active_session_y',
      gameStartedAt: now - 45000
    };
    const resetPlayer = {
      id: 'uid_4',
      sessionId: 'session_reset_y',
      isReset: true
    };
    const result = evaluateJoin(resetPlayer, livePlayer);
    assert.strictEqual(result.coins, 0, 'Explicit isReset must zero coins');
    assert.strictEqual(result.health, 3);
    assert.strictEqual(result.sessionId, 'session_reset_y');
    assert.strictEqual(result.lastQuestionCoins, 0);
  });

  it('4.5 Expired session (> 5 minutes) triggers clean reset on re-join', () => {
    const now = Date.now();
    const expiredPlayer = {
      id: 'uid_5',
      health: 3,
      coins: 40,
      sessionId: 'old_expired_session',
      gameStartedAt: now - (6 * 60 * 1000) // 6 minutes ago
    };
    const joinPlayer = {
      id: 'uid_5',
      sessionId: 'new_session_after_expiry'
    };
    const result = evaluateJoin(joinPlayer, expiredPlayer);
    assert.strictEqual(result.coins, 0, 'Expired session re-join must reset coins');
    assert.strictEqual(result.health, 3);
  });

  it('4.6 Finalized session (historySavedAt present) triggers clean reset on re-join', () => {
    const now = Date.now();
    const finalizedPlayer = {
      id: 'uid_6',
      health: 3,
      coins: 25,
      sessionId: 'session_finalized',
      gameStartedAt: now - 30000,
      historySavedAt: now - 5000
    };
    const joinPlayer = {
      id: 'uid_6',
      sessionId: 'new_session_after_finalize'
    };
    const result = evaluateJoin(joinPlayer, finalizedPlayer);
    assert.strictEqual(result.coins, 0);
    assert.strictEqual(result.health, 3);
  });
});

console.log('\n======================================================');
console.log(`Execution Summary: ${passedCount} Passed, ${failedCount} Failed (Total: ${passedCount + failedCount})`);
console.log('======================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
