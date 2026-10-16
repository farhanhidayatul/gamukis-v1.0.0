/**
 * Automated Test Suite for Character Customization Walk Left Alignment & Skill 1 Direction Bug Fixes
 */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

describe('Character Customization - Walk Left & Skill 1 Direction Visual Fixes', () => {
  const frontendImagesDir = path.resolve(__dirname, '../../images/asset_game/character/gender/male');
  const cssPath = path.resolve(__dirname, '../../component/component_customization_char/characterCustomization.css');

  describe('1. Asset Cleanliness - No Stray Residual Pixels', () => {
    const walkFiles = [
      'walk/char_male_walk_body_color_1.png',
      'walk/char_male_walk_body_color_2.png',
      'walk/char_male_walk_body_color_3.png',
      'walk/char_male_walk_body_color_4.png',
      'walk/char_male_walk_legs_color_1.png',
      'walk/char_male_walk_legs_color_2.png',
      'walk/char_male_walk_legs_color_3.png',
      'walk/char_male_walk_legs_color_4.png',
      'walk/pants/black/walk_pants_black_sheet.png',
      'walk/pants/brown/walk_pants_brown_sheet.png',
      'walk/pants/green_cargo/walk_pants_green_cargo_sheet.png',
      'walk/pants/light_gray/walk_pants_light_gray_sheet.png',
      'walk/pants/original/walk_pants_original_sheet.png',
      'walk/shirt/camo/walk_shirt_camo_sheet.png',
      'walk/shirt/fire/walk_shirt_fire_sheet.png',
      'walk/shirt/ice/walk_shirt_ice_sheet.png',
      'walk/shirt/original/walk_shirt_original_sheet.png',
      'walk/shirt/purple/walk_shirt_purple_sheet.png'
    ];

    walkFiles.forEach((relPath) => {
      it(`walk asset ${relPath} should contain 0 stray pixels in row 2 (left) col 3 (x < 25)`, () => {
        const fullPath = path.join(frontendImagesDir, relPath);
        expect(fs.existsSync(fullPath)).toBe(true);
        const data = fs.readFileSync(fullPath);
        const png = PNG.sync.read(data);
        const cellW = png.width / 4;
        const cellH = png.height / 4;
        let strayCount = 0;
        // row 2 (facing left), col 3
        for (let y = 0; y < cellH; y++) {
          for (let x = 0; x < 25; x++) {
            const px = Math.floor(3 * cellW + x);
            const py = Math.floor(2 * cellH + y);
            const idx = (py * png.width + px) * 4;
            if (png.data[idx + 3] > 0) strayCount++;
          }
        }
        expect(strayCount).toBe(0);
      });
    });

    const fireballFiles = [
      'skill/fireball/shirt/camo/fireball_shirt_camo_sheet.png',
      'skill/fireball/shirt/fire/fireball_shirt_fire_sheet.png',
      'skill/fireball/shirt/ice/fireball_shirt_ice_sheet.png',
      'skill/fireball/shirt/original/fireball_shirt_original_sheet.png',
      'skill/fireball/shirt/purple/fireball_shirt_purple_sheet.png',
      'skill/fireball/char_male_use_skill_fireball_head_color_1.png',
      'skill/fireball/char_male_use_skill_fireball_head_color_2.png',
      'skill/fireball/char_male_use_skill_fireball_head_color_3.png',
      'skill/fireball/char_male_use_skill_fireball_head_color_4.png'
    ];

    fireballFiles.forEach((relPath) => {
      it(`fireball asset ${relPath} should contain 0 stray pixels in row 3 (right) col 2 (x < 25)`, () => {
        const fullPath = path.join(frontendImagesDir, relPath);
        expect(fs.existsSync(fullPath)).toBe(true);
        const data = fs.readFileSync(fullPath);
        const png = PNG.sync.read(data);
        const cellW = png.width / 4;
        const cellH = png.height / 4;
        let strayCount = 0;
        // row 3 (facing right), col 2
        for (let y = 0; y < cellH; y++) {
          for (let x = 0; x < 25; x++) {
            const px = Math.floor(2 * cellW + x);
            const py = Math.floor(3 * cellH + y);
            const idx = (py * png.width + px) * 4;
            if (png.data[idx + 3] > 0) strayCount++;
          }
        }
        expect(strayCount).toBe(0);
      });
    });
  });

  describe('2. CSS Alignment & Keyframe Rules', () => {
    let cssContent;
    beforeAll(() => {
      expect(fs.existsSync(cssPath)).toBe(true);
      cssContent = fs.readFileSync(cssPath, 'utf8');
    });

    it('should configure smooth walk left frame 3 percentage in .direction-left', () => {
      expect(cssContent).toMatch(/direction-left\s*\{[^}]*--walk-frame-x-3:\s*103\.8%/);
    });

    it('should keep Hair Model 2 walk-left at a fixed vertical anchor across all frames', () => {
      const previewPath = path.resolve(__dirname, '../../component/component_customization_char/molecules/CharacterPreview.js');
      const previewContent = fs.readFileSync(previewPath, 'utf8');
      expect(previewContent).toMatch(/const hair2FrameShiftX = lockLeftHair2Crop\s*\?\s*\[0, 0, 0, 0\]/);
      expect(previewContent).toMatch(/const hair2FrameShiftY = \[0, 0, 0, 0\]/);
      expect(cssContent).toMatch(/\.sprite-character-hair\s*\{[^}]*animation:\s*character-hair-sprite-frames/);
      expect(cssContent).toMatch(/@keyframes\s+character-hair-sprite-frames\s*\{[\s\S]*?--hair-frame-shift-y-0[\s\S]*?--hair-frame-shift-y-1[\s\S]*?--hair-frame-shift-y-2[\s\S]*?--hair-frame-shift-y-3/);
    });

    it('should retain the original Idle shirt anchors and unify Walk layer transforms', () => {
      expect(cssContent).toMatch(/\.sprite-character-preview\.direction-front\s+\.sprite-character-shirt-part\s*\{[^}]*translate\(4px,\s*calc\(var\(--idle-body-y,\s*0px\)\s*\+\s*4px\)\)/);
      expect(cssContent).toMatch(/\.sprite-character-preview\.direction-back\s+\.sprite-character-shirt-part\s*\{[^}]*translate\(6px,\s*var\(--idle-body-y,\s*0px\)\)/);
      expect(cssContent).toMatch(/\.sprite-character-preview\.direction-left\s+\.sprite-character-shirt-part\s*\{[^}]*translate\(2px,\s*calc\(var\(--idle-body-y,\s*0px\)\s*-\s*2px\)\)/);
      expect(cssContent).toMatch(/\.sprite-character-preview\.direction-right\s+\.sprite-character-shirt-part\s*\{[^}]*translate\(12px,\s*calc\(var\(--idle-body-y,\s*0px\)\s*-\s*5px\)\)/);
      expect(cssContent).toMatch(/\.sprite-character-preview\.action-walk\s+\.sprite-character-shirt-part[\s\S]*?transform:\s*translate3d\(0px,\s*var\(--idle-body-y,\s*0px\),\s*0\)\s*scale\(1\.1\)/);
      expect(cssContent).toMatch(/\.sprite-character-preview\.action-walk\s+\.sprite-character-walk-head-part[\s\S]*?transform:\s*translate3d\(0px,\s*var\(--idle-body-y,\s*0px\),\s*0\)\s*scale\(1\.1\)/);
      expect(cssContent).not.toMatch(/\.sprite-character-preview:not\(\.action-skill1\)\s+\.sprite-character-shirt-part\s*\{[^}]*background-position-y:\s*var\(--shirt-frame-y/);
    });

    it('should configure smooth walk left keyframe 75%-100% stop at 103.8%', () => {
      expect(cssContent).toMatch(/@keyframes\s+character-walk-body-bob-left\s*\{[\s\S]*?75%,\s*100%\s*\{[^}]*--walk-frame-x-3,\s*103\.8%\)/);
    });

    it('should configure skill 1 frame variables for all 4 directions', () => {
      expect(cssContent).toMatch(/direction-front\s*\{[^}]*--skill-frame-x-0:\s*-4\.2%/);
      expect(cssContent).toMatch(/direction-back\s*\{[^}]*--skill-frame-x-0:\s*-4\.41%/);
      expect(cssContent).toMatch(/direction-left\s*\{[^}]*--skill-frame-x-0:\s*-3\.38%/);
      expect(cssContent).toMatch(/direction-right\s*\{[^}]*--skill-frame-x-0:\s*-7\.11%/);
    });

    it('should use skill frame variables in character-action-frames keyframe', () => {
      expect(cssContent).toMatch(/@keyframes\s+character-action-frames\s*\{[\s\S]*?--idle-frame-x:\s*var\(--skill-frame-x-0/);
    });

    it('should hide idle hands during action-skill1 and action-walk', () => {
      expect(cssContent).toMatch(/\.sprite-character-preview\.action-skill1\s+\.sprite-character-hands\s*\{[^}]*display:\s*none\s*!important/);
      expect(cssContent).toMatch(/\.sprite-character-preview\.action-walk\s+\.sprite-character-hands\s*\{[^}]*display:\s*none\s*!important/);
    });

    it('should synchronize body and shirt translation in action-skill1 without idle offset drift', () => {
      expect(cssContent).toMatch(/\.sprite-character-preview\.action-skill1\s+\.sprite-character-shirt-part\s*\{[^}]*transform:\s*translate3d\(0px,\s*var\(--idle-body-y,\s*0px\),\s*0\)\s*scale\(1\.1\)\s*!important/);
    });

    it('should align head and hair across all 4 directions in action-skill1', () => {
      expect(cssContent).toMatch(/\.sprite-character-preview\.action-skill1\.direction-front\s+\.sprite-character-head-image\s*\{[^}]*translateY\(calc\(var\(--idle-head-y,\s*0px\)\s*\+\s*4px\)\)/);
      expect(cssContent).toMatch(/\.sprite-character-preview\.action-skill1\.direction-front\s*\{[^}]*--hair-head-anchor-y:\s*4px/);
      expect(cssContent).toMatch(/\.sprite-character-preview\.action-skill1\.direction-left\s+\.sprite-character-head-image\s*\{[^}]*translateY\(calc\(var\(--idle-head-y,\s*0px\)\s*\+\s*2px\)\)/);
      expect(cssContent).toMatch(/\.sprite-character-preview\.action-skill1\.direction-left\s*\{[^}]*--hair-head-anchor-y:\s*2px/);
      expect(cssContent).toMatch(/\.sprite-character-preview\.action-skill1\.direction-right\s+\.sprite-character-head-image\s*\{[^}]*translateY\(calc\(var\(--idle-head-y,\s*0px\)\s*\+\s*4px\)\)/);
      expect(cssContent).toMatch(/\.sprite-character-preview\.action-skill1\.direction-right\s*\{[^}]*--hair-head-anchor-y:\s*4px/);
      expect(cssContent).toMatch(/@keyframes\s+character-hair-sprite-frames\s*\{[\s\S]*?--hair-frame-shift-x-1[\s\S]*?--hair-frame-shift-y-1[\s\S]*?--hair-head-anchor-y/);
      expect(cssContent).toMatch(/\.sprite-character-preview\.action-skill1\s+\.sprite-character-hair\s*\{[^}]*animation-duration:\s*0\.95s/);
      expect(cssContent).toMatch(/\.sprite-character-preview\.action-walk\s+\.sprite-character-hair\s*\{[^}]*animation-duration:\s*0\.8s/);
      const previewPath = path.resolve(__dirname, '../../component/component_customization_char/molecules/CharacterPreview.js');
      expect(fs.readFileSync(previewPath, 'utf8')).toMatch(/<span\s+key=\{previewAction\}\s+className="sprite-character-hair"/);
    });
  });

  describe('3. In-Game Renderer (customCharacterRenderer.css) Synchronization', () => {
    const customCssPath = path.resolve(__dirname, '../../component/component_game/customCharacterRenderer.css');
    let customCssContent;
    beforeAll(() => {
      expect(fs.existsSync(customCssPath)).toBe(true);
      customCssContent = fs.readFileSync(customCssPath, 'utf8');
    });

    it('should hide idle hands during action-skill1 in in-game renderer', () => {
      expect(customCssContent).toMatch(/\.sprite-character-preview\.action-skill1\s+\.sprite-character-hands\s*\{[^}]*display:\s*none\s*!important/);
    });
  });

  describe('4. Skill 1 Front View Cleanliness - No Stray Idle Cuff Pixels', () => {
    const frontFireballShirts = [
      'skill/fireball/shirt/camo/fireball_shirt_camo_sheet.png',
      'skill/fireball/shirt/fire/fireball_shirt_fire_sheet.png',
      'skill/fireball/shirt/ice/fireball_shirt_ice_sheet.png',
      'skill/fireball/shirt/original/fireball_shirt_original_sheet.png',
      'skill/fireball/shirt/purple/fireball_shirt_purple_sheet.png',
      'skill/fireball/char_male_use_skill_fireball_body_color_1.png',
      'skill/fireball/char_male_use_skill_fireball_body_color_2.png',
      'skill/fireball/char_male_use_skill_fireball_body_color_3.png',
      'skill/fireball/char_male_use_skill_fireball_body_color_4.png'
    ];

    frontFireballShirts.forEach((relPath) => {
      it(`fireball asset ${relPath} should contain 0 stray idle cuff pixels in row 0 (front) col 0 wings`, () => {
        const fullPath = path.join(frontendImagesDir, relPath);
        expect(fs.existsSync(fullPath)).toBe(true);
        const data = fs.readFileSync(fullPath);
        const png = PNG.sync.read(data);
        let strayCount = 0;
        // Col 0 wings: y between 375 and 435, x < 57 or (x > 185 and x < 243)
        for (let y = 375; y <= 435; y++) {
          for (let x = 0; x < 57; x++) {
            const idx = (y * png.width + x) * 4;
            if (png.data[idx + 3] > 0) strayCount++;
          }
          for (let x = 185; x < 243; x++) {
            const idx = (y * png.width + x) * 4;
            if (png.data[idx + 3] > 0) strayCount++;
          }
        }
        expect(strayCount).toBe(0);
      });
    });
  });
});

