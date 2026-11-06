import { generateSecureGuestId } from '../component/component_game/utils';
import { io } from 'socket.io-client';
import { auth, waitForAuth } from './firebaseAuth';
import { getEffectiveToken } from './firebaseDatabase';

const SOCKET_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, '')
  : 'https://api.gamukis.site';

let socket;

const getSocket = async () => {
  let token = await getEffectiveToken();
  if (!token && typeof window !== 'undefined') {
    try {
      const rawUser = window.localStorage?.getItem('gamukis_manual_user') || window.sessionStorage?.getItem('gamukis_manual_user');
      const parsed = rawUser ? JSON.parse(rawUser) : null;
      if (parsed?.authType === 'google' && !auth?.currentUser && typeof waitForAuth === 'function') {
        await waitForAuth();
        token = await getEffectiveToken();
      }
    } catch (e) {}
  }

  if (!token && auth?.currentUser) {
    try {
      token = await auth.currentUser.getIdToken();
    } catch (e) {
      // fallback
    }
  }

  if (!token) {
    const guestId = typeof window !== 'undefined'
      ? (window.sessionStorage?.getItem('gamukis_guest_id') || generateSecureGuestId())
      : generateSecureGuestId();
    if (typeof window !== 'undefined') {
      window.sessionStorage?.setItem('gamukis_guest_id', guestId);
    }
    token = guestId;
  }

  if (socket && socket.auth?.token !== token) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling']
    });
  }

  if (!socket.connected) {
    await new Promise((resolve) => {
      if (socket.connected) return resolve();
      const onConnect = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        resolve();
      };
      const cleanup = () => {
        clearTimeout(timeoutId);
        socket.off('connect', onConnect);
        socket.off('connect_error', onError);
      };
      const timeoutId = setTimeout(() => {
        cleanup();
        resolve();
      }, 4000);
      socket.once('connect', onConnect);
      socket.once('connect_error', onError);
      if (!socket.connected && !socket.active) {
        socket.connect();
      }
    });
  }

  return socket;
};

