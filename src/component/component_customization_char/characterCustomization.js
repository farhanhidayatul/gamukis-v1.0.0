import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import characterArtwork from '../../images/asset_background_anime.png';
import CategoryTab from './atoms/CategoryTab';
import HairStyleButton from './atoms/HairStyleButton';
import SwatchButton from './atoms/SwatchButton';
import CharacterPreview from './molecules/CharacterPreview';
import ClothingOptionButton from './atoms/ClothingOptionButton';

// Hair style 1
import hair1MaleBlack from '../../images/asset_game/character/hair/hair_1_male_black.png';
import hair1MaleBlue from '../../images/asset_game/character/hair/hair_1_male_blue.png';
import hair1MaleBrown from '../../images/asset_game/character/hair/hair_1_male_brown.png';
import hair1MaleGreen from '../../images/asset_game/character/hair/hair_1_male_green.png';
import hair1MalePink from '../../images/asset_game/character/hair/hair_1_male_pink.png';
import hair1MaleRed from '../../images/asset_game/character/hair/hair_1_male_red.png';
import hair1MaleWhite from '../../images/asset_game/character/hair/hair_1_male_white.png';

// Hair style 2
import hair2MaleBlack from '../../images/asset_game/character/hair/hair_2_male_black.png';
import hair2MaleBlue from '../../images/asset_game/character/hair/hair_2_male_blue.png';
import hair2MaleGreen from '../../images/asset_game/character/hair/hair_2_green.png';
import hair2MaleOrange from '../../images/asset_game/character/hair/hair_2_male_orange.png';
import hair2MalePurple from '../../images/asset_game/character/hair/hair_2_male_purple.png';
import hair2MaleWhite from '../../images/asset_game/character/hair/hair_2_male_silver.png';

// Hair style 3
import hair3MaleBlack from '../../images/asset_game/character/hair/hair_3_male_black.png';
import hair3MaleBlue from '../../images/asset_game/character/hair/hair_3_male_blue.png';
import hair3MaleGreen from '../../images/asset_game/character/hair/hair_3_male_green.png';
import hair3MaleOrange from '../../images/asset_game/character/hair/hair_3_male_orange.png';
import hair3MalePink from '../../images/asset_game/character/hair/hair_3_male_pink.png';
import hair3MaleWhite from '../../images/asset_game/character/hair/hair_3_male_white.png';

// Hair style 4
import hair4MaleBlack from '../../images/asset_game/character/hair/hair_4_male_black_short.png';
import hair4MaleBlue from '../../images/asset_game/character/hair/hair_4_male_blue.png';
import hair4MaleGreen from '../../images/asset_game/character/hair/hair_4_male_green.png';
import hair4MaleOrange from '../../images/asset_game/character/hair/hair_4_male_orange.png';
import hair4MalePink from '../../images/asset_game/character/hair/hair_4_male_pink.png';
import hair4MaleWhite from '../../images/asset_game/character/hair/hair_4_male_white.png';

import femaleCharacterWhite from '../../images/asset_game/character/gender/female/idle/char_woman_idle_white.png';
import './characterCustomization.css';

const maleIdleShirtContext = require.context('../../images/asset_game/character/gender/male/idle/shirt', true, /idle_shirt_[a-z0-9_]+_sheet\.png$/i);
const maleWalkShirtContext = require.context('../../images/asset_game/character/gender/male/walk/shirt', true, /walk_shirt_[a-z0-9_]+_sheet\.png$/i);
const maleSkillShirtContext = require.context('../../images/asset_game/character/gender/male/skill/fireball/shirt', true, /fireball_shirt_[a-z0-9_]+_sheet\.png$/i);
const maleIdlePantsContext = require.context('../../images/asset_game/character/gender/male/idle/pants', true, /idle_pants_[a-z0-9_]+_preview\.png$/i);
const maleIdleShoesContext = require.context('../../images/asset_game/character/gender/male/idle/shoes', true, /idle_shoes_[a-z0-9_]+_preview\.png$/i);
const maleWalkPantsContext = require.context('../../images/asset_game/character/gender/male/walk/pants', true, /walk_pants_[a-z0-9_]+_sheet\.png$/i);
const maleWalkShoesContext = require.context('../../images/asset_game/character/gender/male/walk/shoes', true, /walk_shoes_[a-z0-9_]+_sheet\.png$/i);
const maleSkillPantsContext = require.context('../../images/asset_game/character/gender/male/skill/fireball/pants', true, /fireball_pants_[a-z0-9_]+_sheet\.png$/i);
const maleSkillShoesContext = require.context('../../images/asset_game/character/gender/male/skill/fireball/shoes', true, /fireball_shoes_[a-z0-9_]+_sheet\.png$/i);

