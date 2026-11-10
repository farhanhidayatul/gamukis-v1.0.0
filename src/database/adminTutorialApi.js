import { getEffectiveToken } from './firebaseDatabase';
import { request as manualAuthRequest } from './manualAuth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.gamukis.site/api';

const getAuthHeaders = async () => {
  const token = await getEffectiveToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const fetchAdminTutorialContent = async () => {
  try {
    return await manualAuthRequest('/admin/tutorial', { method: 'GET' });
  } catch (_err) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/admin/tutorial`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gagal memuat konten tutorial admin.');
    return json;
  }
};

export const updateAdminTutorialContent = async (payload) => {
  try {
    return await manualAuthRequest('/admin/tutorial', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  } catch (_err) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/admin/tutorial`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gagal menyimpan pembaruan tutorial.');
    return json;
  }
};

export const resetAdminTutorialContent = async () => {
  try {
    return await manualAuthRequest('/admin/tutorial/reset', { method: 'POST' });
  } catch (_err) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/admin/tutorial/reset`, {
      method: 'POST',
      headers,
      credentials: 'include'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gagal mereset tutorial ke default.');
    return json;
  }
};

export const fetchPublicTutorialContent = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/tutorial/content`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch (_err) {
    return null;
  }
};
