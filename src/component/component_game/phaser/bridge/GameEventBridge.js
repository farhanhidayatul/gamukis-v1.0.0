/**
 * GameEventBridge.js
 * 
 * Central typed event emitter bridging the React DOM UI layer and the Phaser 3 WebGL scene.
 * Designed for low latency, memory safety, and strict separation of concerns.
 * 
 * Complies with the `code-readability` skill: explicit event constants, early validation,
 * and robust cleanup to avoid memory leaks across React component unmounts.
 */

export const GAME_BRIDGE_EVENTS = Object.freeze({
  // Phaser -> React events
  COIN_COLLECTED: 'PHASER:COIN_COLLECTED',
  PLAYER_POSITION_CHANGED: 'PHASER:PLAYER_POSITION_CHANGED',
  BOT_INTERACTED: 'PHASER:BOT_INTERACTED',
  SCENE_READY: 'PHASER:SCENE_READY',

  // React -> Phaser events
  QUESTION_RESOLVED: 'REACT:QUESTION_RESOLVED',
  ROOM_PLAYERS_SYNC: 'REACT:ROOM_PLAYERS_SYNC',
  LOCAL_INPUT_DIRECTION: 'REACT:LOCAL_INPUT_DIRECTION',
  LOCAL_APPEARANCE_UPDATED: 'REACT:LOCAL_APPEARANCE_UPDATED',
  SKILL_CAST_REQUESTED: 'REACT:SKILL_CAST_REQUESTED',
  CAMERA_ZOOM_UPDATED: 'REACT:CAMERA_ZOOM_UPDATED',
  COINS_UPDATED: 'REACT:COINS_UPDATED',
  COIN_CLAIM_REJECTED: 'REACT:COIN_CLAIM_REJECTED',
  LOCAL_POSITION_SYNC: 'REACT:LOCAL_POSITION_SYNC',
  LOCAL_PLAYER_ID_UPDATED: 'REACT:LOCAL_PLAYER_ID_UPDATED',
  BOTS_SYNC: 'REACT:BOTS_SYNC',
  BOT_ATTACK_WARNING: 'REACT:BOT_ATTACK_WARNING',
  BOT_ATTACK_EXECUTED: 'REACT:BOT_ATTACK_EXECUTED',
  INPUT_LOCK_CHANGED: 'REACT:INPUT_LOCK_CHANGED',
  LOCAL_PLAYER_DEATH_STATE: 'REACT:LOCAL_PLAYER_DEATH_STATE'
});

class GameEventBridge {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.listeners = new Map();
  }

  /**
   * Subscribe to a typed bridge event.
   * @param {string} eventName - One of GAME_BRIDGE_EVENTS
   * @param {Function} callback - Event listener callback
   * @returns {Function} Unsubscribe function for easy cleanup in React useEffect
   */
  on(eventName, callback) {
    if (typeof callback !== 'function') {
      console.warn(`[GameEventBridge] Attempted to subscribe non-function to "${eventName}"`);
      return () => {};
    }

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName).add(callback);

    // Return cleanup callback
    return () => this.off(eventName, callback);
  }

  /**
   * Unsubscribe a listener from a typed event.
   * @param {string} eventName 
   * @param {Function} callback 
   */
  off(eventName, callback) {
    if (!this.listeners.has(eventName)) return;
    const eventSet = this.listeners.get(eventName);
    eventSet.delete(callback);
    if (eventSet.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  /**
   * Emit an event across the bridge with structured payload.
   * @param {string} eventName - One of GAME_BRIDGE_EVENTS
   * @param {object} payload - Structured event payload
   */
  emit(eventName, payload = {}) {
    if (!this.listeners.has(eventName)) return;

    const listeners = this.listeners.get(eventName);
    listeners.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`[GameEventBridge] Error in listener for "${eventName}":`, error);
      }
    });
  }

  /**
   * Clear all active listeners (useful on game teardown).
   */
  clearAll() {
    this.listeners.clear();
  }
}

// Export singleton instance for app-wide bridge coordination
export const gameEventBridge = new GameEventBridge();
export default GameEventBridge;
