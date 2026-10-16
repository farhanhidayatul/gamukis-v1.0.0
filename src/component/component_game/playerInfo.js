import React, { useState, useEffect, useRef } from 'react';
import { getKeyString, TILE_SIZE } from './utils';
import { mapData } from './tiledMapData';
import { SkillEffect } from './skill';
import './customCharacterRenderer.css';
import '../component_customization_char/characterCustomization.css';

// Female character asset
import femaleCharacterWhite from '../../images/asset_game/character/gender/female/idle/char_woman_idle_white.png';

// Hair styles 1 to 4
import hair1MaleBlack from '../../images/asset_game/character/hair/hair_1_male_black.png';
import hair1MaleBlue from '../../images/asset_game/character/hair/hair_1_male_blue.png';
import hair1MaleBrown from '../../images/asset_game/character/hair/hair_1_male_brown.png';
import hair1MaleGreen from '../../images/asset_game/character/hair/hair_1_male_green.png';
import hair1MalePink from '../../images/asset_game/character/hair/hair_1_male_pink.png';
import hair1MaleRed from '../../images/asset_game/character/hair/hair_1_male_red.png';
import hair1MaleWhite from '../../images/asset_game/character/hair/hair_1_male_white.png';

import hair2MaleBlack from '../../images/asset_game/character/hair/hair_2_male_black.png';
import hair2MaleBlue from '../../images/asset_game/character/hair/hair_2_male_blue.png';
import hair2MaleGreen from '../../images/asset_game/character/hair/hair_2_green.png';
import hair2MaleOrange from '../../images/asset_game/character/hair/hair_2_male_orange.png';
import hair2MalePurple from '../../images/asset_game/character/hair/hair_2_male_purple.png';
import hair2MaleWhite from '../../images/asset_game/character/hair/hair_2_male_silver.png';

import hair3MaleBlack from '../../images/asset_game/character/hair/hair_3_male_black.png';
import hair3MaleBlue from '../../images/asset_game/character/hair/hair_3_male_blue.png';
import hair3MaleGreen from '../../images/asset_game/character/hair/hair_3_male_green.png';
import hair3MaleOrange from '../../images/asset_game/character/hair/hair_3_male_orange.png';
import hair3MalePink from '../../images/asset_game/character/hair/hair_3_male_pink.png';
import hair3MaleWhite from '../../images/asset_game/character/hair/hair_3_male_white.png';

import hair4MaleBlack from '../../images/asset_game/character/hair/hair_4_male_black_short.png';
import hair4MaleBlue from '../../images/asset_game/character/hair/hair_4_male_blue.png';
import hair4MaleGreen from '../../images/asset_game/character/hair/hair_4_male_green.png';
import hair4MaleOrange from '../../images/asset_game/character/hair/hair_4_male_orange.png';
import hair4MalePink from '../../images/asset_game/character/hair/hair_4_male_pink.png';
import hair4MaleWhite from '../../images/asset_game/character/hair/hair_4_male_white.png';

const STEP_DURATION_MS = 220;

// Contexts for dynamically loading male skin and clothing sprite sheets
let maleIdleSkinContext;
let maleWalkSkinContext;
let maleSkillSkinContext;
let maleIdleShirtContext;
let maleWalkShirtContext;
let maleSkillShirtContext;
let maleIdlePantsContext;
let maleWalkPantsContext;
let maleSkillPantsContext;
let maleIdleShoesContext;
let maleWalkShoesContext;
let maleSkillShoesContext;

