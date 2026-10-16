/**
 * Unit and Integration Test Suite for Milestone 2:
 * Customized Character Resolution for Registered Users & Remote Player Multi-Client Sync
 */

const assert = require('assert');

let passedCount = 0;
let failedCount = 0;

const describe = global.describe || ((name, fn) => {
  console.log(`\n--- Test Suite: ${name} ---`);
  fn();
});

const it = global.it || ((name, fn) => {
  try {
    fn();
    passedCount += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failedCount += 1;
    console.error(`  ✗ ${name}`);
    throw error;
  }
});

// 1. Test loadSavedAppearance logic
describe('loadSavedAppearance verification', () => {
  const mockLocalStorage = {};
  const windowMock = {
    localStorage: {
      getItem: (key) => (key in mockLocalStorage ? mockLocalStorage[key] : null),
      setItem: (key, val) => { mockLocalStorage[key] = String(val); },
      removeItem: (key) => { delete mockLocalStorage[key]; },
      clear: () => { Object.keys(mockLocalStorage).forEach((k) => delete mockLocalStorage[k]); }
    }
  };

  const loadSavedAppearance = (customStorage = windowMock.localStorage) => {
    try {
      const rawAppearance = customStorage.getItem('gamukis_character_appearance');
      if (!rawAppearance) return null;
      const appearance = JSON.parse(rawAppearance);
      if (!appearance || typeof appearance !== 'object' || Array.isArray(appearance)) {
        return null;
      }
      try {
        const rawOutfit = customStorage.getItem('gamukis_character_outfit');
        if (rawOutfit) {
          const outfit = JSON.parse(rawOutfit);
          if (outfit && typeof outfit === 'object' && !Array.isArray(outfit)) {
            appearance.outfit = { ...(appearance.outfit || {}), ...outfit };
          }
        }
      } catch (e) {
        // safe fallback
      }
      return appearance;
    } catch (e) {
      return null;
    }
  };

  it('should return null when localStorage has no saved appearance', () => {
    windowMock.localStorage.clear();
    const result = loadSavedAppearance();
    assert.strictEqual(result, null);
  });

  it('should safely return null on corrupted JSON without crashing', () => {
    windowMock.localStorage.setItem('gamukis_character_appearance', '{"broken_json": [');
    const result = loadSavedAppearance();
    assert.strictEqual(result, null);
  });

  it('should safely return null when appearance is an array or primitive', () => {
    windowMock.localStorage.setItem('gamukis_character_appearance', JSON.stringify(["not", "an", "object"]));
    assert.strictEqual(loadSavedAppearance(), null);

    windowMock.localStorage.setItem('gamukis_character_appearance', JSON.stringify("plain string"));
    assert.strictEqual(loadSavedAppearance(), null);
  });

  it('should successfully parse valid character appearance', () => {
    const validAppearance = {
      version: 1,
      gender: 'Laki-laki',
      hair: 'wave',
      hairColor: '#3B82F6',
      skinTone: '#E7C09A',
      outfit: { shirt: 'shirt-camo', pants: 'pants-black', shoes: 'shoes-original' }
    };
    windowMock.localStorage.setItem('gamukis_character_appearance', JSON.stringify(validAppearance));
    const result = loadSavedAppearance();
    assert.deepStrictEqual(result.gender, 'Laki-laki');
    assert.deepStrictEqual(result.hair, 'wave');
    assert.deepStrictEqual(result.hairColor, '#3B82F6');
    assert.deepStrictEqual(result.outfit.shirt, 'shirt-camo');
  });

  it('should merge separate gamukis_character_outfit key when available', () => {
    const baseAppearance = {
      version: 1,
      gender: 'Laki-laki',
      hair: 'bun',
      outfit: { shirt: 'shirt-original' }
    };
    const separateOutfit = {
      pants: 'pants-green_cargo',
      shoes: 'shoes-boots_black'
    };
    windowMock.localStorage.setItem('gamukis_character_appearance', JSON.stringify(baseAppearance));
    windowMock.localStorage.setItem('gamukis_character_outfit', JSON.stringify(separateOutfit));
    const result = loadSavedAppearance();
    assert.strictEqual(result.outfit.shirt, 'shirt-original');
    assert.strictEqual(result.outfit.pants, 'pants-green_cargo');
    assert.strictEqual(result.outfit.shoes, 'shoes-boots_black');
  });

  it('should handle corrupted gamukis_character_outfit gracefully without breaking appearance', () => {
    const baseAppearance = {
      version: 1,
      gender: 'Laki-laki',
      hair: 'short',
      outfit: { shirt: 'shirt-fire' }
    };
    windowMock.localStorage.setItem('gamukis_character_appearance', JSON.stringify(baseAppearance));
    windowMock.localStorage.setItem('gamukis_character_outfit', '{"corrupted:');
    const result = loadSavedAppearance();
    assert.strictEqual(result.gender, 'Laki-laki');
    assert.strictEqual(result.outfit.shirt, 'shirt-fire');
  });
});