const subscribeToGame = async ({
  player,
  onSnapshot,
  onPlayerUpdated,
  onPlayerLeft,
  onCoinAdded,
  onCoinClaimed,
  onLeaderboardUpdated,
  onBotSpawned,
  onBotMoved,
  onBotAttack,
  onBotAttackWarning,
  onBotRemoved,
  onSkillEffect,
  onIdentityResolved,
  onError
}) => {
  const gameSocket = await getSocket();
  const resolveIdentity = (responseOrSnapshot) => {
    const serverPlayerId = responseOrSnapshot?.player?.id || responseOrSnapshot?.selfPlayerId;
    if (serverPlayerId && serverPlayerId !== player?.id) {
      onIdentityResolved?.(serverPlayerId);
    }
  };
  const handleSnapshot = (snapshot) => {
    resolveIdentity(snapshot);
    onSnapshot(snapshot);
  };
  const handlePlayerUpdated = (updatedPlayer) => onPlayerUpdated(updatedPlayer);
  const handlePlayerLeft = ({ playerId }) => onPlayerLeft(playerId);
  const handleCoinAdded = ({ coinId, coin }) => onCoinAdded(coinId, coin);
  const handleCoinClaimed = ({ coinId, player: updatedPlayer }) => onCoinClaimed(coinId, updatedPlayer);
  let leaderboardBatch = {};
  let leaderboardDebounceTimer = null;
  const handleLeaderboardUpdated = (updatedPlayer) => {
    if (!onLeaderboardUpdated || !updatedPlayer?.id) return;
    leaderboardBatch[updatedPlayer.id] = updatedPlayer;
    if (!leaderboardDebounceTimer) {
      leaderboardDebounceTimer = setTimeout(() => {
        leaderboardDebounceTimer = null;
        const currentBatch = leaderboardBatch;
        leaderboardBatch = {};
        Object.values(currentBatch).forEach((p) => {
          onLeaderboardUpdated(p);
        });
      }, 500);
    }
  };
  const handleBotSpawned = (data) => onBotSpawned?.(data?.bot || data);
  const handleBotMoved = (data) => onBotMoved?.(data);
  const handleBotAttack = (data) => onBotAttack?.(data);
  const handleBotAttackWarning = (data) => onBotAttackWarning?.(data);
  const handleBotRemoved = (data) => onBotRemoved?.(data);
  const handleSkillEffect = (data) => onSkillEffect?.(data);
  const handleError = (error) => onError?.(error);

  gameSocket.on('game:snapshot', handleSnapshot);
  gameSocket.on('player:updated', handlePlayerUpdated);
  gameSocket.on('player:left', handlePlayerLeft);
  gameSocket.on('coin:added', handleCoinAdded);
  gameSocket.on('coin:claimed', handleCoinClaimed);
  gameSocket.on('leaderboard:updated', handleLeaderboardUpdated);
  gameSocket.on('bot:spawned', handleBotSpawned);
  gameSocket.on('bot:moved', handleBotMoved);
  gameSocket.on('bot:attack', handleBotAttack);
  gameSocket.on('bot:attack_warning', handleBotAttackWarning);
  gameSocket.on('bot:removed', handleBotRemoved);
  gameSocket.on('skill:effect', handleSkillEffect);
  gameSocket.on('connect_error', handleError);

  let initialJoinSettled = false;
  let resolveInitialJoin;
  let rejectInitialJoin;
  const initialJoinPromise = new Promise((resolve, reject) => {
    resolveInitialJoin = resolve;
    rejectInitialJoin = reject;
  });

  const emitJoin = () => {
    // Only the very first join may carry the reset flag. Reconnects must resume the running session
    // instead of wiping coins, health, position and the timer.
    const payload = initialJoinSettled
      ? { ...player, isReset: false, isRestart: false }
      : player;
    gameSocket.emit('game:join', payload, (response) => {
      if (response?.ok && response?.player) {
        resolveIdentity(response);
      }
      if (!initialJoinSettled) {
        initialJoinSettled = true;
        if (!response?.ok) {
          rejectInitialJoin(new Error(response?.message || 'Gagal bergabung ke game.'));
          return;
        }
        resolveInitialJoin(response);
        return;
      }
      if (response?.ok && response?.player) {
        handlePlayerUpdated(response.player);
      }
    });
  };

  let joinInFlight = false;
  const performJoin = () => {
    // Skip the reconnect join while the initial join is still pending on the same connection.
    if (!initialJoinSettled && joinInFlight) return;
    joinInFlight = true;
    emitJoin();
  };

  gameSocket.on('connect', performJoin);

  if (gameSocket.connected) {
    joinInFlight = true;
    emitJoin();
  }

  const joinResponse = await Promise.race([
    initialJoinPromise,
    new Promise((resolve) => {
      setTimeout(() => {
        if (!initialJoinSettled) {
          initialJoinSettled = true;
          resolve({ ok: true, player, timedOut: true });
        }
      }, 4000);
    })
  ]);

  if (joinResponse?.player && !joinResponse.timedOut) {
    resolveIdentity(joinResponse);
    handlePlayerUpdated(joinResponse.player);
  }

  return () => {
    if (leaderboardDebounceTimer) {
      clearTimeout(leaderboardDebounceTimer);
      leaderboardDebounceTimer = null;
    }
    leaderboardBatch = {};
    gameSocket.off('connect', performJoin);
    gameSocket.off('game:snapshot', handleSnapshot);
    gameSocket.off('player:updated', handlePlayerUpdated);
    gameSocket.off('player:left', handlePlayerLeft);
    gameSocket.off('coin:added', handleCoinAdded);
    gameSocket.off('coin:claimed', handleCoinClaimed);
    gameSocket.off('leaderboard:updated', handleLeaderboardUpdated);
    gameSocket.off('bot:spawned', handleBotSpawned);
    gameSocket.off('bot:moved', handleBotMoved);
    gameSocket.off('bot:attack', handleBotAttack);
    gameSocket.off('bot:attack_warning', handleBotAttackWarning);
    gameSocket.off('bot:removed', handleBotRemoved);
    gameSocket.off('skill:effect', handleSkillEffect);
    gameSocket.off('connect_error', handleError);
    gameSocket.disconnect();
    // Never drop a newer socket that replaced this one (e.g. guest -> registered promotion).
    if (socket === gameSocket) {
      socket = null;
    }
  };
};

