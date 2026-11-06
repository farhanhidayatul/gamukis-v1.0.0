import { getEffectiveToken } from './firebaseDatabase';

const API_BASE_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL
  : 'https://api.gamukis.site/api';

const CLEAN_API_URL = API_BASE_URL.replace(/\/+$/, '');
const CHARACTERS_URL = `${CLEAN_API_URL}/characters`;

/**
 * Fetch predefined character templates (publicly accessible).
 * Works for both guest users and registered users without requiring an auth token.
 *
 * @returns {Promise<Array<Object>>} List of templates or empty array fallback on network error
 */
export const fetchCharacterTemplates = async () => {
  try {
    const res = await fetch(`${CHARACTERS_URL}/templates`);
    if (!res.ok) {
      throw new Error(`Failed to fetch templates: ${res.status}`);
    }
    const data = await res.json();
    return data.templates || [];
  } catch (error) {
    console.warn('fetchCharacterTemplates error, returning fallback:', error);
    return [];
  }
};

/**
 * Fetch all characters for the authenticated user and their maximum slot limit.
 * If unauthenticated (token missing or 401/403), gracefully returns empty list with default slots.
 *
 * @returns {Promise<{ characters: Array<Object>, max: number }>}
 */
export const fetchCharacters = async () => {
  const token = await getEffectiveToken();
  if (!token) return { characters: [], max: 5 };

  const res = await fetch(CHARACTERS_URL, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return { characters: [], max: 5 };
    }
    throw new Error(`Failed to fetch characters: ${res.status}`);
  }

  return await res.json();
};

/**
 * Fetch a specific character by ID.
 *
 * @param {number|string} id - Character ID
 * @returns {Promise<Object>} Character data object
 * @throws {Error} When unauthenticated or if the request fails
 */
export const fetchCharacterById = async (id) => {
  const token = await getEffectiveToken();
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`${CHARACTERS_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch character ${id}: ${res.status}`);
  }

  const data = await res.json();
  return data.character;
};

/**
 * Create a new character for the authenticated user.
 *
 * @param {string} name - Character name (2-50 chars)
 * @param {Object} data - Appearance payload object
 * @returns {Promise<Object>} Creation response containing character data
 * @throws {Error} If unauthenticated, quota exceeded (409), or server error
 */
export const createCharacter = async (name, data) => {
  const token = await getEffectiveToken();
  if (!token) throw new Error('Authentication required');

  const res = await fetch(CHARACTERS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name, data })
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(body.message || `Failed to create character: ${res.status}`);
    error.status = res.status;
    throw error;
  }

  return body;
};

/**
 * Update an existing character's name and/or appearance.
 *
 * @param {number|string} id - Character ID
 * @param {string} [name] - Updated character name
 * @param {Object} [data] - Updated appearance payload object
 * @returns {Promise<Object>} Update response containing updated character
 * @throws {Error} If unauthenticated or request fails
 */
export const updateCharacter = async (id, name, data) => {
  const token = await getEffectiveToken();
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`${CHARACTERS_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name, data })
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(body.message || `Failed to update character: ${res.status}`);
    error.status = res.status;
    throw error;
  }

  return body;
};

/**
 * Mark a character as active for gameplay.
 *
 * @param {number|string} id - Character ID
 * @returns {Promise<Object>} Response confirmation
 * @throws {Error} If unauthenticated or request fails
 */
export const setActiveCharacter = async (id) => {
  const token = await getEffectiveToken();
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`${CHARACTERS_URL}/${id}/active`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(body.message || `Failed to set active character: ${res.status}`);
    error.status = res.status;
    throw error;
  }

  return body;
};

/**
 * Delete a character owned by the authenticated user.
 *
 * @param {number|string} id - Character ID
 * @returns {Promise<Object>} Response confirmation
 * @throws {Error} If unauthenticated or request fails
 */
export const deleteCharacter = async (id) => {
  const token = await getEffectiveToken();
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`${CHARACTERS_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(body.message || `Failed to delete character: ${res.status}`);
    error.status = res.status;
    throw error;
  }

  return body;
};