const makeIdleSpriteMap = (context, type, assetSuffix = 'preview') => Object.fromEntries(context.keys().flatMap((path) => {
  const match = path.match(new RegExp(`\\./([^/]+)/idle_${type}_([a-z0-9_]+)_${assetSuffix}\\.png$`, 'i'));
  return match ? [[match[1], context(path)]] : [];
}));

const makeActionSpriteMap = (context, action, type) => Object.fromEntries(context.keys().flatMap((path) => {
  const match = path.match(new RegExp(`\\./([^/]+)/${action}_${type}_([a-z0-9_]+)_sheet\\.png$`, 'i'));
  return match ? [[match[1], context(path)]] : [];
}));

const maleIdleSprites = {
  // The latest shirt artwork is stored in the full 4×4 directional sheets.
  // Keep pants and shoes on their existing preview assets.
  shirt: makeIdleSpriteMap(maleIdleShirtContext, 'shirt', 'sheet'),
  pants: makeIdleSpriteMap(maleIdlePantsContext, 'pants'),
  shoes: makeIdleSpriteMap(maleIdleShoesContext, 'shoes')
};

const maleShirtSpriteSets = {
  idle: maleIdleSprites.shirt,
  walk: makeActionSpriteMap(maleWalkShirtContext, 'walk', 'shirt'),
  skill: makeActionSpriteMap(maleSkillShirtContext, 'fireball', 'shirt')
};
const maleActionClothingSprites = {
  walk: {
    shirt: maleShirtSpriteSets.walk,
    pants: makeActionSpriteMap(maleWalkPantsContext, 'walk', 'pants'),
    shoes: makeActionSpriteMap(maleWalkShoesContext, 'walk', 'shoes')
  },
  skill1: {
    shirt: maleShirtSpriteSets.skill,
    pants: makeActionSpriteMap(maleSkillPantsContext, 'fireball', 'pants'),
    shoes: makeActionSpriteMap(maleSkillShoesContext, 'fireball', 'shoes')
  }
};

const makeOptionsFromIdleSprites = (sprites, itemPrefix) => Object.entries(sprites).map(([id, preview]) => ({
  id: `${itemPrefix}-${id}`,
  label: id.split('_').map((word) => word[0].toUpperCase() + word.slice(1)).join(' '),
  preview
}));

const shirtOptions = makeOptionsFromIdleSprites(maleIdleSprites.shirt, 'shirt');
const pantsOptions = makeOptionsFromIdleSprites(maleIdleSprites.pants, 'pants');
const shoeOptions = makeOptionsFromIdleSprites(maleIdleSprites.shoes, 'shoes');

const savedOption = (key, options, fallback) => {
  try {
    const savedId = JSON.parse(window.localStorage.getItem('gamukis_character_outfit') || '{}')[key];
    return options.find(({ id }) => id === savedId) || fallback;
  } catch (error) {
    return fallback;
  }
};

const tabs = ['Rambut', 'Baju', 'Celana', 'Sepatu'];

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
  },
};

const hairStyles = [
  { id: 'bun', label: 'Bun' },
  { id: 'wave', label: 'Wavy' },
  { id: 'short', label: 'Pendek' },
  { id: 'bob', label: 'Bob' },
  { id: 'pixie', label: 'Pixie' },
  { id: 'pigtail', label: 'Pigtail' }
];

const hairColorOptions = [
  { label: 'Hitam', color: '#1D2430' },
  { label: 'Biru', color: '#3B82F6' },
  { label: 'Cokelat', color: '#E5A54E' },
  { label: 'Hijau', color: '#3DAA87' },
  { label: 'Oranye', color: '#F39E4E' },
  { label: 'Ungu', color: '#7B5EF3' },
  { label: 'Merah muda', color: '#F6C3D2' },
  { label: 'Merah', color: '#EF4444' },
  { label: 'Putih', color: '#D9E2F2' }
];
const hairColors = hairColorOptions.map(({ color }) => color);

