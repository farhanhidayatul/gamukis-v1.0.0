import { loadSavedAppearance } from '../../component/component_game/inGame';
import {
  fetchCharacterTemplates,
  fetchCharacters,
  fetchCharacterById,
  createCharacter,
  updateCharacter,
  setActiveCharacter,
  deleteCharacter
} from '../../database/characterApi';

describe('Character Customization & InGame Integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Character Appearance Loading (inGame)', () => {
    it('returns null when localStorage is empty', () => {
      const appearance = loadSavedAppearance();
      expect(appearance).toBeNull();
    });

    it('returns parsed appearance when valid localStorage exists', () => {
      const mockAppearance = {
        version: 1,
        gender: 'Laki-laki',
        hair: 'bun',
        hairColor: '#1D2430',
        skinTone: '#F6D7B5',
        outfit: {
          shirt: 'shirt-fire',
          pants: 'pants-black',
          shoes: 'shoes-boots_black'
        }
      };
      window.localStorage.setItem('gamukis_character_appearance', JSON.stringify(mockAppearance));

      const appearance = loadSavedAppearance();
      expect(appearance).not.toBeNull();
      expect(appearance.gender).toBe('Laki-laki');
      expect(appearance.hair).toBe('bun');
      expect(appearance.outfit.shirt).toBe('shirt-fire');
    });

    it('safely merges gamukis_character_outfit if present', () => {
      const mockAppearance = {
        gender: 'Laki-laki',
        hair: 'short',
        outfit: { shirt: 'shirt-original' }
      };
      const mockOutfit = { shirt: 'shirt-ice', pants: 'pants-light_gray' };

      window.localStorage.setItem('gamukis_character_appearance', JSON.stringify(mockAppearance));
      window.localStorage.setItem('gamukis_character_outfit', JSON.stringify(mockOutfit));

      const appearance = loadSavedAppearance();
      expect(appearance.outfit.shirt).toBe('shirt-ice');
      expect(appearance.outfit.pants).toBe('pants-light_gray');
    });

    it('returns null on invalid or corrupted JSON gracefully', () => {
      window.localStorage.setItem('gamukis_character_appearance', 'corrupted{json');
      const appearance = loadSavedAppearance();
      expect(appearance).toBeNull();
    });
  });

  describe('Guest Fallback Flow & Template Selection', () => {
    it('allows guest to select a template, save to localStorage, and load correctly in-game', () => {
      const templateAppearance = {
        version: 1,
        gender: 'Laki-laki',
        hair: 'wave',
        hairColor: '#3B82F6',
        skinTone: '#F6D7B5',
        outfit: {
          shirt: 'shirt-ice',
          pants: 'pants-light_gray',
          shoes: 'shoes-sneakers_blue'
        },
        layers: ['legs', 'pants', 'shoes', 'body', 'shirt', 'head', 'hands'],
        frameGrid: { columns: 4, rows: 4, directions: ['front', 'back', 'left', 'right'] },
        compatibleActions: ['idle', 'walk', 'skill']
      };

      // Guest flow writes both keys to localStorage
      window.localStorage.setItem('gamukis_character_appearance', JSON.stringify(templateAppearance));
      window.localStorage.setItem('gamukis_character_outfit', JSON.stringify({
        shirt: 'shirt-ice',
        pants: 'pants-light_gray',
        shoes: 'shoes-sneakers_blue'
      }));

      const loaded = loadSavedAppearance();
      expect(loaded).not.toBeNull();
      expect(loaded.version).toBe(1);
      expect(loaded.gender).toBe('Laki-laki');
      expect(loaded.hair).toBe('wave');
      expect(loaded.hairColor).toBe('#3B82F6');
      expect(loaded.skinTone).toBe('#F6D7B5');
      expect(loaded.outfit).toEqual({
        shirt: 'shirt-ice',
        pants: 'pants-light_gray',
        shoes: 'shoes-sneakers_blue'
      });
      expect(loaded.compatibleActions).toEqual(['idle', 'walk', 'skill']);
    });
  });

  describe('Character API Client', () => {
    it('fetchCharacterTemplates returns empty array on network failure without throwing', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      const templates = await fetchCharacterTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates).toEqual([]);
    });

    it('fetchCharacterTemplates returns template list on successful response', async () => {
      const mockTemplates = [
        { templateId: 't1', name: 'Warrior' },
        { templateId: 't2', name: 'Mage' }
      ];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ templates: mockTemplates })
      });

      const templates = await fetchCharacterTemplates();
      expect(templates).toHaveLength(2);
      expect(templates[0].templateId).toBe('t1');
    });

    it('fetchCharacters returns fallback { characters: [], max: 5 } when unauthenticated', async () => {
      // With no token stored, getEffectiveToken returns null
      const res = await fetchCharacters();
      expect(res).toEqual({ characters: [], max: 5 });
    });

    it('createCharacter throws error when unauthenticated', async () => {
      await expect(createCharacter('Hero', {})).rejects.toThrow('Authentication required');
    });

    it('setActiveCharacter throws error when unauthenticated', async () => {
      await expect(setActiveCharacter(1)).rejects.toThrow('Authentication required');
    });

    it('fetchCharacterById throws error when unauthenticated', async () => {
      await expect(fetchCharacterById(1)).rejects.toThrow('Authentication required');
    });

    it('updateCharacter throws error when unauthenticated', async () => {
      await expect(updateCharacter(1, 'Hero', {})).rejects.toThrow('Authentication required');
    });

    it('deleteCharacter throws error when unauthenticated', async () => {
      await expect(deleteCharacter(1)).rejects.toThrow('Authentication required');
    });

    describe('Authenticated API Operations', () => {
      const testToken = 'mock-test-jwt-token';

      beforeEach(() => {
        window.localStorage.setItem('gamukis_manual_token', testToken);
      });

      afterEach(() => {
        window.localStorage.removeItem('gamukis_manual_token');
      });

      it('createCharacter sends POST request with Authorization header and payload', async () => {
        const payload = {
          version: 1,
          gender: 'Laki-laki',
          hair: 'short',
          hairColor: '#1D2430',
          skinTone: '#F6D7B5',
          outfit: { shirt: 'shirt-fire', pants: 'pants-black', shoes: 'shoes-boots_black' }
        };

        const mockResponse = {
          message: 'Karakter berhasil disimpan.',
          character: { id: 10, name: 'Hero', data: payload, isActive: true }
        };

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 201,
          json: async () => mockResponse
        });

        const result = await createCharacter('Hero', payload);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/characters'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              Authorization: `Bearer ${testToken}`,
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify({ name: 'Hero', data: payload })
          })
        );
        expect(result.character.id).toBe(10);
        expect(result.character.isActive).toBe(true);
        expect(result.character.data).toEqual(payload);
      });

      it('setActiveCharacter sends PATCH request to /:id/active', async () => {
        const mockResponse = {
          message: 'Karakter aktif diperbarui.',
          character: { id: 10, isActive: true }
        };

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockResponse
        });

        const result = await setActiveCharacter(10);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/characters/10/active'),
          expect.objectContaining({
            method: 'PATCH',
            headers: expect.objectContaining({
              Authorization: `Bearer ${testToken}`
            })
          })
        );
        expect(result.character.isActive).toBe(true);
      });

      it('fetchCharacters sends GET request with Authorization header and returns characters', async () => {
        const mockData = {
          characters: [
            { id: 10, name: 'Hero', isActive: true, data: { version: 1 } },
            { id: 11, name: 'Mage', isActive: false, data: { version: 1 } }
          ],
          max: 5
        };

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockData
        });

        const result = await fetchCharacters();
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/characters'),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: `Bearer ${testToken}`
            })
          })
        );
        expect(result.characters).toHaveLength(2);
        expect(result.characters[0].isActive).toBe(true);
      });

      it('updateCharacter sends PUT request to /:id', async () => {
        const updatePayload = { version: 1, hair: 'bob' };
        const mockResponse = {
          message: 'Karakter berhasil diperbarui.',
          character: { id: 10, name: 'Hero Updated', data: updatePayload }
        };

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockResponse
        });

        const result = await updateCharacter(10, 'Hero Updated', updatePayload);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/characters/10'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ name: 'Hero Updated', data: updatePayload })
          })
        );
        expect(result.character.name).toBe('Hero Updated');
      });

      it('deleteCharacter sends DELETE request to /:id', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ success: true, message: 'Karakter dihapus.' })
        });

        const result = await deleteCharacter(10);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/characters/10'),
          expect.objectContaining({
            method: 'DELETE'
          })
        );
        expect(result.success).toBe(true);
      });

      it('throws error with server message on HTTP error', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 409,
          json: async () => ({ message: 'Maksimal 5 karakter untuk paket Anda.' })
        });

        await expect(createCharacter('Overflow', {})).rejects.toThrow('Maksimal 5 karakter untuk paket Anda.');
      });
    });
  });
});
