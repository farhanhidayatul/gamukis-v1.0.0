import { generateSecureGuestId } from '../component/component_game/utils';
import { Client } from 'colyseus.js';
import { getEffectiveToken } from './firebaseDatabase';

const API_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, '')
  : 'https://api.gamukis.site';

const COLYSEUS_WS_URL = API_URL.replace(/^http/, 'ws');

let client = null;
let activeRoom = null;

export const getColyseusClient = () => {
  if (!client) {
    client = new Client(COLYSEUS_WS_URL);
  }
  return client;
};

/**
 * Connects to a Colyseus GameRoom and establishes reactive state synchronization.
 * Operates purely on data schemas without touching React DOM / CSS presentation layer.
 */
export const joinGameRoom = async ({
  player = {},
  onSnapshot,
  onPlayerAdd,
  onPlayerChange,
  onPlayerRemove,
  onCoinAdd,
  onCoinRemove,
  onBotAdd,
  onBotChange,
  onBotRemove,
  onCoinClaimed,
  onSkillEffect,
  onError
}) => {
  try {
    let token = await getEffectiveToken();
    if (!token) {
      const guestId = typeof window !== 'undefined'
        ? (window.sessionStorage?.getItem('gamukis_guest_id') || generateSecureGuestId())
        : generateSecureGuestId();
      if (typeof window !== 'undefined') {
        window.sessionStorage?.setItem('gamukis_guest_id', guestId);
      }
      token = guestId;
    }

    const colyseusClient = getColyseusClient();
    activeRoom = await colyseusClient.joinOrCreate('game_room', {
      token,
      name: player.name,
      x: player.x,
      y: player.y,
      direction: player.direction,
      coins: player.coins,
      health: player.health,
      color: player.color,
      appearance: player.appearance
    });

    // 1. Players MapSchema listeners
    activeRoom.state.players.onAdd((p, sessionId) => {
      onPlayerAdd?.(p, sessionId);
      p.onChange(() => {
        onPlayerChange?.(p, sessionId);
      });
    });

    activeRoom.state.players.onRemove((p, sessionId) => {
      onPlayerRemove?.(p, sessionId);
    });

    // 2. Coins MapSchema listeners
    activeRoom.state.coins.onAdd((coin, key) => {
      onCoinAdd?.(coin, key);
    });

    activeRoom.state.coins.onRemove((coin, key) => {
      onCoinRemove?.(coin, key);
    });

    // 3. Bots MapSchema listeners
    activeRoom.state.bots.onAdd((bot, botId) => {
      onBotAdd?.(bot, botId);
      bot.onChange(() => {
        onBotChange?.(bot, botId);
      });
    });

    activeRoom.state.bots.onRemove((bot, botId) => {
      onBotRemove?.(bot, botId);
    });

    // 4. Custom Message Handlers
    activeRoom.onMessage('coin:claimed', (data) => {
      onCoinClaimed?.(data);
    });

    activeRoom.onMessage('skill:effect', (data) => {
      onSkillEffect?.(data);
    });

    activeRoom.onError((code, message) => {
      onError?.({ code, message });
    });

    // 5. Initial Snapshot synchronization
    if (typeof onSnapshot === 'function') {
      const initialPlayers = {};
      activeRoom.state.players.forEach((p, sId) => {
        const formatted = formatColyseusPlayer(p);
        if (formatted) initialPlayers[formatted.id || sId] = formatted;
      });
      const initialCoins = {};
      activeRoom.state.coins.forEach((c, key) => {
        initialCoins[key] = { x: c.x, y: c.y };
      });
      const initialBots = {};
      activeRoom.state.bots.forEach((b, botId) => {
        const formatted = formatColyseusBot(b);
        if (formatted) initialBots[formatted.id || botId] = formatted;
      });
      onSnapshot({
        players: initialPlayers,
        coins: initialCoins,
        bots: initialBots,
        leaderboard: Object.values(initialPlayers)
      });
    }

    return () => {
      if (activeRoom) {
        activeRoom.leave();
        activeRoom = null;
      }
    };
  } catch (error) {
    console.error('[ColyseusClient] Failed to join room:', error);
    onError?.(error);
    throw error;
  }
};

