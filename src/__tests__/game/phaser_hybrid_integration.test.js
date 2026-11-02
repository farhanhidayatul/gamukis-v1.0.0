/**
 * phaser_hybrid_integration.test.js
 * 
 * Unit and integration tests for the Phaser 3 & React Hybrid Architecture.
 * Verifies the typed event bridge, engine configuration, and modular layer alignment.
 */

import { gameEventBridge, GAME_BRIDGE_EVENTS } from '../../component/component_game/phaser/bridge/GameEventBridge';
import { createPhaserConfig, GAME_TILE_SIZE } from '../../component/component_game/phaser/config/phaserConfig';

describe('Phaser 3 & React Hybrid Architecture Integration', () => {
  beforeEach(() => {
    gameEventBridge.clearAll();
  });

  describe('GameEventBridge', () => {
    test('subscribes and receives typed events correctly', () => {
      const mockCallback = jest.fn();
      const unsub = gameEventBridge.on(GAME_BRIDGE_EVENTS.COIN_COLLECTED, mockCallback);

      const payload = { coinKey: '10_12', gridX: 10, gridY: 12 };
      gameEventBridge.emit(GAME_BRIDGE_EVENTS.COIN_COLLECTED, payload);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(payload);

      // Verify unsubscription
      unsub();
      gameEventBridge.emit(GAME_BRIDGE_EVENTS.COIN_COLLECTED, payload);
      expect(mockCallback).toHaveBeenCalledTimes(1); // Not called again
    });

    test('ignores non-function subscribers gracefully', () => {
      expect(() => {
        const unsub = gameEventBridge.on('INVALID_EVENT', null);
        expect(typeof unsub).toBe('function');
      }).not.toThrow();
    });

    test('isolates errors in listeners without halting other subscribers', () => {
      const faultyListener = jest.fn(() => {
        throw new Error('Listener failed');
      });
      const healthyListener = jest.fn();

      gameEventBridge.on(GAME_BRIDGE_EVENTS.ROOM_PLAYERS_SYNC, faultyListener);
      gameEventBridge.on(GAME_BRIDGE_EVENTS.ROOM_PLAYERS_SYNC, healthyListener);

      expect(() => {
        gameEventBridge.emit(GAME_BRIDGE_EVENTS.ROOM_PLAYERS_SYNC, [{ id: 'p1' }]);
      }).not.toThrow();

      expect(healthyListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Phaser Configuration Factory', () => {
    test('produces valid 2D top-down configuration with pixelArt enabled', () => {
      const mockContainer = document.createElement('div');
      const config = createPhaserConfig(mockContainer);

      expect(config).toBeDefined();
      expect(config.parent).toBe(mockContainer);
      expect(config.pixelArt).toBe(true);
      expect(config.roundPixels).toBe(true);
      expect(config.physics.default).toBe('arcade');
      expect(config.physics.arcade.gravity).toEqual({ x: 0, y: 0 });
      expect(config.scene).toHaveLength(2);
    });

    test('exports standard tile dimension constant', () => {
      expect(GAME_TILE_SIZE).toBe(48);
    });
  });
});