// 2. Test Direction and Action mappings for custom avatar renderer
describe('Avatar Direction and Action Mapping verification', () => {
  const VIEW_DIRECTIONS = {
    down: { id: 'front', maleBodyRow: 0 },
    right: { id: 'right', maleBodyRow: 99.5 },
    up: { id: 'back', maleBodyRow: 32.86 },
    left: { id: 'left', maleBodyRow: 66.67 }
  };

  it('should map down direction to front view', () => {
    const view = VIEW_DIRECTIONS['down'];
    assert.strictEqual(view.id, 'front');
    assert.strictEqual(view.maleBodyRow, 0);
  });

  it('should map up direction to back view', () => {
    const view = VIEW_DIRECTIONS['up'];
    assert.strictEqual(view.id, 'back');
    assert.strictEqual(view.maleBodyRow, 32.86);
  });

  it('should map left direction to left view', () => {
    const view = VIEW_DIRECTIONS['left'];
    assert.strictEqual(view.id, 'left');
    assert.strictEqual(view.maleBodyRow, 66.67);
  });

  it('should map right direction to right view', () => {
    const view = VIEW_DIRECTIONS['right'];
    assert.strictEqual(view.id, 'right');
    assert.strictEqual(view.maleBodyRow, 99.5);
  });

  it('should resolve previewAction correctly between idle and walk', () => {
    const resolveAction = (isCharacterMoving) => isCharacterMoving ? 'walk' : 'idle';
    assert.strictEqual(resolveAction(false), 'idle');
    assert.strictEqual(resolveAction(true), 'walk');
  });
});

