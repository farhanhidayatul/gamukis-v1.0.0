import React, { useState, useEffect, useRef, useCallback } from 'react';
import { auth, signInAnon, observeAuthState } from '../../database/firebaseAuth';
import { getManualUser } from '../../database/manualAuth';
import {
  addAnswer, getAnswers, saveGameHistory
} from '../../database/firebaseDatabase';
import { recordGameScore } from '../../database/leaderboardData';
import { castSkillAction, movePlayer, resetPlayer, subscribeToGame, updatePlayer } from '../../database/realtimeGame';
import {
  randomFromArray, createName, canMoveTo, getRandomSafeSpot, getKeyString, TILE_SIZE
} from './utils';
import Player from './playerInfo';
import Coin from './coin';
import EnemyBot from './EnemyBot';
import Leaderboard from './leaderboard';
import GameControls from './molecules/GameControls';
import PlayerPanel from './molecules/PlayerPanel';
import "./style.css";
import Camera from './Camera';
import GameMap from './GameMap';
import useKeyPress from './useKeyPress';
import CoinModal from './modal';
import { questions as defaultQuestions, getQuestionsForSubject } from './questions';
import Timer from './timer';
import { skillTypes } from './skill';
import { calculateMatchExp } from '../../utils/expRankSystem';
import { useNavigate, useLocation } from 'react-router-dom';
import { mapData, mapWidth, mapHeight } from './tiledMapData';
import MiniMap from './miniMap';
import ToastNotification, { emitToast } from './toastNotification';
import {
  playCoinCollectSound,
  playCorrectAnswerSound,
  playWrongAnswerSound,
  playTimerWarningSound,
  playSkillCastSound,
  isSoundMuted,
  toggleSoundMuted
} from './soundEffects';

const getCameraZoom = () => Math.max(
  2,
  window.innerWidth / (TILE_SIZE * 28)
);
const NORMAL_MOVE_INTERVAL_MS = 220;
const SAND_MOVE_INTERVAL_MS = NORMAL_MOVE_INTERVAL_MS * 2;
export const createSessionId = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

export const ANONYMOUS_SESSION_KEY = 'gamukis_anonymous_game_session';
export const REGISTERED_SESSION_KEY = 'gamukis_registered_game_session';
export const GAME_DURATION_MS = 5 * 60 * 1000;

export const DEFAULT_BOT_CONFIGS = [
  {
    id: 'bot_fallback_blood',
    name: 'Blood Monster',
    variant: 'blood',
    category: 'Monster',
    scaleMultiplier: 10,
    x: 18,
    y: 14,
    direction: 'left',
    health: 3,
    maxHealth: 3,
    state: 'idle'
  },
  {
    id: 'bot_fallback_demon',
    name: 'Demon',
    variant: 'demon',
    category: 'Monster',
    scaleMultiplier: 10,
    x: 22,
    y: 16,
    direction: 'right',
    health: 3,
    maxHealth: 3,
    state: 'idle'
  },
  {
    id: 'bot_fallback_orc',
    name: 'Orc',
    variant: 'orc',
    category: 'Monster',
    scaleMultiplier: 10,
    x: 15,
    y: 20,
    direction: 'left',
    health: 3,
    maxHealth: 3,
    state: 'idle'
  },
  {
    id: 'bot_fallback_samurai',
    name: 'Manusia yang Tersesat (Emperor Samurai)',
    variant: 'samurai',
    category: 'Manusia yang Tersesat',
    scaleMultiplier: 2,
    x: 25,
    y: 12,
    direction: 'right',
    health: 3,
    maxHealth: 3,
    state: 'idle'
  }
];

export const getLocalFallbackBots = () => {
  return DEFAULT_BOT_CONFIGS.reduce((acc, bot) => {
    acc[bot.id] = { ...bot };
    return acc;
  }, {});
};

/**
 * Safely loads active anonymous session cache from localStorage if not expired.
 * Purges and returns null if the session exceeded 5 minutes or player died.
 */
export const getAnonymousSessionCache = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ANONYMOUS_SESSION_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached || !cached.gameStartedAt || !cached.sessionId) return null;
    const elapsed = Date.now() - Number(cached.gameStartedAt);
    if (elapsed < GAME_DURATION_MS && Number(cached.health ?? 3) > 0) {
      return cached;
    }
    window.localStorage.removeItem(ANONYMOUS_SESSION_KEY);
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Safely loads active session cache for either guest or registered user.
 * Supports registered accounts so refreshing the page does not reset score/coins/health.
 */
export const getActiveSessionCache = (isGuestUser) => {
  if (typeof window === 'undefined') return null;
  try {
    const key = isGuestUser ? ANONYMOUS_SESSION_KEY : REGISTERED_SESSION_KEY;
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      // Fallback check: check both keys so reload/refresh never loses the session
      const fallbackKey = isGuestUser ? REGISTERED_SESSION_KEY : ANONYMOUS_SESSION_KEY;
      const fallbackRaw = window.localStorage.getItem(fallbackKey);
      if (fallbackRaw) {
        const cachedFallback = JSON.parse(fallbackRaw);
        if (cachedFallback && cachedFallback.gameStartedAt && Number(cachedFallback.health ?? 3) > 0) {
          const elapsed = Date.now() - Number(cachedFallback.gameStartedAt);
          if (elapsed < GAME_DURATION_MS) return cachedFallback;
        }
      }
      return null;
    }
    const cached = JSON.parse(raw);
    if (!cached || !cached.gameStartedAt || !cached.sessionId) return null;
    const elapsed = Date.now() - Number(cached.gameStartedAt);
    if (elapsed < GAME_DURATION_MS && Number(cached.health ?? 3) > 0) {
      return cached;
    }
    window.localStorage.removeItem(key);
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Convenience helper to retrieve any active non-expired session cache (registered or anonymous).
 */
export const getAnyActiveSessionCache = () => {
  return getActiveSessionCache(false) || getActiveSessionCache(true) || getAnonymousSessionCache();
};

/**
 * Clears all active in-game caches (both guest and registered).
 */
export const clearActiveSessionCaches = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ANONYMOUS_SESSION_KEY);
    window.localStorage.removeItem(REGISTERED_SESSION_KEY);
    window.sessionStorage.removeItem('gamukis_game_session_id');
  } catch (e) {}
};

