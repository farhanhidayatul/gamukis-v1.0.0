/**
 * WorldScene.js
 * 
 * Main in-game gameplay scene for Phaser 3.
 * Manages world map, local player input, 30–100 remote player containers,
 * enemy bots, coin pickups, and camera tracking.
 * 
 * Complies with `code-readability`: explicit game loop updates, clear bridge dispatching,
 * and high-performance WebGL sprite batching.
 */

import Phaser from 'phaser';
import PlayerContainer from '../entities/PlayerContainer';
import BotEntity from '../entities/BotEntity';
import CoinManager from '../managers/CoinManager';
import { gameEventBridge, GAME_BRIDGE_EVENTS } from '../bridge/GameEventBridge';
import { mapWidth, mapHeight } from '../../tiledMapData';
import { canMoveTo, TILE_SIZE } from '../../utils';

export const LOCAL_PLAYER_SPEED = 180;
export const DEFAULT_MAP_WIDTH = mapWidth || 2400;
export const DEFAULT_MAP_HEIGHT = mapHeight || 1800;

export default class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldScene' });
    this.remotePlayers = new Map();
    this.bots = new Map();
    this.isInputLocked = false;
  }

  create() {
    // 1. World & Physics Bounds
    this.physics.world.setBounds(0, 0, DEFAULT_MAP_WIDTH, DEFAULT_MAP_HEIGHT);

    // 2. Map Ground Visual (Authentic Tiled Map Ground)
    if (this.textures.exists('world_ground_texture')) {
      this.add.image(0, 0, 'world_ground_texture').setOrigin(0, 0).setDepth(0);
    } else {
      const groundGraphics = this.add.graphics();
      groundGraphics.fillStyle(0x2d4a22, 1.0);
      groundGraphics.fillRect(0, 0, DEFAULT_MAP_WIDTH, DEFAULT_MAP_HEIGHT);
    }

    // 2b. Map Foreground Layer (Houses, Roofs & Treetops above players)
    if (this.textures.exists('world_foreground_texture')) {
      this.add.image(0, 0, 'world_foreground_texture').setOrigin(0, 0).setDepth(2000);
    }

    // 3. Initialize Coin Manager
    this.coinManager = new CoinManager(this);

    // 4. Instantiate Local Player
    const initialGridX = 12;
    const initialGridY = 12;
    this.localPlayer = new PlayerContainer(
      this,
      initialGridX * TILE_SIZE + (TILE_SIZE / 2),
      initialGridY * TILE_SIZE + (TILE_SIZE / 2),
      'local_player',
      'You',
      {},
      true
    );

    // Setup overlap with coins
    this.coinManager.setupPlayerOverlap(this.localPlayer);

    // 5. Setup Smooth Camera
    this.cameras.main.setBounds(0, 0, DEFAULT_MAP_WIDTH, DEFAULT_MAP_HEIGHT);
    this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);
    this.cameras.main.setZoom(2.0);

    // 6. Setup Keyboard Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };

    // 7. Register Event Bridge Subscriptions
    this.setupBridgeListeners();

    // Signal React layer that the Phaser scene is ready
    gameEventBridge.emit(GAME_BRIDGE_EVENTS.SCENE_READY, {
      mapWidth: DEFAULT_MAP_WIDTH,
      mapHeight: DEFAULT_MAP_HEIGHT
    });
  }

  setupBridgeListeners() {
    // Input lock synchronization (disable Phaser keyboard when React Modal is open)
    this.unsubInputLock = gameEventBridge.on(
      GAME_BRIDGE_EVENTS.INPUT_LOCK_CHANGED,
      ({ locked }) => {
        this.isInputLocked = Boolean(locked);
        if (this.isInputLocked && this.localPlayer?.body) {
          this.localPlayer.body.setVelocity(0, 0);
          this.localPlayer.setDirection(this.localPlayer.currentDirection, false);
        }
      }
    );

    // Remote players synchronization (supporting 30–100 players)
    this.unsubPlayersSync = gameEventBridge.on(
      GAME_BRIDGE_EVENTS.ROOM_PLAYERS_SYNC,
      (playersList) => this.syncRemotePlayers(playersList)
    );

    // Local player appearance update from React customization
    this.unsubAppearance = gameEventBridge.on(
      GAME_BRIDGE_EVENTS.LOCAL_APPEARANCE_UPDATED,
      ({ appearance }) => {
        if (this.localPlayer) {
          this.localPlayer.applyAppearance(appearance);
        }
      }
    );

    // Camera zoom updates from React HUD
    this.unsubZoom = gameEventBridge.on(
      GAME_BRIDGE_EVENTS.CAMERA_ZOOM_UPDATED,
      ({ zoom }) => {
        if (zoom && this.cameras.main) {
          this.cameras.main.setZoom(zoom);
        }
      }
    );

    // Coins synchronization from server / React state
    this.unsubCoins = gameEventBridge.on(
      GAME_BRIDGE_EVENTS.COINS_UPDATED,
      ({ coins }) => {
        if (this.coinManager && coins) {
          this.coinManager.syncCoins(coins);
        }
      }
    );

    // Authoritative local player spawn/position synchronization
    this.unsubPositionSync = gameEventBridge.on(
      GAME_BRIDGE_EVENTS.LOCAL_POSITION_SYNC,
      ({ x, y }) => {
        if (this.localPlayer && Number.isFinite(x) && Number.isFinite(y)) {
          this.localPlayer.setPosition((x * TILE_SIZE) + (TILE_SIZE / 2), (y * TILE_SIZE) + (TILE_SIZE / 2));
          this.lastGridX = x;
          this.lastGridY = y;
        }
      }
    );

    // Bot monster synchronization
    this.unsubBots = gameEventBridge.on(
      GAME_BRIDGE_EVENTS.BOTS_SYNC,
      (botsData) => this.syncBots(botsData)
    );

    // Local player ID registration
    this.unsubLocalPlayerId = gameEventBridge.on(
      GAME_BRIDGE_EVENTS.LOCAL_PLAYER_ID_UPDATED,
      ({ id }) => {
        if (id) {
          this.localPlayerId = id;
          if (this.localPlayer) {
            this.localPlayer.playerId = id;
          }
          const existingRemote = this.remotePlayers.get(id);
          if (existingRemote) {
            existingRemote.destroy();
            this.remotePlayers.delete(id);
          }
        }
      }
    );

    // Bot attack warning (telegraph windup animation)
    this.unsubBotWarning = gameEventBridge.on(
      GAME_BRIDGE_EVENTS.BOT_ATTACK_WARNING,
      (data) => this.handleBotAttackWarning(data)
    );

    // Bot attack executed / resolution
    this.unsubBotAttack = gameEventBridge.on(
      GAME_BRIDGE_EVENTS.BOT_ATTACK_EXECUTED,
      (data) => this.handleBotAttackExecuted(data)
    );
  }

  /**
   * Syncs 30–100 remote player avatars efficiently using sprite batching.
   * 
   * @param {Array<object>} playersList
   */
  syncRemotePlayers(playersList = []) {
    if (!Array.isArray(playersList)) return;

    const activeIds = new Set();
    const activeLocalId = this.localPlayerId || 'local_player';

    playersList.forEach((playerData) => {
      const isSelf = !playerData || !playerData.id
        || playerData.id === activeLocalId
        || playerData.id === 'local_player'
        || (this.localPlayer && this.localPlayer.playerId === playerData.id);
      if (isSelf) return;

      activeIds.add(playerData.id);

      const targetPixelX = (playerData.x * TILE_SIZE) + (TILE_SIZE / 2);
      const targetPixelY = (playerData.y * TILE_SIZE) + (TILE_SIZE / 2);

      let remoteContainer = this.remotePlayers.get(playerData.id);

      if (!remoteContainer) {
        // Create new player container
        remoteContainer = new PlayerContainer(
          this,
          targetPixelX,
          targetPixelY,
          playerData.id,
          playerData.name || 'Student',
          playerData.appearance || {},
          false
        );
        this.remotePlayers.set(playerData.id, remoteContainer);
      } else {
        // Interpolate movement to target position
        remoteContainer.moveTo(targetPixelX, targetPixelY);
        remoteContainer.setDirection(playerData.direction || 'down', playerData.isMoving);
      }
    });

    // Remove disconnected players
    for (const [id, container] of this.remotePlayers.entries()) {
      if (!activeIds.has(id)) {
        container.destroy();
        this.remotePlayers.delete(id);
      }
    }
  }

  update(time, delta) {
    if (!this.localPlayer || !this.localPlayer.body) return;

    if (this.localPlayer.isDead) {
      this.localPlayer.body.setVelocity(0, 0);
      return;
    }

    if (this.isInputLocked) {
      this.localPlayer.body.setVelocity(0, 0);
      this.localPlayer.setDirection(this.localPlayer.currentDirection, false);
      return;
    }

    let velocityX = 0;
    let velocityY = 0;
    let direction = this.localPlayer.currentDirection;
    let isMoving = false;

    // Check keyboard input
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      velocityX = -LOCAL_PLAYER_SPEED;
      direction = 'left';
      isMoving = true;
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      velocityX = LOCAL_PLAYER_SPEED;
      direction = 'right';
      isMoving = true;
    }

    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      velocityY = -LOCAL_PLAYER_SPEED;
      direction = 'up';
      isMoving = true;
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      velocityY = LOCAL_PLAYER_SPEED;
      direction = 'down';
      isMoving = true;
    }

    // Apply movement physics
    this.localPlayer.body.setVelocity(velocityX, velocityY);
    this.localPlayer.setDirection(direction, isMoving);

    // Emit position to React / Socket.IO bridge when moving
    if (isMoving) {
      const currentGridX = Math.floor(this.localPlayer.x / TILE_SIZE);
      const currentGridY = Math.floor(this.localPlayer.y / TILE_SIZE);

      if (this.lastGridX !== currentGridX || this.lastGridY !== currentGridY) {
        this.lastGridX = currentGridX;
        this.lastGridY = currentGridY;

        gameEventBridge.emit(GAME_BRIDGE_EVENTS.PLAYER_POSITION_CHANGED, {
          x: currentGridX,
          y: currentGridY,
          direction
        });
      }
    }

    // Dynamic Y-depth sorting for natural layering
    if (this.localPlayer) this.localPlayer.setDepth(Math.floor(this.localPlayer.y));
    for (const remote of this.remotePlayers.values()) {
      if (remote) remote.setDepth(Math.floor(remote.y));
    }
    for (const bot of this.bots.values()) {
      if (bot) bot.setDepth(Math.floor(bot.y));
    }
  }

  /**
   * Synchronizes bot monster entities from server or React state.
   * 
   * @param {Array|Record<string, object>} botsData 
   */
  syncBots(botsData) {
    if (!botsData) return;
    const list = Array.isArray(botsData) ? botsData : Object.values(botsData);
    const activeIds = new Set();

    list.forEach((botData) => {
      if (!botData || !botData.id || botData.state === 'dead' || botData.isDying || Number(botData.health) <= 0) return;
      activeIds.add(botData.id);

      const targetPixelX = (botData.x * TILE_SIZE) + (TILE_SIZE / 2);
      const targetPixelY = (botData.y * TILE_SIZE) + (TILE_SIZE / 2);

      let bot = this.bots.get(botData.id);
      if (!bot) {
        bot = new BotEntity(this, targetPixelX, targetPixelY, botData);
        this.bots.set(botData.id, bot);
      } else {
        bot.moveTo(targetPixelX, targetPixelY);
        if (typeof botData.health === 'number') {
          bot.health = botData.health;
          bot.updateHealthBar();
        }
      }
    });

    for (const [id, bot] of this.bots.entries()) {
      if (!activeIds.has(id)) {
        if (!bot.isDead) {
          this.handleBotKilled(bot);
        }
        bot.destroy();
        this.bots.delete(id);
      }
    }
  }

  /**
   * Spawns a reward coin drop at the location where a monster/slime bot is killed.
   * 
   * @param {BotEntity} bot 
   */
  handleBotKilled(bot) {
    if (!bot || bot.hasDroppedCoin) return;
    bot.hasDroppedCoin = true;

    if (this.coinManager) {
      const gridX = Math.round((bot.x - TILE_SIZE / 2) / TILE_SIZE);
      const gridY = Math.round((bot.y - TILE_SIZE / 2) / TILE_SIZE);
      const coinKey = "coin_drop_" + (bot.botId || "slime") + "_" + Date.now();

      this.coinManager.syncCoins({
        [coinKey]: { x: gridX, y: gridY, key: coinKey }
      }, TILE_SIZE);
    }
  }

  handleBotAttackWarning({ botId, telegraphDurationMs }) {
    const bot = this.bots.get(botId);
    if (bot) {
      bot.playAttackWarning(telegraphDurationMs);
    }
  }

  handleBotAttackExecuted({ botId, missed }) {
    const bot = this.bots.get(botId);
    if (bot) {
      bot.playAttackEffect(missed);
    }
  }

  shutdown() {
    if (this.unsubPlayersSync) this.unsubPlayersSync();
    if (this.unsubLocalPlayerId) this.unsubLocalPlayerId();
    if (this.unsubAppearance) this.unsubAppearance();
    if (this.unsubZoom) this.unsubZoom();
    if (this.unsubCoins) this.unsubCoins();
    if (this.unsubPositionSync) this.unsubPositionSync();
    if (this.unsubBots) this.unsubBots();
    if (this.unsubBotWarning) this.unsubBotWarning();
    if (this.unsubBotAttack) this.unsubBotAttack();
    if (this.unsubInputLock) this.unsubInputLock();
    if (this.unsubDeathState) this.unsubDeathState();
    if (this.coinManager) this.coinManager.destroy();

    this.remotePlayers.forEach(p => p.destroy());
    this.remotePlayers.clear();
    this.bots.forEach(b => b.destroy());
    this.bots.clear();
  }
}
