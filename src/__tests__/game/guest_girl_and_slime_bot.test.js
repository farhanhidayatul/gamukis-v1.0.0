import BotEntity from '../../component/component_game/phaser/entities/BotEntity';

// Mock Phaser physics and scene objects
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
            if (Array.isArray(child)) {
              this.children.push(...child);
            } else {
              this.children.push(child);
            }
            return this;
          }
          destroy() {}
        },
        Sprite: class Sprite {
          constructor() {
            this.visible = true;
            this.frame = { name: 0 };
          }
          setOrigin() { return this; }
          setScale() { return this; }
          setTexture() { return this; }
          setTint() { return this; }
          clearTint() { return this; }
          setFrame() { return this; }
          setFlipX() { return this; }
          setVisible(v) { this.visible = v; }
        },
        Text: class Text {
          setOrigin() { return this; }
        },
        Graphics: class Graphics {
          clear() { return this; }
          fillStyle() { return this; }
          fillRect() { return this; }
          fillEllipse() { return this; }
        }
      }
    }
  };
});

describe('Guest Girl Asset & Slime Bot Unit Suite', () => {
  let mockScene;

  beforeEach(() => {
    mockScene = {
      textures: {
        exists: jest.fn((key) => {
          return [
            'bot_slime_sheet',
            'bot_blood_idle_right',
            'char_man_down',
            'char_girl_down',
            'char_girl_up',
            'char_girl_left',
            'char_girl_right'
          ].includes(key);
        })
      },
      add: {
        existing: jest.fn(),
        sprite: jest.fn(() => ({
          setOrigin: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis(),
          setTexture: jest.fn().mockReturnThis(),
          setTint: jest.fn().mockReturnThis(),
          clearTint: jest.fn().mockReturnThis(),
          setFrame: jest.fn().mockReturnThis(),
          setFlipX: jest.fn().mockReturnThis(),
          frame: { name: 0 }
        })),
        graphics: jest.fn(() => ({
          clear: jest.fn().mockReturnThis(),
          fillStyle: jest.fn().mockReturnThis(),
          fillRect: jest.fn().mockReturnThis(),
          fillEllipse: jest.fn().mockReturnThis()
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
      tweens: {
        add: jest.fn(() => ({
          stop: jest.fn()
        }))
      },
      time: {
        delayedCall: jest.fn((delay, cb) => cb && cb())
      },
      handleBotKilled: jest.fn()
    };
  });

  test('BotEntity successfully instantiates slime variant and triggers squash-and-stretch idle animation', () => {
    const slimeBot = new BotEntity(mockScene, 100, 100, {
      id: 'bot_slime_1',
      name: 'Green Slime',
      variant: 'slime',
      health: 5,
      maxHealth: 5
    });

    expect(slimeBot.variant).toBe('slime');
    expect(mockScene.add.sprite).toHaveBeenCalledWith(0, 0, 'bot_slime_sheet');
    expect(mockScene.tweens.add).toHaveBeenCalledWith(
      expect.objectContaining({
        scaleX: 1.15,
        scaleY: 0.85,
        ease: 'Sine.easeInOut'
      })
    );
  });

  test('BotEntity emits handleDeath and scene.handleBotKilled when health reaches 0 (Coin Drop)', () => {
    const onKilledMock = jest.fn();
    const slimeBot = new BotEntity(mockScene, 120, 150, {
      id: 'bot_slime_2',
      name: 'Slime Leader',
      variant: 'slime',
      health: 2,
      maxHealth: 2
    });
    slimeBot.onKilled = onKilledMock;

    // Apply lethal damage
    slimeBot.takeDamage(2);

    expect(slimeBot.health).toBe(0);
    expect(slimeBot.isDead).toBe(true);
    expect(onKilledMock).toHaveBeenCalledWith(slimeBot);
    expect(mockScene.handleBotKilled).toHaveBeenCalledWith(slimeBot);
  });

  test('Slime Bot moveTo applies Quad.easeInOut bounce tween and frame flip', () => {
    const slimeBot = new BotEntity(mockScene, 100, 100, {
      id: 'bot_slime_3',
      name: 'Bouncy Slime',
      variant: 'slime',
      health: 3
    });

    slimeBot.moveTo(150, 100);

    expect(mockScene.tweens.add).toHaveBeenCalledWith(
      expect.objectContaining({
        x: 150,
        y: 100,
        ease: 'Quad.easeInOut'
      })
    );
  });
});
