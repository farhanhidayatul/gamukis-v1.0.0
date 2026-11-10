/**
 * CoinManager.js
 * 
 * Manages collectible quiz coins in the Phaser 3 world.
 * Handles physics overlap, coin floating animations, and event bridging to React.
 * 
 * Complies with `code-readability`: explicit collision handlers, clear bridge dispatching,
 * and clean respawn/sync lifecycle.
 */

import { gameEventBridge, GAME_BRIDGE_EVENTS } from '../bridge/GameEventBridge';

export default class CoinManager {
  /**
   * @param {Phaser.Scene} scene 
   */
  constructor(scene) {
    this.scene = scene;
    this.coinsByKey = new Map();

    // Group for arcade physics overlap checks
    this.coinGroup = scene.physics.add.staticGroup();

    // Setup listener for question results coming back from React
    this.unsubscribeQuestionResolved = gameEventBridge.on(
      GAME_BRIDGE_EVENTS.QUESTION_RESOLVED,
      (payload) => this.handleQuestionResolved(payload)
    );

    // Setup listener for coin claim rejection from server/network
    this.unsubscribeCoinClaimRejected = gameEventBridge.on(
      GAME_BRIDGE_EVENTS.COIN_CLAIM_REJECTED,
      (payload) => this.handleCoinClaimRejected(payload)
    );
  }

  /**
   * Sets up collision/overlap check with the local player.
   * 
   * @param {Phaser.GameObjects.GameObject} localPlayer 
   */
  setupPlayerOverlap(localPlayer) {
    if (!localPlayer) return;

    this.scene.physics.add.overlap(
      localPlayer,
      this.coinGroup,
      (player, coinSprite) => this.handleCoinPickup(coinSprite),
      null,
      this
    );
  }

  /**
   * Spawns or updates collectible coins in the world.
   * 
   * @param {Record<string, {x: number, y: number}>|Array} coinsData 
   * @param {number} tileSize 
   */
  syncCoins(coinsData, tileSize = 48) {
    if (!coinsData) return;

    const entries = Array.isArray(coinsData)
      ? coinsData.map(c => [c.key || `${c.x}x${c.y}`, c])
      : Object.entries(coinsData);

    const activeKeys = new Set();

    entries.forEach(([key, coin]) => {
      activeKeys.add(key);

      if (!this.coinsByKey.has(key)) {
        const pixelX = (coin.x * tileSize) + (tileSize / 2);
        const pixelY = (coin.y * tileSize) + (tileSize / 2);

        const coinSprite = this.coinGroup.create(pixelX, pixelY, 'coin_sprite');
        coinSprite.coinKey = key;
        coinSprite.gridX = coin.x;
        coinSprite.gridY = coin.y;
        coinSprite.setOrigin?.(0.5, 0.5);
        coinSprite.setScale?.(1.1);
        coinSprite.setDepth?.(10);

        // Gentle floating animation
        this.scene.tweens.add({
          targets: coinSprite,
          y: pixelY - 6,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        this.coinsByKey.set(key, coinSprite);
      }
    });

    // Remove coins that no longer exist on server
    for (const [key, sprite] of this.coinsByKey.entries()) {
      if (!activeKeys.has(key)) {
        sprite.destroy();
        this.coinsByKey.delete(key);
      }
    }
  }

  /**
   * Triggered when the local player overlaps with a coin.
   * 
   * @param {Phaser.GameObjects.Sprite} coinSprite 
   */
  handleCoinPickup(coinSprite) {
    if (!coinSprite || !coinSprite.active || coinSprite.isPendingAnswer) return;

    const coinKey = coinSprite.coinKey;
    const gridX = coinSprite.gridX;
    const gridY = coinSprite.gridY;

    // Immediately hide and disable physics body (instant 0ms visual pickup)
    coinSprite.isPendingAnswer = true;
    if (typeof coinSprite.setVisible === 'function') coinSprite.setVisible(false);
    if (coinSprite.body) coinSprite.body.enable = false;

    // Notify React layer for optimistic score update and authoritative claim
    gameEventBridge.emit(GAME_BRIDGE_EVENTS.COIN_COLLECTED, {
      coinKey,
      gridX,
      gridY
    });
  }

  /**
   * Handles quiz completion feedback from React.
   * 
   * @param {object} payload - { isCorrect, coinKey }
   */
  handleQuestionResolved({ isCorrect, coinKey }) {
    const coinSprite = this.coinsByKey.get(coinKey);
    if (!coinSprite) return;

    if (isCorrect) {
      // Coin collected permanently
      coinSprite.destroy();
      this.coinsByKey.delete(coinKey);
    } else {
      // Failed answer: Re-enable coin after cooldown
      this.scene.time.delayedCall(3000, () => {
        if (coinSprite && coinSprite.scene) {
          coinSprite.isPendingAnswer = false;
          coinSprite.setVisible(true);
          if (coinSprite.body) coinSprite.body.enable = true;
        }
      });
    }
  }

  /**
   * Restores coin if server rejected the claim (e.g. latency/race condition).
   * 
   * @param {object} payload - { coinKey, x, y }
   */
  handleCoinClaimRejected({ coinKey, x, y }) {
    const coinSprite = this.coinsByKey.get(coinKey);
    if (coinSprite) {
      coinSprite.isPendingAnswer = false;
      if (typeof coinSprite.setVisible === 'function') coinSprite.setVisible(true);
      if (coinSprite.body) coinSprite.body.enable = true;
      return;
    }

    const [coordX, coordY] = (coinKey || '').split('x').map(Number);
    const targetX = Number.isFinite(x) ? x : coordX;
    const targetY = Number.isFinite(y) ? y : coordY;
    if (Number.isFinite(targetX) && Number.isFinite(targetY)) {
      this.syncCoins({ [coinKey]: { x: targetX, y: targetY } });
    }
  }

  /**
   * Cleanup on scene shutdown.
   */
  destroy() {
    if (this.unsubscribeQuestionResolved) {
      this.unsubscribeQuestionResolved();
    }
    if (this.unsubscribeCoinClaimRejected) {
      this.unsubscribeCoinClaimRejected();
    }
    this.coinsByKey.clear();
  }
}