try {
  maleIdleSkinContext = require.context(
    '../../images/asset_game/character/gender/male/idle',
    false,
    /^(?:\.\/)?(?:char_male_idle_(?:body|legs|hands)|Head_(?:front|back|left|right))_color_[1-4]\.png$/i
  );
  maleWalkSkinContext = require.context(
    '../../images/asset_game/character/gender/male/walk',
    false,
    /^\.\/char_male_walk_(?:body|legs|head)_color_[1-4]\.png$/i
  );
  maleSkillSkinContext = require.context(
    '../../images/asset_game/character/gender/male/skill/fireball',
    false,
    /^(?:\.\/)?(?:char_male_use_skill_fireball_(?:body|legs)|Head_(?:front|back|left|right))_color_[1-4]\.png$/i
  );
  maleIdleShirtContext = require.context(
    '../../images/asset_game/character/gender/male/idle/shirt',
    true,
    /idle_shirt_[a-z0-9_]+_sheet\.png$/i
  );
  maleWalkShirtContext = require.context(
    '../../images/asset_game/character/gender/male/walk/shirt',
    true,
    /walk_shirt_[a-z0-9_]+_sheet\.png$/i
  );
  maleSkillShirtContext = require.context(
    '../../images/asset_game/character/gender/male/skill/fireball/shirt',
    true,
    /fireball_shirt_[a-z0-9_]+_sheet\.png$/i
  );
  maleIdlePantsContext = require.context(
    '../../images/asset_game/character/gender/male/idle/pants',
    true,
    /idle_pants_[a-z0-9_]+_preview\.png$/i
  );
  maleWalkPantsContext = require.context(
    '../../images/asset_game/character/gender/male/walk/pants',
    true,
    /walk_pants_[a-z0-9_]+_sheet\.png$/i
  );
  maleSkillPantsContext = require.context(
    '../../images/asset_game/character/gender/male/skill/fireball/pants',
    true,
    /fireball_pants_[a-z0-9_]+_sheet\.png$/i
  );
  maleIdleShoesContext = require.context(
    '../../images/asset_game/character/gender/male/idle/shoes',
    true,
    /idle_shoes_[a-z0-9_]+_preview\.png$/i
  );
  maleWalkShoesContext = require.context(
    '../../images/asset_game/character/gender/male/walk/shoes',
    true,
    /walk_shoes_[a-z0-9_]+_sheet\.png$/i
  );
  maleSkillShoesContext = require.context(
    '../../images/asset_game/character/gender/male/skill/fireball/shoes',
    true,
    /fireball_shoes_[a-z0-9_]+_sheet\.png$/i
  );
} catch (e) {
  // Environments without Webpack require.context safely degrade
}

const maleIdleSkinSprites = maleIdleSkinContext ? Object.fromEntries(maleIdleSkinContext.keys().flatMap((path) => {
  const file = path.split('/').pop();
  const match = file.match(/^(?:char_male_idle_(body|legs|hands)|Head_(front|back|left|right))_color_([1-4])\.png$/i);
  const part = match ? (match[2] ? `Head_${match[2]}` : match[1]) : null;
  return match ? [[`${part}-${match[3]}`, maleIdleSkinContext(path)]] : [];
})) : {};

const makeActionSkinSprites = (context, action, prefix) => context ? Object.fromEntries(context.keys().flatMap((path) => {
  const file = path.split('/').pop();
  const match = file.match(new RegExp(`^${prefix}_(body|legs|head)_color_([1-4])\\.png$`, 'i'));
  return match ? [[`${action}-${match[1]}-${match[2]}`, context(path)]] : [];
})) : {};

const maleWalkSkinSprites = makeActionSkinSprites(maleWalkSkinContext, 'walk', 'char_male_walk');
const maleSkillSkinSprites = maleSkillSkinContext ? Object.fromEntries(maleSkillSkinContext.keys().flatMap((path) => {
  const file = path.split('/').pop();
  const bodyPart = file.match(/^char_male_use_skill_fireball_(body|legs)_color_([1-4])\.png$/i);
  const headPart = file.match(/^Head_(front|back|left|right)_color_([1-4])\.png$/i);
  if (bodyPart) return [[`skill1-${bodyPart[1]}-${bodyPart[2]}`, maleSkillSkinContext(path)]];
  if (headPart) return [[`skill1-Head_${headPart[1]}-${headPart[2]}`, maleSkillSkinContext(path)]];
  return [];
})) : {};

const makeIdleSpriteMap = (context, type, assetSuffix = 'preview') => context ? Object.fromEntries(context.keys().flatMap((path) => {
  const match = path.match(new RegExp(`\\./([^/]+)/idle_${type}_([a-z0-9_]+)_${assetSuffix}\\.png$`, 'i'));
  return match ? [[match[1], context(path)]] : [];
})) : {};

const makeActionSpriteMap = (context, action, type) => context ? Object.fromEntries(context.keys().flatMap((path) => {
  const match = path.match(new RegExp(`\\./([^/]+)/${action}_${type}_([a-z0-9_]+)_sheet\\.png$`, 'i'));
  return match ? [[match[1], context(path)]] : [];
})) : {};

const maleIdleSprites = {
  shirt: makeIdleSpriteMap(maleIdleShirtContext, 'shirt', 'sheet'),
  pants: makeIdleSpriteMap(maleIdlePantsContext, 'pants'),
  shoes: makeIdleSpriteMap(maleIdleShoesContext, 'shoes')
};

