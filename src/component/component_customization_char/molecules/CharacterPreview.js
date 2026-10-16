import React from 'react';
import { hairConfigs } from '../characterCustomization';
const maleIdleSkinContext = require.context(
  '../../../images/asset_game/character/gender/male/idle',
  false,
  /^(?:\.\/)?(?:char_male_idle_(?:body|legs|hands)|Head_(?:front|back|left|right))_color_[1-4]\.png$/i
);
const maleWalkSkinContext = require.context(
  '../../../images/asset_game/character/gender/male/walk',
  false,
  /^\.\/char_male_walk_(?:body|legs|head)_color_[1-4]\.png$/i
);
const maleSkillSkinContext = require.context(
  '../../../images/asset_game/character/gender/male/skill/fireball',
  false,
  /^\.\/char_male_use_skill_fireball_(?:body|legs|head)_color_[1-4]\.png$/i
);
const maleIdleSkinSprites = Object.fromEntries(maleIdleSkinContext.keys().flatMap((path) => {
  const file = path.split('/').pop();
  const match = file.match(/^(char_male_idle_(body|legs|hands)|Head_(front|back|left|right))_color_([1-4])\.png$/i);
  const part = match ? (match[3] ? `Head_${match[3]}` : match[2]) : null;
  return match ? [[`${part}-${match[4]}`, maleIdleSkinContext(path)]] : [];
}));
const makeActionSkinSprites = (context, action, prefix) => Object.fromEntries(context.keys().flatMap((path) => {
  const file = path.split('/').pop();
  const match = file.match(new RegExp(`^${prefix}_(body|legs|head)_color_([1-4])\\.png$`, 'i'));
  return match ? [[`${action}-${match[1]}-${match[2]}`, context(path)]] : [];
}));
const maleActionSkinSprites = {
  ...makeActionSkinSprites(maleWalkSkinContext, 'walk', 'char_male_walk'),
  ...makeActionSkinSprites(maleSkillSkinContext, 'skill1', 'char_male_use_skill_fireball')
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

// Hair atlas frames are not drawn on the same horizontal anchor. These
// sub-pixel crop corrections counter the frame drift while retaining animation.
const hairFrameAnchorCorrections = {
  // Black sprite alignment is the reference for every color variant.
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
    // Side-view frame shifts keep each animated silhouette on a stable anchor.
    left: [0, -2.3, -0.02, -1.39]
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

// Alignment is measured from each hairstyle's black reference sheet, then
// translated to the corresponding color sheet so every palette keeps a fixed anchor.
const hairFrameColorCorrections = {
  wave: {
    '#1D2430': {
      front: [0, 0.84, 1.65, 3], right: [0, 1.65, 2.86, 3.56],
      back: [0, 0.87, 1.73, 3.02], left: [0, -2.3, -0.02, -1.39]
    },
    '#3B82F6': {
      front: [0, 1.31, 1.92, 2.61], right: [0, 1.35, 2.28, 2.92],
      back: [0, 1.12, 1.92, 2.44], left: [0, -1.76, -0.02, -1.3]
    },
    '#3DAA87': {
      front: [0, 1.31, 1.93, 2.61], right: [0, 1.35, 2.28, 2.92],
      back: [0, 1.12, 1.92, 2.44], left: [0, -1.76, -0.02, -1.3]
    },
    '#F39E4E': {
      front: [0, 1.31, 1.92, 2.61], right: [0, 1.35, 2.28, 2.92],
      back: [0, 1.11, 1.91, 2.44], left: [0, -1.76, -0.02, -1.3]
    },
    '#7B5EF3': {
      front: [0, 1.31, 1.93, 2.61], right: [0, 1.35, 2.28, 2.92],
      back: [0, 1.11, 1.92, 2.43], left: [0, -1.76, -0.02, -1.3]
    },
    '#D9E2F2': {
      front: [0, 1.33, 1.95, 2.64], right: [0, 1.36, 2.32, 2.94],
      back: [0, 1.12, 1.94, 2.47], left: [0, -1.77, -0.02, -1.32]
    }
  },
  short: {
    '#1D2430': {
      front: [0, 1.28, 2.57, 3.86], right: [0, 1.21, 2.53, 3.71],
      back: [0, 1.29, 2.58, 3.82], left: [0, 1.24, 2.6, 3.73]
    },
    '#3B82F6': {
      front: [0, 0.71, 1.41, 2.31], right: [0, 1.05, 1.5, 2.4],
      back: [0, 0.71, 1.41, 2.3], left: [0, 0.98, 1.48, 2.36]
    },
    '#3DAA87': {
      front: [0, 1.05, 2.13, 3.19], right: [0, 1.06, 2.13, 3.21],
      back: [0, 1.05, 2.11, 3.19], left: [0, 1.01, 2.14, 3.16]
    },
    '#F39E4E': {
      front: [0, 0.82, 1.32, 2.26], right: [0, 1, 1.26, 2.08],
      back: [0, 0.83, 1.33, 2.22], left: [0, 0.84, 1.38, 2.14]
    },
    '#F6C3D2': {
      front: [0, 1.05, 1.78, 2.78], right: [0, 0.99, 1.78, 2.74],
      back: [0, 1.04, 1.79, 2.78], left: [0, 0.99, 1.83, 2.73]
    },
    '#D9E2F2': {
      front: [0, 0.98, 1.66, 2.61], right: [0, 1.11, 1.89, 2.54],
      back: [0, 1, 1.71, 2.57], left: [0, 1.06, 1.91, 2.56]
    }
  }
};

const CharacterPreview = ({
  gender,
  selectedHair,
  hairColor,
  hairSprite,
  characterSprite,
  viewDirection,
  viewDirections,
  onViewDirectionChange,
  skinTone,
  previewAction = 'idle',
  clothingSprites = {},
  maleClothingSprites = {}
}) => {
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
  const hair2FrameShiftX = lockLeftHair2Crop
    ? [0, 0, 0, 0]
    : lockRightHair2Crop && anchorCorrections
    ? anchorCorrections.map((correction) => -correction * 3 * frameScaleX)
    : [0, 0, 0, 0];
  // The left-facing atlas frames already share one vertical head anchor.
  // Per-frame Y offsets add a visible up/down jitter to the walking cycle.
  const hair2FrameShiftY = [0, 0, 0, 0];
  // Hair 2 side-facing crops stay on the same atlas columns; the black-based
  // per-color alignment profile compensates for movement inside each cell.
  const hairFrameColumns = frameCols.map((column, index) => (
    index * 19 + (lockLeftHair2Crop || lockRightHair2Crop
      ? frameCols[0]
      : (anchorCorrections
      ? frameCols[0] + anchorCorrections[index]
      : column))
  ));
  const offsetX = currentHairConfig.offsetX || 0;
  const offsetY = currentHairConfig.offsetY || 0;
  const skinColorIndex = ['#F6D7B5', '#E7C09A', '#C78B5C', '#8A5636'].indexOf(skinTone) + 1;
  const skinSprite = (part, fallback) => maleIdleSkinSprites[`${part}-${skinColorIndex}`] || fallback;

  return (
  <>
    <div className="character-stage" role="img" aria-label={`Pratinjau karakter ${gender}`}>
      <div className="stage-glow" />
      {characterSprite ? (
        <div className={`sprite-character-preview action-${previewAction} gender-${gender === 'Laki-laki' ? 'male' : 'female'} hair-${selectedHair} direction-${viewDirection.id}`}>
          {gender === 'Laki-laki' ? (
            <>
              <span
                className="sprite-character-part sprite-character-legs"
                aria-hidden="true"
                style={{
                  backgroundImage: `url(${maleActionSkinSprites[`${previewAction}-legs-${skinColorIndex}`] || skinSprite('legs', maleIdleLegs)})`,
                  display: maleClothingSprites.pants ? 'none' : undefined
                }}
              />
              <span
                className="sprite-character-part sprite-character-body-part"
                aria-hidden="true"
                style={{
                  backgroundImage: `url(${maleActionSkinSprites[`${previewAction}-body-${skinColorIndex}`] || skinSprite('body', maleIdleBody)})`,
                  display: maleClothingSprites.shirt ? 'none' : undefined
                }}
              />
              {previewAction === 'skill1' ? (
                <span
                  className="sprite-character-part sprite-character-skill-head-part"
                  aria-hidden="true"
                  style={{
                    backgroundImage: `url(${maleActionSkinSprites[`skill1-head-${skinColorIndex}`] || skinSprite(`Head_${viewDirection.id}`, maleHeadsByDirection[viewDirection.id] || maleHeadFront)})`
                  }}
                />
              ) : previewAction === 'walk' && maleActionSkinSprites[`walk-head-${skinColorIndex}`] ? (
                <span
                  className="sprite-character-part sprite-character-walk-head-part"
                  aria-hidden="true"
                  style={{
                    backgroundImage: `url(${maleActionSkinSprites[`walk-head-${skinColorIndex}`]})`
                  }}
                />
              ) : (
                <img
                  className="sprite-character-head-image"
                  src={skinSprite(`Head_${viewDirection.id}`, maleHeadsByDirection[viewDirection.id] || maleHeadFront)}
                  alt=""
                  aria-hidden="true"
                />
              )}
            </>
          ) : (
            <span
              className="sprite-character-body"
              style={{
                backgroundImage: `url(${characterSprite})`,
                backgroundPositionY: `${viewDirection.femaleBodyRow}%`
              }}
            />
          )}
          {gender === 'Laki-laki' && previewAction === 'idle' && (
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
          {gender === 'Laki-laki' && maleClothingSprites.shirt ? (
            <span className="sprite-character-part sprite-character-shirt-part" style={{ backgroundImage: `url(${maleClothingSprites.shirt})` }} />
          ) : clothingSprites.shirt ? (
            <span className="sprite-character-clothing sprite-character-shirt" style={{ backgroundImage: `url(${clothingSprites.shirt})` }} />
          ) : null}
          {gender === 'Laki-laki' && maleClothingSprites.pants ? (
            <span className="sprite-character-part sprite-character-pants-part" style={{ backgroundImage: `url(${maleClothingSprites.pants})` }} />
          ) : clothingSprites.pants ? (
            <span className="sprite-character-clothing sprite-character-pants" style={{ backgroundImage: `url(${clothingSprites.pants})` }} />
          ) : null}
          {gender === 'Laki-laki' && maleClothingSprites.shoes ? (
            <span className="sprite-character-part sprite-character-shoes-part" style={{ backgroundImage: `url(${maleClothingSprites.shoes})` }} />
          ) : clothingSprites.shoes ? (
            <span className="sprite-character-clothing sprite-character-shoes" style={{ backgroundImage: `url(${clothingSprites.shoes})` }} />
          ) : null}
          {hairSprite && (
            <span
              key={previewAction}
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
                '--hair-frame-shift-y-0': `${hair2FrameShiftY[0]}px`,
                '--hair-frame-shift-y-1': `${hair2FrameShiftY[1]}px`,
                '--hair-frame-shift-y-2': `${hair2FrameShiftY[2]}px`,
                '--hair-frame-shift-y-3': `${hair2FrameShiftY[3]}px`
              }}
            />
          )}
        </div>
      ) : (
        <div className={`avatar avatar-${gender.toLowerCase().replace(/\s+/g, '-')}`}>
          <div
            className={`avatar-hair hair-${selectedHair} ${hairSprite ? 'avatar-hair--sprite' : ''}`}
            style={{ '--hair-color': hairColor, backgroundImage: hairSprite ? `url(${hairSprite})` : undefined }}
          />
          <div className="avatar-head" style={{ background: skinTone }}>
            <div className="avatar-face-detail" />
          </div>
          <div className="avatar-eye left" />
          <div className="avatar-eye right" />
          <div className="avatar-smile" />
          <div className="avatar-blush left" />
          <div className="avatar-blush right" />
          <div className="avatar-ear left" style={{ background: skinTone }} />
          <div className="avatar-ear right" style={{ background: skinTone }} />
          <div className="avatar-neck" style={{ background: skinTone }} />
          <div className="avatar-shirt avatar-shirt-asset" style={{ backgroundImage: clothingSprites.shirt ? `url(${clothingSprites.shirt})` : undefined }} />
          <div className="avatar-pants avatar-pants-asset" style={{ backgroundImage: clothingSprites.pants ? `url(${clothingSprites.pants})` : undefined }} />
          <div className="avatar-shoes-asset" style={{ backgroundImage: clothingSprites.shoes ? `url(${clothingSprites.shoes})` : undefined }} />
        </div>
      )}
    </div>
    {characterSprite && (
      <div className="character-view-controls" role="group" aria-label="Sudut pandang karakter">
        <button
          type="button"
          className="view-direction-button rotate-counterclockwise"
          aria-label="Putar berlawanan arah jarum jam"
          title="Putar berlawanan arah jarum jam"
          onClick={() => {
            const currentIndex = viewDirections.findIndex(({ id }) => id === viewDirection.id);
            onViewDirectionChange(viewDirections[(currentIndex - 1 + viewDirections.length) % viewDirections.length].id);
          }}
        >
          ↺
        </button>
        <button
          type="button"
          className="view-direction-button rotate-clockwise"
          aria-label="Putar searah jarum jam"
          title="Putar searah jarum jam"
          onClick={() => {
            const currentIndex = viewDirections.findIndex(({ id }) => id === viewDirection.id);
            onViewDirectionChange(viewDirections[(currentIndex + 1) % viewDirections.length].id);
          }}
        >
          ↻
        </button>
      </div>
    )}
  </>
  );
};

export default CharacterPreview;
