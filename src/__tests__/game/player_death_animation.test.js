import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GAME_BRIDGE_EVENTS, gameEventBridge } from '../../component/component_game/phaser/bridge/GameEventBridge';
import PlayerContainer from '../../component/component_game/phaser/entities/PlayerContainer';

// Mock Phaser objects for Node.js / JSDOM environment
jest.mock('phaser', () => {
  return {
    __esModule: true,
    default: {
      Scene: class Scene {},
      GameObjects: {
        Container: class Container {
          constructor(scene, x, y) {
            this.scene = scene;
            this.x = x || 0;
            this.y = y || 0;
            this.children = [];
          }
          add(child) {
            this.children.push(child);
          }
          destroy() {}
        },
        Sprite: class Sprite {
          constructor() {
            this.visible = true;
          }
          setOrigin() { return this; }
          setScale() { return this; }
          setTint() { return this; }
          clearTint() { return this; }
          setVisible(v) { this.visible = v; }
          setTexture() { return this; }
          setFlipX() { return this; }
          setAngle() { return this; }
          setY() { return this; }
          setAlpha() { return this; }
        },
        Text: class Text {
          setOrigin() { return this; }
        },
        Graphics: class Graphics {
          clear() { return this; }
          fillStyle() { return this; }
          fillEllipse() { return this; }
          fillRect() { return this; }
          setVisible() { return this; }
        }
      }
    }
  };
});

describe('In-Game Player Death Animation Suite', () => {
  let mockScene;
  let playerContainer;

  beforeEach(() => {
    gameEventBridge.clearAll();

    mockScene = {
      add: {
        existing: jest.fn(),
        graphics: jest.fn(() => ({
          fillStyle: jest.fn().mockReturnThis(),
          fillEllipse: jest.fn().mockReturnThis(),
          clear: jest.fn().mockReturnThis(),
          fillRect: jest.fn().mockReturnThis(),
          setVisible: jest.fn().mockReturnThis()
        })),
        sprite: jest.fn(() => ({
          setOrigin: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis(),
          setVisible: jest.fn().mockReturnThis(),
          setTint: jest.fn().mockReturnThis(),
          setTexture: jest.fn().mockReturnThis(),
          setFlipX: jest.fn().mockReturnThis(),
          setAngle: jest.fn().mockReturnThis(),
          setY: jest.fn().mockReturnThis(),
          setAlpha: jest.fn().mockReturnThis()
        })),
        text: jest.fn(() => ({
          setOrigin: jest.fn().mockReturnThis()
        }))
      },
      physics: {
        world: {
          enable: jest.fn()
        }
      },
      textures: {
        exists: jest.fn(() => true)
      },
      tweens: {
        add: jest.fn((config) => {
          if (config && config.onComplete) {
            config.onComplete();
          }
          return {
            stop: jest.fn()
          };
        })
      }
    };

    playerContainer = new PlayerContainer(
      mockScene,
      100,
      100,
      'test_player_1',
      'Hero',
      {},
      true
    );
  });

  it('defines LOCAL_PLAYER_DEATH_STATE event in GameEventBridge', () => {
    expect(GAME_BRIDGE_EVENTS.LOCAL_PLAYER_DEATH_STATE).toBe('REACT:LOCAL_PLAYER_DEATH_STATE');
  });

  it('triggers playDeathAnimation without throwing and sets isDead to true', () => {
    expect(playerContainer.isDead).toBe(false);

    playerContainer.playDeathAnimation();

    expect(playerContainer.isDead).toBe(true);
    expect(playerContainer.isMoving).toBe(false);
    expect(mockScene.tweens.add).toHaveBeenCalled();
  });

  it('resets from death on respawn and restores standing state', () => {
    playerContainer.playDeathAnimation();
    expect(playerContainer.isDead).toBe(true);

    playerContainer.resetFromDeath();
    expect(playerContainer.isDead).toBe(false);
  });

  it('coordinates bridge event emission for death and respawn recovery', () => {
    const deathListener = jest.fn();
    const unsub = gameEventBridge.on(GAME_BRIDGE_EVENTS.LOCAL_PLAYER_DEATH_STATE, deathListener);

    // 1. Emit Death
    gameEventBridge.emit(GAME_BRIDGE_EVENTS.LOCAL_PLAYER_DEATH_STATE, { isDead: true, respawnCountdown: 15 });
    expect(deathListener).toHaveBeenCalledWith({ isDead: true, respawnCountdown: 15 });

    // 2. Emit Respawn Recovery
    gameEventBridge.emit(GAME_BRIDGE_EVENTS.LOCAL_PLAYER_DEATH_STATE, { isDead: false, respawnCountdown: 0 });
    expect(deathListener).toHaveBeenCalledWith({ isDead: false, respawnCountdown: 0 });

    unsub();
  });

  it('validates 1:1 scale parity and calling format for guest male and female death animations', () => {
    const fs = require('fs');
    const path = require('path');
    const cssPath = path.resolve(__dirname, '../../component/component_game/customCharacterRenderer.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Verify female death animation has calibrated 1:1 scale matching 36px in-game height
    expect(cssContent).toContain('background-image: url("../../images/char_girl_1_death.svg") !important');
    expect(cssContent).toContain('background-size: 164px 146px !important');
    expect(cssContent).toContain('width: 41px !important');
    expect(cssContent).toContain('height: 38px !important');
    expect(cssContent).toContain('top: -20px !important');
    expect(cssContent).toContain('left: -12px !important');

    // Verify male death animation has calibrated 1:1 scale matching 36px in-game height
    expect(cssContent).toContain('background-image: url("../../images/char_man_1_death.svg") !important');
    expect(cssContent).toContain('background-size: 169px 166px !important');
    expect(cssContent).toContain('width: 42px !important');
    expect(cssContent).toContain('height: 42px !important');
    expect(cssContent).toContain('top: -21px !important');
    expect(cssContent).toContain('left: -17px !important');

    // Verify guest calling format in playerInfo.js
    const playerInfoPath = path.resolve(__dirname, '../../component/component_game/playerInfo.js');
    const playerInfoContent = fs.readFileSync(playerInfoPath, 'utf8');
    expect(playerInfoContent).toContain('data-gender={isFemale ? \'female\' : \'male\'}');
    expect(playerInfoContent).toContain('effectiveColor === \'girl\' ? \'Character_svg_girl grid-cell\' : \'Character_svg grid-cell\'');
  });
});