const maleActionClothingSprites = {
  walk: {
    shirt: makeActionSpriteMap(maleWalkShirtContext, 'walk', 'shirt'),
    pants: makeActionSpriteMap(maleWalkPantsContext, 'walk', 'pants'),
    shoes: makeActionSpriteMap(maleWalkShoesContext, 'walk', 'shoes')
  },
  skill1: {
    shirt: makeActionSpriteMap(maleSkillShirtContext, 'fireball', 'shirt'),
    pants: makeActionSpriteMap(maleSkillPantsContext, 'fireball', 'pants'),
    shoes: makeActionSpriteMap(maleSkillShoesContext, 'fireball', 'shoes')
  }
};

const maleIdleHands = maleIdleSkinSprites['hands-1'];
const maleIdleBody = maleIdleSkinSprites['body-1'];
const maleIdleLegs = maleIdleSkinSprites['legs-1'];
const maleHeadBack = maleIdleSkinSprites['Head_back-1'];
const maleHeadFront = maleIdleSkinSprites['Head_front-1'];
const maleHeadLeft = maleIdleSkinSprites['Head_left-1'];
const maleHeadRight = maleIdleSkinSprites['Head_right-1'];

const maleHeadsByDirection = {
  front: maleHeadFront,
  back: maleHeadBack,
  left: maleHeadLeft,
  right: maleHeadRight
};

const hairSprites = {
  bun: { '#1D2430': hair1MaleBlack, '#3B82F6': hair1MaleBlue, '#3DAA87': hair1MaleGreen, '#F39E4E': hair1MaleBrown, '#F6C3D2': hair1MalePink, '#EF4444': hair1MaleRed, '#D9E2F2': hair1MaleWhite },
  wave: { '#1D2430': hair2MaleBlack, '#3B82F6': hair2MaleBlue, '#3DAA87': hair2MaleGreen, '#F39E4E': hair2MaleOrange, '#7B5EF3': hair2MalePurple, '#D9E2F2': hair2MaleWhite },
  short: { '#1D2430': hair3MaleBlack, '#3B82F6': hair3MaleBlue, '#3DAA87': hair3MaleGreen, '#F39E4E': hair3MaleOrange, '#F6C3D2': hair3MalePink, '#D9E2F2': hair3MaleWhite },
  bob: { '#1D2430': hair4MaleBlack, '#3B82F6': hair4MaleBlue, '#3DAA87': hair4MaleGreen, '#F39E4E': hair4MaleOrange, '#F6C3D2': hair4MalePink, '#D9E2F2': hair4MaleWhite }
};

const classicHairConfig = {
  front: { offsetX: 0, offsetY: 0 },
  right: { offsetX: 0, offsetY: 0 },
  back:  { offsetX: 0, offsetY: 0 },
  left:  { offsetX: 0, offsetY: 0 }
};

export const hairConfigs = {
  bun: classicHairConfig,
  short: classicHairConfig,
  bob: classicHairConfig,
  wave: {
    front: { offsetX: 1, offsetY: -2, width: 19, height: 17, top: 0, scaleX: 1.06, columnOffsets: [0, 2, 3, 4] },
    right: { offsetX: -0.5, offsetY: -3, width: 19, height: 17, top: 0, scaleX: 1.12, scaleY: 1.1, columnOffsets: [0, 1, 2, 4] },
    back: { offsetX: 1, offsetY: 0, width: 19, height: 17, top: 0, columnOffsets: [0, 1, 2, 3] },
    left: { offsetX: 0, offsetY: -3, width: 19, height: 17, top: 0, columnOffsets: [0, 0, 1, 2] }
  }
};

const hairFrameAnchorCorrections = {
  bun: {
    front: [0, 1, 2, 3],
    right: [0, 0.83, 1.83, 2.67],
    back: [0, 0.83, 1.83, 2.67],
    left: [0, 0.83, 1.83, 2.67]
  },
  wave: {
    front: [0, 0.83, 1.65, 3],
    right: [0, 1.65, 2.86, 3.57],
    back: [0, 0.87, 1.73, 3.01],
    left: [0, 0, 0, 0.37]
  },
  short: {
    front: [0, 1.28, 2.57, 3.86],
    right: [0, 1.21, 2.53, 3.71],
    back: [0, 1.29, 2.57, 3.82],
    left: [0, 1.24, 2.6, 3.74]
  },
  bob: {
    front: [0, 1.26, 2.52, 4.06],
    right: [0, 1.24, 2.54, 3.89],
    back: [0, 1.26, 2.52, 3.69],
    left: [0, 1.24, 2.54, 3.69]
  }
};

