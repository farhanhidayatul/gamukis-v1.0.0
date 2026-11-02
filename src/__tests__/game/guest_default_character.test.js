const fs = require('fs');
const path = require('path');

describe('Guest Default Character Enforcement Suite', () => {
  const playerInfoPath = path.resolve(__dirname, '../../component/component_game/playerInfo.js');
  const customCssPath = path.resolve(__dirname, '../../component/component_game/customCharacterRenderer.css');
  const inGamePath = path.resolve(__dirname, '../../component/component_game/inGame.js');

  test('playerInfo.js strictly guards guest status and isolates custom appearance to registered users', () => {
    expect(fs.existsSync(playerInfoPath)).toBe(true);
    const content = fs.readFileSync(playerInfoPath, 'utf8');

    // 1. Must check isGuestPlayer based on isCurrentPlayer or player.isGuest
    expect(content).toMatch(/isGuestPlayer\s*=\s*isCurrentPlayer\s*\?\s*Boolean\(isGuest\)\s*:\s*\(player\?\.isGuest/);

    // 2. Custom appearance MUST only be true if NOT a guest
    expect(content).toMatch(/hasCustomAppearance\s*=\s*!isGuestPlayer\s*&&\s*hasAppearanceData/);

    // 3. For default character, color 'man' renders SVG, while palette colors render 16x16 pixel sprite
    expect(content).toMatch(/isSvgCharacter\s*=\s*\(charColor\)\s*=>/);
    expect(content).toMatch(/!charColor\s*\|\|\s*charColor\s*===\s*['"]man['"]\s*\|\|\s*charColor\s*===\s*['"]guest['"]/);

    // 4. Fallback rendering branches
    expect(content).toMatch(/hasCustomAppearance\s*\?\s*\(\s*<CustomCharacterRenderer/);
    expect(content).toMatch(/isSvg\s*\?\s*\(\s*<div\s+className="Character_svg grid-cell"/);
    expect(content).toMatch(/<div\s+className="Character_sprite grid-cell"/);
  });

  test('customCharacterRenderer.css defines rules for Character_svg, Character_sprite, and Character_shadow', () => {
    expect(fs.existsSync(customCssPath)).toBe(true);
    const css = fs.readFileSync(customCssPath, 'utf8');

    // 1. Shadow asset
    expect(css).toMatch(/\.game-wrapper\s+\.Character(\.has-custom-appearance|:not\(\.has-custom-appearance\))\s+\.Character_shadow/);
    expect(css).toMatch(/shadow\.png/);

    // 2. SVG character asset
    expect(css).toMatch(/\.game-wrapper\s+\.Character(:not\(\.has-custom-appearance\))?\s+\.Character_svg/);
    expect(css).toMatch(/char-man-1\.svg/);

    // 3. Pixel sprite asset and direction coords
    expect(css).toMatch(/\.game-wrapper\s+\.Character(:not\(\.has-custom-appearance\))?\s+\.Character_sprite/);
    expect(css).toMatch(/characters\.png/);
    expect(css).toMatch(/data-direction=["']right["']\]\s+\.Character_sprite/);

    // 4. Color variations for default sprite
    expect(css).toMatch(/data-color=["']blue["']/);
    expect(css).toMatch(/data-color=["']red["']/);
    expect(css).toMatch(/data-color=["']orange["']/);
    expect(css).toMatch(/data-color=["']yellow["']/);
    expect(css).toMatch(/data-color=["']green["']/);
    expect(css).toMatch(/data-color=["']purple["']/);
  });

  test('inGame.js ensures guest players have appearance set to null', () => {
    expect(fs.existsSync(inGamePath)).toBe(true);
    const inGameContent = fs.readFileSync(inGamePath, 'utf8');

    // Guest resolved appearance must be null
    expect(inGameContent).toMatch(/resolvedAppearance\s*=\s*guest\s*\?\s*null\s*:\s*loadSavedAppearance\(\)/);

    // Anonymous auth effect resets appearance to null
    expect(inGameContent).toMatch(/updatePlayer\(\{\s*name:\s*guestName,\s*appearance:\s*null\s*\}\)/);

    // Player rendering passes null appearance for guests
    expect(inGameContent).toMatch(/appearance=\{key\s*===\s*playerId\s*\?\s*\(isGuest\s*\?\s*null\s*:\s*currentAppearance\)/);
  });
});
