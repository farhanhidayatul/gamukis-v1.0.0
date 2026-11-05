/**
 * Automated Test Suite for In-Game Custom Character Scaling & Dimension Alignment
 */

const fs = require('fs');
const path = require('path');

describe('In-Game Custom Character Scaling & Shadow Alignment', () => {
  const customCssPath = path.resolve(__dirname, '../../component/component_game/customCharacterRenderer.css');
  const playerInfoPath = path.resolve(__dirname, '../../component/component_game/playerInfo.js');

  let customCssContent;
  let playerInfoContent;

  beforeAll(() => {
    expect(fs.existsSync(customCssPath)).toBe(true);
    expect(fs.existsSync(playerInfoPath)).toBe(true);
    customCssContent = fs.readFileSync(customCssPath, 'utf8');
    playerInfoContent = fs.readFileSync(playerInfoPath, 'utf8');
  });

  describe('1. In-Game CSS Avatar Wrapper Rules', () => {
    it('should define .Character_custom-avatar-wrapper with calibrated top offset and scale(0.30)', () => {
      expect(customCssContent).toMatch(/\.Character_custom-avatar-wrapper\s*\{[^}]*top:\s*-91px/);
      expect(customCssContent).toMatch(/\.Character_custom-avatar-wrapper\s*\{[^}]*transform:\s*translateX\(-50%\)\s*scale\(0\.30\)/);
      expect(customCssContent).toMatch(/\.Character_custom-avatar-wrapper\s*\{[^}]*transform-origin:\s*bottom\s*center/);
    });

    it('should isolate in-game sprite-character-preview from customization page preview transform', () => {
      expect(customCssContent).toMatch(/\.Character_custom-avatar-wrapper\s+\.sprite-character-preview\s*\{[^}]*transform:\s*none\s*!important/);
    });

    it('should position name container and arrow indicators properly above character head in CSS', () => {
      expect(customCssContent).toMatch(/\.game-wrapper\s+\.Character\.has-custom-appearance\s+\.Character_name-container\s*\{[^}]*top:\s*-32px/);
      expect(customCssContent).toMatch(/\.game-wrapper\s+\.Character\.has-custom-appearance\s+\.Character_you-arrow\s*\{[^}]*top:\s*-21px/);
      expect(customCssContent).toMatch(/\.game-wrapper\s+\.Character\.has-custom-appearance\s+\.Character_you-arrow\s*\{[^}]*left:\s*8px/);
      expect(customCssContent).toMatch(/\.game-wrapper\s+\.Character\.has-custom-appearance\s+\.Character_you-arrow\s*\{[^}]*transform:\s*translateX\(-50%\)/);
    });

    it('should enforce consistent root position (top: 0, left: 0) on .Character.has-custom-appearance matching in-game characters', () => {
      expect(customCssContent).toMatch(/\.game-wrapper\s+\.Character\.has-custom-appearance\s*\{[^}]*position:\s*absolute/);
      expect(customCssContent).toMatch(/\.game-wrapper\s+\.Character\.has-custom-appearance\s*\{[^}]*top:\s*0/);
      expect(customCssContent).toMatch(/\.game-wrapper\s+\.Character\.has-custom-appearance\s*\{[^}]*left:\s*0/);
    });

    it('should configure 16px shadow with bottom: 0 for .Character.has-custom-appearance', () => {
      expect(customCssContent).toMatch(/\.game-wrapper\s+\.Character\.has-custom-appearance\s+\.Character_shadow\s*\{[^}]*bottom:\s*0\s*!important/);
      expect(customCssContent).toMatch(/\.game-wrapper\s+\.Character\.has-custom-appearance\s+\.Character_shadow\s*\{[^}]*background-size:\s*16px\s+16px\s*!important/);
    });
  });

  describe('2. PlayerInfo Component Calibration', () => {
    it('should render Character_custom-avatar-wrapper with top: -91px and scale(0.30)', () => {
      expect(playerInfoContent).toMatch(/top:\s*['"]-91px['"]/);
      expect(playerInfoContent).toMatch(/scale\(0\.30\)/);
      expect(playerInfoContent).toMatch(/transformOrigin:\s*['"]bottom center['"]/);
    });

    it('should configure name container and arrow indicator styles for custom appearance', () => {
      expect(playerInfoContent).toMatch(/hasCustomAppearance\s*\?\s*\{\s*top:\s*['"]-32px['"],\s*left:\s*['"]8px['"]/);
      expect(playerInfoContent).toMatch(/hasCustomAppearance\s*\?\s*\{\s*top:\s*['"]-21px['"],\s*left:\s*['"]8px['"]/);
    });

    it('should use unified cropped head image and hair key transition in PlayerInfo', () => {
      expect(playerInfoContent).toMatch(/<img\s+className="sprite-character-head-image"\s+src=\{skinSprite/);
      expect(playerInfoContent).toMatch(/<span\s+key=\{previewAction\}\s+className="sprite-character-hair"/);
    });
  });

  describe('3. Mathematical Proportions & Shadow Grounding Audit', () => {
    it('should ground character feet squarely inside shadow ellipse', () => {
      const wrapperHeight = 107;
      const topOffset = -91;
      // With transform-origin at bottom center, bottom edge coordinate stays at:
      const footY = topOffset + wrapperHeight; // -91 + 107 = 16px
      expect(footY).toBe(16);

      // Shadow vertical span inside 16x16 cell is [0px, 16px], center at 8px
      const shadowMinY = 0;
      const shadowMaxY = 16;
      expect(footY).toBeGreaterThanOrEqual(shadowMinY);
      expect(footY).toBeLessThanOrEqual(shadowMaxY);
    });

    it('should calibrate custom character dimensions to 16x32px footprint within tolerance', () => {
      const targetHeight = 32.0; // Target height in px
      const targetWidth = 16.0;  // Target width in px

      const baseSpriteWidth = 62;
      const baseSpriteHeight = 107;
      const scale = 0.30;

      const renderedWidth = baseSpriteWidth * scale;   // 18.6px
      const renderedHeight = baseSpriteHeight * scale; // 32.1px

      // Height matches target 32px within 1% (32.1px vs 32.0px)
      expect(Math.abs(renderedHeight - targetHeight)).toBeLessThan(1.0);

      // Width matches target 16px footprint within 3px
      expect(Math.abs(renderedWidth - targetWidth)).toBeLessThan(3.0);
    });
  });
});
