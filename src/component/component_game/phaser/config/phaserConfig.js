/**
 * phaserConfig.js
 * 
 * Central Phaser 3 configuration factory.
 * Optimized for top-down 2D pixel art, 60 FPS WebGL rendering, and zero-gravity arcade physics.
 * 
 * Conforms to `code-readability`: explicit constants, pixel-art preservation, and
 * container binding without global side effects.
 */

import * as Phaser from 'phaser';
import BootScene from '../scenes/BootScene';
import WorldScene from '../scenes/WorldScene';

export const GAME_TILE_SIZE = 48;
export const DEFAULT_CAMERA_ZOOM = 2.0;

/**
 * Creates a standard Phaser game configuration bound to a given DOM container.
 * 
 * @param {HTMLElement|string} parentElement - DOM container reference or element ID
 * @param {object} customOverrides - Optional configuration overrides
 * @returns {Phaser.Types.Core.GameConfig}
 */
export const createPhaserConfig = (parentElement, customOverrides = {}) => {
  return {
    type: Phaser.AUTO,
    parent: parentElement,
    width: (typeof window !== 'undefined' && window.innerWidth) || 800,
    height: (typeof window !== 'undefined' && window.innerHeight) || 600,
    pixelArt: true, // Crucial for crisp pixel-art sprites and tilesets without blur
    roundPixels: true,
    backgroundColor: '#1a1a2e',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 }, // Top-down game: no vertical gravity
        debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, WorldScene],
    ...customOverrides
  };
};
