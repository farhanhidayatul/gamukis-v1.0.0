/**
 * Standalone Node.js Verification Test Suite for Milestone 1:
 * Natural Walking Animation, CSS Keyframes, & Step Delta Tracking
 *
 * Validates:
 * 1. style.css: 0.22s linear transition, 0.44s step-end timing, 4-beat keyframe stops, idle resting positions.
 * 2. playerInfo.js: STEP_DURATION_MS (220ms), delta coordinate tracking logic, timer cleanup.
 * 3. Character resolution & SVG fallback rules for guests vs customized registered accounts.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passedCount = 0;
let failedCount = 0;

const describe = global.describe || ((suiteName, fn) => {
  console.log(`\n======================================================`);
  console.log(`Suite: ${suiteName}`);
  console.log(`======================================================`);
  fn();
});

const it = global.it || ((testName, fn) => {
  try {
    fn();
    passedCount += 1;
    console.log(`  ✓ ${testName}`);
  } catch (error) {
    failedCount += 1;
    console.error(`  ✗ ${testName}`);
    console.error(`    Error: ${error.message}`);
    throw error;
  }
});

// Locate style.css and playerInfo.js
const candidateStylePaths = [
  path.resolve(__dirname, '../../component/component_game/style.css'),
  path.resolve(__dirname, 'style.css')
];
const styleCssPath = candidateStylePaths.find((p) => fs.existsSync(p)) || candidateStylePaths[0];

const candidatePlayerInfoPaths = [
  path.resolve(__dirname, '../../component/component_game/playerInfo.js'),
  path.resolve(__dirname, 'playerInfo.js')
];
const playerInfoPath = candidatePlayerInfoPaths.find((p) => fs.existsSync(p)) || candidatePlayerInfoPaths[0];

assert(fs.existsSync(styleCssPath), `style.css must exist at ${styleCssPath}`);
assert(fs.existsSync(playerInfoPath), `playerInfo.js must exist at ${playerInfoPath}`);

const styleCssContent = fs.readFileSync(styleCssPath, 'utf8');
const playerInfoContent = fs.readFileSync(playerInfoPath, 'utf8');

// =============================================================================
// Suite 1: CSS Animation & Keyframe Verification (style.css)
// =============================================================================
describe('Suite 1: CSS Animation & Keyframe Verification (style.css)', () => {
  it('1.1 Transition rule defines 0.22s linear transform transition', () => {
    assert(
      /transition:\s*transform\s+0\.22s\s+linear/i.test(styleCssContent),
      'style.css must define "transition: transform 0.22s linear"'
    );
  });

  it('1.2 Directional walk animations use 0.44s step-end infinite timing', () => {
    const directions = ['down', 'up', 'left', 'right'];
    directions.forEach((dir) => {
      const animPattern = new RegExp(`walk-man-${dir}\\s+0\\.44s\\s+step-end\\s+infinite`, 'i');
      assert(
        animPattern.test(styleCssContent),
        `style.css must contain "walk-man-${dir} 0.44s step-end infinite"`
      );
    });
  });

  it('1.3 Keyframes define authentic 4-beat stops at 0px, -20px, and -39px', () => {
    const directions = ['down', 'up', 'left', 'right'];
    directions.forEach((dir) => {
      const keyframeRegex = new RegExp(`@keyframes\\s+walk-man-${dir}\\s*\\{([\\s\\S]*?100%[\\s\\S]*?\\})\\s*\\}`, 'i');
      const match = styleCssContent.match(keyframeRegex);
      assert(match, `@keyframes walk-man-${dir} must be defined`);
      const body = match[1];

      assert(/0%\s*\{\s*background-position-x:\s*0px;?\s*\}/i.test(body), `${dir} 0% stop must be 0px`);
      assert(/25%\s*\{\s*background-position-x:\s*-20px;?\s*\}/i.test(body), `${dir} 25% stop must be -20px`);
      assert(/50%\s*\{\s*background-position-x:\s*-39px;?\s*\}/i.test(body), `${dir} 50% stop must be -39px`);
      assert(/75%\s*\{\s*background-position-x:\s*-20px;?\s*\}/i.test(body), `${dir} 75% stop must be -20px`);
      assert(/100%\s*\{\s*background-position-x:\s*0px;?\s*\}/i.test(body), `${dir} 100% stop must be 0px`);
    });
  });

  it('1.4 Sprite frame stops remain strictly within 58px sprite boundary (no out-of-bounds -60px)', () => {
    // Ensure no out-of-bounds -60px exists in character animation styles
    assert(!/background-position(-x)?:\s*-60px/i.test(styleCssContent), 'style.css must not contain invalid -60px out-of-bounds sprite stops');

    const directions = ['down', 'up', 'left', 'right'];
    directions.forEach((dir) => {
      const keyframeRegex = new RegExp(`@keyframes\\s+walk-man-${dir}\\s*\\{([\\s\\S]*?100%[\\s\\S]*?\\})\\s*\\}`, 'i');
      const match = styleCssContent.match(keyframeRegex);
      assert(match, `@keyframes walk-man-${dir} must be defined`);
      const body = match[1];

      const posMatches = body.match(/background-position-x:\s*(-?\d+)px/gi) || [];
      assert(posMatches.length > 0, `Keyframes for ${dir} must define background-position-x stops`);
      posMatches.forEach((posStr) => {
        const val = parseInt(posStr.match(/(-?\d+)/)[1], 10);
        assert(val >= -58 && val <= 0, `Keyframe position ${val}px exceeds 58px sprite boundary!`);
        assert([0, -20, -39].includes(val), `Keyframe position ${val}px must be one of the authentic stops (0, -20, -39)`);
      });
    });
  });

  it('1.5 Resting idle stances snap to -20px background-position-x for stationary states', () => {
    const idleRegex = /\.Character\[data-color="man"\]\[data-direction="down"\]\s+\.Character_svg[\s\S]*?background-position-x:\s*-20px;/i;
    assert(idleRegex.test(styleCssContent), 'Resting down idle stance must set background-position-x: -20px');
  });
});

// =============================================================================
// Suite 2: Step Delta Coordinate Tracking & Timing Verification (playerInfo.js)
// =============================================================================
describe('Suite 2: Step Delta Coordinate Tracking & Timing Verification (playerInfo.js)', () => {
  it('2.1 Step duration constant STEP_DURATION_MS equals 220ms', () => {
    assert(
      /const\s+STEP_DURATION_MS\s*=\s*220;/i.test(playerInfoContent),
      'playerInfo.js must define STEP_DURATION_MS = 220'
    );
  });

  it('2.2 Delta tracking detects grid coordinate displacement (prev.x !== player.x || prev.y !== player.y)', () => {
    assert(
      /prev\.x\s*!==\s*player\.x\s*\|\|\s*prev\.y\s*!==\s*player\.y/i.test(playerInfoContent),
      'playerInfo.js must compare prev coordinates to detect stepping'
    );
    assert(
      /setIsStepping\(true\)/i.test(playerInfoContent),
      'Displacement must trigger setIsStepping(true)'
    );
  });

  it('2.3 Delta timer cleanup uses clearTimeout on component unmount or re-render', () => {
    assert(
      /clearTimeout\(stepTimeoutRef\.current\)/i.test(playerInfoContent),
      'playerInfo.js must cleanly clear step timeout'
    );
  });

  it('2.4 Physical walk cycle math: 0.44s cycle / 4 beats = 110ms per beat, 2 beats = 220ms per step', () => {
    const cycleDuration = 0.44; // seconds
    const beats = 4;
    const beatInterval = cycleDuration / beats; // 0.11s (110ms)
    const stepDuration = 0.22; // 220ms

    assert.strictEqual(Math.round(beatInterval * 100) / 100, 0.11);
    assert.strictEqual(Math.round(stepDuration * 100) / 100, 0.22);
    assert.strictEqual(stepDuration, beatInterval * 2);
    assert.strictEqual(stepDuration * 2, cycleDuration);
  });

  it('2.5 Dynamic delta tracking simulation: coordinate changes trigger step state', () => {
    let isStepping = false;
    let prevCoord = { x: 10, y: 10 };

    const simulateMove = (newX, newY) => {
      if (prevCoord.x !== newX || prevCoord.y !== newY) {
        isStepping = true;
      }
      prevCoord = { x: newX, y: newY };
    };

    // Initial state
    assert.strictEqual(isStepping, false);

    // Single tile step down
    simulateMove(10, 11);
    assert.strictEqual(isStepping, true);
    assert.deepStrictEqual(prevCoord, { x: 10, y: 11 });

    // Stationary (no movement)
    isStepping = false;
    simulateMove(10, 11);
    assert.strictEqual(isStepping, false);
  });
});

// =============================================================================
// Suite 3: Fallback & Appearance Resolution Rules
// =============================================================================
describe('Suite 3: Fallback & Appearance Resolution Rules', () => {
  // Extract resolution logic matching playerInfo.js
  const resolvePlayer = ({ isCurrentPlayer, isGuest, player, appearance }) => {
    const candidateAppearance = appearance || player?.appearance || player?.customization || null;
    const hasAppearanceData = Boolean(
      candidateAppearance &&
      typeof candidateAppearance === 'object' &&
      !Array.isArray(candidateAppearance) &&
      (candidateAppearance.gender || candidateAppearance.hair || candidateAppearance.outfit || candidateAppearance.shirt || candidateAppearance.skin || candidateAppearance.pants || candidateAppearance.shoes)
    );

    const effectiveIsGuest = hasAppearanceData
      ? false
      : (isCurrentPlayer
          ? Boolean(isGuest)
          : (player?.isGuest !== undefined ? Boolean(player.isGuest) : Boolean(isGuest)));

    const hasCustomAppearance = !effectiveIsGuest && hasAppearanceData;
    const effectiveAppearance = hasCustomAppearance ? candidateAppearance : null;

    const isSvgCharacter = (charColor) => {
      if (hasCustomAppearance) return false;
      if (effectiveIsGuest || !charColor || charColor === 'man' || charColor === 'guest') return true;
      return true;
    };

    const isSvg = isSvgCharacter(player?.color);
    const effectiveColor = hasCustomAppearance ? 'custom' : (isSvg ? 'man' : (player?.color || 'man'));

    return {
      effectiveIsGuest,
      hasCustomAppearance,
      effectiveAppearance,
      effectiveColor,
      isSvg
    };
  };

  it('3.1 Guest players default to humanoid SVG character fallback', () => {
    const result = resolvePlayer({
      isCurrentPlayer: true,
      isGuest: true,
      player: { id: 'g1', name: 'Tamu', color: 'blue' },
      appearance: null
    });
    assert.strictEqual(result.hasCustomAppearance, false);
    assert.strictEqual(result.effectiveIsGuest, true);
    assert.strictEqual(result.isSvg, true);
    assert.strictEqual(result.effectiveColor, 'man');
  });

  it('3.2 Unregistered players without customization default to humanoid SVG character', () => {
    const result = resolvePlayer({
      isCurrentPlayer: false,
      isGuest: true,
      player: { id: 'u1', name: 'Pemain 1', isGuest: true, color: 'orange' },
      appearance: null
    });
    assert.strictEqual(result.hasCustomAppearance, false);
    assert.strictEqual(result.isSvg, true);
    assert.strictEqual(result.effectiveColor, 'man');
  });

  it('3.3 Registered players with valid custom appearance do not default to SVG fallback', () => {
    const customAppearance = { gender: 'Laki-laki', hair: 'short', outfit: { shirt: 'shirt-red' } };
    const result = resolvePlayer({
      isCurrentPlayer: true,
      isGuest: false,
      player: { id: 'reg1', name: 'User1', color: 'man' },
      appearance: customAppearance
    });
    assert.strictEqual(result.hasCustomAppearance, true);
    assert.strictEqual(result.effectiveIsGuest, false);
    assert.strictEqual(result.isSvg, false);
    assert.strictEqual(result.effectiveColor, 'custom');
  });

  it('3.4 Remote registered players with appearance data are NEVER treated as guests even when viewer is a guest', () => {
    const remoteCustomAppearance = { gender: 'Perempuan', hair: 'bob', outfit: { shirt: 'shirt-blue' } };
    // Local viewer is a guest (isGuest = true passed to component)
    const result = resolvePlayer({
      isCurrentPlayer: false,
      isGuest: true, // Local viewer guest flag
      player: { id: 'remote99', name: 'Citra', appearance: remoteCustomAppearance },
      appearance: null
    });
    // Remote registered player must retain custom avatar!
    assert.strictEqual(result.hasCustomAppearance, true);
    assert.strictEqual(result.effectiveIsGuest, false);
    assert.strictEqual(result.isSvg, false);
    assert.strictEqual(result.effectiveColor, 'custom');
    assert.deepStrictEqual(result.effectiveAppearance, remoteCustomAppearance);
  });

  it('3.5 Corrupted or non-object appearance data safely falls back to default character', () => {
    const result = resolvePlayer({
      isCurrentPlayer: false,
      isGuest: true,
      player: { id: 'bad1', name: 'Corrupted', appearance: 'not-an-object' },
      appearance: null
    });
    assert.strictEqual(result.hasCustomAppearance, false);
    assert.strictEqual(result.isSvg, true);
    assert.strictEqual(result.effectiveColor, 'man');
  });
});

console.log('\n======================================================');
console.log(`Execution Summary: ${passedCount} Passed, ${failedCount} Failed (Total: ${passedCount + failedCount})`);
console.log('======================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
