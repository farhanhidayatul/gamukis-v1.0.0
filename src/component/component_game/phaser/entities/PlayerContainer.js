/**
 * PlayerContainer.js
 * 
 * Modular player avatar container for Phaser 3.
 * Stacks shadow, body/skin, pants, shirt, shoes, head, hair, and nameplate into a single
 * composite game object with zero DOM reflow overhead.
 * 
 * Complies with `code-readability`: explicit layer ordering, named constants,
 * smooth network interpolation (lerp), and strict null-safety on appearance configs.
 */

import Phaser from 'phaser';

export const PLAYER_PIVOT_ORIGIN_X = 0.5;
export const PLAYER_PIVOT_ORIGIN_Y = 1.0; // Anchored at feet
export const DEFAULT_MOVE_LERP_DURATION_MS = 180;

export default class PlayerContainer extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x - Grid or pixel X position
   * @param {number} y - Grid or pixel Y position
   * @param {string} playerId - Unique player identifier
   * @param {string} playerName - Display name for nameplate
   * @param {object} appearance - Wardrobe/appearance configuration
   * @param {boolean} isLocal - True if this is the active user's character
   */
  constructor(scene, x, y, playerId, playerName = 'Player', appearance = {}, isLocal = false) {
    super(scene, x, y);

    this.playerId = playerId;
    this.playerName = playerName;
    this.isLocal = isLocal;
    this.currentDirection = 'down';
    this.isMoving = false;

    // 1. Layer 0: Shadow ellipse directly under feet
    this.shadowGraphics = scene.add.graphics();
    this.shadowGraphics.fillStyle(0x000000, 0.35);
    this.shadowGraphics.fillEllipse(0, -2, 28, 14);
    this.add(this.shadowGraphics);

    // 2. Layer 1-6: Modular Character Sprites (Paperdoll layering)
    // Anchored at bottom-center (0.5, 1.0) and scaled to target 16x32px footprint
    const spriteScaleX = 16 / 24;
    const spriteScaleY = 32 / 36;

    const hasAuthenticChar = scene.textures.exists('char_man_down');
    const baseTexture = hasAuthenticChar ? 'char_man_down' : 'char_fallback_base';
    this.bodySprite = scene.add.sprite(0, 0, baseTexture).setOrigin(PLAYER_PIVOT_ORIGIN_X, PLAYER_PIVOT_ORIGIN_Y);

    if (hasAuthenticChar) {
      this.bodySprite.setScale(1.1);
      this.pantsSprite = scene.add.sprite(0, 0, 'char_fallback_base').setVisible(false);
      this.shirtSprite = scene.add.sprite(0, 0, 'char_fallback_base').setVisible(false);
      this.shoesSprite = scene.add.sprite(0, 0, 'char_fallback_base').setVisible(false);
      this.headSprite = scene.add.sprite(0, 0, 'char_fallback_base').setVisible(false);
      this.hairSprite = scene.add.sprite(0, 0, 'char_fallback_base').setVisible(false);
    } else {
      this.bodySprite.setScale(spriteScaleX, spriteScaleY);
      this.pantsSprite = scene.add.sprite(0, 0, 'char_fallback_base').setOrigin(PLAYER_PIVOT_ORIGIN_X, PLAYER_PIVOT_ORIGIN_Y).setScale(spriteScaleX, spriteScaleY);
      this.shirtSprite = scene.add.sprite(0, 0, 'char_fallback_base').setOrigin(PLAYER_PIVOT_ORIGIN_X, PLAYER_PIVOT_ORIGIN_Y).setScale(spriteScaleX, spriteScaleY);
      this.shoesSprite = scene.add.sprite(0, 0, 'char_fallback_base').setOrigin(PLAYER_PIVOT_ORIGIN_X, PLAYER_PIVOT_ORIGIN_Y).setScale(spriteScaleX, spriteScaleY);
      this.headSprite = scene.add.sprite(0, 0, 'char_fallback_base').setOrigin(PLAYER_PIVOT_ORIGIN_X, PLAYER_PIVOT_ORIGIN_Y).setScale(spriteScaleX, spriteScaleY);
      this.hairSprite = scene.add.sprite(0, 0, 'char_fallback_base').setOrigin(PLAYER_PIVOT_ORIGIN_X, PLAYER_PIVOT_ORIGIN_Y).setScale(spriteScaleX, spriteScaleY);
    }

    // Add in bottom-up z-order
    this.add([
      this.bodySprite,
      this.pantsSprite,
      this.shirtSprite,
      this.shoesSprite,
      this.headSprite,
      this.hairSprite
    ]);

    // 3. Layer 7: Hovering Nameplate Text (calibrated for 32px height)
    const nameColor = isLocal ? '#ffeb3b' : '#ffffff';
    this.nameplateText = scene.add.text(0, -36, playerName, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: nameColor,
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5, 1.0);
    this.add(this.nameplateText);

    // Initial appearance styling
    this.applyAppearance(appearance);

    // Add container to scene display list and physics
    scene.add.existing(this);
    scene.physics.world.enable(this);

    // Adjust collision body to the feet area for accurate tile overlap
    if (this.body) {
      this.body.setSize(24, 16);
      this.body.setOffset(-12, -16);
    }
  }

  /**
   * Applies wardrobe configuration to individual sprite layers.
   * Gracefully handles guest or missing keys.
   * 
   * @param {object} appearance
   */
  applyAppearance(appearance = {}) {
    this.appearance = appearance;
    const { skinColor, hairStyle, hairColor, shirt, pants } = appearance;

    // Body tint or texture variant
    if (skinColor && this.bodySprite) {
      const skinTints = [0xffffff, 0xffe0bd, 0xf1c27d, 0x8d5524, 0xc68642];
      const tintIndex = Number(skinColor) || 1;
      this.bodySprite.setTint(skinTints[tintIndex % skinTints.length]);
    }

    // Hair styling
    if (hairColor && this.hairSprite) {
      const hairTints = {
        black: 0x222222,
        blue: 0x3b82f6,
        brown: 0x8b5a2b,
        green: 0x22c55e,
        pink: 0xec4899,
        red: 0xef4444,
        white: 0xf8fafc
      };
      if (hairTints[hairColor]) {
        this.hairSprite.setTint(hairTints[hairColor]);
      }
    }
  }

  /**
   * Updates character direction and playback state.
   * 
   * @param {'up'|'down'|'left'|'right'} direction
   * @param {boolean} isMoving
   */
  setDirection(direction, isMoving = false) {
    this.currentDirection = direction;
    this.isMoving = isMoving;

    const textureKey = `char_man_${direction}`;
    if (this.bodySprite && this.scene.textures.exists(textureKey)) {
      this.bodySprite.setTexture(textureKey);
      this.bodySprite.setFlipX(false);
    } else {
      // Horizontal flipping for fallback
      if (direction === 'left') {
        this.bodySprite.setFlipX(true);
        this.shirtSprite.setFlipX(true);
        this.pantsSprite.setFlipX(true);
        this.headSprite.setFlipX(true);
        this.hairSprite.setFlipX(true);
      } else if (direction === 'right') {
        this.bodySprite.setFlipX(false);
        this.shirtSprite.setFlipX(false);
        this.pantsSprite.setFlipX(false);
        this.headSprite.setFlipX(false);
        this.hairSprite.setFlipX(false);
      }
    }
  }

  /**
   * Smoothly interpolates position to target coordinates received from the network.
   * Prevents jitter when 30-100 players move concurrently.
   * 
   * @param {number} targetX 
   * @param {number} targetY 
   * @param {number} durationMs 
   */
  moveTo(targetX, targetY, durationMs = DEFAULT_MOVE_LERP_DURATION_MS) {
    if (this.moveTween) {
      this.moveTween.stop();
    }

    this.moveTween = this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: durationMs,
      ease: 'Linear',
      onComplete: () => {
        this.moveTween = null;
      }
    });
  }

  /**
   * Cleanup method when player leaves the room.
   */
  destroy(fromScene) {
    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }
    super.destroy(fromScene);
  }
}
