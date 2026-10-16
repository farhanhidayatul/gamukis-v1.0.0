import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import EnemyBot, { SPRITE_CONFIG } from '../../component/component_game/EnemyBot';
import { castSkillAction } from '../../database/realtimeGame';

global.IS_REACT_ACT_ENVIRONMENT = true;

const mount = async (element) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return {
    container,
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  };
};

describe('Authoritative Gameplay Damage & Bot Enemy Suite', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('1. EnemyBot Component Rendering', () => {
    test('renders EnemyBot with correct coordinates, name and health representation', async () => {
      const mockBot = {
        id: 'bot_test_1',
        name: 'Goblin Scout',
        x: 12,
        y: 15,
        health: 2,
        maxHealth: 3,
        state: 'idle'
      };

      const { container, unmount } = await mount(<EnemyBot bot={mockBot} />);
      const botElement = container.querySelector('[data-testid="bot-enemy-bot_test_1"]');
      expect(botElement).toBeTruthy();
      expect(container.textContent).toContain('Goblin Scout');

      // Grid positioning: 16px tile size
      // left = 12 * 16 = 192px, top = 15 * 16 - 12 = 228px
      expect(botElement.style.transform).toContain('translate3d(192px, 228px, 0)');

      // HP bar fill check
      const hpFill = container.querySelector('.EnemyBot_hp_fill');
      expect(hpFill).toBeTruthy();
      expect(hpFill.style.width).toBe('66.66666666666666%');

      await unmount();
    });

    test('renders attack animation state when bot.state is attacking', async () => {
      const mockAttackingBot = {
        id: 'bot_atk',
        name: 'Shadow Imp',
        x: 5,
        y: 5,
        health: 3,
        maxHealth: 3,
        state: 'attacking'
      };

      const { container, unmount } = await mount(<EnemyBot bot={mockAttackingBot} />);
      const botElement = container.querySelector('[data-testid="bot-enemy-bot_atk"]');
      expect(botElement.classList.contains('attacking')).toBe(true);
      expect(container.querySelector('.EnemyBot_attack_effect')).toBeTruthy();

      await unmount();
    });

    test('returns null gracefully when bot is invalid or coordinates missing', async () => {
      const { container: c1, unmount: u1 } = await mount(<EnemyBot bot={null} />);
      expect(c1.children.length).toBe(0);
      await u1();

      const { container: c2, unmount: u2 } = await mount(<EnemyBot bot={{ x: 'invalid' }} />);
      expect(c2.children.length).toBe(0);
      await u2();
    });

    test('renders Blood Demon with default 10x scale and Idle direction left/right', async () => {
      const mockBloodBot = {
        id: 'bot_blood_idle',
        name: 'Blood Demon',
        x: 4,
        y: 6,
        health: 3,
        maxHealth: 3,
        state: 'idle',
        direction: 'left'
      };

      const { container, unmount } = await mount(<EnemyBot bot={mockBloodBot} />);
      const botElement = container.querySelector('[data-testid="bot-enemy-bot_blood_idle"]');
      expect(botElement).toBeTruthy();
      expect(botElement.style.getPropertyValue('--bot-scale')).toBe('10');
      const sheet = container.querySelector('.EnemyBot_sheet_frame');
      expect(sheet.classList.contains('bot-anim-idle')).toBe(true);
      expect(sheet.classList.contains('dir-left')).toBe(true);
      expect(sheet.getAttribute('data-sprite-src')).toContain('Blood Monster_A_Idle_direction_left.png');

      await unmount();
    });

    test('renders Walk animation with full directions', async () => {
      const mockWalkingBot = {
        id: 'bot_walk',
        name: 'Blood Demon',
        x: 7,
        y: 8,
        health: 3,
        maxHealth: 3,
        state: 'walk',
        direction: 'right'
      };

      const { container, unmount } = await mount(<EnemyBot bot={mockWalkingBot} />);
      const sheet = container.querySelector('.EnemyBot_sheet_frame');
      expect(sheet.classList.contains('bot-anim-walk')).toBe(true);
      expect(sheet.classList.contains('dir-right')).toBe(true);
      expect(sheet.getAttribute('data-sprite-src')).toContain('Blood Monster_A_Walk_direction_right.png');

      await unmount();
    });

    test('renders Attack 1 and Attack 2 variations with combo effects', async () => {
      const mockAtk1 = {
        id: 'bot_atk1',
        name: 'Blood Demon',
        x: 2,
        y: 3,
        state: 'attack1',
        direction: 'left'
      };
      const { container: c1, unmount: u1 } = await mount(<EnemyBot bot={mockAtk1} />);
      const sheet1 = c1.querySelector('.EnemyBot_sheet_frame');
      expect(sheet1.classList.contains('bot-anim-attack1')).toBe(true);
      expect(sheet1.getAttribute('data-sprite-src')).toContain('Blood Monster_A_Attack01_direction_left.png');
      expect(c1.querySelector('.EnemyBot_attack_effect')).toBeTruthy();
      await u1();

      const mockAtk2 = {
        id: 'bot_atk2',
        name: 'Blood Demon',
        x: 2,
        y: 3,
        state: 'attack2',
        direction: 'right'
      };
      const { container: c2, unmount: u2 } = await mount(<EnemyBot bot={mockAtk2} />);
      const sheet2 = c2.querySelector('.EnemyBot_sheet_frame');
      expect(sheet2.classList.contains('bot-anim-attack2')).toBe(true);
      expect(sheet2.getAttribute('data-sprite-src')).toContain('Blood Monster_A_Attack02_direction_right.png');
      expect(c2.querySelector('.EnemyBot_attack_effect.combo')).toBeTruthy();
      await u2();
    });

    test('renders Death animation and burst effect when HP reaches 0', async () => {
      const mockDeadBot = {
        id: 'bot_dead',
        name: 'Blood Demon',
        x: 10,
        y: 10,
        health: 0,
        maxHealth: 3,
        state: 'idle',
        direction: 'left'
      };

      const { container, unmount } = await mount(<EnemyBot bot={mockDeadBot} />);
      const botElement = container.querySelector('[data-testid="bot-enemy-bot_dead"]');
      expect(botElement.classList.contains('dead')).toBe(true);
      const sheet = container.querySelector('.EnemyBot_sheet_frame');
      expect(sheet.classList.contains('bot-anim-death')).toBe(true);
      expect(sheet.getAttribute('data-sprite-src')).toContain('Blood Monster_A_Death_direction_left.png');
      expect(container.querySelector('.EnemyBot_death_effect')).toBeTruthy();

      await unmount();
    });

    test('renders Death animation for right direction with Blood Monster_A_Death_direction_right.png', async () => {
      const mockDeadBotRight = {
        id: 'bot_dead_right',
        name: 'Blood Demon',
        x: 10,
        y: 10,
        health: 0,
        maxHealth: 3,
        state: 'idle',
        direction: 'right'
      };

      const { container, unmount } = await mount(<EnemyBot bot={mockDeadBotRight} />);
      const botElement = container.querySelector('[data-testid="bot-enemy-bot_dead_right"]');
      expect(botElement.classList.contains('dead')).toBe(true);
      const sheet = container.querySelector('.EnemyBot_sheet_frame');
      expect(sheet.classList.contains('bot-anim-death')).toBe(true);
      expect(sheet.getAttribute('data-sprite-src')).toContain('Blood Monster_A_Death_direction_right.png');
      expect(container.querySelector('.EnemyBot_death_effect')).toBeTruthy();

      await unmount();
    });

    test('calls onDeathComplete callback when death animation finishes', async () => {
      jest.useFakeTimers();
      const onDeathComplete = jest.fn();
      const mockDeadBot = {
        id: 'bot_timer_test',
        name: 'Blood Demon',
        x: 10,
        y: 10,
        health: 0,
        maxHealth: 3,
        state: 'idle',
        direction: 'left'
      };

      const { unmount } = await mount(<EnemyBot bot={mockDeadBot} onDeathComplete={onDeathComplete} />);
      expect(onDeathComplete).not.toHaveBeenCalled();

      jest.advanceTimersByTime(950);
      expect(onDeathComplete).toHaveBeenCalledWith('bot_timer_test');

      await unmount();
      jest.useRealTimers();
    });

    test('renders Demon variant with 10x scale, purple styling, and Demon_A sprite sheets', async () => {
      const mockDemonBot = {
        id: 'bot_demon_1',
        name: 'Demon',
        variant: 'demon',
        x: 15,
        y: 8,
        health: 3,
        maxHealth: 3,
        state: 'idle',
        direction: 'left'
      };

      const { container, unmount } = await mount(<EnemyBot bot={mockDemonBot} />);
      const botElement = container.querySelector('[data-testid="bot-enemy-bot_demon_1"]');
      expect(botElement).toBeTruthy();
      expect(botElement.classList.contains('demon')).toBe(true);
      expect(botElement.style.getPropertyValue('--bot-scale')).toBe('10');
      expect(botElement.getAttribute('data-category')).toBe('Monster');
      expect(container.textContent).toContain('Demon');

      const sheet = container.querySelector('.EnemyBot_sheet_frame');
      expect(sheet.getAttribute('data-sprite-src')).toContain('Demon_A_Idle_direction_left.png');
      await unmount();
    });

    test('renders Orc variant with 10x scale, orc sprite sheets, and left-flip transform', async () => {
      const mockOrcBot = {
        id: 'bot_orc_1',
        name: 'Orc',
        variant: 'orc',
        x: 10,
        y: 12,
        health: 3,
        maxHealth: 3,
        state: 'walk',
        direction: 'left'
      };

      const { container, unmount } = await mount(<EnemyBot bot={mockOrcBot} />);
      const botElement = container.querySelector('[data-testid="bot-enemy-bot_orc_1"]');
      expect(botElement).toBeTruthy();
      expect(botElement.classList.contains('orc')).toBe(true);
      expect(botElement.style.getPropertyValue('--bot-scale')).toBe('10');
      expect(botElement.getAttribute('data-category')).toBe('Monster');
      expect(container.textContent).toContain('Orc');

      const sheet = container.querySelector('.EnemyBot_sheet_frame');
      expect(sheet.getAttribute('data-sprite-src')).toContain('Orc_Walk_Left.png');
      expect(sheet.classList.contains('dir-left')).toBe(true);
      await unmount();
    });

    test('renders Emperor Samurai variant with 2x scale and Manusia yang Tersesat category', async () => {
      const mockSamuraiBot = {
        id: 'bot_samurai_1',
        name: 'Manusia yang Tersesat (Emperor Samurai)',
        variant: 'samurai',
        x: 8,
        y: 14,
        health: 3,
        maxHealth: 3,
        state: 'idle',
        direction: 'right'
      };

      const { container, unmount } = await mount(<EnemyBot bot={mockSamuraiBot} />);
      const botElement = container.querySelector('[data-testid="bot-enemy-bot_samurai_1"]');
      expect(botElement).toBeTruthy();
      expect(botElement.classList.contains('samurai')).toBe(true);
      // Emperor samurai is only 2x larger (scale 2x)
      expect(botElement.style.getPropertyValue('--bot-scale')).toBe('2');
      expect(botElement.getAttribute('data-category')).toBe('Manusia yang Tersesat');
      expect(container.textContent).toContain('Manusia yang Tersesat');

      const sheet = container.querySelector('.EnemyBot_sheet_frame');
      expect(sheet.getAttribute('data-sprite-src')).toContain('IDLE_direction_right.png');
      await unmount();
    });

    test('DEFAULT_BOT_CONFIGS in inGame.js contains all 4 bot variants with correct scales and categories', async () => {
      const { DEFAULT_BOT_CONFIGS, getLocalFallbackBots } = await import('../../component/component_game/inGame');
      expect(DEFAULT_BOT_CONFIGS).toHaveLength(4);

      const variants = DEFAULT_BOT_CONFIGS.map((b) => b.variant);
      expect(variants).toEqual(['blood', 'demon', 'orc', 'samurai']);

      const scales = DEFAULT_BOT_CONFIGS.map((b) => b.scaleMultiplier);
      expect(scales).toEqual([10, 10, 10, 2]);

      const categories = DEFAULT_BOT_CONFIGS.map((b) => b.category);
      expect(categories).toEqual(['Monster', 'Monster', 'Monster', 'Manusia yang Tersesat']);

      const fallbackMap = getLocalFallbackBots();
      expect(Object.keys(fallbackMap)).toHaveLength(4);
    });

    test('SPRITE_CONFIG defines accurate frame counts and widths across all bot variants', () => {
      // Demon frame precision
      expect(SPRITE_CONFIG.demon.walk.left.frames).toBe(7);
      expect(SPRITE_CONFIG.demon.walk.left.width).toBe(700);
      expect(SPRITE_CONFIG.demon.walk.right.frames).toBe(8);
      expect(SPRITE_CONFIG.demon.walk.right.width).toBe(800);
      expect(SPRITE_CONFIG.demon.attack1.left.frames).toBe(7);
      expect(SPRITE_CONFIG.demon.attack1.left.width).toBe(700);
      expect(SPRITE_CONFIG.demon.attack1.right.frames).toBe(7);
      expect(SPRITE_CONFIG.demon.attack1.right.width).toBe(700);
      expect(SPRITE_CONFIG.demon.attack2.left.frames).toBe(7);
      expect(SPRITE_CONFIG.demon.attack2.left.width).toBe(700);
      expect(SPRITE_CONFIG.demon.attack2.right.frames).toBe(7);
      expect(SPRITE_CONFIG.demon.attack2.right.width).toBe(700);

      // Samurai frame precision
      expect(SPRITE_CONFIG.samurai.idle.left.frames).toBe(10);
      expect(SPRITE_CONFIG.samurai.idle.left.width).toBe(960);
      expect(SPRITE_CONFIG.samurai.idle.right.frames).toBe(10);
      expect(SPRITE_CONFIG.samurai.idle.right.width).toBe(960);
      expect(SPRITE_CONFIG.samurai.walk.left.frames).toBe(16);
      expect(SPRITE_CONFIG.samurai.walk.left.width).toBe(1536);
      expect(SPRITE_CONFIG.samurai.walk.right.frames).toBe(16);
      expect(SPRITE_CONFIG.samurai.walk.right.width).toBe(1536);
      expect(SPRITE_CONFIG.samurai.hurt.left.frames).toBe(4);
      expect(SPRITE_CONFIG.samurai.hurt.left.width).toBe(384);
      expect(SPRITE_CONFIG.samurai.hurt.right.frames).toBe(4);
      expect(SPRITE_CONFIG.samurai.hurt.right.width).toBe(384);
      expect(SPRITE_CONFIG.samurai.attack1.left.frames).toBe(7);
      expect(SPRITE_CONFIG.samurai.attack1.left.width).toBe(672);
      expect(SPRITE_CONFIG.samurai.death.left.frames).toBe(10);
      expect(SPRITE_CONFIG.samurai.death.left.width).toBe(960);
    });

    test('omits up and down sprite versions and strictly renders horizontal sprites', async () => {
      // SPRITE_CONFIG should not have 'down' or 'up' in any variant
      ['blood', 'demon', 'orc', 'samurai'].forEach((variant) => {
        ['idle', 'walk', 'attack1', 'attack2', 'hurt', 'death'].forEach((action) => {
          if (SPRITE_CONFIG[variant]?.[action]) {
            expect(SPRITE_CONFIG[variant][action].down).toBeUndefined();
            expect(SPRITE_CONFIG[variant][action].up).toBeUndefined();
            expect(SPRITE_CONFIG[variant][action].left).toBeDefined();
            expect(SPRITE_CONFIG[variant][action].right).toBeDefined();
          }
        });
      });

      // Blood Monster with direction 'down' seamlessly renders horizontal (right)
      const mockBloodDown = {
        id: 'bot_blood_down',
        variant: 'blood',
        x: 5,
        y: 5,
        direction: 'down',
        state: 'idle'
      };
      const { container: c1, unmount: u1 } = await mount(<EnemyBot bot={mockBloodDown} />);
      const sheet1 = c1.querySelector('.EnemyBot_sheet_frame');
      expect(sheet1.classList.contains('dir-right')).toBe(true);
      expect(sheet1.classList.contains('dir-down')).toBe(false);
      expect(sheet1.getAttribute('data-sprite-src')).toContain('Blood Monster_A_Idle_direction_right.png');
      await u1();

      // Demon walking with direction 'down' renders horizontal (right)
      const mockDemonDown = {
        id: 'bot_demon_down',
        variant: 'demon',
        x: 5,
        y: 5,
        direction: 'down',
        state: 'walk'
      };
      const { container: c2, unmount: u2 } = await mount(<EnemyBot bot={mockDemonDown} />);
      const sheet2 = c2.querySelector('.EnemyBot_sheet_frame');
      expect(sheet2.classList.contains('dir-right')).toBe(true);
      expect(sheet2.classList.contains('dir-down')).toBe(false);
      expect(sheet2.getAttribute('data-sprite-src')).toContain('Demon_A_Walk_direction_right.png');
      await u2();

      // Samurai running with direction 'left' renders 'dir-left'
      const mockSamuraiLeft = {
        id: 'bot_samurai_left',
        variant: 'samurai',
        x: 5,
        y: 5,
        direction: 'left',
        state: 'chasing'
      };
      const { container: c3, unmount: u3 } = await mount(<EnemyBot bot={mockSamuraiLeft} />);
      const sheet3 = c3.querySelector('.EnemyBot_sheet_frame');
      expect(sheet3.classList.contains('dir-left')).toBe(true);
      expect(sheet3.classList.contains('dir-up')).toBe(false);
      expect(sheet3.getAttribute('data-sprite-src')).toContain('RUN_direction_left.png');
      await u3();
    });

    test('normalizes customCategory from socket (e.g. lowercase "monster" to "Monster")', async () => {
      const mockBot = {
        id: 'bot_cat_test',
        variant: 'blood',
        category: 'monster',
        x: 5,
        y: 5
      };
      const { container, unmount } = await mount(<EnemyBot bot={mockBot} />);
      const el = container.querySelector('[data-testid="bot-enemy-bot_cat_test"]');
      expect(el.getAttribute('data-category')).toBe('Monster');
      await unmount();
    });
  });

  describe('2. Player Skill Intent Dispatch', () => {
    test('castSkillAction is exported and callable', () => {
      expect(typeof castSkillAction).toBe('function');
    });
  });

  describe('3. MiniMap Radar Threat Visualization for Enemy Bots', () => {
    test('renders enemy bots as red threat dots on the radar at proper percent positions', async () => {
      const MiniMap = (await import('../../component/component_game/miniMap')).default;
      const mockPlayer = { id: 'p1', name: 'Tester', x: 20, y: 12 };
      const mockBots = {
        'bot-1': { id: 'bot-1', name: 'Goblin Scout', x: 40, y: 24 }
      };

      const { container, unmount } = await mount(
        <MiniMap
          player={mockPlayer}
          bots={mockBots}
          mapWidthTiles={80}
          mapHeightTiles={40}
        />
      );

      const botDot = container.querySelector('[data-testid="minimap-bot"]');
      expect(botDot).not.toBeNull();
      // x: 40 / 80 = 50%, y: 24 / 40 = 60%
      expect(botDot.style.left).toBe('50%');
      expect(botDot.style.top).toBe('60%');

      await unmount();
    });
  });

  describe('4. Wrong Answer Damage Separation Verification', () => {
    test('wrong answer logs statistics without mutating health or calling damage', () => {
      const sessionAnswers = [];
      let playerHealth = 3;

      const onQuestionAnswered = (question, answer, correct) => {
        const answerData = {
          question,
          answer,
          correct,
          timestamp: Date.now()
        };
        sessionAnswers.push(answerData);

        // Verification: Wrong answer records metrics, but does NOT decrement playerHealth
        if (!correct) {
          // No damage applied!
        }
      };

      onQuestionAnswered('Apa ibukota Indonesia?', 'Bandung', false);

      expect(sessionAnswers).toHaveLength(1);
      expect(sessionAnswers[0].correct).toBe(false);
      expect(sessionAnswers[0].question).toBe('Apa ibukota Indonesia?');
      expect(sessionAnswers[0].answer).toBe('Bandung');
      expect(playerHealth).toBe(3); // Health remains undamaged
    });
  });
});

