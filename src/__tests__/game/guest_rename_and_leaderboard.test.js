const React = require('react');
const { formatLeaderboardPlayerName } = require('../../component/component_game/leaderboard');

describe('Guest Leaderboard & One-Time Rename Suite', () => {
  describe('formatLeaderboardPlayerName', () => {
    test('converts empty or null players to Guest or Unknown', () => {
      expect(formatLeaderboardPlayerName(null)).toBe('Unknown');
      expect(formatLeaderboardPlayerName({})).toBe('Guest');
      expect(formatLeaderboardPlayerName({ name: '' })).toBe('Guest');
      expect(formatLeaderboardPlayerName('   ')).toBe('Guest');
    });

    test('converts raw guest IDs and numeric strings to Guest', () => {
      expect(formatLeaderboardPlayerName({ id: 'guest_1792356178429', name: 'guest_1792356178429', isGuest: true })).toBe('Guest');
      expect(formatLeaderboardPlayerName({ id: 'guest_9999', name: '1792356178', isGuest: true })).toBe('Guest');
      expect(formatLeaderboardPlayerName({ id: 'guest_123', name: 'guest_123' })).toBe('Guest');
      expect(formatLeaderboardPlayerName({ id: 'guest_456', name: '123456789' })).toBe('Guest');
    });

    test('preserves explicitly renamed guest custom names', () => {
      expect(formatLeaderboardPlayerName({
        id: 'guest_1792356178429',
        name: 'Budi Santoso',
        isGuest: true,
        hasCustomName: true
      })).toBe('Budi Santoso');

      expect(formatLeaderboardPlayerName({
        id: 'guest_1792356178429',
        name: 'Warrior77',
        isGuest: true,
        isRenamed: true
      })).toBe('Warrior77');
    });

    test('preserves registered user account names', () => {
      expect(formatLeaderboardPlayerName({
        id: 'manual_1',
        name: 'Nanang Kusuma',
        isGuest: false
      })).toBe('Nanang Kusuma');

      expect(formatLeaderboardPlayerName({
        id: 'google_uid_123',
        username: 'Siti Aminah',
        isGuest: false
      })).toBe('Siti Aminah');
    });
  });

  describe('style.css responsive color button rules', () => {
    const fs = require('fs');
    const path = require('path');
    const stylePath = path.resolve(__dirname, '../../component/component_game/style.css');

    test('hides player-info__color-action on desktop and displays it on tablet/mobile', () => {
      expect(fs.existsSync(stylePath)).toBe(true);
      const css = fs.readFileSync(stylePath, 'utf8');

      // 1. Default desktop hide
      expect(css).toMatch(/\.game-wrapper\s+\.player-info__color-action\s*\{\s*display:\s*none;/);

      // 2. Responsive max-width 900px display block
      expect(css).toMatch(/@media\s*\(max-width:\s*900px\)\s*\{\s*\.game-wrapper\s+\.player-info__color-action\s*\{\s*display:\s*block;/);
    });

    test('defines player-name-button and locked input styles', () => {
      const css = fs.readFileSync(stylePath, 'utf8');
      expect(css).toMatch(/\.player-name-button/);
      expect(css).toMatch(/\.player-name-input--locked/);
      expect(css).toMatch(/\.player-name-badge/);
    });
  });
});
