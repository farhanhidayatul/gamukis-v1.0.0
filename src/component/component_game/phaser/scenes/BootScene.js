/**
 * BootScene.js
 * 
 * Preloads and initializes all game assets and runtime textures for Phaser 3.
 * Preloads authentic Gamukis Tiled map tilesets, character sprites, monster sprites,
 * and coins, generating WebGL textures for pixel-perfect fidelity with the original design.
 * 
 * Complies with `code-readability`: clear asset registration, robust fallback handling,
 * and seamless transition to WorldScene.
 */

import * as Phaser from 'phaser';
import coinImg from '../../../../images/coin.png';
import charManSvg from '../../../../images/char-man-1.svg';
import charGirlSvg from '../../../../images/char_girl_1.svg';
import charactersImg from '../../../../images/characters.png';
import bloodIdleLeft from '../../../../images/asset_game/character/bot_enemy/Blood Monster_A/Blood Monster_A/Blood Monster_A_Idle_direction_left.png';
import bloodIdleRight from '../../../../images/asset_game/character/bot_enemy/Blood Monster_A/Blood Monster_A/Blood Monster_A_Idle_direction_right.png';
import demonIdleLeft from '../../../../images/asset_game/character/bot_enemy/Demon_A/Demon_A/Demon_A_Idle_direction_left.png';
import demonIdleRight from '../../../../images/asset_game/character/bot_enemy/Demon_A/Demon_A/Demon_A_Idle_direction_right.png';
import orcIdleLeft from '../../../../images/asset_game/character/bot_enemy/Orc/Orc_Idle_Left.png';
import orcIdleRight from '../../../../images/asset_game/character/bot_enemy/Orc/Orc_Idle_direction_right.png';
import { tilesets } from '../../tiledMapData';
import { renderMap, renderForegroundMap } from '../../TiledMapCanvas';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // 1. Preload Tiled map tileset images
    tilesets.forEach(({ name, image }) => {
      if (image && !this.textures.exists(`tileset_${name}`)) {
        this.load.image(`tileset_${name}`, image);
      }
    });

    // 2. Preload authentic Coin asset
    if (!this.textures.exists('coin_sprite')) {
      this.load.image('coin_sprite', coinImg);
    }

    // 3. Preload authentic Monster Bot assets
    this.load.image('bot_blood_idle_right', bloodIdleRight);
    this.load.image('bot_blood_idle_left', bloodIdleLeft);
    this.load.image('bot_demon_idle_right', demonIdleRight);
    this.load.image('bot_demon_idle_left', demonIdleLeft);
    this.load.image('bot_orc_idle_right', orcIdleRight);
    this.load.image('bot_orc_idle_left', orcIdleLeft);

    // 4. Preload Slime Bot spritesheet (characters.png)
    if (!this.textures.exists('bot_slime_sheet')) {
      this.load.spritesheet('bot_slime_sheet', charactersImg, {
        frameWidth: 32,
        frameHeight: 32
      });
    }

    // 5. Preload authentic Character SVGs (Boy & Girl)
    this.load.image('char_man_svg', charManSvg);
    this.load.image('char_girl_svg', charGirlSvg);

    // 5. Fallback textures in case any network/asset request degrades
    if (!this.textures.exists('char_fallback_base')) {
      const charCanvas = this.textures.createCanvas('char_fallback_base', 24, 36);
      const ctx = charCanvas.context;
      ctx.fillStyle = '#ffdbac';
      ctx.fillRect(6, 4, 12, 10);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(4, 14, 16, 12);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(6, 26, 5, 8);
      ctx.fillRect(13, 26, 5, 8);
      charCanvas.refresh();
    }
  }

  create() {
    // 1. Compile authentic Tiled Map Ground & Foreground Textures
    try {
      const images = new Map();
      tilesets.forEach(({ name }) => {
        const texture = this.textures.get(`tileset_${name}`);
        if (texture) {
          const source = texture.getSourceImage();
          if (source) images.set(name, source);
        }
      });

      if (images.size > 0) {
        if (!this.textures.exists('world_ground_texture')) {
          const groundCanvas = document.createElement('canvas');
          renderMap(groundCanvas, images);
          this.textures.addCanvas('world_ground_texture', groundCanvas);
        }

        if (!this.textures.exists('world_foreground_texture')) {
          const fgCanvas = document.createElement('canvas');
          renderForegroundMap(fgCanvas, images);
          this.textures.addCanvas('world_foreground_texture', fgCanvas);
        }
      }
    } catch (e) {
      console.warn('Tiled map texture generation skipped or degraded:', e.message);
    }

    // 2. Slice authentic SVG character frames for 4 directional stances
    try {
      const svgTexture = this.textures.get('char_man_svg');
      const svgSource = svgTexture && svgTexture.getSourceImage();
      if (svgSource) {
        const createDirectionTexture = (key, sx, sy) => {
          if (this.textures.exists(key)) return;
          const canvas = document.createElement('canvas');
          canvas.width = 19;
          canvas.height = 36;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(svgSource, sx, sy, 19, 36, 0, 0, 19, 36);
          this.textures.addCanvas(key, canvas);
        };

        createDirectionTexture('char_man_down', 20, 0);
        createDirectionTexture('char_man_up', 20, 37);
        createDirectionTexture('char_man_left', 20, 72);
        createDirectionTexture('char_man_right', 20, 110);
      }

      // Slice authentic Girl SVG character frames (calibrated with 13.6x scale ratio)
      const girlSvgTexture = this.textures.get('char_girl_svg');
      const girlSvgSource = girlSvgTexture && girlSvgTexture.getSourceImage();
      if (girlSvgSource) {
        const createGirlDirectionTexture = (key, sx, sy, sw, sh) => {
          if (this.textures.exists(key)) return;
          const canvas = document.createElement('canvas');
          canvas.width = 19;
          canvas.height = 36;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(girlSvgSource, sx, sy, sw, sh, 0, 0, 19, 36);
          this.textures.addCanvas(key, canvas);
        };

        createGirlDirectionTexture('char_girl_down', 270, 0, 250, 490);
        createGirlDirectionTexture('char_girl_up', 270, 500, 250, 490);
        createGirlDirectionTexture('char_girl_left', 276, 1490, 250, 490);
        createGirlDirectionTexture('char_girl_right', 270, 980, 250, 490);
      }
    } catch (e) {
      console.warn('SVG character frame slicing degraded:', e.message);
    }

    // Proceed to WorldScene once textures are ready
    this.scene.start('WorldScene');
  }
}

