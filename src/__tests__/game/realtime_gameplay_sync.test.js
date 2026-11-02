import { gameEventBridge, GAME_BRIDGE_EVENTS } from '../../component/component_game/phaser/bridge/GameEventBridge';
import CoinManager from '../../component/component_game/phaser/managers/CoinManager';
import BotEntity from '../../component/component_game/phaser/entities/BotEntity';

// Mock Phaser physics and scene
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
          setTint() { return this; }
          clearTint() { return this; }
          setVisible(v) { this.visible = v; }
        },
        Text: class Text {
          setOrigin() { return this; }
        },
        Graphics: class Graphics {
          clear() { return this; }
          fillStyle() { return this; }
          fillRect() { return this; }
        }
      }
    }
  };
});

describe('Realtime Gameplay Synchronization & Fair Combat Mechanics', () => {
  let mockScene;

  beforeEach(() => {
    mockScene = {
      physics: {
        add: {
          staticGroup: jest.fn(() => ({
            create: jest.fn(() => ({
              setOrigin: jest.fn(),
              setVisible: jest.fn(),
              active: true,
              body: { enable: true }
            }))
          })),
          overlap: jest.fn()
        },
        world: {
          enable: jest.fn()
        }
      },
      add: {
        existing: jest.fn(),
        sprite: jest.fn(() => {
          const spriteObj = {
            setOrigin: jest.fn().mockReturnThis(),
            setTint: jest.fn().mockReturnThis(),
            clearTint: jest.fn().mockReturnThis()
          };
          return spriteObj;
        }),
        graphics: jest.fn(() => ({
          clear: jest.fn(),
          fillStyle: jest.fn(),
          fillRect: jest.fn()
        })),
        text: jest.fn(() => ({
          setOrigin: jest.fn().mockReturnThis(),
          destroy: jest.fn()
        }))
      },
      tweens: {
        add: jest.fn(({ onComplete }) => {
          if (onComplete) onComplete();
          return { stop: jest.fn() };
        })
      },
      time: {
        delayedCall: jest.fn((delay, callback) => callback())
      }
    };
  });

  afterEach(() => {
    gameEventBridge.listeners.clear();
  });

  test('GAME_BRIDGE_EVENTS includes low-latency coin and bot synchronization events', () => {
    expect(GAME_BRIDGE_EVENTS.COIN_COLLECTED).toBe('PHASER:COIN_COLLECTED');
    expect(GAME_BRIDGE_EVENTS.COIN_CLAIM_REJECTED).toBe('REACT:COIN_CLAIM_REJECTED');
    expect(GAME_BRIDGE_EVENTS.BOTS_SYNC).toBe('REACT:BOTS_SYNC');
    expect(GAME_BRIDGE_EVENTS.BOT_ATTACK_WARNING).toBe('REACT:BOT_ATTACK_WARNING');
    expect(GAME_BRIDGE_EVENTS.BOT_ATTACK_EXECUTED).toBe('REACT:BOT_ATTACK_EXECUTED');
  });

  test('CoinManager dispatches COIN_COLLECTED immediately upon pickup', () => {
    const coinManager = new CoinManager(mockScene);
    const mockCoinSprite = {
      active: true,
      isPendingAnswer: false,
      coinKey: '10x15',
      gridX: 10,
      gridY: 15,
      setVisible: jest.fn(),
      body: { enable: true }
    };

    const emittedPayloads = [];
    const unsub = gameEventBridge.on(GAME_BRIDGE_EVENTS.COIN_COLLECTED, (payload) => {
      emittedPayloads.push(payload);
    });

    coinManager.handleCoinPickup(mockCoinSprite);

    expect(mockCoinSprite.setVisible).toHaveBeenCalledWith(false);
    expect(mockCoinSprite.body.enable).toBe(false);
    expect(emittedPayloads.length).toBe(1);
    expect(emittedPayloads[0]).toEqual({
      coinKey: '10x15',
      gridX: 10,
      gridY: 15
    });

    unsub();
    coinManager.destroy();
  });

  test('CoinManager restores coin visibility if server rejects claim (COIN_CLAIM_REJECTED)', () => {
    const coinManager = new CoinManager(mockScene);
    const mockCoinSprite = {
      scene: mockScene,
      isPendingAnswer: true,
      setVisible: jest.fn(),
      body: { enable: false }
    };
    coinManager.coinsByKey.set('12x12', mockCoinSprite);

    gameEventBridge.emit(GAME_BRIDGE_EVENTS.COIN_CLAIM_REJECTED, { coinKey: '12x12' });

    expect(mockCoinSprite.isPendingAnswer).toBe(false);
    expect(mockCoinSprite.setVisible).toHaveBeenCalledWith(true);
    expect(mockCoinSprite.body.enable).toBe(true);

    coinManager.destroy();
  });

  test('BotEntity plays 300ms attack telegraph warning animation and dodge feedback', () => {
    const bot = new BotEntity(mockScene, 100, 100, {
      id: 'bot_test_1',
      name: 'Blood Monster',
      health: 3,
      maxHealth: 3
    });

    expect(() => bot.playAttackWarning(300)).not.toThrow();
    expect(mockScene.tweens.add).toHaveBeenCalled();

    expect(() => bot.playAttackEffect(true)).not.toThrow();
    expect(mockScene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 'DODGED!', expect.any(Object));

    bot.destroy();
  });
});