const hairFrameColorCorrections = {
  wave: {
    '#1D2430': { front: [0, 0.84, 1.65, 3], right: [0, 1.65, 2.86, 3.56], back: [0, 0.87, 1.73, 3.02], left: [0, -1.66, 0, 0.37] },
    '#3B82F6': { front: [0, 1.31, 1.92, 2.61], right: [0, 1.35, 2.28, 2.92], back: [0, 1.12, 1.92, 2.44], left: [0, -1.26, 0, 0.24] },
    '#3DAA87': { front: [0, 1.31, 1.93, 2.61], right: [0, 1.35, 2.28, 2.92], back: [0, 1.12, 1.92, 2.44], left: [0, -1.26, 0, 0.25] },
    '#F39E4E': { front: [0, 1.31, 1.92, 2.61], right: [0, 1.35, 2.28, 2.92], back: [0, 1.11, 1.91, 2.44], left: [0, -1.24, 0, 0.27] },
    '#7B5EF3': { front: [0, 1.31, 1.93, 2.61], right: [0, 1.35, 2.28, 2.92], back: [0, 1.11, 1.92, 2.43], left: [0, -1.25, 0, 0.26] },
    '#D1D9E6': { front: [0, 1.33, 1.95, 2.64], right: [0, 1.36, 2.32, 2.94], back: [0, 1.12, 1.94, 2.47], left: [0, -1.28, 0, 0.22] }
  },
  short: {
    '#1D2430': { front: [0, 1.28, 2.57, 3.86], right: [0, 1.21, 2.53, 3.71], back: [0, 1.29, 2.58, 3.82], left: [0, 1.24, 2.6, 3.73] },
    '#3B82F6': { front: [0, 0.71, 1.41, 2.31], right: [0, 1.05, 1.5, 2.4], back: [0, 0.71, 1.41, 2.3], left: [0, 0.98, 1.48, 2.36] },
    '#3DAA87': { front: [0, 1.05, 2.13, 3.19], right: [0, 1.06, 2.13, 3.21], back: [0, 1.05, 2.11, 3.19], left: [0, 1.01, 2.14, 3.16] },
    '#F39E4E': { front: [0, 0.82, 1.32, 2.26], right: [0, 1, 1.26, 2.08], back: [0, 0.83, 1.33, 2.22], left: [0, 0.84, 1.38, 2.14] },
    '#F6C3D2': { front: [0, 1.05, 1.78, 2.78], right: [0, 0.99, 1.78, 2.74], back: [0, 1.04, 1.79, 2.78], left: [0, 0.99, 1.83, 2.73] },
    '#D9E2F2': { front: [0, 0.98, 1.66, 2.61], right: [0, 1.11, 1.89, 2.54], back: [0, 1, 1.71, 2.57], left: [0, 1.06, 1.91, 2.56] }
  }
};

const VIEW_DIRECTIONS = {
  down: {
    id: 'front', label: 'Depan', symbol: '↑', maleBodyRow: 0, femaleBodyRow: 0,
    hairFrame: { row: 0, top: 0, width: 14, height: 12, columnOffsets: [1, 2, 3, 4] }
  },
  right: {
    id: 'right', label: 'Samping kanan', symbol: '→', maleBodyRow: 99.5, femaleBodyRow: 100,
    hairFrame: { row: 3, top: 3, width: 16, height: 14, columnOffsets: [0, 1, 2, 3] }
  },
  up: {
    id: 'back', label: 'Belakang', symbol: '↓', maleBodyRow: 32.86, femaleBodyRow: 100 / 3,
    hairFrame: { row: 1, top: 0, width: 16, height: 16, columnOffsets: [0, 1, 2, 3] }
  },
  left: {
    id: 'left', label: 'Samping kiri', symbol: '←', maleBodyRow: 66.67, femaleBodyRow: 66.67,
    hairFrame: { row: 2, top: 2, width: 16, height: 14, columnOffsets: [0, 1, 2, 3] }
  }
};

/**
 * CustomCharacterRenderer
 * Renders the 8 layered components (legs, body, pants, hands, shoes, shirt, head, hair)
 * exactly mapped to character appearance customization, direction, and walk/idle animation.
 */
