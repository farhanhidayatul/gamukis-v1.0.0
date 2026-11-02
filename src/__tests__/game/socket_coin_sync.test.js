/**
 * socket_coin_sync.test.js
 * 
 * Verifies Frontend-Backend synchronization for GameSocket spawn coordinates,
 * coin key alignment (${x}x${y}), and Phaser Event Bridge coin/position sync.
 */

import { gameEventBridge, GAME_BRIDGE_EVENTS } from '../../component/component_game/phaser/bridge/GameEventBridge';
import CoinManager from '../../component/component_game/phaser/managers/CoinManager';
import { getKeyString } from '../../component/component_game/utils';

describe('GameSocket & In-Game Coin Synchronization', () => {
  beforeEach(() => {
    gameEventBridge.clearAll();
  });

  describe('Coin Key Format Standard (${x}x${y})', () => {
    test('getKeyString produces matching letter-x key string for grid coordinates', () => {
      expect(getKeyString(15, 20)).toBe('15x20');
      expect(getKeyString(0, 0)).toBe('0x0');
      expect(getKeyString(48, 36)).toBe('48x36');
    });

    test('CoinManager.syncCoins parses array coin items with standard ${x}x${y} keys', () => {
      const mockScene = {
        physics: {
          add: {
            staticGroup: () => ({
              create: jest.fn(() => ({
                setOrigin: jest.fn()
              }))
            })
          }
        },
        tweens: {
          add: jest.fn()
        }
      };

      const manager = new CoinManager(mockScene);
      const coinsArray = [
        { x: 10, y: 15 },
        { x: 22, y: 30 }
      ];

      manager.syncCoins(coinsArray, 16);

      // Verify keys stored in coinsByKey use "x" separator, not "_"
      expect(manager.coinsByKey.has('10x15')).toBe(true);
      expect(manager.coinsByKey.has('22x30')).toBe(true);
      expect(manager.coinsByKey.has('10_15')).toBe(false);

      manager.destroy();
    });

    test('CoinManager.syncCoins accepts dictionary of coins matching backend Redis snapshot', () => {
      const mockScene = {
        physics: {
          add: {
            staticGroup: () => ({
              create: jest.fn(() => ({
                setOrigin: jest.fn()
              }))
            })
          }
        },
        tweens: {
          add: jest.fn()
        }
      };

      const manager = new CoinManager(mockScene);
      const serverCoinsDict = {
        '5x8': { x: 5, y: 8 },
        '14x20': { x: 14, y: 20 }
      };

      manager.syncCoins(serverCoinsDict, 16);

      expect(manager.coinsByKey.has('5x8')).toBe(true);
      expect(manager.coinsByKey.has('14x20')).toBe(true);

      // Verify that removal on server removes coin sprite in Phaser
      const updatedDict = {
        '5x8': { x: 5, y: 8 }
      };
      const sprite14x20 = manager.coinsByKey.get('14x20');
      sprite14x20.destroy = jest.fn();

      manager.syncCoins(updatedDict, 16);
      expect(sprite14x20.destroy).toHaveBeenCalledTimes(1);
      expect(manager.coinsByKey.has('14x20')).toBe(false);
      expect(manager.coinsByKey.has('5x8')).toBe(true);

      manager.destroy();
    });
  });

  describe('EventBridge Synchronizations', () => {
    test('defines typed bridge events for COINS_UPDATED and LOCAL_POSITION_SYNC', () => {
      expect(GAME_BRIDGE_EVENTS.COINS_UPDATED).toBe('REACT:COINS_UPDATED');
      expect(GAME_BRIDGE_EVENTS.LOCAL_POSITION_SYNC).toBe('REACT:LOCAL_POSITION_SYNC');
    });

    test('dispatches COINS_UPDATED to listeners with coin payload', () => {
      const listener = jest.fn();
      const unsub = gameEventBridge.on(GAME_BRIDGE_EVENTS.COINS_UPDATED, listener);

      const mockCoins = { '12x14': { x: 12, y: 14 } };
      gameEventBridge.emit(GAME_BRIDGE_EVENTS.COINS_UPDATED, { coins: mockCoins });

      expect(listener).toHaveBeenCalledWith({ coins: mockCoins });
      unsub();
    });

    test('dispatches LOCAL_POSITION_SYNC to keep Phaser local avatar anchored to server tile', () => {
      const positionListener = jest.fn();
      const unsub = gameEventBridge.on(GAME_BRIDGE_EVENTS.LOCAL_POSITION_SYNC, positionListener);

      gameEventBridge.emit(GAME_BRIDGE_EVENTS.LOCAL_POSITION_SYNC, { x: 18, y: 24 });

      expect(positionListener).toHaveBeenCalledWith({ x: 18, y: 24 });
      unsub();
    });
  });
});
