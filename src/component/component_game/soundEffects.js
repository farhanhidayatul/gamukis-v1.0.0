/**
 * soundEffects.js
 * Lightweight Web Audio API Synthesizer for Gamukis.
 * Generates dynamic retro & modern SFX without external audio asset dependencies.
 */

const STORAGE_KEY = 'gamukis_sound_muted';

let audioCtx = null;

/**
 * Safely initializes or retrieves the shared AudioContext.
 * Handles browser autoplay policy and environments without Web Audio API (e.g., Jest / SSR).
 */
export const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    try {
      audioCtx = new AudioContextClass();
    } catch (e) {
      return null;
    }
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
};

/**
 * Checks whether audio is muted in localStorage.
 * @returns {boolean}
 */
export const isSoundMuted = () => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch (e) {
    return false;
  }
};

/**
 * Sets muted state and persists to localStorage.
 * Dispatches 'gamukis-sound-muted-change' event for UI subscribers.
 * @param {boolean} muted
 */
export const setSoundMuted = (muted) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('gamukis-sound-muted-change', { detail: { muted: Boolean(muted) } }));
  } catch (e) {}
};

/**
 * Toggles muted state and returns new value.
 * @returns {boolean}
 */
export const toggleSoundMuted = () => {
  const next = !isSoundMuted();
  setSoundMuted(next);
  return next;
};

/**
 * Internal helper to safely schedule an oscillator tone with gain envelope.
 */
const playTone = ({
  freq = 440,
  type = 'sine',
  startTime = 0,
  duration = 0.15,
  peakGain = 0.2,
  freqEnd = null,
  gainDecay = 'exponential'
}) => {
  const ctx = getAudioContext();
  if (!ctx || isSoundMuted()) return;

  try {
    const t0 = ctx.currentTime + startTime;
    const tEnd = t0 + duration;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;

    if (freqEnd && freqEnd !== freq) {
      osc.frequency.setValueAtTime(freq, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(10, freqEnd), tEnd);
    } else {
      osc.frequency.setValueAtTime(freq, t0);
    }

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(peakGain, t0 + Math.min(0.02, duration * 0.2));

    if (gainDecay === 'exponential') {
      gain.gain.exponentialRampToValueAtTime(0.0001, tEnd);
    } else {
      gain.gain.linearRampToValueAtTime(0.0001, tEnd);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(tEnd);
  } catch (e) {
    // Graceful fallback for restricted AudioContext
  }
};

/**
 * SFX: High-pitched cheerful chime/bell when collecting a coin.
 * Two quick ascending bell tones: B5 (987.77 Hz) -> E6 (1318.51 Hz).
 */
export const playCoinCollectSound = () => {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  playTone({ freq: 987.77, type: 'sine', startTime: 0, duration: 0.1, peakGain: 0.22 });
  playTone({ freq: 1318.51, type: 'triangle', startTime: 0.07, duration: 0.22, peakGain: 0.25 });
};

/**
 * SFX: Cheerful success major chord arpeggio for correct answer.
 * C5 (523.25 Hz) -> E5 (659.25 Hz) -> G5 (783.99 Hz) -> C6 (1046.50 Hz).
 */
export const playCorrectAnswerSound = () => {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, idx) => {
    playTone({
      freq,
      type: idx === 3 ? 'sine' : 'triangle',
      startTime: idx * 0.08,
      duration: idx === 3 ? 0.35 : 0.15,
      peakGain: 0.2
    });
  });
};

/**
 * SFX: Low buzzing tone with short decay for wrong answer.
 * Sawtooth wave dropping from 160 Hz to 110 Hz.
 */
export const playWrongAnswerSound = () => {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  playTone({
    freq: 160,
    freqEnd: 110,
    type: 'sawtooth',
    startTime: 0,
    duration: 0.25,
    peakGain: 0.28,
    gainDecay: 'linear'
  });
  playTone({
    freq: 120,
    freqEnd: 85,
    type: 'square',
    startTime: 0.04,
    duration: 0.2,
    peakGain: 0.15,
    gainDecay: 'linear'
  });
};

/**
 * SFX: Warning alert / clock tick when game time < 30 seconds.
 * Crisp digital alert pulse.
 */
export const playTimerWarningSound = () => {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  playTone({ freq: 880, type: 'sine', startTime: 0, duration: 0.06, peakGain: 0.2 });
  playTone({ freq: 1174.66, type: 'sine', startTime: 0.07, duration: 0.08, peakGain: 0.18 });
};

/**
 * SFX: Futuristic / magical fast frequency sweep on skill cast.
 * Dynamic pitch sweep upward from 260 Hz to 1750 Hz with shimmering release.
 */
export const playSkillCastSound = () => {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Sweep 1: rising magical sine
  playTone({
    freq: 260,
    freqEnd: 1650,
    type: 'sine',
    startTime: 0,
    duration: 0.32,
    peakGain: 0.24
  });
  // Sweep 2: shimmering harmonic triangle with slight delay
  playTone({
    freq: 520,
    freqEnd: 2093,
    type: 'triangle',
    startTime: 0.06,
    duration: 0.35,
    peakGain: 0.18
  });
};