export const sendPlayerMove = (x, y, direction) => {
  if (activeRoom) {
    activeRoom.send('player:move', { x, y, direction });
  }
};

export const sendCoinClaim = (coinId) => {
  if (activeRoom) {
    activeRoom.send('coin:claim', { coinId });
  }
};

export const sendSkillCast = (skillIndex) => {
  if (activeRoom) {
    activeRoom.send('skill:cast', { skillIndex });
  }
};

export const sendPlayerUpdate = (updateData) => {
  if (activeRoom) {
    activeRoom.send('player:update', updateData);
  }
};

// Drop-in compatible actions for inGame.js
export const movePlayer = async (position) => {
  sendPlayerMove(position?.x, position?.y, position?.direction);
  return position;
};

export const claimCoinAction = async ({ coinId, x, y }) => {
  sendCoinClaim(coinId);
  return { ok: true, coinId };
};

export const castSkillAction = async ({ skillIndex = 0 } = {}) => {
  sendSkillCast(skillIndex);
  return { ok: true };
};

export const updatePlayer = async (updateData) => {
  sendPlayerUpdate(updateData);
  return updateData;
};

export const resetPlayer = async (resetData) => {
  sendPlayerUpdate(resetData);
  return resetData;
};

export const formatColyseusPlayer = (p) => {
  if (!p) return null;
  let parsedAppearance = null;
  if (p.appearanceJson) {
    try {
      parsedAppearance = JSON.parse(p.appearanceJson);
    } catch (e) {}
  }
  return {
    id: p.id,
    name: p.name,
    x: p.x,
    y: p.y,
    direction: p.direction,
    coins: p.coins,
    health: p.health,
    maxHealth: p.maxHealth,
    isGuest: p.isGuest,
    color: p.color,
    appearance: parsedAppearance,
    skillActive: p.skillActive,
    skillIndex: p.skillIndex,
    gameStartedAt: p.gameStartedAt
  };
};

export const formatColyseusBot = (b) => {
  if (!b) return null;
  return {
    id: b.id,
    name: b.name,
    variant: b.variant,
    category: b.category,
    scaleMultiplier: b.scaleMultiplier,
    x: b.x,
    y: b.y,
    direction: b.direction,
    health: b.health,
    maxHealth: b.maxHealth,
    state: b.state,
    targetPlayerId: b.targetPlayerId
  };
};

/**
 * Drop-in adapter matching subscribeToGame callback interface.
 * Connects Colyseus Room delta streams directly into inGame React states.
 */
export const subscribeToColyseusGame = async ({
  player,
  onSnapshot,
  onPlayerUpdated,
  onPlayerLeft,
  onCoinAdded,
  onCoinClaimed,
  onLeaderboardUpdated,
  onBotSpawned,
  onBotMoved,
  onBotRemoved,
  onSkillEffect,
  onError
}) => {
  return await joinGameRoom({
    player,
    onSnapshot,
    onPlayerAdd: (p) => {
      const formatted = formatColyseusPlayer(p);
      if (formatted) onPlayerUpdated?.(formatted);
    },
    onPlayerChange: (p) => {
      const formatted = formatColyseusPlayer(p);
      if (formatted) onPlayerUpdated?.(formatted);
    },
    onPlayerRemove: (p, sessionId) => {
      onPlayerLeft?.({ playerId: p?.id || sessionId });
    },
    onCoinAdd: (c, key) => {
      onCoinAdded?.(key, { x: c.x, y: c.y });
    },
    onBotAdd: (b) => {
      const formatted = formatColyseusBot(b);
      if (formatted) onBotSpawned?.(formatted);
    },
    onBotChange: (b) => {
      const formatted = formatColyseusBot(b);
      if (formatted) onBotMoved?.(formatted);
    },
    onBotRemove: (b, id) => {
      onBotRemoved?.({ id: b?.id || id });
    },
    onCoinClaimed: (data) => {
      onCoinClaimed?.(data.coinId, { id: player.id, coins: data.coins });
    },
    onSkillEffect: (data) => {
      onSkillEffect?.(data);
    },
    onError
  });
};

export const getActiveRoom = () => activeRoom;