const hairSprites = {
  bun: { '#1D2430': hair1MaleBlack, '#3B82F6': hair1MaleBlue, '#3DAA87': hair1MaleGreen, '#F39E4E': hair1MaleBrown, '#F6C3D2': hair1MalePink, '#EF4444': hair1MaleRed, '#D9E2F2': hair1MaleWhite },
  wave: { '#1D2430': hair2MaleBlack, '#3B82F6': hair2MaleBlue, '#3DAA87': hair2MaleGreen, '#F39E4E': hair2MaleOrange, '#7B5EF3': hair2MalePurple, '#D9E2F2': hair2MaleWhite },
  short: { '#1D2430': hair3MaleBlack, '#3B82F6': hair3MaleBlue, '#3DAA87': hair3MaleGreen, '#F39E4E': hair3MaleOrange, '#F6C3D2': hair3MalePink, '#D9E2F2': hair3MaleWhite },
  bob: { '#1D2430': hair4MaleBlack, '#3B82F6': hair4MaleBlue, '#3DAA87': hair4MaleGreen, '#F39E4E': hair4MaleOrange, '#F6C3D2': hair4MalePink, '#D9E2F2': hair4MaleWhite }
};
const skinTones = ['#F6D7B5', '#E7C09A', '#C78B5C', '#8A5636'];

const loadSavedAppearance = () => {
  try {
    const appearance = JSON.parse(window.localStorage.getItem('gamukis_character_appearance') || '{}');
    if (!appearance || typeof appearance !== 'object' || Array.isArray(appearance)) return {};

    const gender = ['Laki-laki', 'Perempuan'].includes(appearance.gender) ? appearance.gender : 'Laki-laki';
    const hair = hairStyles.some(({ id }) => id === appearance.hair)
      && (gender === 'Perempuan' || hairSprites[appearance.hair])
      ? appearance.hair
      : 'bun';
    const hairColor = hairColorOptions.some(({ color }) => color === appearance.hairColor)
      && (gender === 'Perempuan' || hairSprites[hair]?.[appearance.hairColor])
      ? appearance.hairColor
      : hairColors[0];

    return {
      gender,
      hair,
      hairColor,
      skinTone: skinTones.includes(appearance.skinTone) ? appearance.skinTone : skinTones[0]
    };
  } catch (error) {
    return {};
  }
};

const viewDirections = [
  {
    id: 'front', label: 'Depan', symbol: '↑', maleBodyRow: 0, femaleBodyRow: 0,
    hairFrame: { row: 0, top: 0, width: 14, height: 12, columnOffsets: [1, 2, 3, 4] }
  },
  {
    id: 'right', label: 'Samping kanan', symbol: '→', maleBodyRow: 99.5, femaleBodyRow: 100,
    hairFrame: { row: 3, top: 3, width: 16, height: 14, columnOffsets: [0, 1, 2, 3] }
  },
  {
    id: 'back', label: 'Belakang', symbol: '↓', maleBodyRow: 32.86, femaleBodyRow: 100 / 3,
    hairFrame: { row: 1, top: 0, width: 16, height: 16, columnOffsets: [0, 1, 2, 3] }
  },
  {
    id: 'left', label: 'Samping kiri', symbol: '←', maleBodyRow: 66.67, femaleBodyRow: 66.67,
    hairFrame: { row: 2, top: 2, width: 16, height: 14, columnOffsets: [0, 1, 2, 3] }
  }
];

const getOptionSet = (activeTab) => {
  switch (activeTab) {
    case 'Rambut':
      return hairStyles;
    case 'Baju':
      return shirtOptions;
    case 'Celana':
      return pantsOptions;
    case 'Sepatu':
      return shoeOptions;
    default:
      return [];
  }
};