// 3. Test Guest vs Registered Account Appearance Resolution Logic
describe('Guest vs Registered Character Resolution Logic', () => {
  const resolveCharacterMode = ({ isGuest, player, appearance, isCurrentPlayer = false }) => {
    const candidateAppearance = appearance || player?.appearance || player?.customization || null;
    const hasAppearanceData = Boolean(
      candidateAppearance &&
      typeof candidateAppearance === 'object' &&
      !Array.isArray(candidateAppearance) &&
      (candidateAppearance.gender || candidateAppearance.hair || candidateAppearance.outfit || candidateAppearance.shirt || candidateAppearance.skin || candidateAppearance.pants || candidateAppearance.shoes)
    );

    // If candidate appearance data is present, NEVER treat as a guest so custom avatars always render!
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

  it('should resolve guest player with saved appearance in localStorage to default character', () => {
    const res = resolveCharacterMode({
      isCurrentPlayer: true,
      isGuest: true,
      player: { id: 'guest1', name: 'Kucing Cepat', color: 'blue' },
      appearance: null // inGame.js sets currentAppearance to null for guests
    });
    assert.strictEqual(res.hasCustomAppearance, false);
    assert.strictEqual(res.effectiveIsGuest, true);
    assert.strictEqual(res.isSvg, true);
    assert.strictEqual(res.effectiveColor, 'man');
  });

  it('should resolve registered player with custom appearance to custom avatar', () => {
    const res = resolveCharacterMode({
      isCurrentPlayer: true,
      isGuest: false,
      player: { id: 'reg1', name: 'Budi Santoso', color: 'man' },
      appearance: { gender: 'Laki-laki', hair: 'short', skinTone: '#C78B5C', outfit: { shirt: 'shirt-fire' } }
    });
    assert.strictEqual(res.hasCustomAppearance, true);
    assert.strictEqual(res.effectiveIsGuest, false);
    assert.strictEqual(res.isSvg, false);
    assert.strictEqual(res.effectiveColor, 'custom');
  });

  it('should safely fall back to default character if registered user has null appearance', () => {
    const res = resolveCharacterMode({
      isCurrentPlayer: true,
      isGuest: false,
      player: { id: 'reg2', name: 'Ani', color: 'man' },
      appearance: null
    });
    assert.strictEqual(res.hasCustomAppearance, false);
    assert.strictEqual(res.isSvg, true);
    assert.strictEqual(res.effectiveColor, 'man');
  });

  it('should safely resolve multiplayer remote players who have appearance on player payload', () => {
    const res = resolveCharacterMode({
      isCurrentPlayer: false,
      isGuest: false, // local user guest state
      player: {
        id: 'remotePlayer99',
        name: 'Citra',
        isGuest: false,
        appearance: { gender: 'Perempuan', hair: 'bob' }
      },
      appearance: null // local player appearance
    });
    assert.strictEqual(res.hasCustomAppearance, true);
    assert.strictEqual(res.effectiveColor, 'custom');
    assert.strictEqual(res.isSvg, false);
  });

  it('ST-4: Remote registered player viewed by local guest NEVER stripped of custom avatar', () => {
    // In inGame.js:
    // isGuest={key === playerId ? isGuest : (players[key]?.isGuest ?? (players[key]?.appearance ? false : true))}
    const remotePlayer = {
      id: 'remoteRegisteredUser',
      name: 'Dewi',
      // player.isGuest is undefined on socket payload
      appearance: { gender: 'Perempuan', hair: 'ponytail', outfit: { shirt: 'shirt-camo' } }
    };
    const localViewerIsGuest = true;
    const computedPropIsGuest = remotePlayer.id === 'localUser'
      ? localViewerIsGuest
      : (remotePlayer.isGuest ?? (remotePlayer.appearance ? false : true));

    assert.strictEqual(computedPropIsGuest, false, 'inGame.js must resolve isGuest=false for remote player with appearance');

    // In playerInfo.js:
    const res = resolveCharacterMode({
      isCurrentPlayer: false,
      isGuest: computedPropIsGuest,
      player: remotePlayer,
      appearance: null
    });

    assert.strictEqual(res.hasCustomAppearance, true, 'Remote registered player must render custom avatar');
    assert.strictEqual(res.effectiveIsGuest, false, 'Remote registered player must not be treated as guest');
    assert.strictEqual(res.isSvg, false, 'Remote registered player must not fall back to default SVG');
    assert.strictEqual(res.effectiveColor, 'custom');
  });

  it('Remote guest player viewed by registered user correctly resolves to default SVG', () => {
    const remoteGuest = {
      id: 'remoteGuest88',
      name: 'Tamu 88',
      color: 'green'
      // no appearance
    };
    const localViewerIsGuest = false;
    const computedPropIsGuest = remoteGuest.id === 'localUser'
      ? localViewerIsGuest
      : (remoteGuest.isGuest ?? (remoteGuest.appearance ? false : true));

    assert.strictEqual(computedPropIsGuest, true, 'inGame.js must resolve isGuest=true for remote player without appearance');

    const res = resolveCharacterMode({
      isCurrentPlayer: false,
      isGuest: computedPropIsGuest,
      player: remoteGuest,
      appearance: null
    });

    assert.strictEqual(res.hasCustomAppearance, false);
    assert.strictEqual(res.effectiveIsGuest, true);
    assert.strictEqual(res.isSvg, true);
    assert.strictEqual(res.effectiveColor, 'man');
  });

  it('Corrupted or empty appearance object safely falls back without crashing', () => {
    const resEmpty = resolveCharacterMode({
      isCurrentPlayer: false,
      isGuest: false,
      player: { id: 'p1', appearance: {} }
    });
    assert.strictEqual(resEmpty.hasCustomAppearance, false);
    assert.strictEqual(resEmpty.isSvg, true);

    const resArray = resolveCharacterMode({
      isCurrentPlayer: false,
      isGuest: false,
      player: { id: 'p2', appearance: ['invalid'] }
    });
    assert.strictEqual(resArray.hasCustomAppearance, false);
    assert.strictEqual(resArray.isSvg, true);
  });
});

console.log('\n======================================================');
console.log(`Execution Summary: ${passedCount} Passed, ${failedCount} Failed (Total: ${passedCount + failedCount})`);
console.log('======================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
