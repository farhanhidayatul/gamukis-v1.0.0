import React, { useState, useEffect, useRef, useCallback } from 'react';
import { auth, observeAuthState, waitForAuth } from '../../database/firebaseAuth';
import { getManualUser } from '../../database/manualAuth';
import {
  addAnswer, getAnswers, saveGameHistory
} from '../../database/firebaseDatabase';
import { fetchCharacters } from '../../database/characterApi';
import { recordGameScore } from '../../database/leaderboardData';
import { castSkillAction, claimCoinAction, finishPlayerAction, movePlayer, resetPlayer, respawnPlayerAction, subscribeToGame, updatePlayer } from '../../database/realtimeGame';
import { gameEventBridge, GAME_BRIDGE_EVENTS } from './phaser/bridge/GameEventBridge';
import {
  randomFromArray, createName, canMoveTo, getRandomSafeSpot, getKeyString, TILE_SIZE, generateSecureGuestId
} from './utils';
import Player from './playerInfo';
import Coin from './coin';
import EnemyBot from './EnemyBot';
import Camera from './Camera';
import GameMap from './GameMap';
import Leaderboard from './leaderboard';
import GameControls from './molecules/GameControls';
import PlayerPanel from './molecules/PlayerPanel';
import "./style.css";
import useKeyPress from './useKeyPress';
import CoinModal from './modal';
import { questions as defaultQuestions, getQuestionsForSubject, getQuestionsForChapter } from './questions';
import {
  getNextStudentClassGameQuestion,
  submitStudentClassGameAnswer,
  completeStudentClassGameSession
} from '../../database/studentClassroomApi';
import Timer from './timer';
import { skillTypes } from './skill';
import { calculateMatchExp } from '../../utils/expRankSystem';
import { useNavigate, useLocation } from 'react-router-dom';
import { mapData, mapWidth, mapHeight } from './tiledMapData';
import MiniMap from './miniMap';
import ToastNotification, { emitToast } from './toastNotification';
import { reportInGameAnomaly } from '../../database/ingameAnomalyApi';
import {
  playCoinCollectSound,
  playCorrectAnswerSound,
  playWrongAnswerSound,
  playTimerWarningSound,
  playSkillCastSound,
  isSoundMuted,
  toggleSoundMuted
} from './soundEffects';
import { getOrCreateCryptoRoute } from '../../utils/universalCryptoRouter';
import { encryptPayload, decryptPayload } from '../../utils/secureStorageCipher';

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
export const MAX_GAME_DURATION_MS = 48 * 60 * 60 * 1000;
export const RESPAWN_COOLDOWN_SECONDS = 15;
export const RESPAWN_INVULNERABILITY_SECONDS = 3;

export const DEFAULT_BOT_CONFIGS = [
  {
    id: 'bot_fallback_blood',
    name: 'Blood Monster',
    variant: 'blood',
    category: 'Monster',
    scaleMultiplier: 10,
    x: 20,
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
    x: 26,
    y: 14,
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
const DEFAULT_GAME_DURATION_SECONDS = GAME_DURATION_MS / 1000;

const resolveGameDurationSeconds = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return DEFAULT_GAME_DURATION_SECONDS;
  }
  return Math.min(Math.round(numericValue), MAX_GAME_DURATION_MS / 1000);
};

const resolveGameDurationMs = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return GAME_DURATION_MS;
  return Math.min(Math.round(numericValue), MAX_GAME_DURATION_MS);
};

export const DEFAULT_FALLBACK_COIN_SPOTS = [
  // Sector 0-0 (Spawn Area)
  { x: 14, y: 12 },
  { x: 10, y: 12 },
  { x: 12, y: 14 },
  { x: 12, y: 10 },
  { x: 15, y: 14 },
  { x: 9, y: 14 },
  { x: 14, y: 10 },
  { x: 10, y: 15 },
  // Sector 0-1 (North Central)
  { x: 36, y: 7 },
  { x: 43, y: 12 },
  // Sector 0-2 (North East)
  { x: 55, y: 5 },
  { x: 65, y: 11 },
  // Sector 0-3 (Far North East)
  { x: 71, y: 6 },
  { x: 70, y: 13 },
  // Sector 1-0 (West Central)
  { x: 21, y: 20 },
  { x: 8, y: 27 },
  // Sector 1-1 (Center Island)
  { x: 31, y: 21 },
  { x: 37, y: 28 },
  // Sector 1-2 (East Central)
  { x: 53, y: 19 },
  { x: 51, y: 26 },
  // Sector 1-3 (Far East)
  { x: 72, y: 19 },
  { x: 67, y: 26 },
  // Sector 2-0 (South West)
  { x: 7, y: 36 },
  { x: 4, y: 42 },
  // Sector 2-1 (South Central)
  { x: 30, y: 34 },
  { x: 42, y: 39 },
  // Sector 2-2 (South East)
  { x: 52, y: 35 },
  { x: 57, y: 41 },
  // Sector 2-3 (Far South East)
  { x: 71, y: 36 },
  { x: 79, y: 40 }
];

export const getLocalFallbackCoins = (_baseX = 12, _baseY = 12) => {
  const coins = {};
  DEFAULT_FALLBACK_COIN_SPOTS.forEach((spot) => {
    const key = spot.x + 'x' + spot.y;
    coins[key] = { x: spot.x, y: spot.y, value: 1 };
  });
  return coins;
};

export const dedupeLeaderboardList = (list, activePid, selfReplacement = null) => {
  const byId = new Map();
  (list || []).forEach((entry) => {
    if (!entry || !entry.id) return;
    if (entry.historySavedAt || entry.disconnectedAt) return;
    byId.set(entry.id, entry);
  });
  if (selfReplacement && activePid) {
    byId.set(activePid, { ...byId.get(activePid), ...selfReplacement, id: activePid });
  }
  return Array.from(byId.values());
};

/**
 * Safely parses cookie value by key.
 */
const getCookieValue = (key) => {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + key + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
  } catch (_e) {
    return null;
  }
};

/**
 * Safely loads active anonymous session cache from localStorage/sessionStorage/cookies if not expired.
 * Purges and returns null if the session exceeded 5 minutes or player died.
 */
