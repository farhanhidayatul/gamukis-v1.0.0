/**
 * PhaserGameContainer.js
 * 
 * React component wrapper for the Phaser 3 game instance.
 * Manages clean lifecycle mounting, WebGL context disposal, and event bridge synchronization.
 * 
 * Complies with `code-readability`: strict lifecycle safety, unmount cleanup,
 * and zero DOM leaks.
 */

import React, { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { createPhaserConfig } from './config/phaserConfig';
import { gameEventBridge, GAME_BRIDGE_EVENTS } from './bridge/GameEventBridge';

const PhaserGameContainer = ({
  players = [],
  bots = {},
  appearance = null,
  coins = {},
  zoom = 2.0,
  localPlayerId = null,
  localPlayerPosition = null,
  onCoinCollected = null
}) => {
  const containerRef = useRef(null);
  const gameInstanceRef = useRef(null);

  // 1. Mount & Cleanup Phaser Game Instance
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      const config = createPhaserConfig(containerRef.current);
      const game = new Phaser.Game(config);
      gameInstanceRef.current = game;
    } catch (e) {
      console.warn('Phaser Game initialization skipped or running headless:', e.message);
    }

    return () => {
      // Clean destruction of WebGL context to prevent memory leaks
      if (gameInstanceRef.current) {
        try {
          gameInstanceRef.current.destroy(true);
        } catch (err) { console.warn("[PhaserGameContainer] Fallback:", err?.message || err); }
        gameInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Synchronize Remote Players via Event Bridge
  useEffect(() => {
    const list = Array.isArray(players) ? players : Object.values(players || {});
    gameEventBridge.emit(GAME_BRIDGE_EVENTS.ROOM_PLAYERS_SYNC, list);
  }, [players]);

  // 3. Synchronize Local Player ID
  useEffect(() => {
    if (localPlayerId) {
      gameEventBridge.emit(GAME_BRIDGE_EVENTS.LOCAL_PLAYER_ID_UPDATED, { id: localPlayerId });
    }
  }, [localPlayerId]);

  // 4. Synchronize Bots via Event Bridge
  useEffect(() => {
    if (bots) {
      gameEventBridge.emit(GAME_BRIDGE_EVENTS.BOTS_SYNC, bots);
    }
  }, [bots]);

  // 5. Synchronize Local Appearance
  useEffect(() => {
    if (appearance) {
      gameEventBridge.emit(GAME_BRIDGE_EVENTS.LOCAL_APPEARANCE_UPDATED, { appearance });
    }
  }, [appearance]);

  // 6. Synchronize Camera Zoom
  useEffect(() => {
    if (zoom) {
      gameEventBridge.emit(GAME_BRIDGE_EVENTS.CAMERA_ZOOM_UPDATED, { zoom });
    }
  }, [zoom]);

  // 7. Synchronize Coins
  useEffect(() => {
    if (coins) {
      gameEventBridge.emit(GAME_BRIDGE_EVENTS.COINS_UPDATED, { coins });
    }
  }, [coins]);

  // 8. Synchronize Local Player Position
  useEffect(() => {
    if (localPlayerPosition && Number.isFinite(localPlayerPosition.x) && Number.isFinite(localPlayerPosition.y)) {
      gameEventBridge.emit(GAME_BRIDGE_EVENTS.LOCAL_POSITION_SYNC, localPlayerPosition);
    }
  }, [localPlayerPosition]);

  // 9. Handle Coin Pickup callback for React quiz modal
  useEffect(() => {
    if (typeof onCoinCollected === 'function') {
      const unsub = gameEventBridge.on(GAME_BRIDGE_EVENTS.COIN_COLLECTED, onCoinCollected);
      return unsub;
    }
  }, [onCoinCollected]);

  return (
    <div
      ref={containerRef}
      id="phaser-game-canvas-root"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1, // Sits under React HUD overlays (z-index: 10+)
        overflow: 'hidden'
      }}
    />
  );
};

export default React.memo(PhaserGameContainer);