const playerColors = ["blue", "red", "orange", "yellow", "green", "purple", "man"];

/**
 * Format duration seconds into MySQL TIME string format (HH:MM:SS).
 * @param {number} seconds
 * @returns {string}
 */
export const formatTimePlaying = (seconds) => {
  const totalSeconds = Math.max(0, Math.floor(seconds || 0));
  const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
};

/**
 * Safely loads character appearance and outfit from localStorage.
 * Ensures corrupted JSON or missing properties gracefully fall back to null.
 */
export const loadSavedAppearance = () => {
  try {
    const rawAppearance = window.localStorage.getItem('gamukis_character_appearance');
    if (!rawAppearance) return null;
    const appearance = JSON.parse(rawAppearance);
    if (!appearance || typeof appearance !== 'object' || Array.isArray(appearance)) {
      return null;
    }
    try {
      const rawOutfit = window.localStorage.getItem('gamukis_character_outfit');
      if (rawOutfit) {
        const outfit = JSON.parse(rawOutfit);
        if (outfit && typeof outfit === 'object' && !Array.isArray(outfit)) {
          appearance.outfit = { ...(appearance.outfit || {}), ...outfit };
        }
      }
    } catch (e) {
      // safe fallback on corrupted outfit JSON
    }
    return appearance;
  } catch (e) {
    return null;
  }
};