export const getAnonymousSessionCache = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ANONYMOUS_SESSION_KEY)
      || window.sessionStorage?.getItem(ANONYMOUS_SESSION_KEY)
      || getCookieValue(ANONYMOUS_SESSION_KEY);
    if (!raw) return null;
    const cached = decryptPayload(raw);
    if (!cached || !cached.gameStartedAt || !cached.sessionId) return null;
    const elapsed = Date.now() - Number(cached.gameStartedAt);
    if (elapsed < resolveGameDurationMs(cached.gameDurationMs) && Number(cached.health ?? 3) > 0) {
      return cached;
    }
    window.localStorage.removeItem(ANONYMOUS_SESSION_KEY);
    window.sessionStorage?.removeItem(ANONYMOUS_SESSION_KEY);
    return null;
  } catch (_e) {
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
    const raw = window.localStorage.getItem(key)
      || window.sessionStorage?.getItem(key)
      || getCookieValue(key);
    if (!raw) {
      // Fallback check: check both keys so reload/refresh never loses the session
      const fallbackKey = isGuestUser ? REGISTERED_SESSION_KEY : ANONYMOUS_SESSION_KEY;
      const fallbackRaw = window.localStorage.getItem(fallbackKey)
        || window.sessionStorage?.getItem(fallbackKey)
        || getCookieValue(fallbackKey);
      if (fallbackRaw) {
        const cachedFallback = decryptPayload(fallbackRaw);
        if (cachedFallback && cachedFallback.gameStartedAt && Number(cachedFallback.health ?? 3) > 0) {
          const elapsed = Date.now() - Number(cachedFallback.gameStartedAt);
          if (elapsed < resolveGameDurationMs(cachedFallback.gameDurationMs)) return cachedFallback;
        }
      }
      return null;
    }
    const cached = decryptPayload(raw);
    if (!cached || !cached.gameStartedAt || !cached.sessionId) return null;
    const elapsed = Date.now() - Number(cached.gameStartedAt);
    if (elapsed < resolveGameDurationMs(cached.gameDurationMs) && Number(cached.health ?? 3) > 0) {
      return cached;
    }
    window.localStorage.removeItem(key);
    window.sessionStorage?.removeItem(key);
    return null;
  } catch (_e) {
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
    window.sessionStorage?.removeItem(ANONYMOUS_SESSION_KEY);
    window.sessionStorage?.removeItem(REGISTERED_SESSION_KEY);
    window.sessionStorage?.removeItem('gamukis_game_session_id');
    document.cookie = `${ANONYMOUS_SESSION_KEY}=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `${REGISTERED_SESSION_KEY}=; path=/; max-age=0; SameSite=Lax`;
  } catch (e) { console.warn("[inGame] Fallback:", e?.message || e); }
};

const playerColors = ["man", "girl"];

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
          appearance.outfit = { ...appearance.outfit, ...outfit };
        }
      }
    } catch (e) { console.warn("[inGame] Fallback:", e?.message || e);
      // safe fallback on corrupted outfit JSON
    }
    return appearance;
  } catch (_e) {
    return null;
  }
};

const InGame = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Class game mode: server-managed questions and answers
  const classGameMode = Boolean(location.state?.classGameMode);
  const classGameClassId = location.state?.classId || null;
  const classGameSessionId = location.state?.sessionId || null;
  const classGameModeRef = useRef(classGameMode);
  classGameModeRef.current = classGameMode;

  // Resolve questions for subject if provided via location state, fallback to default
  const activeSubject = location.state?.subject || 'indonesia';
  const subjectQuestions = location.state?.questions && Array.isArray(location.state.questions) && location.state.questions.length > 0
    ? location.state.questions
    : (getQuestionsForSubject(activeSubject) || defaultQuestions);
  const activeQuestions = getQuestionsForChapter(
    activeSubject,
    location.state?.selectedChapter,
    subjectQuestions
  );

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
  const playerIdRef = useRef(playerId);
  playerIdRef.current = playerId;
  const [players, setPlayers] = useState({});
  const [leaderboardPlayers, setLeaderboardPlayers] = useState([]);
  const [randomPlayers, setRandomPlayers] = useState([]);
  const [coins, setCoins] = useState({});
  const [bots, setBots] = useState({});
  const [playerName, setPlayerName] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedCustom = window.sessionStorage?.getItem('gamukis_guest_custom_name');
      if (savedCustom) return savedCustom;
    }
    return 'Guest';
  });
  const playerNameRef = useRef(playerName);
  const [manualUser, setManualUser] = useState(() => getManualUser());
  const [isGuest, setIsGuest] = useState(true);
  const [currentAppearance, setCurrentAppearance] = useState(() => {
    try {
      const signedInManualUser = getManualUser();
      if (!signedInManualUser && (!auth.currentUser || auth.currentUser.isAnonymous)) {
        return null;
      }
      return loadSavedAppearance();
    } catch (e) { console.warn("[inGame] Fallback:", e?.message || e); }
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
    // Transparently auto-negotiate cryptographic hashed URL if accessed via static /inGame route
    if (location.pathname === '/inGame') {
      try {
        const cryptoPath = getOrCreateCryptoRoute('inGame', {
          subject: location.state?.subject || location.state?.selectedCard?.title || 'Umum'
        });
        if (cryptoPath && cryptoPath !== location.pathname) {
          navigate(cryptoPath, {
            replace: true,
            state: location.state
          });
          return;
        }
      } catch (_) { /* ignored */ }
    }
    // Clean up resetSession flag from browser history state immediately after initial mount
    // so refreshing (F5) will NOT wipe the active session or coins.
    if (location.state?.resetSession) {
      try {
        navigate(location.pathname, {
          replace: true,
          state: {
            ...location.state,
            resetSession: false
          }
        });
      } catch (e) { console.warn("[inGame] Fallback:", e?.message || e); }
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const updateCameraZoom = () => setCameraZoom(getCameraZoom());
    window.addEventListener('resize', updateCameraZoom);
    return () => window.removeEventListener('resize', updateCameraZoom);
  }, []);

  // Layer 1: Passive In-Game Telemetry & Anomaly Guard
  useEffect(() => {
    let lastFrame = performance.now();
    let animFrameId = null;

    // 1. Heartbeat Watchdog: Detect client freezes > 1800ms
    const checkFrame = () => {
      const now = performance.now();
      const delta = now - lastFrame;
      lastFrame = now;

      if (delta > 1800) {
        reportInGameAnomaly({
          type: 'CLIENT_FREEZE',
          severity: 'HIGH',
          playerId: playerId || 'anonymous',
          message: `Client loop freeze detected (${Math.round(delta)}ms)`,
          details: { deltaMs: Math.round(delta) }
        }).catch(() => {});
      }
      animFrameId = requestAnimationFrame(checkFrame);
    };
    animFrameId = requestAnimationFrame(checkFrame);

    // 2. Sprite & Asset 404 Guard
    const handleAssetError = (e) => {
      if (e && e.target && e.target.tagName === 'IMG') {
        reportInGameAnomaly({
          type: 'ASSET_LOAD_FAILURE',
          severity: 'LOW',
          playerId: playerId || 'anonymous',
          message: `Asset sprite failed to load: ${e.target.src}`,
          details: { src: e.target.src }
        }).catch(() => {});
      }
    };
    window.addEventListener('error', handleAssetError, true);

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('error', handleAssetError, true);
    };
  }, [playerId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isPersistingResult, setIsPersistingResult] = useState(false);
  const [resultSaveError, setResultSaveError] = useState('');
  const [isSkillActive, setIsSkillActive] = useState(false);
  const [isSkillCoolingDown, setIsSkillCoolingDown] = useState(false);
  const [isButtonMoving, setIsButtonMoving] = useState(false);
  const [activeSkillIndex, setActiveSkillIndex] = useState(0);
  const [respawnCountdown, setRespawnCountdown] = useState(0);
  const [invulnerableCountdown, setInvulnerableCountdown] = useState(0);
  const [modalContent, setModalContent] = useState({
    question: "",
    options: [],
    correct: ""
  });

  // Synchronize modal presentation state with Phaser game engine to freeze background movement
  useEffect(() => {
    const isLocked = Boolean(isModalOpen || isCompletionModalOpen);
    gameEventBridge.emit(GAME_BRIDGE_EVENTS.INPUT_LOCK_CHANGED, { locked: isLocked });
  }, [isModalOpen, isCompletionModalOpen]);

  const cleanupRealtimeRef = useRef(null);
  const sessionStartedRef = useRef(false);
  const isGuestSessionRef = useRef(true);
  const activeSubscriptionIdRef = useRef(0);
  const lastQuestionMilestoneRef = useRef(
    (!resetSessionRequested && initialSessionCache.current?.lastQuestionCoins !== undefined)
      ? Math.floor((Number(initialSessionCache.current.lastQuestionCoins) || 0) / 5)
      : ((!resetSessionRequested && initialSessionCache.current?.coins)
          ? Math.floor((Number(initialSessionCache.current.coins) || 0) / 5)
          : 0)
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
  // Restore kill counts from localStorage cache on page refresh.
  // botKills and playerKills are ephemeral in RAM — on refresh, re-seed from cache
  // so the counter is not lost before Redis can confirm the value at game:join.
  const botKillsRef = useRef(
    (!resetSessionRequested && Number.isFinite(Number(initialSessionCache.current?.botKills)))
      ? Number(initialSessionCache.current.botKills)
      : 0
  );
  const playerKillsRef = useRef(
    (!resetSessionRequested && Number.isFinite(Number(initialSessionCache.current?.playerKills)))
      ? Number(initialSessionCache.current.playerKills)
      : 0
  );
  const playerDeathsRef = useRef(0);
  const isRespawningRef = useRef(false);
  const respawnTimerRef = useRef(null);
  const invulnerableTimerRef = useRef(null);
  const historySavedRef = useRef(false);
  const historySavePromiseRef = useRef(null);
  const isFinalizingSessionRef = useRef(false);
  const finalizationLockRef = useRef(false);
  const optimisticCoinClaimsRef = useRef(new Set());
  const rejectedCoinsCooldownRef = useRef(new Map());
  const spawnGracePeriodEndRef = useRef(Date.now() + 800);
  const hasMovedOnceRef = useRef(false);
  const pendingRemoteBatchRef = useRef({});
  const remoteBatchTimerRef = useRef(null);
  const pendingBotBatchRef = useRef({});
  const botBatchTimerRef = useRef(null);

  useEffect(() => {
    const refreshManualUser = () => setManualUser(getManualUser());
    const handleStorageChange = (event) => {
      if (event.key === 'gamukis_manual_user' || event.key === 'gamukis_manual_token') {
        refreshManualUser();
      }
      if (event.key === 'gamukis_character_appearance' || event.key === 'gamukis_character_outfit') {
        setCurrentAppearance(loadSavedAppearance());
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
  const routeDurationSeconds = location.state?.gameDurationSeconds ??
      location.state?.selectedCard?.gameDurationSeconds ??
      location.state?.selectedCard?.durationSeconds ??
      (location.state?.selectedCard?.gameDurationMinutes !== undefined
        ? Number(location.state.selectedCard.gameDurationMinutes) * 60
        : undefined) ??
      (location.state?.selectedCard?.durationMinutes !== undefined
        ? Number(location.state.selectedCard.durationMinutes) * 60
        : undefined);
  const cachedGameDurationMs = currentPlayer?.gameDurationMs ?? initialSessionCache.current?.gameDurationMs;
  const gameDurationSeconds = resolveGameDurationSeconds(
    cachedGameDurationMs !== undefined
      ? Number(cachedGameDurationMs) / 1000
      : routeDurationSeconds
  );
  const effectiveGameStartedAt = currentPlayer?.gameStartedAt || sessionStartTimeRef.current;
  const elapsedGameSeconds = effectiveGameStartedAt
    ? Math.floor((Date.now() - Number(effectiveGameStartedAt)) / 1000)
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
      death: Number(playerDeathsRef.current) || (isDeath ? 1 : 0)
    };

    historySavePromiseRef.current = saveGameHistory(historyPayload)
      .then(() => {
        historySavedRef.current = true;
        const totalQ = activeQuestions.length || (correctAnswers.length + incorrectAnswers.length);
        const accuracy = totalQ > 0 ? (correctAnswers.length / totalQ) * 100 : 0;
        const botKills = botKillsRef.current || 0;
        const playerKills = playerKillsRef.current || 0;
        const pointsBase = Math.max(0, Number(currentPlayer?.pointsBase) || 0);
        const gameScore = pointsBase + (Number(currentCoins) * 5) + (botKills * 15) + (playerKills * 30);
        const matchExp = calculateMatchExp({
          coins: Number(currentCoins),
          botKills,
          playerKills,
          accuracy,
          correctAnswers: correctAnswers.length
        });
        const resolvedUserId = answerOwnerIdRef.current || ((manualUser?.id || manualUser?.userId) ? (manualUser.id || manualUser.userId) : playerId);
        recordGameScore({
          score: gameScore,
          coins: Math.max(0, Number(currentCoins) || 0),
          accuracy,
          timeRemaining: Math.max(0, gameDurationSeconds - elapsedSeconds),
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
  }, [activeQuestions.length, currentPlayer?.coins, currentPlayer?.name, gameDurationSeconds, manualUser?.id, playerId]);

  const saveAnonymousCache = useCallback((updatedCoins, updatedHealth, updatedLastQCoins, updatedAnswers) => {
    if (typeof window === 'undefined') return;
    // Never re-write the cache while the session is being finalized (time-up -> /result),
    // otherwise a late socket update would resurrect the finished session cache.
    if (isFinalizingSessionRef.current || finalizationLockRef.current || historySavedRef.current) return;
    try {
      const currentCoins = updatedCoins !== undefined ? updatedCoins : (currentPlayer?.coins || 0);
      const currentHealth = updatedHealth !== undefined ? updatedHealth : (currentPlayer?.health ?? 3);
      const currentLastQ = updatedLastQCoins !== undefined ? updatedLastQCoins : (currentPlayer?.lastQuestionCoins || 0);
      const currentAnswers = updatedAnswers !== undefined ? updatedAnswers : (sessionAnswersRef.current || []);
      const payload = {
        sessionId: sessionIdRef.current,
        coins: currentCoins,
        health: currentHealth,
        lastQuestionCoins: currentLastQ,
        gameStartedAt: sessionStartTimeRef.current,
        gameDurationMs: gameDurationSeconds * 1000,
        sessionAnswers: currentAnswers,
        subject: activeSubject,
        // Persist kill counters so they survive page refresh (re-seeded from cache on mount,
        // then confirmed/overridden by Redis value from game:join response).
        botKills: botKillsRef.current || 0,
        playerKills: playerKillsRef.current || 0,
        savedAt: Date.now()
      };
      const cacheKey = isGuest ? ANONYMOUS_SESSION_KEY : REGISTERED_SESSION_KEY;
      const obfuscated = encryptPayload(payload);
      window.localStorage.setItem(cacheKey, obfuscated);
      window.sessionStorage?.setItem(cacheKey, obfuscated);
      // Keep ANONYMOUS_SESSION_KEY updated as backward compatibility
      if (isGuest) {
        window.localStorage.setItem(ANONYMOUS_SESSION_KEY, obfuscated);
        window.sessionStorage?.setItem(ANONYMOUS_SESSION_KEY, obfuscated);
      }
      try {
        document.cookie = `${cacheKey}=${encodeURIComponent(obfuscated)}; path=/; max-age=${gameDurationSeconds}; SameSite=Lax`;
      } catch (ce) { console.warn("[inGame] Fallback:", ce?.message || ce); }
    } catch (e) { console.warn("[inGame] Fallback:", e?.message || e); }
  }, [activeSubject, currentPlayer?.coins, currentPlayer?.health, currentPlayer?.lastQuestionCoins, gameDurationSeconds, isGuest]);

  const clearRespawnAndInvulnerableTimers = useCallback(() => {
    if (respawnTimerRef.current) {
      clearInterval(respawnTimerRef.current);
      respawnTimerRef.current = null;
    }
    if (invulnerableTimerRef.current) {
      clearInterval(invulnerableTimerRef.current);
      invulnerableTimerRef.current = null;
    }
    setRespawnCountdown(0);
    setInvulnerableCountdown(0);
    isRespawningRef.current = false;
  }, []);

  const restartQuestionSession = useCallback(async () => {
    if (isFinalizingSessionRef.current) return;
    isFinalizingSessionRef.current = true;
    setResultSaveError('');
    clearRespawnAndInvulnerableTimers();
    clearActiveSessionCaches();
    try {
      await persistGameHistory({ forceCoins: currentPlayer?.coins });
      const nextSessionId = createSessionId();
      sessionIdRef.current = nextSessionId;
      sessionStorage.setItem('gamukis_game_session_id', nextSessionId);
      sessionStartTimeRef.current = Date.now();
      sessionAnswersRef.current = [];
      playerDeathsRef.current = 0;
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
  }, [activeQuestions.length, clearRespawnAndInvulnerableTimers, currentPlayer?.coins, persistGameHistory]);

  const navigateToResults = useCallback(async ({ isDeath = false, forceCoins = null } = {}) => {
    if (finalizationLockRef.current || historySavedRef.current) return;
    finalizationLockRef.current = true;
    isFinalizingSessionRef.current = true;
    clearRespawnAndInvulnerableTimers();
    setIsCompletionModalOpen(true);
    setIsPersistingResult(true);
    setResultSaveError('');
    
    // Reset and clear active in-game cache immediately
    clearActiveSessionCaches();

    const currentCoins = forceCoins !== null ? forceCoins : (currentPlayer?.coins || 0);
    const resultState = {
      selectedCard: location.state?.selectedCard || null,
      subject: activeSubject,
      selectedChapter: location.state?.selectedChapter || null,
      gameDurationSeconds,
      sessionAnswers: sessionAnswersRef.current || [],
      coins: Math.max(0, Number(currentCoins) || 0),
      botKills: botKillsRef.current || 0,
      playerKills: playerKillsRef.current || 0,
      allQuestion: activeQuestions.length || 25,
      sessionId: sessionIdRef.current,
      // Preserve class game context for result/retry
      classGameMode: classGameModeRef.current || undefined,
      classId: classGameClassId || undefined,
      classGameSessionId: classGameSessionId || undefined
    };
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem('gamukis_last_game_result', encryptPayload(resultState));
      } catch (e) { console.warn("[inGame] Fallback:", e?.message || e); }
    }
    try {
      // 1. Persist game history to MySQL
      await persistGameHistory({ isDeath, forceCoins });

      // 1b. Complete class game session if in class mode
      if (classGameModeRef.current && classGameClassId && classGameSessionId) {
        try {
          await completeStudentClassGameSession(classGameClassId, classGameSessionId);
        } catch (completeErr) {
          console.warn('Class game session complete warning:', completeErr.message);
        }
      }

      // 2. Cleanly finish player session in Redis and room to eliminate ghost player
      try {
        await finishPlayerAction();
      } catch (finishErr) {
        console.warn('Session finish notice:', finishErr.message);
      }

      // Purge again after async work so late socket updates cannot leave a stale session cache.
      clearActiveSessionCaches();

      // 3. Navigate to results page using dynamic crypto route
      const cryptoResultUrl = getOrCreateCryptoRoute('result', { sessionId: sessionIdRef.current });
      navigate(cryptoResultUrl || '/result', {
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
  }, [activeQuestions.length, activeSubject, classGameClassId, classGameSessionId, clearRespawnAndInvulnerableTimers, currentPlayer?.coins, gameDurationSeconds, location.state, navigate, persistGameHistory]);

  // Handle health depletion: 15-second Respawn Cooldown (CD), then revive at safe spot with 3-second Invulnerability.
  // The session only ends when the 5-minute timer expires (onTimeUp).
  useEffect(() => {
    if (!currentPlayer || currentPlayer.health === undefined || currentPlayer.health > 0) return;
    if (isRespawningRef.current || isFinalizingSessionRef.current || finalizationLockRef.current) return;
    isRespawningRef.current = true;
    playerDeathsRef.current += 1;

    // R2 Death penalty: client-side optimistic synchronization for coins reset & points deduction
    setPlayers((prev) => {
      const self = prev[playerId];
      if (!self) return prev;
      const currentTotal = (Number(self.pointsBase) || 0) + ((Number(self.coins) || 0) * 5) + ((botKillsRef.current || 0) * 15) + ((playerKillsRef.current || 0) * 30);
      const penalizedPoints = Math.max(0, currentTotal - 300);
      return {
        ...prev,
        [playerId]: {
          ...self,
          coins: 0,
          pointsBase: penalizedPoints
        }
      };
    });

    const localId = playerId;
    let remainingCooldown = RESPAWN_COOLDOWN_SECONDS;
    setRespawnCountdown(remainingCooldown);
    gameEventBridge.emit(GAME_BRIDGE_EVENTS.LOCAL_PLAYER_DEATH_STATE, { isDead: true, respawnCountdown: remainingCooldown });
    emitToast(`Kamu gugur! Hidup kembali dalam ${RESPAWN_COOLDOWN_SECONDS} detik...`, 'warning', 3000);

    if (respawnTimerRef.current) {
      clearInterval(respawnTimerRef.current);
    }

    respawnTimerRef.current = setInterval(() => {
      if (isFinalizingSessionRef.current || finalizationLockRef.current) {
        clearInterval(respawnTimerRef.current);
        respawnTimerRef.current = null;
        setRespawnCountdown(0);
        isRespawningRef.current = false;
        gameEventBridge.emit(GAME_BRIDGE_EVENTS.LOCAL_PLAYER_DEATH_STATE, { isDead: false, respawnCountdown: 0 });
        return;
      }

      remainingCooldown -= 1;
      if (remainingCooldown > 0) {
        setRespawnCountdown(remainingCooldown);
        return;
      }

      clearInterval(respawnTimerRef.current);
      respawnTimerRef.current = null;
      setRespawnCountdown(0);
      gameEventBridge.emit(GAME_BRIDGE_EVENTS.LOCAL_PLAYER_DEATH_STATE, { isDead: false, respawnCountdown: 0 });

      const { x: respawnX, y: respawnY } = getRandomSafeSpot(mapData);
      const invulnUntil = Date.now() + (RESPAWN_INVULNERABILITY_SECONDS * 1000);

      setPlayers((prev) => {
        const self = prev[localId];
        if (!self) return prev;
        return {
          ...prev,
          [localId]: {
            ...self,
            x: respawnX,
            y: respawnY,
            health: 3,
            invulnerableUntil: invulnUntil
          }
        };
      });
      gameEventBridge.emit(GAME_BRIDGE_EVENTS.LOCAL_POSITION_SYNC, { x: respawnX, y: respawnY });
      emitToast(`Kamu hidup kembali! Kebal serangan selama ${RESPAWN_INVULNERABILITY_SECONDS} detik.`, 'success', 3000);

      // Start 3-second post-respawn invulnerability HUD countdown
      let remainingInvuln = RESPAWN_INVULNERABILITY_SECONDS;
      setInvulnerableCountdown(remainingInvuln);
      if (invulnerableTimerRef.current) {
        clearInterval(invulnerableTimerRef.current);
      }
      invulnerableTimerRef.current = setInterval(() => {
        remainingInvuln -= 1;
        if (remainingInvuln > 0) {
          setInvulnerableCountdown(remainingInvuln);
        } else {
          clearInterval(invulnerableTimerRef.current);
          invulnerableTimerRef.current = null;
          setInvulnerableCountdown(0);
        }
      }, 1000);

      respawnPlayerAction({ x: respawnX, y: respawnY })
        .then((serverPlayer) => {
          if (serverPlayer) {
            saveAnonymousCache(serverPlayer.coins, serverPlayer.health, serverPlayer.lastQuestionCoins);
          }
        })
        .catch((err) => console.warn('Respawn notice:', err.message))
        .finally(() => {
          isRespawningRef.current = false;
        });
    }, 1000);
  }, [currentPlayer, playerId, saveAnonymousCache]);

  // Track if guest has renamed themselves (limit: 1 time per session)
  const [hasRenamed, setHasRenamed] = useState(() => {
    if (typeof window !== 'undefined') {
      return Boolean(window.sessionStorage?.getItem('gamukis_guest_has_renamed') === 'true');
    }
    return false;
  });

  const handleNameChange = (newNameOrEvent) => {
    if (!isGuest) return;
    if (hasRenamed) {
      emitToast('Nama hanya dapat diubah satu kali.', 'warning', 2000);
      return;
    }
    const rawName = typeof newNameOrEvent === 'string'
      ? newNameOrEvent
      : (newNameOrEvent?.target?.value || '');
    const trimmed = rawName.trim();
    if (!trimmed) return;
    const finalName = trimmed.slice(0, 20);

    setPlayerName(finalName);
    playerNameRef.current = finalName;
    setHasRenamed(true);
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage?.setItem('gamukis_guest_has_renamed', 'true');
        window.sessionStorage?.setItem('gamukis_guest_custom_name', finalName);
      } catch (e) { console.warn("[inGame] Fallback:", e?.message || e); }
    }

    if (playerId) {
      updatePlayer({ name: finalName, hasCustomName: true, isRenamed: true }).catch(console.error);
    }
    emitToast(`Nama berhasil diubah menjadi "${finalName}"!`, 'success', 2200);
  };

  const changeColor = () => {
    const activeColor = (playerId && players[playerId]?.color) || playerColor || 'man';
    const currentIndex = playerColors.indexOf(activeColor);
    const nextIndex = (currentIndex + 1) % playerColors.length;
    const newColor = playerColors[nextIndex] || 'man';
    const newGender = newColor === 'girl' ? 'female' : 'male';
    setPlayerColor(newColor);
    if (playerId) {
      setPlayers((prev) => {
        if (!prev[playerId]) return prev;
        return {
          ...prev,
          [playerId]: {
            ...prev[playerId],
            color: newColor,
            gender: newGender
          }
        };
      });
      updatePlayer({ color: newColor, gender: newGender }).catch(console.error);
    }
  };

  const handleArrowPress = (xChange = 0, yChange = 0) => {
    if (!playerId || isModalOpen || isCompletionModalOpen || isRespawningRef.current || respawnCountdown > 0) return NORMAL_MOVE_INTERVAL_MS;
    const player = players[playerId];
    if (!player || Number(player.health) <= 0) return NORMAL_MOVE_INTERVAL_MS;
    const newX = player.x + xChange;
    const newY = player.y + yChange;
    if (canMoveTo(player.x, player.y, newX, newY, mapData)) {
      const direction = xChange !== 0
        ? (xChange === 1 ? 'right' : 'left')
        : (yChange === 1 ? 'down' : 'up');
      hasMovedOnceRef.current = true;
      const updatedPlayer = { ...player, x: newX, y: newY, direction };

      // Optimistic 0ms local player position update
      setPlayers((prev) => ({ ...prev, [playerId]: updatedPlayer }));
      gameEventBridge.emit(GAME_BRIDGE_EVENTS.LOCAL_POSITION_SYNC, { x: newX, y: newY });

      // Instant optimistic coin pickup with hitbox proximity tolerance (0ms delay)
      let targetCoinKey = `${newX}x${newY}`;
      let targetCoin = coins[targetCoinKey];
      if (!targetCoin) {
        const nearbyEntry = Object.entries(coins).find(([key, c]) => {
          if (!c || typeof c.x !== 'number' || typeof c.y !== 'number') return false;
          if (optimisticCoinClaimsRef.current.has(key)) return false;
          const coolUntil = rejectedCoinsCooldownRef.current.get(key) || 0;
          if (Date.now() < coolUntil) return false;
          return Math.hypot(c.x - newX, c.y - newY) <= 1.05;
        });
        if (nearbyEntry) {
          targetCoinKey = nearbyEntry[0];
          targetCoin = nearbyEntry[1];
        }
      }
      const coolUntil = rejectedCoinsCooldownRef.current.get(targetCoinKey) || 0;
      if (targetCoin && !optimisticCoinClaimsRef.current.has(targetCoinKey) && Date.now() >= coolUntil) {
        optimisticCoinClaimsRef.current.add(targetCoinKey);
        playCoinCollectSound();
        emitToast('+1 Koin!', 'info', 1000);
        const nextCoinCount = (Number(player.coins) || 0) + 1;
        const playerWithCoin = { ...updatedPlayer, coins: nextCoinCount };
        setPlayers((prev) => ({ ...prev, [playerId]: playerWithCoin }));
        setLeaderboardPlayers((prev) => dedupeLeaderboardList(prev, playerId, playerWithCoin));
        saveAnonymousCache(nextCoinCount);
        setCoins((prev) => {
          const nextCoins = { ...prev };
          delete nextCoins[targetCoinKey];
          return nextCoins;
        });
        checkCoinMilestoneRef.current(playerWithCoin);
        const claimX = typeof targetCoin.x === 'number' ? targetCoin.x : newX;
        const claimY = typeof targetCoin.y === 'number' ? targetCoin.y : newY;
        claimCoinAction({ coinId: targetCoinKey, x: claimX, y: claimY }).catch(() => {
          // If rejected by server, throttle for 3s to prevent loop
          optimisticCoinClaimsRef.current.delete(targetCoinKey);
          rejectedCoinsCooldownRef.current.set(targetCoinKey, Date.now() + 3000);
          setCoins((prev) => ({ ...prev, [targetCoinKey]: targetCoin }));
          setPlayers((prev) => {
            const currentP = prev[playerId];
            if (!currentP) return prev;
            const revertedCoins = Math.max(0, (Number(currentP.coins) || 0) - 1);
            saveAnonymousCache(revertedCoins);
            const revertedPlayer = { ...currentP, coins: revertedCoins };
            setLeaderboardPlayers((currLb) => dedupeLeaderboardList(currLb, playerId, revertedPlayer));
            return { ...prev, [playerId]: revertedPlayer };
          });
        });
      }

      movePlayer(updatedPlayer).then((res) => {
        if (res?.reconcile && res?.authoritativePosition) {
          const authPos = res.authoritativePosition;
          setPlayers((prev) => {
            const self = prev[playerId];
            if (!self) return prev;
            return {
              ...prev,
              [playerId]: {
                ...self,
                x: authPos.x,
                y: authPos.y,
                direction: authPos.direction || self.direction
              }
            };
          });
          gameEventBridge.emit(GAME_BRIDGE_EVENTS.LOCAL_POSITION_SYNC, { x: authPos.x, y: authPos.y });
        }
      }).catch(() => {});
      const fromSpace = getKeyString(player.x, player.y);
      const toSpace = getKeyString(newX, newY);
      return mapData.sandSpaces[fromSpace] || mapData.sandSpaces[toSpace]
        ? SAND_MOVE_INTERVAL_MS
        : NORMAL_MOVE_INTERVAL_MS;
    }
    return NORMAL_MOVE_INTERVAL_MS;
  };

  const castSkill = (skillIndex = 0) => {
    if (!playerId || isSkillCoolingDown || isModalOpen || isCompletionModalOpen || isRespawningRef.current || respawnCountdown > 0) return;
    if (players[playerId] && Number(players[playerId].health) <= 0) return;
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
    // Modal strictly triggers only when collected coins is a positive multiple of POINT_THRESHOLD (5, 10, 15, ...)
    if (coins === 0 || coins % POINT_THRESHOLD !== 0) return;

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
   *
   * In classGameMode, questions come from the server via getNextStudentClassGameQuestion.
   */
  const fetchNextUnansweredQuestion = (queryPlayerId, _milestone) => {
    // Class game mode: fetch next question from server
    if (classGameModeRef.current && classGameClassId && classGameSessionId) {
      getNextStudentClassGameQuestion(classGameClassId, classGameSessionId)
        .then((serverQuestion) => {
          const q = serverQuestion?.question || serverQuestion;
          const questionId = q?.questionId || q?.id;
          if (!q || !questionId) {
            // No more questions — keep playing until timer finishes
            const pendingQuestion = pendingQuestionRef.current;
            if (pendingQuestion) {
              lastQuestionMilestoneRef.current = pendingQuestion.milestone;
              pendingQuestionRef.current = null;
              updatePlayer({ lastQuestionCoins: pendingQuestion.reachedCoinCount }).catch(console.error);
            }
            return;
          }
          // Map server question DTO to modal format
          const modalQ = {
            question: q.prompt,
            prompt: q.prompt,
            options: (q.options || []).map((o) => (typeof o === 'string' ? o : o.text || o.optionText || '')),
            correct: null, // server-scored; not revealed to client
            _classQuestion: true,
            _questionId: questionId,
            _serverOptions: q.options || [],
            imageUrl: q.imageUrl || q.imageKey || null,
            imageBase64: q.imageBase64 || null,
            interactionType: q.interactionType || q.questionType || 'single_choice',
            matrixData: q.matrixData || null
          };
          setModalContent(modalQ);
          setIsModalOpen(true);
        })
        .catch((error) => {
          pendingQuestionRef.current = null;
          console.error('Gagal mengambil soal dari server kelas:', error);
        });
      return;
    }

    // Default subject-only mode
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
        // R1: Soal telah selesai dijawab, tetapi game belum berakhir (menunggu pemain lain sampai timer room selesai)
      }
    }).catch((error) => {
      pendingQuestionRef.current = null;
      console.error(error);
    });
  };

  // Listen for authoritative coin collections from Phaser bridge
  useEffect(() => {
    const unsubCoinCollected = gameEventBridge.on(
      GAME_BRIDGE_EVENTS.COIN_COLLECTED,
      async ({ coinKey, gridX, gridY }) => {
        if (!coinKey) return;
        optimisticCoinClaimsRef.current.add(coinKey);
        playCoinCollectSound();
        emitToast('+1 Koin!', 'info', 1000);

        // Instant optimistic coin removal and score increment (0ms delay)
        setCoins((prev) => {
          if (!prev[coinKey]) return prev;
          const nextCoins = { ...prev };
          delete nextCoins[coinKey];
          return nextCoins;
        });

        setPlayers((prev) => {
          const currentLocalId = playerIdRef.current;
          if (!currentLocalId || !prev[currentLocalId]) return prev;
          const p = prev[currentLocalId];
          const nextCoins = (Number(p.coins) || 0) + 1;
          const updated = { ...p, coins: nextCoins };
          checkCoinMilestoneRef.current(updated);
          saveAnonymousCache(nextCoins);
          setLeaderboardPlayers((currLb) => dedupeLeaderboardList(currLb, currentLocalId, updated));
          return { ...prev, [currentLocalId]: updated };
        });

        try {
          const claimResult = await claimCoinAction({ coinId: coinKey, x: gridX, y: gridY });
          if (claimResult?.player) {
            setPlayers((prev) => ({ ...prev, [claimResult.player.id]: claimResult.player }));
            setLeaderboardPlayers((currLb) => dedupeLeaderboardList(currLb, claimResult.player.id, claimResult.player));
            checkCoinMilestoneRef.current(claimResult.player);
            saveAnonymousCache(claimResult.player.coins, claimResult.player.health, claimResult.player.lastQuestionCoins);
          }
        } catch (_err) {
          optimisticCoinClaimsRef.current.delete(coinKey);
          setCoins((prev) => ({ ...prev, [coinKey]: { x: gridX, y: gridY } }));
          setPlayers((prev) => {
            const currentLocalId = playerIdRef.current;
            if (!currentLocalId || !prev[currentLocalId]) return prev;
            const p = prev[currentLocalId];
            const revertedCoins = Math.max(0, (Number(p.coins) || 0) - 1);
            saveAnonymousCache(revertedCoins);
            const revertedPlayer = { ...p, coins: revertedCoins };
            setLeaderboardPlayers((currLb) => dedupeLeaderboardList(currLb, currentLocalId, revertedPlayer));
            return { ...prev, [currentLocalId]: revertedPlayer };
          });
          gameEventBridge.emit(GAME_BRIDGE_EVENTS.COIN_CLAIM_REJECTED, { coinKey, x: gridX, y: gridY });
        }
      }
    );

    return () => {
      unsubCoinCollected();
    };
  }, [saveAnonymousCache]);

  // Continuous proximity sweep: claim coin if player touches or stands within <= 0.85 tiles
  useEffect(() => {
    // Guard against spawn auto-claims before initial movement and before grace period expires
    if (Date.now() < spawnGracePeriodEndRef.current || !hasMovedOnceRef.current) return;
    if (!playerId || !players[playerId]) return;
    const player = players[playerId];
    const px = player.x;
    const py = player.y;
    if (typeof px !== 'number' || typeof py !== 'number') return;

    const touchingCoinEntry = Object.entries(coins).find(([key, c]) => {
      if (!c || typeof c.x !== 'number' || typeof c.y !== 'number') return false;
      if (optimisticCoinClaimsRef.current.has(key)) return false;
      const coolUntil = rejectedCoinsCooldownRef.current.get(key) || 0;
      if (Date.now() < coolUntil) return false;
      return Math.hypot(c.x - px, c.y - py) <= 0.85;
    });

    if (touchingCoinEntry) {
      const [touchKey, touchCoin] = touchingCoinEntry;
      const coolUntil = rejectedCoinsCooldownRef.current.get(touchKey) || 0;
      if (Date.now() < coolUntil) return;

      optimisticCoinClaimsRef.current.add(touchKey);
      playCoinCollectSound();
      emitToast('+1 Koin!', 'info', 1000);
      const nextCoinCount = (Number(player.coins) || 0) + 1;
      const playerWithCoin = { ...player, coins: nextCoinCount };
      setPlayers((prev) => ({ ...prev, [playerId]: playerWithCoin }));
      setLeaderboardPlayers((prev) => dedupeLeaderboardList(prev, playerId, playerWithCoin));
      saveAnonymousCache(nextCoinCount);
      setCoins((prev) => {
        const next = { ...prev };
        delete next[touchKey];
        return next;
      });
      checkCoinMilestoneRef.current(playerWithCoin);
      const claimX = typeof touchCoin.x === 'number' ? touchCoin.x : px;
      const claimY = typeof touchCoin.y === 'number' ? touchCoin.y : py;
      claimCoinAction({ coinId: touchKey, x: claimX, y: claimY }).catch(() => {
        // If rejected by server, throttle for 3s to break rapid-fire loops
        optimisticCoinClaimsRef.current.delete(touchKey);
        rejectedCoinsCooldownRef.current.set(touchKey, Date.now() + 3000);
        setCoins((prev) => ({ ...prev, [touchKey]: touchCoin }));
        setPlayers((prev) => {
          const currentP = prev[playerId];
          if (!currentP) return prev;
          const revertedCoins = Math.max(0, (Number(currentP.coins) || 0) - 1);
          saveAnonymousCache(revertedCoins);
          const revertedPlayer = { ...currentP, coins: revertedCoins };
          setLeaderboardPlayers((currLb) => dedupeLeaderboardList(currLb, playerId, revertedPlayer));
          return { ...prev, [playerId]: revertedPlayer };
        });
      });
    }
  }, [coins, players, playerId, saveAnonymousCache]);

  // Listen for authoritative movement events from Phaser canvas
  useEffect(() => {
    const unsubMove = gameEventBridge.on(
      GAME_BRIDGE_EVENTS.PLAYER_POSITION_CHANGED,
      ({ x, y, direction }) => {
        const currentLocalId = playerIdRef.current;
        if (!currentLocalId || isRespawningRef.current) return;

        setPlayers((prev) => {
          const p = prev[currentLocalId];
          if (!p) return prev;
          const updated = { ...p, x, y, direction: direction || p.direction };
          return { ...prev, [currentLocalId]: updated };
        });

        movePlayer({ x, y, direction }).then((res) => {
          if (res?.reconcile && res?.authoritativePosition) {
            const authPos = res.authoritativePosition;
            setPlayers((prev) => {
              const self = prev[currentLocalId];
              if (!self) return prev;
              return {
                ...prev,
                [currentLocalId]: {
                  ...self,
                  x: authPos.x,
                  y: authPos.y,
                  direction: authPos.direction || self.direction
                }
              };
            });
            gameEventBridge.emit(GAME_BRIDGE_EVENTS.LOCAL_POSITION_SYNC, { x: authPos.x, y: authPos.y });
          }
        }).catch(() => {});
      }
    );

    return () => {
      unsubMove();
    };
  }, []);

  /**
   * Cleanly resets in-game progress and starts a repeatable session cycle:
   * 1. Saves history of the finished run to MySQL.
   * 2. Resets coins to 0, health to 3, lastQuestionCoins to 0, milestone to 0.
   * 3. Generates a fresh sessionId.
   * 4. Reconnects to socket with isReset: true to prevent stale Redis state merge.
   * 5. Resets player position to a safe spot.
   */
  /**
   * Proximity & Combat Viewport Culling:
   * 1. Local player is guaranteed 100% rendered.
   * 2. Combat priority: anyone within combat radius (<= 5 tiles), actively casting skills,
   *    attacking, or damaged is 100% guaranteed to be rendered.
   * 3. Viewport priority: remaining render budget is filled by nearest players within camera view (<= 16 tiles).
   * 4. Faraway players (> 25 tiles away) are excluded from DOM rendering to protect mobile CPU/FPS.
   */
  const cullVisiblePlayers = (playersObj, currentPlayerId) => {
    if (!playersObj) return;
    const playerIds = Object.keys(playersObj);
    if (playerIds.length === 0) {
      setRandomPlayers(currentPlayerId ? [currentPlayerId] : []);
      return;
    }

    const self = currentPlayerId ? playersObj[currentPlayerId] : null;
    const selfX = Number(self?.x) || 12;
    const selfY = Number(self?.y) || 12;
    const MAX_DISPLAY_PLAYERS = 14;

    const combatCandidates = [];
    const nearbyCandidates = [];

    playerIds.forEach((id) => {
      if (id === currentPlayerId) return;
      const other = playersObj[id];
      if (!other) return;

      const otherX = Number(other.x) || 0;
      const otherY = Number(other.y) || 0;
      const dist = Math.hypot(otherX - selfX, otherY - selfY);

      const isCombatant = dist <= 5
        || Boolean(other.skillActive)
        || (other.lastAttackerId === currentPlayerId)
        || (self && self.lastAttackerId === id);

      if (isCombatant) {
        combatCandidates.push({ id, dist });
      } else if (dist <= 16) {
        nearbyCandidates.push({ id, dist });
      }
    });

    combatCandidates.sort((a, b) => a.dist - b.dist);
    nearbyCandidates.sort((a, b) => a.dist - b.dist);

    const selectedIds = [];
    if (currentPlayerId) {
      selectedIds.push(currentPlayerId);
    }

    // 1. Guaranteed 100% render for combatants
    for (const c of combatCandidates) {
      if (selectedIds.length >= MAX_DISPLAY_PLAYERS) break;
      selectedIds.push(c.id);
    }

    // 2. Fill remaining slots with nearest viewport players
    for (const n of nearbyCandidates) {
      if (selectedIds.length >= MAX_DISPLAY_PLAYERS) break;
      if (!selectedIds.includes(n.id)) {
        selectedIds.push(n.id);
      }
    }

    // Fallback if room has fewer players than MAX_DISPLAY_PLAYERS
    if (selectedIds.length < MAX_DISPLAY_PLAYERS && playerIds.length <= MAX_DISPLAY_PLAYERS) {
      for (const id of playerIds) {
        if (!selectedIds.includes(id)) {
          selectedIds.push(id);
        }
      }
    }

    setRandomPlayers((prev) => {
      if (prev.length === selectedIds.length && prev.every((id, idx) => id === selectedIds[idx])) {
        return prev;
      }
      return selectedIds;
    });
  };

  const selectRandomPlayers = cullVisiblePlayers;

  useEffect(() => {
    const handleUserSession = (user) => {
      const signedInManualUser = getManualUser();
      const isRegistered = Boolean(signedInManualUser || (user && !user.isAnonymous));

      // If already initialized as registered user, do not restart
      if (sessionStartedRef.current && !isGuestSessionRef.current) return;

      // If already started as guest, but now registered user credentials arrive -> clean up guest and promote session!
      if (sessionStartedRef.current && isGuestSessionRef.current) {
        if (!isRegistered) return;
        if (typeof cleanupRealtimeRef.current === 'function') {
          cleanupRealtimeRef.current();
          cleanupRealtimeRef.current = null;
        }
        sessionStartedRef.current = false;
        isGuestSessionRef.current = false;
      }

      sessionStartedRef.current = true;
      isGuestSessionRef.current = !isRegistered;

      const hasManualToken = typeof window !== 'undefined'
        && Boolean(window.localStorage?.getItem('gamukis_manual_token') || window.sessionStorage?.getItem('gamukis_manual_token'));
      const isGoogleAuth = Boolean(auth?.currentUser && !auth.currentUser.isAnonymous) || signedInManualUser?.authType === 'google';
      const isManualUser = Boolean((hasManualToken || Boolean(signedInManualUser?.id || signedInManualUser?.userId)) && !isGoogleAuth && (signedInManualUser?.id || signedInManualUser?.userId));

      // Normalize answerOwnerId: manual user ID if manual, else user.uid
      answerOwnerIdRef.current = isManualUser
        ? String(signedInManualUser.id || signedInManualUser.userId)
        : (user?.uid || signedInManualUser?.id || 'guest');
      const guest = !isRegistered;
      const accountName = (!user?.isAnonymous && user?.displayName?.trim() ? user.displayName.trim() : null)
        || signedInManualUser?.username?.trim()
        || user?.displayName?.trim()
        || user?.email?.split('@')[0]
        || 'Pengguna';
      const normalizedAccountName = accountName.slice(0, 30);
      const initialName = guest ? playerNameRef.current : normalizedAccountName;
      setIsGuest(guest);
      setPlayerName(initialName);
      playerNameRef.current = initialName;
      let guestId = typeof window !== 'undefined' ? window.sessionStorage?.getItem('gamukis_guest_id') : null;
      if (!guestId) {
        guestId = generateSecureGuestId();
        if (typeof window !== 'undefined') {
          window.sessionStorage?.setItem('gamukis_guest_id', guestId);
        }
      }
      const previousPid = playerIdRef.current;
      // `let` on purpose: subscription callbacks close over this binding, so adopting the
      // server-authoritative id (see onIdentityResolved) updates every handler at once.
      let pid = isManualUser
        ? `manual_${signedInManualUser.id || signedInManualUser.userId}`
        : (user?.uid || signedInManualUser?.id || guestId);
      setPlayerId(pid);
      playerIdRef.current = pid;

      const isStaleLocalIdentity = (candidateId, entry, activePid) => {
        if (!candidateId || candidateId === activePid) return false;
        const currentSessionId = sessionIdRef.current;
        const altManualId = isManualUser ? `manual_${signedInManualUser.id || signedInManualUser.userId}` : null;
        const altFirebaseId = user?.uid || (!isManualUser ? signedInManualUser?.id : null) || auth?.currentUser?.uid || null;
        const localOwnerId = answerOwnerIdRef.current && answerOwnerIdRef.current !== 'guest'
          ? answerOwnerIdRef.current
          : null;
        const isStaleLocalGuest = (candidateId === guestId)
          || (previousPid && candidateId === previousPid)
          || (!guest && String(candidateId).startsWith('guest_') && entry?.sessionId === currentSessionId);
        const isStaleLocalAuth = (altManualId && candidateId === altManualId) || (altFirebaseId && candidateId === altFirebaseId);
        const isSameLocalSession = Boolean(currentSessionId && entry?.sessionId === currentSessionId);
        const isSameLocalOwner = Boolean(localOwnerId && entry?.answerOwnerId === localOwnerId);
        return Boolean(isStaleLocalGuest || isStaleLocalAuth || isSameLocalSession || isSameLocalOwner);
      };

      // Helper to strip any duplicate local identities (e.g. promoted guest_* or alternate local auth UID)
      // so the local player never renders twice on the map.
      const pruneStaleLocalEntries = (playersMap, activePid) => {
        if (!playersMap) return {};
        const next = { ...playersMap };
        Object.keys(next).forEach((k) => {
          if (isStaleLocalIdentity(k, next[k], activePid)) {
            delete next[k];
          }
        });
        return next;
      };

      const dedupeLeaderboardList = (list, activePid, selfReplacement = null) => {
        const byId = new Map();
        (list || []).forEach((entry) => {
          if (!entry || !entry.id) return;
          if (entry.historySavedAt || entry.disconnectedAt) return;
          if (isStaleLocalIdentity(entry.id, entry, activePid)) return;
          byId.set(entry.id, entry);
        });
        if (selfReplacement && activePid) {
          byId.set(activePid, { ...byId.get(activePid), ...selfReplacement, id: activePid });
        }
        return Array.from(byId.values());
      };

      const previousPlayer = (previousPid && players[previousPid]) || (pid && players[pid]) || null;
      const safeSpot = getRandomSafeSpot(mapData);
      const x = (previousPlayer && Number.isFinite(previousPlayer.x) && !(previousPlayer.x === 0 && previousPlayer.y === 0))
        ? previousPlayer.x
        : safeSpot.x;
      const y = (previousPlayer && Number.isFinite(previousPlayer.y) && !(previousPlayer.x === 0 && previousPlayer.y === 0))
        ? previousPlayer.y
        : safeSpot.y;
      const savedAppearance = loadSavedAppearance();
      const guestGenderColor = (savedAppearance?.gender === 'Perempuan' || savedAppearance?.gender === 'female') ? 'girl' : 'man';
      const color = previousPlayer?.color || (guest ? guestGenderColor : randomFromArray(playerColors));
      setPlayerColor(color);

      const resolvedAppearance = guest ? null : loadSavedAppearance();
      setCurrentAppearance(resolvedAppearance);

        // For registered users, try loading server active character asynchronously
        if (!guest) {
          fetchCharacters()
            .then((res) => {
              const activeChar = res?.characters?.find((c) => c.isActive) || res?.characters?.[0];
              if (activeChar?.data) {
                setCurrentAppearance(activeChar.data);
                // Sync to realtime game state if playerId matches
                updatePlayer({ appearance: activeChar.data });
              }
            })
            .catch(() => {
              // Gracefully fallback to localStorage resolvedAppearance
            });
        }

        const activeCache = initialSessionCache.current || getAnyActiveSessionCache();
        const hasValidCache = !resetSessionRequested && Boolean(activeCache);
        const initialCoins = hasValidCache ? (Number(activeCache.coins) || 0) : 0;
        const initialHealth = hasValidCache ? (Number(activeCache.health) || 3) : 3;
        const initialLastQCoins = hasValidCache ? (Number(activeCache.lastQuestionCoins) || 0) : 0;
        const initialGameStartedAt = hasValidCache ? Number(activeCache.gameStartedAt) : sessionStartTimeRef.current;
        // Read kill counts from cache (already seeded into refs on mount).
        // Send them in the join payload so the server can Math.max against Redis.
        const initialBotKills = hasValidCache ? (Number(activeCache.botKills) || 0) : 0;
        const initialPlayerKills = hasValidCache ? (Number(activeCache.playerKills) || 0) : 0;
        const isResetFlag = resetSessionRequested;

        const initialLocalPlayer = {
          id: pid,
          name: initialName,
          direction: "right",
          color,
          gender: color === 'girl' ? 'female' : 'male',
          x,
          y,
          coins: initialCoins,
          health: initialHealth,
          lastQuestionCoins: initialLastQCoins,
          botKills: initialBotKills,
          playerKills: initialPlayerKills,
          sessionId: sessionIdRef.current,
          gameStartedAt: initialGameStartedAt,
          gameDurationMs: gameDurationSeconds * 1000,
          answerOwnerId: answerOwnerIdRef.current,
          allQuestion: activeQuestions.length,
          appearance: resolvedAppearance,
          isGuest: guest
        };

        // Initialize local player immediately so Camera and Player avatar render instantly
        // without waiting for network/socket, preventing the 0x0 ocean glitch!
        setPlayers((prev) => {
          const next = pruneStaleLocalEntries(prev, pid);
          next[pid] = initialLocalPlayer;
          return next;
        });
        setRandomPlayers((prev) => {
          const filtered = prev.filter((id) => id === pid || (id !== guestId && id !== previousPid));
          return filtered.includes(pid) ? filtered : [...filtered, pid];
        });
        setCoins((prev) => (Object.keys(prev || {}).length ? prev : getLocalFallbackCoins(x, y)));
        setBots((prev) => (Object.keys(prev || {}).length ? prev : getLocalFallbackBots()));
        setLeaderboardPlayers((prev) => (prev && prev.length ? prev : [initialLocalPlayer]));

        const subscriptionId = ++activeSubscriptionIdRef.current;

        const adoptServerIdentity = (serverPid) => {
          if (activeSubscriptionIdRef.current !== subscriptionId) return;
          if (!serverPid || serverPid === pid) return;
          const localPid = pid;
          pid = serverPid;
          playerIdRef.current = serverPid;
          setPlayerId(serverPid);
          setPlayers((prev) => {
            const localEntry = prev[localPid] || initialLocalPlayer;
            const cleaned = pruneStaleLocalEntries(prev, serverPid);
            delete cleaned[localPid];
            cleaned[serverPid] = { ...cleaned[serverPid], ...localEntry, id: serverPid };
            return cleaned;
          });
          setRandomPlayers((prev) => {
            const mapped = prev.filter((id) => id !== localPid && id !== serverPid);
            return [...mapped, serverPid];
          });
          setLeaderboardPlayers((prev) => {
            const localLbEntry = (prev || []).find((p) => p && p.id === localPid) || initialLocalPlayer;
            return dedupeLeaderboardList(prev, serverPid, { ...localLbEntry, id: serverPid });
          });
        };

        subscribeToGame({
          player: {
            ...initialLocalPlayer,
            previousGuestId: guestId !== pid ? guestId : undefined,
            previousPlayerId: previousPid && previousPid !== pid ? previousPid : undefined,
            isReset: isResetFlag
          },
          onIdentityResolved: adoptServerIdentity,
          onSnapshot: (snapshot) => {
            if (activeSubscriptionIdRef.current !== subscriptionId) return;
            // If snapshot carries the server-authoritative player id (or a matching sessionId record)
            // before the join callback resolves, adopt it immediately so pruneStaleLocalEntries never deletes self!
            const rawSnapshotPlayers = snapshot?.players || {};
            let detectedServerPid = snapshot?.selfPlayerId || null;
            if (!detectedServerPid && !rawSnapshotPlayers[pid] && sessionIdRef.current) {
              const matchingEntry = Object.entries(rawSnapshotPlayers).find(
                ([, p]) => p && p.sessionId === sessionIdRef.current
              );
              if (matchingEntry) detectedServerPid = matchingEntry[0];
            }
            if (detectedServerPid && detectedServerPid !== pid) {
              adoptServerIdentity(detectedServerPid);
            }
            const activePid = playerIdRef.current || detectedServerPid || pid;

            const currentPlayers = pruneStaleLocalEntries(rawSnapshotPlayers, activePid);
            const fallbackSelf = {
              ...currentPlayers[activePid],
              ...initialLocalPlayer,
              id: activePid,
              coins: currentPlayers[activePid]?.coins !== undefined ? currentPlayers[activePid].coins : initialLocalPlayer.coins,
              health: currentPlayers[activePid]?.health !== undefined ? currentPlayers[activePid].health : initialLocalPlayer.health
            };
            currentPlayers[activePid] = currentPlayers[activePid] || fallbackSelf;

            // Guarantee local player predicted coordinates and state are preserved against delayed server snapshots
            setPlayers((prev) => {
              const merged = pruneStaleLocalEntries({ ...currentPlayers }, activePid);
              const existingSelf = prev[activePid] || prev[pid] || fallbackSelf;
              const serverSelf = rawSnapshotPlayers[activePid] || currentPlayers[activePid] || {};
              const resolvedCoins = Math.max(
                Number(serverSelf.coins) || 0,
                Number(existingSelf.coins) || 0,
                Number(initialLocalPlayer.coins) || 0
              );
              merged[activePid] = {
                ...serverSelf,
                ...existingSelf,
                id: activePid,
                coins: resolvedCoins,
                health: serverSelf.health !== undefined ? serverSelf.health : existingSelf.health,
                gameStartedAt: serverSelf.gameStartedAt || existingSelf.gameStartedAt || sessionStartTimeRef.current
              };
              return merged;
            });

            // Sync-back kill counters from server snapshot.
            // Redis is authoritative: if the server restored a higher kill count (from a previous
            // session resumed after refresh), update the local refs to match so the score is correct.
            const serverSelfData = rawSnapshotPlayers[playerIdRef.current || pid];
            if (serverSelfData) {
              const serverBotKills = Number(serverSelfData.botKills) || 0;
              const serverPlayerKills = Number(serverSelfData.playerKills) || 0;
              if (serverBotKills > botKillsRef.current) botKillsRef.current = serverBotKills;
              if (serverPlayerKills > playerKillsRef.current) playerKillsRef.current = serverPlayerKills;
            }

            const currentP = currentPlayers[activePid] || fallbackSelf;
            setLeaderboardPlayers(dedupeLeaderboardList(snapshot.leaderboard || [], activePid, currentP));
            if (snapshot.coins && Object.keys(snapshot.coins).length > 0) {
              setCoins(snapshot.coins);
            } else {
              setCoins((prev) => (Object.keys(prev || {}).length ? prev : getLocalFallbackCoins(x, y)));
            }
            setBots((prev) => {
              const serverBots = snapshot.bots || {};
              const dyingBots = {};
              Object.entries(prev || {}).forEach(([id, b]) => {
                if ((b?.isDying || b?.state === 'dead' || Number(b?.health) <= 0) && !serverBots[id]) {
                  dyingBots[id] = b;
                }
              });
              const mergedBots = { ...serverBots, ...dyingBots };
              if (Object.keys(mergedBots).length === 0 && Object.keys(prev || {}).length > 0) {
                return prev;
              }
              return Object.keys(mergedBots).length > 0 ? mergedBots : getLocalFallbackBots();
            });
            selectRandomPlayers(currentPlayers, activePid);
            checkCoinMilestoneRef.current(currentPlayers?.[activePid]);
          },
          onPlayerUpdated: (updatedPlayer) => {
            if (activeSubscriptionIdRef.current !== subscriptionId) return;
            if (!updatedPlayer?.id) return;
            const activePid = playerIdRef.current || pid;
            // Ignore any stale broadcast for a superseded local guest/auth ID
            if (isStaleLocalIdentity(updatedPlayer.id, updatedPlayer, activePid)) {
              return;
            }
            if (updatedPlayer.id !== activePid && Number(updatedPlayer.health) <= 0 && updatedPlayer.lastAttackerId === activePid) {
              playerKillsRef.current += 1;
              emitToast('Kamu mengeliminasi lawan! (+30 Skor)', 'success', 2500);
            }

            if (updatedPlayer.id === activePid) {
              // 0ms instant local player update
              setPlayers((currentPlayers) => {
                const cleaned = pruneStaleLocalEntries(currentPlayers, activePid);
                const existingSelf = cleaned[activePid];
                const playerToStore = existingSelf
                  ? {
                      ...updatedPlayer,
                      id: activePid,
                      x: existingSelf.x,
                      y: existingSelf.y,
                      direction: existingSelf.direction
                    }
                  : { ...updatedPlayer, id: activePid };

                const nextPlayers = { ...cleaned, [activePid]: playerToStore };
                cullVisiblePlayers(nextPlayers, activePid);
                return nextPlayers;
              });
              checkCoinMilestoneRef.current(updatedPlayer);
              saveAnonymousCache(updatedPlayer.coins, updatedPlayer.health, updatedPlayer.lastQuestionCoins);
            } else {
              // Remote player: batch into RAF to eliminate unthrottled React re-render lag under 100 players
              pendingRemoteBatchRef.current[updatedPlayer.id] = updatedPlayer;
              if (!remoteBatchTimerRef.current) {
                remoteBatchTimerRef.current = requestAnimationFrame(() => {
                  remoteBatchTimerRef.current = null;
                  const batch = pendingRemoteBatchRef.current;
                  pendingRemoteBatchRef.current = {};
                  const batchIds = Object.keys(batch);
                  if (batchIds.length === 0) return;

                  setPlayers((currentPlayers) => {
                    const merged = { ...currentPlayers, ...batch };
                    const selfLobbyId = currentPlayers[activePid]?.lobbyId;
                    batchIds.forEach((remoteId) => {
                      const remote = batch[remoteId];
                      // Finished, disconnected or cross-lobby entities must never linger as ghost avatars.
                      const isInactive = Boolean(remote?.historySavedAt || remote?.disconnectedAt);
                      const isOtherLobby = Boolean(selfLobbyId && remote?.lobbyId && String(remote.lobbyId) !== String(selfLobbyId));
                      if (isInactive || isOtherLobby) {
                        delete merged[remoteId];
                      }
                    });
                    const nextPlayers = pruneStaleLocalEntries(merged, activePid);
                    cullVisiblePlayers(nextPlayers, activePid);
                    return nextPlayers;
                  });
                });
              }
            }
          },
          onPlayerLeft: (leftPlayerId) => {
            const activePid = playerIdRef.current || pid;
            if (!leftPlayerId || leftPlayerId === activePid) return;
            delete pendingRemoteBatchRef.current[leftPlayerId];
            setPlayers((currentPlayers) => {
              const nextPlayers = { ...currentPlayers };
              delete nextPlayers[leftPlayerId];
              cullVisiblePlayers(nextPlayers, activePid);
              return nextPlayers;
            });
            setLeaderboardPlayers((currentPlayers) => (
              (currentPlayers || []).filter((player) => player && player.id !== leftPlayerId)
            ));
          },
          onLeaderboardUpdated: (updatedPlayer) => {
            if (activeSubscriptionIdRef.current !== subscriptionId) return;
            if (!updatedPlayer?.id) return;
            const activePid = playerIdRef.current || pid;
            if (isStaleLocalIdentity(updatedPlayer.id, updatedPlayer, activePid)) {
              return;
            }
            if (updatedPlayer.historySavedAt || updatedPlayer.disconnectedAt) {
              setLeaderboardPlayers((currentPlayers) => (
                (currentPlayers || []).filter((player) => player && player.id !== updatedPlayer.id)
              ));
              return;
            }
            setLeaderboardPlayers((currentPlayers) => (
              dedupeLeaderboardList(currentPlayers, activePid, updatedPlayer.id === activePid ? updatedPlayer : null)
                .filter((player) => player && player.id !== updatedPlayer.id)
                .concat(updatedPlayer)
            ));
          },
          onCoinAdded: (coinId, coin) => setCoins((currentCoins) => ({ ...currentCoins, [coinId]: coin })),
          onCoinClaimed: (coinId, updatedPlayer) => {
            setCoins((currentCoins) => {
              const nextCoins = { ...currentCoins };
              delete nextCoins[coinId];
              return nextCoins;
            });
            if (updatedPlayer?.id) {
              const activePid = playerIdRef.current || pid;
              setPlayers((currentPlayers) => {
                // coin:claimed is broadcast globally; never spawn avatars for players outside this view/lobby.
                if (updatedPlayer.id !== activePid && !currentPlayers[updatedPlayer.id]) {
                  return currentPlayers;
                }
                const existingSelf = currentPlayers[activePid];
                const playerToStore = (updatedPlayer.id === activePid && existingSelf)
                  ? {
                      ...updatedPlayer,
                      id: activePid,
                      x: existingSelf.x,
                      y: existingSelf.y,
                      direction: existingSelf.direction
                    }
                  : updatedPlayer;
                return { ...currentPlayers, [updatedPlayer.id]: playerToStore };
              });
              checkCoinMilestoneRef.current(updatedPlayer);
              if (updatedPlayer.id === activePid) {
                // Check exact ID or coordinate prefix match to prevent duplicate SFX/toast
                const matchedClaim = Array.from(optimisticCoinClaimsRef.current).find(
                  (id) => id === coinId || id.startsWith(`${updatedPlayer.x}x${updatedPlayer.y}`)
                );
                if (matchedClaim) {
                  optimisticCoinClaimsRef.current.delete(matchedClaim);
                } else {
                  playCoinCollectSound();
                  emitToast('+1 Koin!', 'info', 1200);
                }
                saveAnonymousCache(updatedPlayer.coins, updatedPlayer.health, updatedPlayer.lastQuestionCoins);
              }
              setLeaderboardPlayers((currentPlayers) => (
                dedupeLeaderboardList(currentPlayers, activePid, updatedPlayer.id === activePid ? updatedPlayer : null)
                  .filter((player) => player && player.id !== updatedPlayer.id)
                  .concat(updatedPlayer)
              ));
            }
          },
          onBotSpawned: (newBot) => {
            if (newBot?.id) {
              setBots((prev) => ({ ...prev, [newBot.id]: newBot }));
            }
          },
          onBotMoved: (botUpdate) => {
            if (!botUpdate?.botId) return;
            pendingBotBatchRef.current[botUpdate.botId] = botUpdate;
            if (!botBatchTimerRef.current) {
              botBatchTimerRef.current = requestAnimationFrame(() => {
                botBatchTimerRef.current = null;
                const batch = pendingBotBatchRef.current;
                pendingBotBatchRef.current = {};
                const batchIds = Object.keys(batch);
                if (batchIds.length === 0) return;

                setBots((prev) => {
                  let hasChanges = false;
                  const nextBots = { ...prev };

                  batchIds.forEach((bId) => {
                    const update = batch[bId];
                    const existing = prev[bId];
                    if (!existing) return;
                    if (existing.isDying || existing.state === 'dead' || Number(existing.health) <= 0) {
                      return;
                    }

                    const isNowDead = (typeof update.health === 'number' && update.health <= 0) || update.state === 'dead' || update.state === 'death';
                    if (isNowDead) {
                      window.setTimeout(() => {
                        setBots((curr) => {
                          if (!curr[bId]) return curr;
                          const next = { ...curr };
                          delete next[bId];
                          return next;
                        });
                      }, 1000);
                    }

                    hasChanges = true;
                    nextBots[bId] = {
                      ...existing,
                      x: typeof update.x === 'number' ? update.x : existing.x,
                      y: typeof update.y === 'number' ? update.y : existing.y,
                      direction: update.direction || existing.direction,
                      state: isNowDead ? 'dead' : (update.state || existing.state),
                      health: typeof update.health === 'number' ? update.health : existing.health,
                      maxHealth: typeof update.maxHealth === 'number' ? update.maxHealth : existing.maxHealth,
                      ...(isNowDead ? { isDying: true } : {})
                    };
                  });

                  return hasChanges ? nextBots : prev;
                });
              });
            }
          },
          onBotAttackWarning: (data) => {
            const { botId, targetPlayerId } = data || {};
            setBots((prev) => {
              if (!prev[botId] || prev[botId].isDying || prev[botId].state === 'dead') return prev;
              return { ...prev, [botId]: { ...prev[botId], state: 'telegraphing', isTelegraphing: true } };
            });
            gameEventBridge.emit(GAME_BRIDGE_EVENTS.BOT_ATTACK_WARNING, data);
            if (targetPlayerId === pid) {
              emitToast('Awas! Monster bersiap menyerang!', 'warning', 1200);
            }
          },
          onBotAttack: (data) => {
            const { botId, targetPlayerId, missed } = data || {};
            setBots((prev) => {
              if (!prev[botId] || prev[botId].isDying || prev[botId].state === 'dead' || Number(prev[botId].health) <= 0) return prev;
              return { ...prev, [botId]: { ...prev[botId], state: 'attacking', isTelegraphing: false } };
            });
            window.setTimeout(() => {
              setBots((prev) => {
                if (!prev[botId] || prev[botId].isDying || prev[botId].state === 'dead' || Number(prev[botId].health) <= 0) return prev;
                return { ...prev, [botId]: { ...prev[botId], state: 'idle' } };
              });
            }, 400);
            gameEventBridge.emit(GAME_BRIDGE_EVENTS.BOT_ATTACK_EXECUTED, data);
            if (targetPlayerId === pid) {
              if (missed) {
                emitToast('Berhasil menghindar dari serangan monster!', 'info', 1500);
              } else {
                emitToast('Kamu diserang monster!', 'error', 2000);
              }
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
          if (activeSubscriptionIdRef.current !== subscriptionId) {
            cleanup?.();
            return;
          }
          cleanupRealtimeRef.current = cleanup;
          if (!guest) updatePlayer({ name: normalizedAccountName }).catch(console.error);
        }).catch((err) => {
          if (activeSubscriptionIdRef.current !== subscriptionId) return;
          console.error('Socket realtime fallback to local:', err);
          const localFallbackPlayer = {
            id: pid,
            name: initialName,
            direction: "right",
            color,
            gender: color === 'girl' ? 'female' : 'male',
            x,
            y,
            coins: initialCoins,
            health: initialHealth,
            lastQuestionCoins: initialLastQCoins,
            sessionId: sessionIdRef.current,
            gameStartedAt: initialGameStartedAt,
            gameDurationMs: gameDurationSeconds * 1000,
            answerOwnerId: answerOwnerIdRef.current,
            allQuestion: activeQuestions.length,
            appearance: resolvedAppearance,
            isGuest: guest
          };
          setPlayers((prev) => ({ ...pruneStaleLocalEntries(prev, pid), [pid]: localFallbackPlayer }));
          setBots((prev) => (Object.keys(prev || {}).length ? prev : getLocalFallbackBots()));
          setCoins((prev) => (Object.keys(prev || {}).length ? prev : getLocalFallbackCoins(x, y)));
        });
    };

    let isSubscribed = true;
    let handledSessionKey = null;

    const runUserSession = (userToHandle) => {
      if (!isSubscribed) return;
      const manualUserSnapshot = getManualUser();
      const sessionKey = userToHandle?.uid
        || (manualUserSnapshot ? `manual_${manualUserSnapshot.id || manualUserSnapshot.userId}` : 'guest');
      if (handledSessionKey === sessionKey) return;
      handledSessionKey = sessionKey;
      handleUserSession(userToHandle);
    };

    const initAuthSession = async () => {
      // 1. If logged in via manual MySQL auth (non-google), initialize game immediately on frame 1
      const existingManualUser = getManualUser();
      const hasManualToken = typeof window !== 'undefined' && Boolean(window.localStorage?.getItem('gamukis_manual_token') || window.sessionStorage?.getItem('gamukis_manual_token'));
      const isManualLoggedIn = Boolean((hasManualToken || Boolean(existingManualUser?.id || existingManualUser?.userId)) && existingManualUser && existingManualUser.authType !== 'google');
      if (isManualLoggedIn) {
        runUserSession(auth.currentUser);
        return;
      }

      // 2. If logged in via Google and currentUser is already in memory, initialize immediately
      if (auth.currentUser && !auth.currentUser.isAnonymous) {
        runUserSession(auth.currentUser);
        return;
      }

      // 3. Otherwise wait for Firebase auth persistence to resolve (e.g. on hard refresh or cold load)
      try {
        if (typeof waitForAuth === 'function') {
          await waitForAuth();
        } else if (typeof auth?.authStateReady === 'function') {
          await auth.authStateReady();
        }
      } catch (err) {
        console.warn('Firebase waitForAuth error:', err);
      }

      if (!isSubscribed) return;

      const resolvedUser = auth.currentUser;
      const currentManualUser = getManualUser();

      if (resolvedUser || currentManualUser) {
        runUserSession(resolvedUser);
      } else {
        // True unauthenticated guest: initialize directly without destructive signInAnon
        runUserSession(null);
      }
    };

    initAuthSession();

    const unsubscribe = observeAuthState((user) => {
      if (!isSubscribed) return;
      if (user) {
        runUserSession(user);
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
      if (remoteBatchTimerRef.current) {
        cancelAnimationFrame(remoteBatchTimerRef.current);
        remoteBatchTimerRef.current = null;
      }
      if (botBatchTimerRef.current) {
        cancelAnimationFrame(botBatchTimerRef.current);
        botBatchTimerRef.current = null;
      }
      if (respawnTimerRef.current) {
        clearInterval(respawnTimerRef.current);
        respawnTimerRef.current = null;
      }
      if (invulnerableTimerRef.current) {
        clearInterval(invulnerableTimerRef.current);
        invulnerableTimerRef.current = null;
      }
      // Invalidate any subscription still connecting so its late `.then` cleans itself up.
      activeSubscriptionIdRef.current += 1;
      cleanupRealtimeRef.current?.();
      cleanupRealtimeRef.current = null;
      sessionStartedRef.current = false;
      isGuestSessionRef.current = true;
    };
  // Autentikasi dan subjek game diselesaikan sekali ketika halaman dimuat.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!playerId) return;

    const hasManualToken = typeof window !== 'undefined'
      && Boolean(window.localStorage?.getItem('gamukis_manual_token') || window.sessionStorage?.getItem('gamukis_manual_token'));
    const isGoogleAuth = Boolean(auth?.currentUser && !auth.currentUser.isAnonymous) || manualUser?.authType === 'google';
    const isManual = Boolean((hasManualToken || Boolean(manualUser?.id || manualUser?.userId)) && !isGoogleAuth && (manualUser?.id || manualUser?.userId));

    answerOwnerIdRef.current = isManual
      ? String(manualUser.id || manualUser.userId)
      : (auth.currentUser?.uid || manualUser?.id || playerId);

    if (manualUser?.username) {
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
      updatePlayer({ name: guestName, appearance: null }).catch(console.error);
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
    'Keyc': changeColor,
    'c': changeColor,
    'C': changeColor,
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
        key={effectiveGameStartedAt || 'new-game'}
        gameStartedAt={effectiveGameStartedAt}
        durationMs={gameDurationSeconds * 1000}
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

      {/* Authentic Original Viewport (Camera, GameMap, TiledMapCanvas, Player, EnemyBot, Coin) */}
      <Camera
        player={currentPlayer}
        mapWidth={mapWidth}
        mapHeight={mapHeight}
        tileSize={TILE_SIZE}
        zoom={cameraZoom}
      >
        <GameMap zoom={cameraZoom}>
          {Array.from(new Set([playerId, ...randomPlayers].filter(Boolean)))
            .filter((key) => {
              const p = players[key];
              if (!p) return false;
              if (key === playerId) return true;
              // Never render a second avatar belonging to the local player's session or guest ID
              if (p.sessionId && p.sessionId === sessionIdRef.current) return false;
              const localGuestId = typeof window !== 'undefined' ? window.sessionStorage?.getItem('gamukis_guest_id') : null;
              if (localGuestId && key === localGuestId) return false;
              return true;
            })
            .map((key) => (
              <Player
                key={key}
                player={players[key]}
                isCurrentPlayer={key === playerId}
                isButtonMoving={key === playerId && isButtonMoving}
                skillActive={key === playerId ? isSkillActive : Boolean(players[key]?.skillActive)}
                skillIndex={key === playerId ? activeSkillIndex : (players[key]?.skillIndex || 0)}
                isGuest={key === playerId ? isGuest : (players[key]?.isGuest !== undefined ? Boolean(players[key]?.isGuest) : (players[key]?.appearance ? false : true))}
                appearance={key === playerId ? (isGuest ? null : currentAppearance) : (players[key]?.isGuest ? null : players[key]?.appearance)}
                isDead={key === playerId ? (respawnCountdown > 0 || (typeof players[key]?.health === 'number' && players[key].health <= 0)) : (typeof players[key]?.health === 'number' && players[key].health <= 0)}
              />
            ))}
          {Object.values(bots || {})
            .filter((bot) => Boolean(
              bot &&
              bot.id &&
              Number.isFinite(bot.x) &&
              Number.isFinite(bot.y) &&
              !(bot.x === 0 && bot.y === 0)
            ))
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
          {Object.entries(coins || {})
            .filter(([, coin]) => Boolean(
              coin &&
              Number.isFinite(coin.x) &&
              Number.isFinite(coin.y)
            ))
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
        hasRenamed={hasRenamed}
        health={currentPlayer?.health ?? 3}
        onChangeColor={changeColor}
      />

      <CoinModal
        isOpen={isModalOpen}
        onRequestClose={() => {
          setIsModalOpen(false);
          if (pendingQuestionRef.current) {
            lastQuestionMilestoneRef.current = Math.max(
              lastQuestionMilestoneRef.current,
              pendingQuestionRef.current.milestone
            );
          }
          pendingQuestionRef.current = null;
        }}
        questionData={modalContent}
        serverScored={classGameMode && Boolean(modalContent?._classQuestion)}
        onServerAnswer={(selectedOptionId) => {
          if (!classGameClassId || !classGameSessionId) return;
          const questionId = modalContent?._questionId;
          if (!questionId) return;
          const idempotencyKey = `ans_${Date.now()}_${Math.random().toString(36).slice(2, 12)}_${questionId}`;
          submitStudentClassGameAnswer(classGameClassId, classGameSessionId, {
            questionId,
            selectedOptionId,
            idempotencyKey
          })
            .then((result) => {
              const isCorrect = Boolean(result?.isCorrect);
              const answerData = {
                question: modalContent?.question || '',
                answer: selectedOptionId,
                correct: isCorrect,
                options: Array.isArray(modalContent?.options) ? modalContent.options : [],
                optionsList: Array.isArray(modalContent?.options) ? modalContent.options : [],
                correctAnswer: '',
                timestamp: Date.now()
              };
              sessionAnswersRef.current.push(answerData);
              if (isCorrect) {
                playCorrectAnswerSound();
                emitToast('Jawaban Benar! +Poin', 'success', 2500);
              } else {
                playWrongAnswerSound();
                emitToast('Jawaban Salah!', 'error', 2500);
              }
              saveAnonymousCache(undefined, undefined, undefined, sessionAnswersRef.current);
              const pendingQuestion = pendingQuestionRef.current;
              if (pendingQuestion) {
                lastQuestionMilestoneRef.current = Math.max(
                  lastQuestionMilestoneRef.current,
                  pendingQuestion.milestone
                );
                pendingQuestionRef.current = null;
                updatePlayer({ lastQuestionCoins: pendingQuestion.reachedCoinCount }).catch(console.error);
              }
            })
            .catch((err) => {
              console.error('Gagal mengirim jawaban server:', err);
              pendingQuestionRef.current = null;
            });
        }}
        onQuestionAnswered={(question, answer, correct) => {
          // Skip in class game mode — handled by onServerAnswer
          if (classGameModeRef.current && modalContent?._classQuestion) return;

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
          saveAnonymousCache(undefined, undefined, undefined, sessionAnswersRef.current);
          if (pendingQuestionRef.current) {
            lastQuestionMilestoneRef.current = Math.max(
              lastQuestionMilestoneRef.current,
              pendingQuestionRef.current.milestone
            );
          }
          addAnswer(`${answerOwnerIdRef.current || playerId}:${sessionIdRef.current}`, answerData)
            .then(() => {
              const pendingQuestion = pendingQuestionRef.current;
              if (!pendingQuestion) return;
              lastQuestionMilestoneRef.current = Math.max(
                lastQuestionMilestoneRef.current,
                pendingQuestion.milestone
              );
              return updatePlayer({ lastQuestionCoins: pendingQuestion.reachedCoinCount });
            })
            .catch(console.error)
            .finally(() => {
              pendingQuestionRef.current = null;
            });
        }}
        playerId={playerId}
      />

      {/* Respawn 15s Cooldown & 3s Post-Respawn Invulnerability HUD Cards */}
      {!isCompletionModalOpen && respawnCountdown > 0 && (
        <div
          className="respawn-cooldown-banner gamukis-respawn-card"
          role="status"
          aria-live="assertive"
          data-testid="respawn-cooldown-banner"
        >
          <div className="gamukis-respawn-card__main">
            <div className="gamukis-respawn-ring-wrap">
              <svg className="gamukis-respawn-ring" viewBox="0 0 56 56" aria-hidden="true">
                <circle
                  className="gamukis-respawn-ring__bg"
                  cx="28"
                  cy="28"
                  r="23"
                />
                <circle
                  className="gamukis-respawn-ring__fg"
                  cx="28"
                  cy="28"
                  r="23"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 23}`,
                    strokeDashoffset: `${2 * Math.PI * 23 * (1 - respawnCountdown / RESPAWN_COOLDOWN_SECONDS)}`
                  }}
                />
              </svg>
              <span className="gamukis-respawn-ring__number">{respawnCountdown}</span>
            </div>
            <div className="gamukis-respawn-card__info">
              <span className="gamukis-respawn-card__badge">COOLDOWN RESPAWN</span>
              <strong className="gamukis-respawn-card__title">Kamu Gugur!</strong>
              <span className="gamukis-respawn-card__subtitle">
                Hidup kembali dalam <b>{respawnCountdown}</b> detik...
              </span>
            </div>
          </div>
          <div className="gamukis-respawn-progress-track" aria-hidden="true">
            <div
              className="gamukis-respawn-progress-fill"
              style={{
                width: `${Math.max(0, Math.min(100, (respawnCountdown / RESPAWN_COOLDOWN_SECONDS) * 100))}%`
              }}
            />
          </div>
        </div>
      )}

      {!isCompletionModalOpen && respawnCountdown === 0 && invulnerableCountdown > 0 && (
        <div
          className="respawn-invulnerable-banner gamukis-invuln-card"
          role="status"
          aria-live="polite"
          data-testid="respawn-invulnerable-banner"
        >
          <div className="gamukis-invuln-card__row">
            <span className="gamukis-invuln-card__icon" aria-hidden="true">🛡️</span>
            <div className="gamukis-invuln-card__text">
              <strong className="gamukis-invuln-card__title">Kebal Serangan Aktif</strong>
              <span className="gamukis-invuln-card__sub">
                Perlindungan tersisa <b>{invulnerableCountdown}</b> detik
              </span>
            </div>
            <span className="gamukis-invuln-card__pill">{invulnerableCountdown}s</span>
          </div>
          <div className="gamukis-invuln-progress-track" aria-hidden="true">
            <div
              className="gamukis-invuln-progress-fill"
              style={{
                width: `${Math.max(0, Math.min(100, (invulnerableCountdown / RESPAWN_INVULNERABILITY_SECONDS) * 100))}%`
              }}
            />
          </div>
        </div>
      )}

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

      <Leaderboard
        page="inGame"
        playersData={leaderboardPlayers}
        playerId={playerId}
        sessionAnswers={sessionAnswersRef.current}
        playerName={playerName}
        playerCoins={currentPlayer?.coins || 0}
      />
    </div>
  );
};

export default InGame;