const CharacterCustomization = () => {
  const navigate = useNavigate();
  const [initialAppearance] = useState(loadSavedAppearance);
  const [activeTab, setActiveTab] = useState('Rambut');
  const [gender, setGender] = useState(initialAppearance.gender || 'Laki-laki');
  const [viewDirectionId, setViewDirectionId] = useState('front');
  const [previewAction, setPreviewAction] = useState('idle');
  const [selectedHair, setSelectedHair] = useState(initialAppearance.hair || 'bun');
  const [skinTone, setSkinTone] = useState(initialAppearance.skinTone || skinTones[0]);
  const [hairColor, setHairColor] = useState(initialAppearance.hairColor || hairColors[0]);
  const [selectedShirt, setSelectedShirt] = useState(() => savedOption('shirt', shirtOptions, shirtOptions.find(({ id }) => id === 'shirt-original') || shirtOptions[0]));
  const [selectedPants, setSelectedPants] = useState(() => savedOption('pants', pantsOptions, pantsOptions.find(({ id }) => id === 'pants-original') || pantsOptions[0]));
  const [selectedShoes, setSelectedShoes] = useState(() => savedOption('shoes', shoeOptions, shoeOptions.find(({ id }) => id === 'shoes-original') || shoeOptions[0]));

  const optionSet = useMemo(() => {
    const options = getOptionSet(activeTab);
    return activeTab === 'Rambut' && gender === 'Laki-laki'
      ? options.filter(({ id }) => hairSprites[id])
      : options;
  }, [activeTab, gender]);
  const availableHairColorOptions = gender === 'Laki-laki' && hairSprites[selectedHair]
    ? hairColorOptions.filter(({ color }) => hairSprites[selectedHair][color])
    : hairColorOptions;

  const handleOptionSelect = (option) => {
    if (activeTab === 'Rambut') {
      setSelectedHair(option.id);
      const nextHairColors = hairSprites[option.id];
      if (gender === 'Laki-laki' && nextHairColors && !nextHairColors[hairColor]) {
        const fallbackColor = hairColorOptions.find(({ color }) => nextHairColors[color])?.color;
        if (fallbackColor) setHairColor(fallbackColor);
      }
      return;
    }

    if (activeTab === 'Baju') {
      setSelectedShirt(option);
      return;
    }

    if (activeTab === 'Celana') {
      setSelectedPants(option);
      return;
    }

    setSelectedShoes(option);
  };

  const selectedClothing = activeTab === 'Baju' ? selectedShirt : activeTab === 'Celana' ? selectedPants : selectedShoes;
  const selectedHairSprite = gender === 'Laki-laki' && hairSprites[selectedHair]
    ? hairSprites[selectedHair][hairColor] || null
    : null;
  const selectedCharacterSprite = gender === 'Laki-laki'
    ? 'male-split-parts'
    : skinTone === skinTones[0] && selectedHair === hairStyles[0].id
      ? femaleCharacterWhite
    : null;
  const selectedViewDirection = viewDirections.find(({ id }) => id === viewDirectionId) || viewDirections[0];

  return (
    <div className="character-customization-page">
      <div className="customization-layout">
        <section className="customization-visual">
          <div className="step-badge">LANGKAH 4 DARI 4</div>
          <h1>Kustomisasi Karakter</h1>
          <p>Buat karakter unikmu sendiri untuk memulai petualangan belajar di Gamukis.</p>
          <div className="customization-art" aria-hidden="true">
            <img src={characterArtwork} alt="" />
          </div>

        </section>

        <aside className="customization-panel">
          <div className="character-preview-column">
          <div className="customization-preview">
            <CharacterPreview
              gender={gender}
              selectedHair={selectedHair}
              hairColor={hairColor}
              hairSprite={selectedHairSprite}
              characterSprite={selectedCharacterSprite}
              viewDirection={selectedViewDirection}
              viewDirections={viewDirections}
              onViewDirectionChange={setViewDirectionId}
              skinTone={skinTone}
              previewAction={previewAction}
              clothingSprites={{
                shirt: selectedShirt?.sprites?.[selectedViewDirection.id],
                pants: selectedPants?.sprites?.[selectedViewDirection.id],
                shoes: selectedShoes?.sprites?.[selectedViewDirection.id]
              }}
              maleClothingSprites={{
                shirt: (previewAction === 'idle' ? maleIdleSprites.shirt : maleActionClothingSprites[previewAction]?.shirt)?.[selectedShirt?.id?.replace(/^shirt-/, '')] || maleIdleSprites.shirt[selectedShirt?.id?.replace(/^shirt-/, '')],
                pants: (previewAction === 'idle' ? maleIdleSprites.pants : maleActionClothingSprites[previewAction]?.pants)?.[selectedPants?.id?.replace(/^pants-/, '')] || maleIdleSprites.pants[selectedPants?.id?.replace(/^pants-/, '')],
                shoes: (previewAction === 'idle' ? maleIdleSprites.shoes : maleActionClothingSprites[previewAction]?.shoes)?.[selectedShoes?.id?.replace(/^shoes-/, '')] || maleIdleSprites.shoes[selectedShoes?.id?.replace(/^shoes-/, '')]
              }}
            />
          </div>
          <div className="character-action-controls" role="group" aria-label="Simulasi gerakan karakter">
            {[{ id: 'idle', label: 'Idle' }, { id: 'walk', label: 'Walk' }, ...Array.from({ length: 6 }, (_, index) => ({ id: `skill${index + 1}`, label: `Skill ${index + 1}`, disabled: index > 0 }))].map((action) => (
              <button
                key={action.id}
                type="button"
                className={`character-action-button ${previewAction === action.id ? 'selected' : ''}`}
                aria-pressed={previewAction === action.id}
                disabled={action.disabled}
                title={action.disabled ? 'Aset animasi skill ini belum tersedia' : action.id === 'skill1' ? 'Simulasi skill 1 (Fireball)' : `Simulasi ${action.label}`}
                onClick={() => setPreviewAction(action.id)}
              >{action.label}</button>
            ))}
          </div>
          </div>

          <div className="customization-controls">
            <div className="customization-tabs" role="tablist" aria-label="Kategori karakter">
              {tabs.map((tab) => (
                <CategoryTab
                  key={tab}
                  label={tab}
                  isSelected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                />
              ))}
            </div>

            <div className="customization-section">
            {activeTab === 'Rambut' && (
              <>
                <h2>Jenis Rambut</h2>
                <div className="option-grid option-grid-hair">
                  {optionSet.map((option) => (
                    <HairStyleButton
                      key={option.id}
                      option={option}
                      isSelected={selectedHair === option.id}
                      sprite={gender === 'Laki-laki' && hairSprites[option.id] ? hairSprites[option.id][hairColor] || null : null}
                      onSelect={() => handleOptionSelect(option)}
                    />
                  ))}
                </div>
              </>
            )}

            {activeTab !== 'Rambut' && (
              <>
                <h2>{activeTab}</h2>
                <div className="option-grid">
                  {optionSet.map((option) => (
                    <ClothingOptionButton
                      key={option.id}
                      label={option.label}
                      category={activeTab.toLowerCase()}
                      sprite={option.preview || option.sprites?.front || option.sprites?.[Object.keys(option.sprites || {})[0]]}
                      isSelected={option.id === selectedClothing?.id}
                      onClick={() => handleOptionSelect(option)}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="divider" />

            <h2>Gender Character</h2>
            <div className="gender-toggle" role="group" aria-label="Pilih gender karakter">
              {['Laki-laki', 'Perempuan'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`toggle-pill ${gender === item ? 'selected' : ''}`}
                  onClick={() => {
                    setGender(item);
                    if (item === 'Laki-laki') {
                      const nextHair = hairSprites[selectedHair] ? selectedHair : 'bun';
                      const nextHairColors = hairSprites[nextHair];
                      setSelectedHair(nextHair);
                      if (!nextHairColors[hairColor]) {
                        const fallbackColor = hairColorOptions.find(({ color }) => nextHairColors[color])?.color;
                        if (fallbackColor) setHairColor(fallbackColor);
                      }
                    }
                  }}
                  aria-pressed={gender === item}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="divider" />

            <h2>Warna Kulit</h2>
            <div className="option-grid color-grid">
              {skinTones.map((tone) => (
                <SwatchButton
                  key={tone}
                  label={`Warna kulit ${tone}`}
                  color={tone}
                  isSelected={skinTone === tone}
                  onClick={() => setSkinTone(tone)}
                />
              ))}
            </div>

            <div className="divider" />

            <h2>Warna Rambut</h2>
            <div className="option-grid color-grid wide-grid">
              {availableHairColorOptions.map(({ label, color }) => (
                <SwatchButton
                  key={color}
                  label={`Warna rambut ${label}`}
                  color={color}
                  isSelected={hairColor === color}
                  onClick={() => setHairColor(color)}
                />
              ))}
            </div>
            </div>

            <button type="button" className="confirm-button" onClick={() => {
              window.localStorage.setItem('gamukis_character_outfit', JSON.stringify({
                shirt: selectedShirt?.id,
                pants: selectedPants?.id,
                shoes: selectedShoes?.id
              }));
              window.localStorage.setItem('gamukis_character_appearance', JSON.stringify({
                version: 1,
                gender,
                hair: selectedHair,
                hairColor,
                skinTone,
                outfit: {
                  shirt: selectedShirt?.id,
                  pants: selectedPants?.id,
                  shoes: selectedShoes?.id
                },
                shirtSpriteSheets: Object.fromEntries(
                  Object.entries(maleShirtSpriteSets).map(([action, sprites]) => [
                    action,
                    sprites[selectedShirt?.id?.replace(/^shirt-/, '')] || null
                  ])
                ),
                layers: ['legs', 'pants', 'shoes', 'body', 'shirt', 'head', 'hands'],
                frameGrid: { columns: 4, rows: 4, directions: ['front', 'back', 'left', 'right'] },
                compatibleActions: ['idle', 'walk', 'skill']
              }));
              navigate('/profile');
            }}>
              Konfirmasi Karakter Anda
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CharacterCustomization;