const movePlayer = async (position) => {
  const gameSocket = await getSocket();
  return new Promise((resolve, reject) => {
    gameSocket.emit('player:move', position, (response) => {
      if (!response?.ok) {
        if (response?.reconcile && response?.authoritativePosition) {
          resolve({ reconcile: true, authoritativePosition: response.authoritativePosition });
          return;
        }
        reject(new Error(response?.message || 'Gerakan tidak valid.'));
        return;
      }
      resolve(response.player);
    });
  });
};

const updatePlayer = async (changes) => {
  const gameSocket = await getSocket();
  return new Promise((resolve, reject) => {
    gameSocket.emit('player:update', changes, (response) => {
      if (!response?.ok) {
        reject(new Error(response?.message || 'Data player gagal diperbarui.'));
        return;
      }
      resolve(response.player);
    });
  });
};

const resetPlayer = async (changes) => {
  const gameSocket = await getSocket();
  return new Promise((resolve, reject) => {
    gameSocket.emit('player:reset', changes, (response) => {
      if (!response?.ok) {
        reject(new Error(response?.message || 'Reset progress gagal.'));
        return;
      }
      resolve(response.player);
    });
  });
};

const castSkillAction = async ({ skillIndex = 0 } = {}) => {
  const gameSocket = await getSocket();
  return new Promise((resolve, reject) => {
    gameSocket.emit('player:skill', { skillIndex }, (response) => {
      if (!response?.ok) {
        reject(new Error(response?.message || 'Gagal mengeksekusi skill.'));
        return;
      }
      resolve(response);
    });
  });
};

const damagePlayer = async () => {
  const gameSocket = await getSocket();
  return new Promise((resolve, reject) => {
    gameSocket.emit('player:damage', (response) => {
      if (!response?.ok) {
        reject(new Error(response?.message || 'Damage player gagal diproses.'));
        return;
      }
      resolve(response.player);
    });
  });
};

const claimCoinAction = async ({ coinId, x, y } = {}) => {
  const gameSocket = await getSocket();
  return new Promise((resolve, reject) => {
    gameSocket.emit('coin:claim', { coinId, x, y }, (response) => {
      if (!response?.ok) {
        reject(new Error(response?.message || 'Gagal mengklaim koin.'));
        return;
      }
      resolve(response);
    });
  });
};

const finishPlayerAction = async () => {
  const gameSocket = await getSocket();
  return new Promise((resolve) => {
    gameSocket.emit('player:finish', {}, (response) => {
      resolve(response || { ok: true });
    });
  });
};

const respawnPlayerAction = async ({ x, y } = {}) => {
  const gameSocket = await getSocket();
  return new Promise((resolve, reject) => {
    gameSocket.emit('player:respawn', { x, y }, (response) => {
      if (!response?.ok) {
        reject(new Error(response?.message || 'Gagal respawn pemain.'));
        return;
      }
      resolve(response.player);
    });
  });
};

const disconnectRealtimeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export {
  castSkillAction,
  claimCoinAction,
  damagePlayer,
  disconnectRealtimeSocket,
  finishPlayerAction,
  respawnPlayerAction,
  movePlayer,
  resetPlayer,
  subscribeToGame,
  updatePlayer
};