const InGame = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Resolve questions for subject if provided via location state, fallback to default
  const activeSubject = location.state?.subject || 'indonesia';
  const activeQuestions = getQuestionsForSubject(activeSubject) || defaultQuestions;

  const [cameraZoom, setCameraZoom] = useState(getCameraZoom);
  const [isMuted, setIsMuted] = useState(() => isSoundMuted());

  const handleToggleMute = useCallback(() => {
    const next = toggleSoundMuted();
    setIsMuted(next);
    emitToast(next ? 'Suara dinonaktifkan' : 'Suara diaktifkan', 'info', 1800);
  }, []);

  useEffect(() => {
    const handleMuteChange = (e) => {
      if (e?.detail?.muted !== undefined) {
        setIsMuted(e.detail.muted);
      } else {
        setIsMuted(isSoundMuted());
      }
    };
    window.addEventListener('gamukis-sound-muted-change', handleMuteChange);
    return () => window.removeEventListener('gamukis-sound-muted-change', handleMuteChange);
  }, []);
  const [playerId, setPlayerId] = useState(null);
  const [players, setPlayers] = useState({});
  const [leaderboardPlayers, setLeaderboardPlayers] = useState([]);
  const [randomPlayers, setRandomPlayers] = useState([]);
  const [coins, setCoins] = useState({});
  const [bots, setBots] = useState({});
  const [playerName, setPlayerName] = useState(createName());
  const playerNameRef = useRef(playerName);
  const [manualUser, setManualUser] = useState(() => getManualUser());
  const [isGuest, setIsGuest] = useState(true);
  const [currentAppearance, setCurrentAppearance] = useState(() => {
    try {
      const signedInManualUser = getManualUser();
      if (signedInManualUser) {
        return loadSavedAppearance();
      }
    } catch (e) {}
    return null;
  });
  const [playerColor, setPlayerColor] = useState('');

  const resetSessionRequested = Boolean(location.state?.resetSession);
  if (resetSessionRequested && typeof window !== 'undefined') {
    clearActiveSessionCaches();
  }

  const initialSessionCache = useRef(
    !resetSessionRequested ? getAnyActiveSessionCache() : null
  );

  const sessionIdRef = useRef(
    (!resetSessionRequested && initialSessionCache.current?.sessionId)
      || (!resetSessionRequested && typeof window !== 'undefined' && window.sessionStorage?.getItem('gamukis_game_session_id'))
      || createSessionId()
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionIdRef.current) {
      window.sessionStorage.setItem('gamukis_game_session_id', sessionIdRef.current);
    }
  }, []);

  useEffect(() => {
    const updateCameraZoom = () => setCameraZoom(getCameraZoom());
    window.addEventListener('resize', updateCameraZoom);
    return () => window.removeEventListener('resize', updateCameraZoom);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isPersistingResult, setIsPersistingResult] = useState(false);
  const [resultSaveError, setResultSaveError] = useState('');
  const [isSkillActive, setIsSkillActive] = useState(false);
  const [isSkillCoolingDown, setIsSkillCoolingDown] = useState(false);
  const [isButtonMoving, setIsButtonMoving] = useState(false);
  const [activeSkillIndex, setActiveSkillIndex] = useState(0);
  const [modalContent, setModalContent] = useState({
    question: "",
    options: [],
    correct: ""
  });

  const cleanupRealtimeRef = useRef(null);
  const guestSignInRequestedRef = useRef(false);
  const lastQuestionMilestoneRef = useRef(
    (!resetSessionRequested && initialSessionCache.current?.coins)
      ? Math.floor((Number(initialSessionCache.current.coins) || 0) / 5)
      : 0
  );
  const pendingQuestionRef = useRef(null);
  const answerOwnerIdRef = useRef(null);

  // Session metrics tracking for MySQL history persistence
  const sessionStartTimeRef = useRef(
    (!resetSessionRequested && initialSessionCache.current?.gameStartedAt)
      ? Number(initialSessionCache.current.gameStartedAt)
      : Date.now()
  );
  const sessionAnswersRef = useRef(
    (!resetSessionRequested && Array.isArray(initialSessionCache.current?.sessionAnswers))
      ? initialSessionCache.current.sessionAnswers
      : []
  );
  const botKillsRef = useRef(0);
  const playerKillsRef = useRef(0);
  const historySavedRef = useRef(false);
  const historySavePromiseRef = useRef(null);
  const isFinalizingSessionRef = useRef(false);
  const finalizationLockRef = useRef(false);

  useEffect(() => {
    const refreshManualUser = () => setManualUser(getManualUser());
    const handleStorageChange = (event) => {
      if (event.key === 'gamukis_manual_user' || event.key === 'gamukis_manual_token') {
        refreshManualUser();
      }
      if (event.key === 'gamukis_character_appearance' || event.key === 'gamukis_character_outfit') {
        if (!isGuest) {
          setCurrentAppearance(loadSavedAppearance());
        }
      }
    };

    window.addEventListener('gamukis-manual-auth-change', refreshManualUser);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('gamukis-manual-auth-change', refreshManualUser);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isGuest]);

  const POINT_THRESHOLD = 5; // Question triggers every 5 coins collected

  const currentPlayer = playerId ? players[playerId] : null;
  const gameDurationSeconds = 5 * 60;
  const elapsedGameSeconds = currentPlayer?.gameStartedAt
    ? Math.floor((Date.now() - Number(currentPlayer.gameStartedAt)) / 1000)
    : 0;
  const remainingGameSeconds = Math.max(0, gameDurationSeconds - elapsedGameSeconds);

  /**
   * Persists the current game session metrics into MySQL history table.
   * Compiles time_playing, answer_true, answer_false, coin, death, all_question.
   */
  const persistGameHistory = useCallback(async ({ isDeath = false, forceCoins = null } = {}) => {
    if (historySavedRef.current) return historySavePromiseRef.current;
    if (historySavePromiseRef.current) return historySavePromiseRef.current;

    const currentCoins = forceCoins !== null ? forceCoins : (currentPlayer?.coins || 0);
    const elapsedSeconds = sessionStartTimeRef.current
      ? Math.max(1, Math.floor((Date.now() - sessionStartTimeRef.current) / 1000))
      : 1;

    const answers = sessionAnswersRef.current || [];
    const correctAnswers = answers.filter((a) => a.correct);
    const incorrectAnswers = answers.filter((a) => !a.correct);

    const historyPayload = {
      time_playing: formatTimePlaying(elapsedSeconds),
      answer_true: correctAnswers.length,
      answer_false: incorrectAnswers.length,
      desc_answer_true: correctAnswers.map((a) => a.question).join('\n'),
      desc_answer_false: incorrectAnswers.map((a) => a.question).join('\n'),
      all_question: activeQuestions.length,
      coin: Math.max(0, Number(currentCoins) || 0),
      death: isDeath ? 1 : 0
    };

    historySavePromiseRef.current = saveGameHistory(historyPayload)
      .then(() => {
        historySavedRef.current = true;
        const totalQ = activeQuestions.length || (correctAnswers.length + incorrectAnswers.length);
        const accuracy = totalQ > 0 ? (correctAnswers.length / totalQ) * 100 : 0;
        const botKills = botKillsRef.current || 0;
        const playerKills = playerKillsRef.current || 0;
        const gameScore = (Number(currentCoins) * 5) + (botKills * 15) + (playerKills * 30);
        const matchExp = calculateMatchExp({
          coins: Number(currentCoins),
          botKills,
          playerKills,
          accuracy,
          correctAnswers: correctAnswers.length
        });
        const resolvedUserId = answerOwnerIdRef.current || (manualUser?.id ? manualUser.id : playerId);
        recordGameScore({
          score: gameScore,
          coins: Math.max(0, Number(currentCoins) || 0),
          accuracy,
          timeRemaining: Math.max(0, 300 - elapsedSeconds),
          userId: resolvedUserId,
          username: currentPlayer?.name || 'Pemain',
          exp: matchExp,
          botKills,
          playerKills,
          correctAnswers: correctAnswers.length
        }).catch((err) => console.warn('Leaderboard score record warning:', err.message));
      })
      .catch((error) => {
        historySavePromiseRef.current = null;
        throw error;
      });
    return historySavePromiseRef.current;
  }, [activeQuestions.length, currentPlayer?.coins, currentPlayer?.name, manualUser?.id, playerId]);

  const saveAnonymousCache = useCallback((updatedCoins, updatedHealth, updatedLastQCoins) => {
    if (typeof window === 'undefined') return;
    try {
      const currentCoins = updatedCoins !== undefined ? updatedCoins : (currentPlayer?.coins || 0);
      const currentHealth = updatedHealth !== undefined ? updatedHealth : (currentPlayer?.health ?? 3);
      const currentLastQ = updatedLastQCoins !== undefined ? updatedLastQCoins : (currentPlayer?.lastQuestionCoins || 0);
      const payload = {
        sessionId: sessionIdRef.current,
        coins: currentCoins,
        health: currentHealth,
        lastQuestionCoins: currentLastQ,
        gameStartedAt: sessionStartTimeRef.current,
        sessionAnswers: sessionAnswersRef.current || [],
        subject: activeSubject,
        savedAt: Date.now()
      };
      const cacheKey = isGuest ? ANONYMOUS_SESSION_KEY : REGISTERED_SESSION_KEY;
      window.localStorage.setItem(cacheKey, JSON.stringify(payload));
      // Keep ANONYMOUS_SESSION_KEY updated as backward compatibility
      if (isGuest) {
        window.localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(payload));
      }
    } catch (e) {}
  }, [activeSubject, currentPlayer?.coins, currentPlayer?.health, currentPlayer?.lastQuestionCoins, isGuest]);

  const restartQuestionSession = useCallback(async () => {
    if (isFinalizingSessionRef.current) return;
    isFinalizingSessionRef.current = true;
    setResultSaveError('');
    clearActiveSessionCaches();
    try {
      await persistGameHistory({ forceCoins: currentPlayer?.coins });
      const nextSessionId = createSessionId();
      sessionIdRef.current = nextSessionId;
      sessionStorage.setItem('gamukis_game_session_id', nextSessionId);
      sessionStartTimeRef.current = Date.now();
      sessionAnswersRef.current = [];
      historySavedRef.current = false;
      historySavePromiseRef.current = null;
      lastQuestionMilestoneRef.current = 0;
      pendingQuestionRef.current = null;
      setIsModalOpen(false);
      setIsCompletionModalOpen(false);
      setModalContent({ question: '', options: [], correct: '' });
      const { x, y } = getRandomSafeSpot(mapData);
      await resetPlayer({
        x, y, sessionId: nextSessionId, allQuestion: activeQuestions.length,
      });
    } catch (error) {
      console.error('Gagal menyimpan hasil sesi sebelum mengulang:', error);
      setResultSaveError('Hasil belum tersimpan. Periksa koneksi lalu coba lagi.');
    } finally {
      isFinalizingSessionRef.current = false;
    }
  }, [activeQuestions.length, currentPlayer?.coins, persistGameHistory]);

  const navigateToResults = useCallback(async ({ isDeath = false, forceCoins = null } = {}) => {
    if (finalizationLockRef.current || historySavedRef.current) return;
    finalizationLockRef.current = true;
    isFinalizingSessionRef.current = true;
    setIsCompletionModalOpen(true);
    setIsPersistingResult(true);
    setResultSaveError('');
    
    // Reset and clear active in-game cache immediately
    clearActiveSessionCaches();

    const currentCoins = forceCoins !== null ? forceCoins : (currentPlayer?.coins || 0);
    const resultState = {
      selectedCard: location.state?.selectedCard || null,
      subject: activeSubject,
      sessionAnswers: sessionAnswersRef.current || [],
      coins: Math.max(0, Number(currentCoins) || 0),
      botKills: botKillsRef.current || 0,
      playerKills: playerKillsRef.current || 0,
      allQuestion: activeQuestions.length || 25,
      sessionId: sessionIdRef.current
    };
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem('gamukis_last_game_result', JSON.stringify(resultState));
      } catch (e) {}
    }
    try {
      // 1. Persist game history to MySQL
      await persistGameHistory({ isDeath, forceCoins });

      // 2. Reset player state and lobby in Redis/Socket so lobby is completely clean
      try {
        await resetPlayer({
          coins: 0,
          health: 3,
          lastQuestionCoins: 0,
          sessionId: sessionIdRef.current
        });
      } catch (resetErr) {
        console.warn('Lobby reset notice:', resetErr.message);
      }

      // 3. Navigate to results page
      navigate('/result', {
        state: resultState
      });
    } catch (error) {
      console.error('Gagal menyimpan history sesi ke MySQL:', error);
      setResultSaveError('Hasil belum tersimpan. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsPersistingResult(false);
      finalizationLockRef.current = false;
      isFinalizingSessionRef.current = false;
    }
  }, [activeQuestions.length, activeSubject, currentPlayer?.coins, location.state, navigate, persistGameHistory]);

  // Handle health depletion (Game Over -> persist history then navigate to /result)
  useEffect(() => {
    if (currentPlayer && currentPlayer.health !== undefined && currentPlayer.health <= 0) {
      navigateToResults({ isDeath: true, forceCoins: currentPlayer.coins });
    }
  }, [currentPlayer, navigateToResults]);

  const handleNameChange = (event) => {
    if (!isGuest) return;
    const newName = event.target.value || createName();
    setPlayerName(newName);
    playerNameRef.current = newName;
    if (playerId) {
      updatePlayer({ name: newName }).catch(console.error);
    }
  };

  const changeColor = () => {
    const currentIndex = playerColors.indexOf(playerColor);
    const nextIndex = (currentIndex + 1) % playerColors.length;
    const newColor = playerColors[nextIndex];
    setPlayerColor(newColor);
    if (playerId) {
      updatePlayer({ color: newColor }).catch(console.error);
    }
  };

  const handleArrowPress = (xChange = 0, yChange = 0) => {
    if (!playerId || isModalOpen || isCompletionModalOpen) return NORMAL_MOVE_INTERVAL_MS;
    const player = players[playerId];
    if (!player) return NORMAL_MOVE_INTERVAL_MS;
    const newX = player.x + xChange;
    const newY = player.y + yChange;
    if (canMoveTo(player.x, player.y, newX, newY, mapData)) {
      const direction = xChange !== 0
        ? (xChange === 1 ? 'right' : 'left')
        : (yChange === 1 ? 'down' : 'up');
      const updatedPlayer = { x: newX, y: newY, direction };
      movePlayer(updatedPlayer).catch(() => {});
      const fromSpace = getKeyString(player.x, player.y);
      const toSpace = getKeyString(newX, newY);
      return mapData.sandSpaces[fromSpace] || mapData.sandSpaces[toSpace]
        ? SAND_MOVE_INTERVAL_MS
        : NORMAL_MOVE_INTERVAL_MS;
    }
    return NORMAL_MOVE_INTERVAL_MS;
  };

  const castSkill = (skillIndex = 0) => {
    if (!playerId || isSkillCoolingDown || isModalOpen || isCompletionModalOpen) return;
    playSkillCastSound();
    const skillName = skillTypes[skillIndex]?.name || 'Skill';
    emitToast(`Skill ${skillName} diaktifkan!`, 'info', 2000);
    setActiveSkillIndex(skillIndex);
    setIsSkillActive(true);
    setIsSkillCoolingDown(true);
    window.setTimeout(() => setIsSkillActive(false), 550);
    window.setTimeout(() => setIsSkillCoolingDown(false), 1200);

    castSkillAction({ skillIndex }).catch((err) => {
      console.warn('Gagal mengeksekusi skill:', err.message);
    });
  };

  const checkCoinMilestone = (playerData) => {
    if (!playerData || (playerId && playerData.id !== playerId)) return;
    const coins = Math.max(0, Number(playerData.coins) || 0);
    const milestone = Math.floor(coins / POINT_THRESHOLD);
    if (milestone <= lastQuestionMilestoneRef.current || pendingQuestionRef.current) return;

    const reachedCoinCount = milestone * POINT_THRESHOLD;
    pendingQuestionRef.current = { milestone, reachedCoinCount };
    fetchNextUnansweredQuestion(answerOwnerIdRef.current || playerData.id, milestone);
  };
  const checkCoinMilestoneRef = useRef(checkCoinMilestone);
  checkCoinMilestoneRef.current = checkCoinMilestone;

  /**
   * Fetches the next unanswered question in the active subject bank.
   * If all questions in the bank have been answered, displays the completion modal
   * allowing the player to repeat questions from the start or view results.
   */
  const fetchNextUnansweredQuestion = (queryPlayerId, milestone) => {
    const ownerId = answerOwnerIdRef.current || queryPlayerId;
    getAnswers(`${ownerId}:${sessionIdRef.current}`).catch((error) => {
      console.error('Gagal mengambil jawaban tersimpan, menggunakan cache lokal:', error);
      return {};
    }).then((answers = {}) => {
      const answeredQuestions = new Set();
      Object.values(answers || {}).forEach((childData) => {
        if (childData && childData.question) answeredQuestions.add(childData.question);
      });
      (sessionAnswersRef.current || []).forEach((item) => {
        if (item && item.question) answeredQuestions.add(item.question);
      });

      const remainingQuestions = activeQuestions.filter((q) => !answeredQuestions.has(q.question));
      let nextQuestion = null;
      if (remainingQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
        nextQuestion = remainingQuestions[randomIndex];
      }

      if (nextQuestion) {
        setModalContent(nextQuestion);
        setIsModalOpen(true);
      } else {
        const pendingQuestion = pendingQuestionRef.current;
        if (pendingQuestion) {
          lastQuestionMilestoneRef.current = pendingQuestion.milestone;
          pendingQuestionRef.current = null;
          updatePlayer({ lastQuestionCoins: pendingQuestion.reachedCoinCount }).catch(console.error);
        }
        navigateToResults({ forceCoins: currentPlayer?.coins });
      }
    }).catch((error) => {
      pendingQuestionRef.current = null;
      console.error(error);
    });
  };

  /**
   * Cleanly resets in-game progress and starts a repeatable session cycle:
   * 1. Saves history of the finished run to MySQL.
   * 2. Resets coins to 0, health to 3, lastQuestionCoins to 0, milestone to 0.
   * 3. Generates a fresh sessionId.
   * 4. Reconnects to socket with isReset: true to prevent stale Redis state merge.
   * 5. Resets player position to a safe spot.
   */
  const selectRandomPlayers = (playersObj, currentPlayerId) => {
    const playerIds = Object.keys(playersObj);
    const randomPlayerIds = [];
    const MAX_DISPLAY_PLAYERS = 10;

    if (currentPlayerId && playerIds.includes(currentPlayerId)) {
      randomPlayerIds.push(currentPlayerId);
      playerIds.splice(playerIds.indexOf(currentPlayerId), 1);
    }

    while (randomPlayerIds.length < MAX_DISPLAY_PLAYERS && playerIds.length > 0) {
      const randomIndex = Math.floor(Math.random() * playerIds.length);
      randomPlayerIds.push(playerIds[randomIndex]);
      playerIds.splice(randomIndex, 1);
    }

    setRandomPlayers(randomPlayerIds);
  };

  useEffect(() => {
    const unsubscribe = observeAuthState((user) => {
      if (user) {
        const signedInManualUser = getManualUser();
        // Normalize answerOwnerId: manual user ID if manual, else user.uid
        answerOwnerIdRef.current = signedInManualUser?.id
          ? String(signedInManualUser.id)
          : user.uid;
        const guest = user.isAnonymous && !signedInManualUser;
        const accountName = (!user.isAnonymous ? user.displayName?.trim() : null)
          || signedInManualUser?.username?.trim()
          || user.displayName?.trim()
          || user.email?.split('@')[0]
          || 'Pengguna';
        const normalizedAccountName = accountName.slice(0, 30);
        const initialName = guest ? playerNameRef.current : normalizedAccountName;
        setIsGuest(guest);
        setPlayerName(initialName);
        const pid = user.uid;
        setPlayerId(pid);
        const { x, y } = getRandomSafeSpot(mapData);
        const color = randomFromArray(playerColors);
        setPlayerColor(color);

        const resolvedAppearance = !guest ? loadSavedAppearance() : null;
        setCurrentAppearance(resolvedAppearance);

        const activeCache = initialSessionCache.current || getAnyActiveSessionCache();
        const hasValidCache = !resetSessionRequested && Boolean(activeCache);
        const initialCoins = hasValidCache ? (Number(activeCache.coins) || 0) : 0;
        const initialHealth = hasValidCache ? (Number(activeCache.health) || 3) : 3;
        const initialLastQCoins = hasValidCache ? (Number(activeCache.lastQuestionCoins) || 0) : 0;
        const initialGameStartedAt = hasValidCache ? Number(activeCache.gameStartedAt) : sessionStartTimeRef.current;
        const isResetFlag = resetSessionRequested;

        subscribeToGame({
          player: {
            id: pid,
            name: initialName,
            direction: "right",
            color,
            x,
            y,
            coins: initialCoins,
            health: initialHealth,
            lastQuestionCoins: initialLastQCoins,
            sessionId: sessionIdRef.current,
            gameStartedAt: initialGameStartedAt,
            answerOwnerId: answerOwnerIdRef.current,
            allQuestion: activeQuestions.length,
            appearance: resolvedAppearance,
            isGuest: guest,
            isReset: isResetFlag
          },
          onSnapshot: (snapshot) => {
            const currentPlayers = snapshot.players || {};
            setPlayers(currentPlayers);
            const rawLeaderboard = snapshot.leaderboard || [];
            // Ensure current player in leaderboard reflects their actual coins
            const currentP = currentPlayers[pid];
            let syncedLeaderboard = rawLeaderboard;
            if (currentP) {
              const hasCurrentInLeaderboard = rawLeaderboard.some((p) => p.id === pid);
              if (hasCurrentInLeaderboard) {
                syncedLeaderboard = rawLeaderboard.map((p) => (p.id === pid ? { ...p, ...currentP } : p));
              } else {
                syncedLeaderboard = [...rawLeaderboard, currentP];
              }
            }
            setLeaderboardPlayers(syncedLeaderboard);
            setCoins(snapshot.coins || {});
            setBots((prev) => {
              const serverBots = snapshot.bots || {};
              const dyingBots = {};
              Object.entries(prev || {}).forEach(([id, b]) => {
                if ((b?.isDying || b?.state === 'dead' || Number(b?.health) <= 0) && !serverBots[id]) {
                  dyingBots[id] = b;
                }
              });
              return { ...serverBots, ...dyingBots };
            });
            selectRandomPlayers(currentPlayers, pid);
            checkCoinMilestoneRef.current(currentPlayers?.[pid]);
          },
          onPlayerUpdated: (updatedPlayer) => {
            if (updatedPlayer.id !== pid && Number(updatedPlayer.health) <= 0 && updatedPlayer.lastAttackerId === pid) {
              playerKillsRef.current += 1;
              emitToast('Kamu mengeliminasi lawan! (+30 Skor)', 'success', 2500);
            }
            setPlayers((currentPlayers) => {
              const nextPlayers = { ...currentPlayers, [updatedPlayer.id]: updatedPlayer };
              selectRandomPlayers(nextPlayers, pid);
              return nextPlayers;
            });
            checkCoinMilestoneRef.current(updatedPlayer);
            if (updatedPlayer.id === pid) {
              saveAnonymousCache(updatedPlayer.coins, updatedPlayer.health, updatedPlayer.lastQuestionCoins);
            }
          },
          onPlayerLeft: (leftPlayerId) => {
            setPlayers((currentPlayers) => {
              const nextPlayers = { ...currentPlayers };
              delete nextPlayers[leftPlayerId];
              return nextPlayers;
            });
          },
          onLeaderboardUpdated: (updatedPlayer) => {
            setLeaderboardPlayers((currentPlayers) => {
              const nextPlayers = currentPlayers.filter((player) => player.id !== updatedPlayer.id);
              return [...nextPlayers, updatedPlayer];
            });
          },
          onCoinAdded: (coinId, coin) => setCoins((currentCoins) => ({ ...currentCoins, [coinId]: coin })),
          onCoinClaimed: (coinId, updatedPlayer) => {
            setCoins((currentCoins) => {
              const nextCoins = { ...currentCoins };
              delete nextCoins[coinId];
              return nextCoins;
            });
            setPlayers((currentPlayers) => ({ ...currentPlayers, [updatedPlayer.id]: updatedPlayer }));
            checkCoinMilestoneRef.current(updatedPlayer);
            if (updatedPlayer.id === pid) {
              playCoinCollectSound();
              emitToast('+1 Koin!', 'info', 1200);
            }
            if (updatedPlayer.id === pid) {
              saveAnonymousCache(updatedPlayer.coins, updatedPlayer.health, updatedPlayer.lastQuestionCoins);
            }
          },
          onBotSpawned: (newBot) => {
            if (newBot?.id) {
              setBots((prev) => ({ ...prev, [newBot.id]: newBot }));
            }
          },
          onBotMoved: ({ botId, x, y, direction, state, health, maxHealth }) => {
            setBots((prev) => {
              if (!prev[botId]) return prev;
              if (prev[botId].isDying || prev[botId].state === 'dead' || Number(prev[botId].health) <= 0) {
                return prev;
              }
              const isNowDead = (typeof health === 'number' && health <= 0) || state === 'dead' || state === 'death';
              if (isNowDead) {
                window.setTimeout(() => {
                  setBots((curr) => {
                    if (!curr[botId]) return curr;
                    const next = { ...curr };
                    delete next[botId];
                    return next;
                  });
                }, 1000);
              }
              return {
                ...prev,
                [botId]: {
                  ...prev[botId],
                  x: typeof x === 'number' ? x : prev[botId].x,
                  y: typeof y === 'number' ? y : prev[botId].y,
                  direction: direction || prev[botId].direction,
                  state: isNowDead ? 'dead' : (state || prev[botId].state),
                  health: typeof health === 'number' ? health : prev[botId].health,
                  maxHealth: typeof maxHealth === 'number' ? maxHealth : prev[botId].maxHealth,
                  ...(isNowDead ? { isDying: true } : {})
                }
              };
            });
          },
          onBotAttack: ({ botId, targetPlayerId }) => {
            setBots((prev) => {
              if (!prev[botId] || prev[botId].isDying || prev[botId].state === 'dead' || Number(prev[botId].health) <= 0) return prev;
              return { ...prev, [botId]: { ...prev[botId], state: 'attacking' } };
            });
            window.setTimeout(() => {
              setBots((prev) => {
                if (!prev[botId] || prev[botId].isDying || prev[botId].state === 'dead' || Number(prev[botId].health) <= 0) return prev;
                return { ...prev, [botId]: { ...prev[botId], state: 'idle' } };
              });
            }, 400);
            if (targetPlayerId === pid) {
              emitToast('Kamu diserang monster!', 'error', 2000);
            }
          },
          onBotRemoved: ({ botId, killerId }) => {
            if (killerId === pid) {
              botKillsRef.current += 1;
              emitToast('Monster berhasil dikalahkan! (+15 Skor)', 'success', 2500);
            }
            setBots((prev) => {
              if (!prev[botId]) return prev;
              return {
                ...prev,
                [botId]: {
                  ...prev[botId],
                  health: 0,
                  state: 'dead',
                  isDying: true
                }
              };
            });
            window.setTimeout(() => {
              setBots((prev) => {
                if (!prev[botId]) return prev;
                const next = { ...prev };
                delete next[botId];
                return next;
              });
            }, 1000);
          },
          onSkillEffect: ({ casterId, skillIndex: castedIndex, hitPlayerIds, hitBotIds }) => {
            if (casterId && casterId !== pid) {
              setPlayers((currentPlayers) => {
                if (!currentPlayers[casterId]) return currentPlayers;
                return {
                  ...currentPlayers,
                  [casterId]: {
                    ...currentPlayers[casterId],
                    skillActive: true,
                    skillIndex: castedIndex ?? 0
                  }
                };
              });
              window.setTimeout(() => {
                setPlayers((currentPlayers) => {
                  if (!currentPlayers[casterId]) return currentPlayers;
                  return {
                    ...currentPlayers,
                    [casterId]: {
                      ...currentPlayers[casterId],
                      skillActive: false
                    }
                  };
                });
              }, 550);
            }
            if (Array.isArray(hitPlayerIds) && hitPlayerIds.includes(pid)) {
              emitToast('Kamu terkena skill pemain!', 'error', 2000);
            }
            if (casterId === pid && Array.isArray(hitBotIds) && hitBotIds.length > 0) {
              emitToast(`Skill mengenai ${hitBotIds.length} monster!`, 'success', 2000);
            }
          },
          onError: console.error
        }).then((cleanup) => {
          cleanupRealtimeRef.current = cleanup;
          if (!guest) updatePlayer({ name: normalizedAccountName }).catch(console.error);
        }).catch((err) => {
          console.error(err);
          setBots((prev) => (Object.keys(prev || {}).length ? prev : getLocalFallbackBots()));
        });
      } else if (!guestSignInRequestedRef.current) {
        guestSignInRequestedRef.current = true;
        signInAnon().catch((error) => {
          console.error(error.code, error.message);
        });
      }
    });

    return () => {
      unsubscribe();
      cleanupRealtimeRef.current?.();
    };
  // Autentikasi dan subjek game diselesaikan sekali ketika halaman dimuat.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!playerId) return;

    answerOwnerIdRef.current = auth.currentUser?.isAnonymous && manualUser?.id
      ? String(manualUser.id)
      : playerId;

    if (auth.currentUser?.isAnonymous && manualUser?.username) {
      const username = manualUser.username.trim().slice(0, 30);
      if (!username) return;
      setIsGuest(false);
      setPlayerName(username);
      playerNameRef.current = username;
      const resolvedAppearance = loadSavedAppearance();
      setCurrentAppearance(resolvedAppearance);
      updatePlayer({ name: username }).catch(console.error);
      return;
    }

    if (auth.currentUser?.isAnonymous) {
      const guestName = createName();
      setIsGuest(true);
      setPlayerName(guestName);
      playerNameRef.current = guestName;
      setCurrentAppearance(null);
      updatePlayer({ name: guestName }).catch(console.error);
    }
  }, [manualUser, playerId]);

  useEffect(() => {
    sessionStorage.setItem('gamukis_game_session_id', sessionIdRef.current);
  }, []);

  useKeyPress({
    'KeyW': () => handleArrowPress(0, -1),
    'ArrowUp': () => handleArrowPress(0, -1),
    'KeyS': () => handleArrowPress(0, 1),
    'ArrowDown': () => handleArrowPress(0, 1),
    'KeyA': () => handleArrowPress(-1, 0),
    'ArrowLeft': () => handleArrowPress(-1, 0),
    'KeyD': () => handleArrowPress(1, 0),
    'ArrowRight': () => handleArrowPress(1, 0),
    'KeyC': changeColor,
    'Space': () => castSkill(activeSkillIndex),
    'Digit1': () => castSkill(0),
    'Digit2': () => castSkill(1),
    'Digit3': () => castSkill(2),
    'Digit4': () => castSkill(3),
    'Digit5': () => castSkill(4),
    'Digit6': () => castSkill(5)
  });

  return (
    <div className="game-wrapper">
      <Timer
        key={currentPlayer?.gameStartedAt || 'new-game'}
        initialMinutes={Math.floor(remainingGameSeconds / 60)}
        initialSeconds={remainingGameSeconds % 60}
        warningThreshold={30}
        onWarning={(secondsLeft) => {
          playTimerWarningSound();
          if (secondsLeft === 30) {
            emitToast('Waktu tersisa 30 detik!', 'warning', 3500);
          } else if (secondsLeft === 10) {
            emitToast('Waktu tersisa 10 detik!', 'warning', 2500);
          }
        }}
        onTimeUp={() => {
          navigateToResults({ forceCoins: currentPlayer?.coins });
        }}
      />

      <Camera
        player={currentPlayer}
        mapWidth={mapWidth}
        mapHeight={mapHeight}
        tileSize={TILE_SIZE}
        zoom={cameraZoom}
      >
        <GameMap zoom={cameraZoom}>
          {randomPlayers
            .filter((key) => Boolean(players[key]))
            .map((key) => (
              <Player
                key={key}
                player={players[key]}
                isCurrentPlayer={key === playerId}
                isButtonMoving={key === playerId && isButtonMoving}
                skillActive={key === playerId ? isSkillActive : Boolean(players[key]?.skillActive)}
                skillIndex={key === playerId ? activeSkillIndex : (players[key]?.skillIndex || 0)}
                isGuest={key === playerId ? isGuest : (players[key]?.isGuest ?? (players[key]?.appearance ? false : true))}
                appearance={key === playerId ? currentAppearance : players[key]?.appearance}
              />
            ))}
          {Object.values(bots || {})
            .filter((bot) => Boolean(bot && typeof bot.x === 'number' && typeof bot.y === 'number'))
            .map((bot) => (
              <EnemyBot
                key={bot.id}
                bot={bot}
                onDeathComplete={(id) => {
                  setBots((prev) => {
                    if (!prev[id]) return prev;
                    const next = { ...prev };
                    delete next[id];
                    return next;
                  });
                }}
              />
            ))}
          {Object.entries(coins)
            .filter(([, coin]) => Boolean(coin && typeof coin.x === 'number' && typeof coin.y === 'number'))
            .map(([key, coin]) => <Coin key={key} coin={coin} />)}
        </GameMap>
      </Camera>

      <GameControls
        onMove={handleArrowPress}
        onMoveStart={() => setIsButtonMoving(true)}
        onMoveEnd={() => setIsButtonMoving(false)}
        onCastSkill={(skillIndex) => castSkill(skillIndex ?? activeSkillIndex)}
        skill={`${activeSkillIndex + 1}. ${skillTypes[activeSkillIndex].name}`}
        isCoolingDown={isSkillCoolingDown}
      />

      <PlayerPanel
        name={playerName}
        onNameChange={handleNameChange}
        isGuest={isGuest}
        health={currentPlayer?.health ?? 3}
        onChangeColor={changeColor}
      />

      <CoinModal
        isOpen={isModalOpen}
        onRequestClose={() => {
          setIsModalOpen(false);
          pendingQuestionRef.current = null;
        }}
        questionData={modalContent}
        onQuestionAnswered={(question, answer, correct) => {
          const answerData = {
            question,
            answer,
            correct,
            options: Array.isArray(modalContent?.options) ? modalContent.options : [],
            optionsList: Array.isArray(modalContent?.options) ? modalContent.options : [],
            correctAnswer: modalContent?.correct || '',
            timestamp: Date.now()
          };
          // Track answer in local run metrics for MySQL history persistence
          sessionAnswersRef.current.push(answerData);

          if (correct) {
            playCorrectAnswerSound();
            emitToast('Jawaban Benar! +Poin', 'success', 2500);
          } else {
            playWrongAnswerSound();
            emitToast('Jawaban Salah!', 'error', 2500);
          }
          saveAnonymousCache();
          addAnswer(`${answerOwnerIdRef.current || playerId}:${sessionIdRef.current}`, answerData)
            .then(() => {
              const pendingQuestion = pendingQuestionRef.current;
              if (!pendingQuestion) return;
              lastQuestionMilestoneRef.current = pendingQuestion.milestone;
              return updatePlayer({ lastQuestionCoins: pendingQuestion.reachedCoinCount });
            })
            .catch(console.error)
            .finally(() => {
              pendingQuestionRef.current = null;
            });
        }}
        playerId={playerId}
      />

      {/* Keep the player in the completed state until the result is safely persisted. */}
      {isCompletionModalOpen && (
        <div className="completion-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="completion-modal-box" role="status" aria-live="polite" style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '420px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.25s ease-out'
          }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '22px', color: '#1e293b' }}>
              {resultSaveError ? 'Hasil belum tersimpan' : (isPersistingResult ? 'Menyimpan hasil permainan...' : 'Sesi selesai')}
            </h3>
            <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '14px' }}>
        {resultSaveError || (isPersistingResult
          ? 'Sesi selesai. Riwayat sedang disimpan ke akun Anda.'
          : 'Riwayat progres sesi ini sudah tersimpan di akun Anda.')}
            </p>
            {resultSaveError ? (
              <button
                type="button"
                className="btn-view-results"
          onClick={() => navigateToResults({ forceCoins: currentPlayer?.coins })}
                style={{
                  background: '#ffd044',
                  color: '#17345e',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Coba simpan lagi
              </button>
            ) : isPersistingResult ? null : (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                <button
                  type="button"
                  className="btn-view-results"
                  onClick={restartQuestionSession}
                  style={{
                    background: '#ffd044', color: '#17345e', border: 'none',
                    borderRadius: '10px', padding: '12px 16px', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  Ulangi dari awal
                </button>
                <button
                  type="button"
                  className="btn-view-results"
                  onClick={() => navigate('/result', {
                    state: {
                      selectedCard: location.state?.selectedCard || null,
                      subject: activeSubject
                    }
                  })}
                  style={{
                    background: '#e2e8f0', color: '#17345e', border: 'none',
                    borderRadius: '10px', padding: '12px 16px', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  Lihat hasil
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <MiniMap
        player={currentPlayer}
        players={players}
        coins={coins}
        bots={bots}
        mapWidthTiles={Math.round(mapWidth / TILE_SIZE)}
        mapHeightTiles={Math.round(mapHeight / TILE_SIZE)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      <ToastNotification />

      <Leaderboard page="inGame" playersData={leaderboardPlayers}/>
    </div>
  );
};

export default InGame;