export const CustomCharacterRenderer = ({ appearance, direction = 'down', isMoving = false, isSkillActive = false, skillIndex = 0 }) => {
  if (!appearance || typeof appearance !== 'object') return null;

  const gender = appearance.gender === 'Perempuan' ? 'Perempuan' : 'Laki-laki';
  const viewDirection = VIEW_DIRECTIONS[direction] || VIEW_DIRECTIONS.down;
  // The available action-specific clothing sheets currently cover walk and Skill 1 (fireball).
  const previewAction = isSkillActive && skillIndex === 0 ? 'skill1' : (isMoving ? 'walk' : 'idle');
  const skinTones = ['#F6D7B5', '#E7C09A', '#C78B5C', '#8A5636'];
  const skinTone = appearance.skinTone || skinTones[0];
  const skinColorIndex = Math.max(1, skinTones.indexOf(skinTone) + 1);

  const skinSprite = (part, fallback) => maleIdleSkinSprites[`${part}-${skinColorIndex}`] || fallback;
  const actionSkinSprite = (part, fallback) => {
    if (previewAction === 'walk') {
      return maleWalkSkinSprites[`walk-${part}-${skinColorIndex}`] || skinSprite(part, fallback);
    }
    if (previewAction === 'skill1') {
      return maleSkillSkinSprites[`skill1-${part}-${skinColorIndex}`] || skinSprite(part, fallback);
    }
    return skinSprite(part, fallback);
  };

  // Outfit styles extraction
  const outfit = appearance.outfit || {};
  const shirtStyle = (outfit.shirt || 'shirt-original').replace(/^shirt-/, '');
  const pantsStyle = (outfit.pants || 'pants-original').replace(/^pants-/, '');
  const shoesStyle = (outfit.shoes || 'shoes-original').replace(/^shoes-/, '');

  const getActionClothing = (type, style) => {
    if (previewAction === 'walk') {
      return maleActionClothingSprites.walk[type][style]
        || (type === 'shirt' ? appearance.shirtSpriteSheets?.walk : null)
        || maleIdleSprites[type][style];
    }
    if (previewAction === 'skill1') {
      return maleActionClothingSprites.skill1[type][style]
        || (type === 'shirt' ? (appearance.shirtSpriteSheets?.skill || appearance.shirtSpriteSheets?.skill1) : null)
        || maleIdleSprites[type][style];
    }
    return (type === 'shirt' ? appearance.shirtSpriteSheets?.idle : null)
      || maleIdleSprites[type][style]
      || maleActionClothingSprites.walk[type][style];
  };
  const maleClothingSprites = {
    shirt: getActionClothing('shirt', shirtStyle),
    pants: getActionClothing('pants', pantsStyle),
    shoes: getActionClothing('shoes', shoesStyle)
  };

  // Hair calculations
  const selectedHair = appearance.hair || 'bun';
  const hairColor = appearance.hairColor || '#1D2430';
  const hairSprite = hairSprites[selectedHair]?.[hairColor]
    || hairSprites[selectedHair]?.['#1D2430']
    || hairSprites.bun['#1D2430'];

  const currentHairConfig = (hairConfigs[selectedHair] && hairConfigs[selectedHair][viewDirection.id]) || {};
  const frameWidth = currentHairConfig.width || viewDirection.hairFrame.width;
  const frameHeight = currentHairConfig.height || viewDirection.hairFrame.height;
  const frameScaleX = currentHairConfig.scaleX || 1;
  const frameTop = currentHairConfig.top !== undefined ? currentHairConfig.top : viewDirection.hairFrame.top;
  const frameCols = currentHairConfig.columnOffsets || viewDirection.hairFrame.columnOffsets;
  const anchorCorrections = hairFrameColorCorrections[selectedHair]?.[hairColor]?.[viewDirection.id]
    || hairFrameAnchorCorrections[selectedHair]?.[viewDirection.id];
  const lockLeftHair2Crop = selectedHair === 'wave' && viewDirection.id === 'left';
  const lockRightHair2Crop = selectedHair === 'wave' && viewDirection.id === 'right';
  const hair2FrameShiftX = (lockLeftHair2Crop || lockRightHair2Crop) && anchorCorrections
    ? anchorCorrections.map((correction) => -correction * 3 * frameScaleX)
    : [0, 0, 0, 0];
  const leftHair2FrameShiftY = lockLeftHair2Crop ? [2, 0, 2, 0] : [0, 0, 0, 0];
  const hairFrameColumns = frameCols.map((column, index) => (
    index * 19 + (lockLeftHair2Crop || lockRightHair2Crop
      ? frameCols[0]
      : (anchorCorrections
      ? frameCols[0] + anchorCorrections[index]
      : column))
  ));
  const offsetX = currentHairConfig.offsetX || 0;
  const offsetY = currentHairConfig.offsetY || 0;

  return (
    <div
      className="Character_custom-avatar-wrapper"
      style={{
        position: 'absolute',
        top: '-30px',
        left: '50%',
        transform: 'translateX(-50%) scale(0.48)',
        transformOrigin: 'bottom center',
        width: '62px',
        height: '107px',
        pointerEvents: 'none',
        zIndex: 2
      }}
    >
      <div className={`sprite-character-preview action-${previewAction} gender-${gender === 'Laki-laki' ? 'male' : 'female'} hair-${selectedHair} direction-${viewDirection.id}`}>
        {gender === 'Laki-laki' ? (
          <>
            {/* 1. Legs Layer */}
            <span
              className="sprite-character-part sprite-character-legs"
              aria-hidden="true"
              style={{
                backgroundImage: `url(${actionSkinSprite('legs', maleIdleLegs)})`,
                display: maleClothingSprites.pants ? 'none' : undefined
              }}
            />
            {/* 2. Body Layer */}
            <span
              className="sprite-character-part sprite-character-body-part"
              aria-hidden="true"
              style={{
                backgroundImage: `url(${actionSkinSprite('body', maleIdleBody)})`,
                display: maleClothingSprites.shirt ? 'none' : undefined
              }}
            />
            {/* 3. Pants Layer */}
            {maleClothingSprites.pants && (
              <span
                className="sprite-character-part sprite-character-pants-part"
                style={{ backgroundImage: `url(${maleClothingSprites.pants})` }}
              />
            )}
            {/* 4. Hands Layer */}
            {previewAction !== 'skill1' && (
              <>
                <span
                  className="sprite-character-hands sprite-character-hand-left"
                  aria-hidden="true"
                  style={{
                    backgroundImage: `url(${skinSprite('hands', maleIdleHands)})`,
                    backgroundPositionY: `${viewDirection.maleBodyRow}%`
                  }}
                />
                <span
                  className="sprite-character-hands sprite-character-hand-right"
                  aria-hidden="true"
                  style={{
                    backgroundImage: `url(${skinSprite('hands', maleIdleHands)})`,
                    backgroundPositionY: `${viewDirection.maleBodyRow}%`
                  }}
                />
              </>
            )}
            {/* 5. Shoes Layer */}
            {maleClothingSprites.shoes && (
              <span
                className="sprite-character-part sprite-character-shoes-part"
                style={{ backgroundImage: `url(${maleClothingSprites.shoes})` }}
              />
            )}
            {/* 6. Shirt Layer */}
            {maleClothingSprites.shirt && (
              <span
                className="sprite-character-part sprite-character-shirt-part"
                style={{ backgroundImage: `url(${maleClothingSprites.shirt})` }}
              />
            )}
            {/* 7. Head Directional Image */}
            {previewAction === 'walk' && maleWalkSkinSprites[`walk-head-${skinColorIndex}`] ? (
              <span
                className="sprite-character-action-head-sheet"
                aria-hidden="true"
                style={{ backgroundImage: `url(${maleWalkSkinSprites[`walk-head-${skinColorIndex}`]})` }}
              />
            ) : (
              <img
                className="sprite-character-head-image"
                src={previewAction === 'skill1'
                  ? (maleSkillSkinSprites[`skill1-Head_${viewDirection.id}-${skinColorIndex}`]
                    || skinSprite(`Head_${viewDirection.id}`, maleHeadsByDirection[viewDirection.id] || maleHeadFront))
                  : (skinSprite(`Head_${viewDirection.id}`, maleHeadsByDirection[viewDirection.id] || maleHeadFront))}
                alt=""
                aria-hidden="true"
              />
            )}
          </>
        ) : (
          <>
            <span
              className="sprite-character-body"
              style={{
                backgroundImage: `url(${femaleCharacterWhite})`,
                backgroundPositionY: `${viewDirection.femaleBodyRow}%`
              }}
            />
          </>
        )}

        {/* 8. Hair Layer */}
        {hairSprite && (
          <span
            className="sprite-character-hair"
            style={{
              backgroundImage: `url(${hairSprite})`,
              width: `${frameWidth * 3 * frameScaleX}px`,
              height: `${frameHeight * 3}px`,
              left: `calc(50% + ${offsetX * 3}px)`,
              top: `${-3 + offsetY * 3 + (previewAction === 'idle' ? (viewDirection.id === 'front' || viewDirection.id === 'right' ? 4 : viewDirection.id === 'left' ? 2 : 0) : 0)}px`,
              backgroundSize: `${228 * frameScaleX}px 204px`,
              '--hair-source-y': `${-(viewDirection.hairFrame.row * 17 + frameTop) * 3}px`,
              '--hair-frame-x-0': `${-hairFrameColumns[0] * 3 * frameScaleX}px`,
              '--hair-frame-x-1': `${-hairFrameColumns[1] * 3 * frameScaleX}px`,
              '--hair-frame-x-2': `${-hairFrameColumns[2] * 3 * frameScaleX}px`,
              '--hair-frame-x-3': `${-hairFrameColumns[3] * 3 * frameScaleX}px`,
              '--hair-frame-shift-x-0': `${hair2FrameShiftX[0]}px`,
              '--hair-frame-shift-x-1': `${hair2FrameShiftX[1]}px`,
              '--hair-frame-shift-x-2': `${hair2FrameShiftX[2]}px`,
              '--hair-frame-shift-x-3': `${hair2FrameShiftX[3]}px`,
              '--hair-frame-shift-y-0': `${leftHair2FrameShiftY[0]}px`,
              '--hair-frame-shift-y-1': `${leftHair2FrameShiftY[1]}px`,
              '--hair-frame-shift-y-2': `${leftHair2FrameShiftY[2]}px`,
              '--hair-frame-shift-y-3': `${leftHair2FrameShiftY[3]}px`
            }}
          />
        )}
      </div>
    </div>
  );
};

