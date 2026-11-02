/**
 * Automated Test Suite for Profile Character Slot Management & Customization Preview Animation
 */

const fs = require('fs');
const path = require('path');

describe('Profile Character Slots & Customization Preview Animation', () => {
  const customizationJsPath = path.resolve(__dirname, '../../component/component_customization_char/characterCustomization.js');
  const customizationCssPath = path.resolve(__dirname, '../../component/component_customization_char/characterCustomization.css');
  const profileJsPath = path.resolve(__dirname, '../../pages/profile.js');
  const profileCssPath = path.resolve(__dirname, '../../pages/profile.css');

  describe('1. Static Idle vs Animated Jurus in Customization CSS', () => {
    let cssContent;

    beforeAll(() => {
      expect(fs.existsSync(customizationCssPath)).toBe(true);
      cssContent = fs.readFileSync(customizationCssPath, 'utf8');
    });

    it('enforces active idle bobbing animation on action-idle preview', () => {
      expect(cssContent).toMatch(/\.sprite-character-preview\.action-idle\s*\{[^}]*animation:\s*character-idle-bob/);
    });

    it('enforces active animation when action-walk or action-skill1 jurus are checked', () => {
      expect(cssContent).toMatch(/\.sprite-character-preview\.action-walk\s*\{[^}]*animation:\s*character-walk-body-bob/);
      expect(cssContent).toMatch(/\.sprite-character-preview\.action-skill1\s*\{[^}]*animation:\s*character-action-frames/);
    });
  });

  describe('2. Customization Page CTA & Feedback Verification', () => {
    let jsContent;

    beforeAll(() => {
      expect(fs.existsSync(customizationJsPath)).toBe(true);
      jsContent = fs.readFileSync(customizationJsPath, 'utf8');
    });

    it('displays "Konfirmasi Karakter Anda" on primary button', () => {
      expect(jsContent).toContain('Konfirmasi Karakter Anda');
    });

    it('stores character appearance and outfit to localStorage and profile without forced immediate navigate', () => {
      expect(jsContent).toContain("window.localStorage.setItem('gamukis_character_outfit'");
      expect(jsContent).toContain("window.localStorage.setItem('gamukis_character_appearance'");
      expect(jsContent).toContain('berhasil dikonfirmasi dan disimpan ke profil Anda');
    });

    it('provides secondary navigation links to profile and game', () => {
      expect(jsContent).toContain('Lihat di Profil');
      expect(jsContent).toContain('Masuk ke Game');
    });
  });

  describe('3. Profile Page Character Slot Management Integration', () => {
    let profileJsContent;
    let profileCssContent;

    beforeAll(() => {
      expect(fs.existsSync(profileJsPath)).toBe(true);
      expect(fs.existsSync(profileCssPath)).toBe(true);
      profileJsContent = fs.readFileSync(profileJsPath, 'utf8');
      profileCssContent = fs.readFileSync(profileCssPath, 'utf8');
    });

    it('imports and renders SavedCharacterList inside profile page', () => {
      expect(profileJsContent).toContain('import SavedCharacterList from "../component/component_customization_char/molecules/SavedCharacterList"');
      expect(profileJsContent).toContain('<SavedCharacterList');
      expect(profileJsContent).toContain('profile-characters-card');
    });

    it('wires up character activation, editing load, and deletion handlers in profile', () => {
      expect(profileJsContent).toContain('handleActivateCharacter');
      expect(profileJsContent).toContain('handleDeleteCharacter');
      expect(profileJsContent).toContain('handleLoadCharacter');
      expect(profileJsContent).toContain('fetchCharacters');
    });

    it('styles profile-characters-card matching Gamukis theme in profile.css', () => {
      expect(profileCssContent).toContain('.profile-characters-card');
      expect(profileCssContent).toContain('.profile-character-feedback');
      expect(profileCssContent).toContain('.profile-characters-layout');
      expect(profileCssContent).toContain('.profile-character-preview-card');
    });

    it('renders visual character sprite preview via CustomCharacterRenderer in profile', () => {
      expect(profileJsContent).toContain('CustomCharacterRenderer');
      expect(profileJsContent).toContain('profile-character-preview-card');
      expect(profileJsContent).toContain('profile-character-visual-stage');
      expect(profileJsContent).toContain('loadStoredAppearance');
    });
  });
});
