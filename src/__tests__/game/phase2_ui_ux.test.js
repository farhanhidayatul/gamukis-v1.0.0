import React, { act } from 'react';
import ReactDOM from 'react-dom/client';

import {
  getAudioContext,
  isSoundMuted,
  setSoundMuted,
  toggleSoundMuted,
  playCoinCollectSound,
  playCorrectAnswerSound,
  playWrongAnswerSound,
  playTimerWarningSound,
  playSkillCastSound
} from '../../component/component_game/soundEffects';

import MiniMap, { calculateMapPercent } from '../../component/component_game/miniMap';
import ToastNotification, { emitToast, showToast } from '../../component/component_game/toastNotification';

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

describe('Phase 2 UI & UX Sensory Suite', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  /* =========================================================================
   * 1. Web Audio SFX Synthesizer Tests
   * ========================================================================= */
  describe('Web Audio SFX Synthesizer (soundEffects.js)', () => {
    test('sound preference defaults to unmuted and toggles properly with localStorage', () => {
      expect(isSoundMuted()).toBe(false);

      setSoundMuted(true);
      expect(isSoundMuted()).toBe(true);
      expect(window.localStorage.getItem('gamukis_sound_muted')).toBe('true');

      const toggled = toggleSoundMuted();
      expect(toggled).toBe(false);
      expect(isSoundMuted()).toBe(false);
      expect(window.localStorage.getItem('gamukis_sound_muted')).toBe('false');
    });

    test('dispatches gamukis-sound-muted-change event on mute change', () => {
      const listener = jest.fn();
      window.addEventListener('gamukis-sound-muted-change', listener);

      setSoundMuted(true);
      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0].detail.muted).toBe(true);

      window.removeEventListener('gamukis-sound-muted-change', listener);
    });

    test('all SFX functions execute safely without exception when AudioContext is absent or in jsdom', () => {
      expect(() => {
        playCoinCollectSound();
        playCorrectAnswerSound();
        playWrongAnswerSound();
        playTimerWarningSound();
        playSkillCastSound();
      }).not.toThrow();
    });

    test('synthesizes tones and envelopes when AudioContext is provided', () => {
      const mockGainNode = {
        gain: {
          setValueAtTime: jest.fn(),
          linearRampToValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn()
        },
        connect: jest.fn()
      };

      const mockOscillatorNode = {
        type: 'sine',
        frequency: {
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn()
        },
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn()
      };

      const mockContext = {
        currentTime: 0,
        state: 'running',
        destination: {},
        createGain: jest.fn(() => mockGainNode),
        createOscillator: jest.fn(() => mockOscillatorNode),
        resume: jest.fn().mockResolvedValue()
      };

      const originalAudioContext = window.AudioContext;
      window.AudioContext = jest.fn(() => mockContext);

      try {
        setSoundMuted(false);

        // Test Coin sound
        playCoinCollectSound();
        expect(mockContext.createOscillator).toHaveBeenCalled();
        expect(mockContext.createGain).toHaveBeenCalled();
        expect(mockOscillatorNode.start).toHaveBeenCalled();

        // Test Correct answer sound
        playCorrectAnswerSound();
        expect(mockOscillatorNode.frequency.setValueAtTime).toHaveBeenCalledWith(523.25, expect.any(Number));

        // Test Wrong answer sound
        playWrongAnswerSound();
        expect(mockOscillatorNode.frequency.exponentialRampToValueAtTime).toHaveBeenCalled();

        // Test Timer warning sound
        playTimerWarningSound();
        expect(mockOscillatorNode.start).toHaveBeenCalled();

        // Test Skill cast sound
        playSkillCastSound();
        expect(mockOscillatorNode.start).toHaveBeenCalled();

        // When muted, no tones should be scheduled
        setSoundMuted(true);
        mockContext.createOscillator.mockClear();
        playCoinCollectSound();
        playSkillCastSound();
        expect(mockContext.createOscillator).not.toHaveBeenCalled();
      } finally {
        window.AudioContext = originalAudioContext;
      }
    });
  });

  /* =========================================================================
   * 2. MiniMap HUD Radar Tests
   * ========================================================================= */
  describe('MiniMap HUD Radar (miniMap.js)', () => {
    test('calculateMapPercent handles tile, pixel, and boundary coordinates correctly', () => {
      // 0 tile on 85 width -> 0%
      expect(calculateMapPercent(0, 85)).toBe(0);
      // Halfway: 42.5 on 85 -> 50%
      expect(calculateMapPercent(42.5, 85)).toBe(50);
      // Full: 85 on 85 -> 100%
      expect(calculateMapPercent(85, 85)).toBe(100);
      // Overflow clamp
      expect(calculateMapPercent(100, 85)).toBe(100);
      // Negative clamp
      expect(calculateMapPercent(-10, 85)).toBe(0);
      // Null / undefined fallback
      expect(calculateMapPercent(null, 85)).toBe(0);
      expect(calculateMapPercent(undefined, 85)).toBe(0);

      // Pixel coordinate (> maxDimensionTiles) normalization (1360px -> 85 tiles -> 100%)
      expect(calculateMapPercent(1360, 85)).toBe(100);
      expect(calculateMapPercent(680, 85)).toBe(50);
    });

    test('renders current player, other players, and coin dots accurately on the radar', async () => {
      const mockPlayer = { id: 'p1', name: 'Tester', x: 20, y: 12 };
      const mockCoins = {
        c1: { x: 10, y: 5 },
        c2: { x: 40, y: 24 }
      };
      const mockOtherPlayers = {
        p2: { id: 'p2', name: 'Rival', x: 60, y: 30 }
      };

      const { container, unmount } = await mount(
        <MiniMap
          player={mockPlayer}
          players={{ p1: mockPlayer, ...mockOtherPlayers }}
          coins={mockCoins}
          mapWidthTiles={80}
          mapHeightTiles={40}
        />
      );

      expect(container.querySelector('[data-testid="gamukis-minimap"]')).not.toBeNull();
      expect(container.textContent).toContain('RADAR');
      expect(container.textContent).toContain('🪙 2');

      // Check current player dot
      const playerDot = container.querySelector('[data-testid="minimap-player"]');
      expect(playerDot).not.toBeNull();
      // x: 20 / 80 = 25%, y: 12 / 40 = 30%
      expect(playerDot.style.left).toBe('25%');
      expect(playerDot.style.top).toBe('30%');

      // Check coin dots
      const coinDots = container.querySelectorAll('[data-testid="minimap-coin"]');
      expect(coinDots.length).toBe(2);
      expect(coinDots[0].style.left).toBe('12.5%'); // 10 / 80
      expect(coinDots[0].style.top).toBe('12.5%');  // 5 / 40

      // Check other player dot
      const otherDot = container.querySelector('[data-testid="minimap-other-player"]');
      expect(otherDot).not.toBeNull();
      expect(otherDot.style.left).toBe('75%'); // 60 / 80
      expect(otherDot.style.top).toBe('75%');  // 30 / 40

      await unmount();
    });

    test('toggles collapse and expand when header is clicked', async () => {
      const mockPlayer = { id: 'p1', x: 10, y: 10 };
      const { container, unmount } = await mount(<MiniMap player={mockPlayer} coins={{}} />);

      expect(container.querySelector('[data-testid="minimap-player"]')).not.toBeNull();

      // Click header to collapse
      const header = container.querySelector('.gamukis-minimap-header');
      await act(async () => {
        header.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(container.querySelector('[data-testid="minimap-player"]')).toBeNull();

      // Click header to expand back
      await act(async () => {
        header.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(container.querySelector('[data-testid="minimap-player"]')).not.toBeNull();

      await unmount();
    });

    test('triggers onToggleMute from HUD toolbar', async () => {
      const onToggleMute = jest.fn();
      const { container, unmount } = await mount(
        <MiniMap
          player={{ id: 'p1', x: 10, y: 10 }}
          isMuted={false}
          onToggleMute={onToggleMute}
          showToolbar={true}
        />
      );

      const muteBtn = container.querySelector('.gamukis-hud-btn');
      expect(muteBtn).not.toBeNull();
      await act(async () => {
        muteBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(onToggleMute).toHaveBeenCalledTimes(1);

      await unmount();
    });
  });

  /* =========================================================================
   * 3. Toast Notification System Tests
   * ========================================================================= */
  describe('Toast Notification System (toastNotification.js)', () => {
    test('renders nothing initially when queue is empty', async () => {
      const { container, unmount } = await mount(<ToastNotification />);
      expect(container.querySelector('[data-testid="toast-container"]')).toBeNull();
      await unmount();
    });

    test('receives and renders toast message with correct variant and icon', async () => {
      const { container, unmount } = await mount(<ToastNotification />);

      await act(async () => {
        emitToast('Jawaban Benar +10 Poin!', 'success', 3000);
      });

      expect(container.querySelector('[data-testid="toast-container"]')).not.toBeNull();
      expect(container.textContent).toContain('Jawaban Benar +10 Poin!');
      expect(container.textContent).toContain('✨');

      // Emit warning toast
      await act(async () => {
        showToast('Waktu tersisa 30 detik!', 'warning', 3000);
      });

      expect(container.textContent).toContain('Waktu tersisa 30 detik!');
      expect(container.textContent).toContain('⚠️');

      await unmount();
    });

    test('dismisses toast on close button click', async () => {
      const { container, unmount } = await mount(<ToastNotification />);

      await act(async () => {
        emitToast('Pesan Sementara', 'info', 5000);
      });

      expect(container.textContent).toContain('Pesan Sementara');

      const closeBtn = container.querySelector('.gamukis-toast-close');
      expect(closeBtn).not.toBeNull();
      await act(async () => {
        closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(container.textContent).not.toContain('Pesan Sementara');
      await unmount();
    });

    test('auto-dismisses toast after duration expires', async () => {
      const { container, unmount } = await mount(<ToastNotification />);

      await act(async () => {
        emitToast('Notifikasi Otomatis Hilang', 'info', 2000);
      });

      expect(container.textContent).toContain('Notifikasi Otomatis Hilang');

      await act(async () => {
        jest.advanceTimersByTime(2100);
      });

      expect(container.textContent).not.toContain('Notifikasi Otomatis Hilang');
      await unmount();
    });
  });
});