const characterAnimationStyles = `
.game-wrapper .Character {
  transition: transform 0.22s linear !important;
}
@keyframes walk-man-down {
  0% { background-position-x: 0px; }
  25% { background-position-x: -20px; }
  50% { background-position-x: -39px; }
  75% { background-position-x: -20px; }
  100% { background-position-x: 0px; }
}
@keyframes walk-man-up {
  0% { background-position-x: 0px; }
  25% { background-position-x: -20px; }
  50% { background-position-x: -39px; }
  75% { background-position-x: -20px; }
  100% { background-position-x: 0px; }
}
@keyframes walk-man-left {
  0% { background-position-x: 0px; }
  25% { background-position-x: -20px; }
  50% { background-position-x: -39px; }
  75% { background-position-x: -20px; }
  100% { background-position-x: 0px; }
}
@keyframes walk-man-right {
  0% { background-position-x: 0px; }
  25% { background-position-x: -20px; }
  50% { background-position-x: -39px; }
  75% { background-position-x: -20px; }
  100% { background-position-x: 0px; }
}
.game-wrapper .Character.moving[data-color="man"][data-direction="down"] .Character_svg,
.game-wrapper .Character.moving.has-svg-character[data-direction="down"] .Character_svg,
.game-wrapper .Character.moving[data-direction="down"] .Character_svg {
  background-position-y: 0px;
  animation: walk-man-down 0.44s step-end infinite !important;
}
.game-wrapper .Character.moving[data-color="man"][data-direction="up"] .Character_svg,
.game-wrapper .Character.moving.has-svg-character[data-direction="up"] .Character_svg,
.game-wrapper .Character.moving[data-direction="up"] .Character_svg {
  background-position-y: -37px;
  animation: walk-man-up 0.44s step-end infinite !important;
}
.game-wrapper .Character.moving[data-color="man"][data-direction="left"] .Character_svg,
.game-wrapper .Character.moving.has-svg-character[data-direction="left"] .Character_svg,
.game-wrapper .Character.moving[data-direction="left"] .Character_svg {
  background-position-y: -72px;
  animation: walk-man-left 0.44s step-end infinite !important;
}
.game-wrapper .Character.moving[data-color="man"][data-direction="right"] .Character_svg,
.game-wrapper .Character.moving.has-svg-character[data-direction="right"] .Character_svg,
.game-wrapper .Character.moving[data-direction="right"] .Character_svg {
  background-position-y: -110px;
  animation: walk-man-right 0.44s step-end infinite !important;
}
`;

