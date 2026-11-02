/**
 * BotEntity.js
 * 
 * In-game monster / enemy bot entity for Phaser 3.
 * Renders monster visual, floating health bar, and combat state indicators.
 * 
 * Complies with `code-readability`: clear state transitions, visible health math,
 * and robust network interpolation.
 */

import Phaser from 'phaser';

export const BOT_HEALTH_BAR_WIDTH = 32;
export const BOT_HEALTH_BAR_HEIGHT = 4;

export default class BotEntity extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene 
   * @param {number} x 
   * @param {number} y 
   * @param {object} botConfig - Bot data (id, name, variant, health, maxHealth)
   */
  constructor(scene, x, y, botConfig = {}) {
    super(scene, x, y);
    this.scene = scene;

    this.botId = botConfig.id || 'bot_unknown';
    this.botName = botConfig.name || 'Monster';
    this.variant = botConfig.variant || 'blood';
    this.health = botConfig.health ?? 3;
    this.maxHealth = botConfig.maxHealth ?? 3;

    // 1. Monster Sprite (Anchored at feet)
    const variant = this.variant || 'blood';
    let textureKey = `bot_${variant}_idle_right`;
    if (!scene.textures.exists(textureKey)) {
      textureKey = this.variant === 'demon' ? 'bot_demon_sprite' : 'bot_blood_sprite';
    }
    this.sprite = scene.add.sprite(0, 0, textureKey).setOrigin(0.5, 1.0);
    if (scene.textures.exists(`bot_${variant}_idle_right`)) {
      this.sprite.setScale(0.4);
    }
    this.add(this.sprite);

    // 2. Health Bar Background & Fill
    this.healthBarGraphics = scene.add.graphics();
    this.add(this.healthBarGraphics);
    this.updateHealthBar();

    // 3. Nameplate
    this.nameText = scene.add.text(0, -42, this.botName, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px',
      color: '#ef4444',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5, 1.0);
    this.add(this.nameText);

    // Add to scene and physics
    scene.add.existing(this);
    scene.physics.world.enable(this);

    if (this.body) {
      this.body.setSize(28, 20);
      this.body.setOffset(-14, -20);
    }
  }

  /**
   * Redraws the floating health bar based on current health ratio.
   */
  updateHealthBar() {
    this.healthBarGraphics.clear();

    const healthRatio = Math.max(0, Math.min(1, this.health / this.maxHealth));
    const startX = -BOT_HEALTH_BAR_WIDTH / 2;
    const startY = -34;

    // Background (Dark)
    this.healthBarGraphics.fillStyle(0x000000, 0.6);
    this.healthBarGraphics.fillRect(startX, startY, BOT_HEALTH_BAR_WIDTH, BOT_HEALTH_BAR_HEIGHT);

    // Fill (Green -> Yellow -> Red)
    let fillColor = 0x22c55e;
    if (healthRatio < 0.3) {
      fillColor = 0xef4444;
    } else if (healthRatio < 0.6) {
      fillColor = 0xeab308;
    }

    this.healthBarGraphics.fillStyle(fillColor, 1.0);
    this.healthBarGraphics.fillRect(startX, startY, BOT_HEALTH_BAR_WIDTH * healthRatio, BOT_HEALTH_BAR_HEIGHT);
  }

  /**
   * Applies damage and updates visual indicators.
   * 
   * @param {number} damageAmount 
   */
  takeDamage(damageAmount) {
    this.health = Math.max(0, this.health - damageAmount);
    this.updateHealthBar();

    // Damage flash effect
    if (this.sprite) {
      this.sprite.setTint(0xff0000);
      this.scene.time.delayedCall(120, () => {
        if (this.sprite) this.sprite.clearTint();
      });
    }
  }

  /**
   * Smooth movement lerp for network roaming updates.
   * 
   * @param {number} targetX 
   * @param {number} targetY 
   */
  moveTo(targetX, targetY) {
    if (this.moveTween) this.moveTween.stop();

    const variant = this.variant || 'blood';
    if (targetX < this.x && this.scene.textures.exists(`bot_${variant}_idle_left`)) {
      this.sprite.setTexture(`bot_${variant}_idle_left`);
    } else if (targetX > this.x && this.scene.textures.exists(`bot_${variant}_idle_right`)) {
      this.sprite.setTexture(`bot_${variant}_idle_right`);
    }

    this.moveTween = this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: 200,
      ease: 'Linear',
      onComplete: () => {
        this.moveTween = null;
      }
    });
  }

  /**
   * Plays a 300ms visual attack telegraph animation (windup / red flash)
   * giving the player a clear window to dodge.
   * 
   * @param {number} durationMs 
   */
  playAttackWarning(durationMs = 300) {
    if (this.sprite && this.scene) {
      this.sprite.setTint(0xff3333);
      this.scene.tweens.add({
        targets: this.sprite,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: Math.max(100, Math.floor(durationMs / 2)),
        yoyo: true,
        onComplete: () => {
          if (this.sprite) this.sprite.clearTint();
        }
      });
    }
  }

  /**
   * Plays attack resolution feedback (e.g. miss text when player dodged).
   * 
   * @param {boolean} missed 
   */
  playAttackEffect(missed = false) {
    if (missed && this.scene) {
      const missText = this.scene.add.text(this.x, this.y - 48, 'DODGED!', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#60a5fa',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5, 1.0);

      this.scene.tweens.add({
        targets: missText,
        y: this.y - 66,
        alpha: 0,
        duration: 700,
        onComplete: () => {
          if (missText && typeof missText.destroy === 'function') {
            missText.destroy();
          }
        }
      });
    }
  }

  destroy(fromScene) {
    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }
    super.destroy(fromScene);
  }
}
