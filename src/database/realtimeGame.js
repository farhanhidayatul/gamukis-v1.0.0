import { io } from 'socket.io-client';
import { auth } from './firebaseAuth';
import { getEffectiveToken } from './firebaseDatabase';

const SOCKET_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:5000';

let socket;

const getSocket = async () => {
  let token = await getEffectiveToken();

  if (!token && auth?.currentUser) {
    try {
      token = await auth.currentUser.getIdToken();
    } catch (e) {
      // fallback
    }
  }

  if (!token) {
    const guestId = typeof window !== 'undefined'
      ? (window.sessionStorage?.getItem('gamukis_guest_id') || `guest_${Date.now()}`)
      : `guest_${Date.now()}`;
    if (typeof window !== 'undefined') {
      window.sessionStorage?.setItem('gamukis_guest_id', guestId);
    }
    token = guestId;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      transports: ['websocket', 'polling']
    });
  } else if (socket.auth?.token !== token) {
    socket.auth = { token };
    if (socket.connected) {
      socket.disconnect();
    }
  }

  if (!socket.connected) {
    socket.connect();
    await new Promise((resolve) => {
      if (socket.connected) return resolve();
      const cleanup = () => {
        clearTimeout(timeoutId);
        socket.off('connect', onConnect);
        socket.off('connect_error', onError);
      };
      const onConnect = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        resolve();
      };
      const timeoutId = setTimeout(() => {
        cleanup();
        resolve();
      }, 4000);
      socket.once('connect', onConnect);
      socket.once('connect_error', onError);
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
  onError
}) => {
  const gameSocket = await getSocket();
  const handleSnapshot = (snapshot) => onSnapshot(snapshot);
  const handlePlayerUpdated = (updatedPlayer) => onPlayerUpdated(updatedPlayer);
  const handlePlayerLeft = ({ playerId }) => onPlayerLeft(playerId);
  const handleCoinAdded = ({ coinId, coin }) => onCoinAdded(coinId, coin);
  const handleCoinClaimed = ({ coinId, player: updatedPlayer }) => onCoinClaimed(coinId, updatedPlayer);
  const handleLeaderboardUpdated = (updatedPlayer) => onLeaderboardUpdated?.(updatedPlayer);
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

  const joinResponse = await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      resolve({ ok: true, player });
    }, 4000);

    gameSocket.emit('game:join', player, (response) => {
      clearTimeout(timeoutId);
      if (!response?.ok) {
        reject(new Error(response?.message || 'Gagal bergabung ke game.'));
        return;
      }
      resolve(response);
    });
  });

  if (joinResponse?.player) {
    handlePlayerUpdated(joinResponse.player);
  }

  const handleReconnect = () => {
    gameSocket.emit('game:join', player, (response) => {
      if (response?.player) {
        handlePlayerUpdated(response.player);
      }
    });
  };

  gameSocket.on('connect', handleReconnect);

  return () => {
    gameSocket.off('connect', handleReconnect);
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
    socket = null;
  };
};

const movePlayer = async (position) => {
  const gameSocket = await getSocket();
  return new Promise((resolve, reject) => {
    gameSocket.emit('player:move', position, (response) => {
      if (!response?.ok) {
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
  movePlayer,
  resetPlayer,
  subscribeToGame,
  updatePlayer
};