const Player = ({
  player,
  isCurrentPlayer,
  isButtonMoving = false,
  skillActive,
  skillIndex,
  isGuest,
  appearance
}) => {
  const [isMoving, setIsMoving] = useState(false);
  const [isStepping, setIsStepping] = useState(false);
  const prevCoordRef = useRef({ x: player?.x, y: player?.y });
  const stepTimeoutRef = useRef(null);

  // Local keyboard movement tracking
  useEffect(() => {
    if (isCurrentPlayer) {
      const movementKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      const handleKeyDown = (event) => {
        if (!movementKeys.includes(event.code)) return;
        setIsMoving(true);
      };

      const handleKeyUp = (event) => {
        if (!movementKeys.includes(event.code)) return;
        setIsMoving(false);
      };
      const handleBlur = () => {
        setIsMoving(false);
        setIsStepping(false);
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('blur', handleBlur);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', handleBlur);
      };
    }
  }, [isCurrentPlayer]);

  // Coordinate delta step tracking:
  // Plays walking animation for the full 220ms duration of each grid displacement
  // (for single-taps, key releases, and remote players) and snaps to a resting idle stance when stationary.
  useEffect(() => {
    if (!player) return;
    const prev = prevCoordRef.current;
    if (
      prev.x !== undefined &&
      prev.y !== undefined &&
      (prev.x !== player.x || prev.y !== player.y)
    ) {
      setIsStepping(true);
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
      }
      stepTimeoutRef.current = setTimeout(() => {
        setIsStepping(false);
      }, STEP_DURATION_MS);
    }
    prevCoordRef.current = { x: player.x, y: player.y };
  }, [player]);

  useEffect(() => {
    return () => {
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
      }
    };
  }, []);

  if (!player) return null;
  const { name, coins, color, direction, x, y } = player;

  // Determine custom appearance candidate
  const candidateAppearance = appearance || player?.appearance || player?.customization || null;
  const hasAppearanceData = Boolean(
    candidateAppearance &&
    typeof candidateAppearance === 'object' &&
    !Array.isArray(candidateAppearance) &&
    (candidateAppearance.gender || candidateAppearance.hair || candidateAppearance.outfit || candidateAppearance.shirt || candidateAppearance.skin || candidateAppearance.pants || candidateAppearance.shoes)
  );

  // If player appearance is present, NEVER treat as a guest so custom avatars always render
  const effectiveIsGuest = hasAppearanceData
    ? false
    : (isCurrentPlayer
        ? Boolean(isGuest)
        : (player?.isGuest !== undefined ? Boolean(player.isGuest) : Boolean(isGuest)));

  const hasCustomAppearance = !effectiveIsGuest && hasAppearanceData;
  const effectiveAppearance = hasCustomAppearance ? candidateAppearance : null;

  // Default guest / unregistered players to the humanoid character (char-man-1.svg / isSvgCharacter)
  const isSvgCharacter = (charColor) => {
    if (hasCustomAppearance) return false;
    if (effectiveIsGuest || !charColor || charColor === 'man' || charColor === 'guest') return true;
    return true;
  };

  const isSvg = isSvgCharacter(color);
  const effectiveColor = hasCustomAppearance ? 'custom' : (isSvg ? 'man' : (color || 'man'));
  const isCharacterMoving = Boolean(isStepping || isMoving || isButtonMoving);

  // Default positioning for characters
  let left = TILE_SIZE * x + 'px';
  let top = TILE_SIZE * y - 12 + 'px';
  const playerSpace = getKeyString(x, y);
  const isBehindHouseOrTree = Boolean(
    mapData.depthSortedSpaces?.[playerSpace]
    && !mapData.blockedSpaces?.[playerSpace]
    && !mapData.staircaseSpaces?.[playerSpace]
    && !mapData.house3PlatformSpaces?.[playerSpace]
  );

  return (
    <div
      className={`Character grid-cell ${isCurrentPlayer ? 'you' : ''} ${isCharacterMoving ? 'moving' : ''} ${hasCustomAppearance ? 'has-custom-appearance' : (isSvg ? 'has-svg-character' : '')}`}
      style={{
        transform: `translate3d(${left}, ${top}, 0)`,
        zIndex: isBehindHouseOrTree ? 1 : (y + 3) * 10 + 5
      }}
      data-color={effectiveColor}
      data-direction={direction || 'down'}
    >
      <style>{characterAnimationStyles}</style>
      <div className="Character_shadow grid-cell"></div>

      {hasCustomAppearance ? (
        <CustomCharacterRenderer
          appearance={effectiveAppearance}
          direction={direction || 'down'}
          isMoving={isCharacterMoving}
          isSkillActive={skillActive}
          skillIndex={skillIndex}
        />
      ) : isSvg ? (
        <div className="Character_svg grid-cell"></div>
      ) : (
        <div className="Character_sprite grid-cell"></div>
      )}

      <div
        className="Character_name-container"
        style={hasCustomAppearance ? { top: '-40px', left: '24px', transform: 'translateX(-50%)' } : undefined}
      >
        <span className="Character_name">{name}</span>
        <span className="Character_coins">{coins}</span>
      </div>

      {isCurrentPlayer && (
        <div
          className="Character_you-arrow"
          style={hasCustomAppearance ? { top: '-28px', left: '24px', transform: 'translateX(-50%)' } : undefined}
        />
      )}

      <SkillEffect active={skillActive} skillIndex={skillIndex} />
    </div>
  );
};

export default Player;
