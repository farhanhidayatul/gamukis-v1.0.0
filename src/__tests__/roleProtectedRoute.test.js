import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RoleProtectedRoute, {
  isTokenExpired,
  decodeJwtPayload,
  resolveUserRole,
  fetchAccountStatus
} from '../component/common/RoleProtectedRoute';
import * as manualAuth from '../database/manualAuth';
import * as firebaseDatabase from '../database/firebaseDatabase';
import * as firebaseAuth from '../database/firebaseAuth';

jest.mock('../database/manualAuth', () => ({
  getManualUser: jest.fn(),
  clearManualSession: jest.fn()
}));

jest.mock('../database/firebaseDatabase', () => ({
  getEffectiveToken: jest.fn()
}));

jest.mock('../database/firebaseAuth', () => ({
  auth: { currentUser: null },
  observeAuthState: jest.fn((cb) => () => {})
}));

let container = null;
let root = null;

describe('RoleProtectedRoute Dual-Auth Suite (ManualAuth & GoogleAuth)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    global.fetch = jest.fn();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root.unmount();
      });
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;
    root = null;
  });

  describe('JWT Decoding & Role Helpers', () => {
    test('decodeJwtPayload and isTokenExpired work accurately', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 100;
      const expiredToken = 'header.' + btoa(JSON.stringify({ exp: pastExp, role: 'admin' })) + '.sig';
      expect(isTokenExpired(expiredToken)).toBe(true);

      const futureExp = Math.floor(Date.now() / 1000) + 7200;
      const validToken = 'header.' + btoa(JSON.stringify({ exp: futureExp, role: 'guru' })) + '.sig';
      expect(isTokenExpired(validToken)).toBe(false);
      expect(decodeJwtPayload(validToken).role).toBe('guru');
    });

    test('resolveUserRole resolves role for both manual profile and Google teacher application', () => {
      expect(resolveUserRole({ role: 'admin' })).toBe('admin');
      expect(resolveUserRole({ teacherApplication: { status: 'approved' } })).toBe('guru');
      expect(resolveUserRole(null, 'header.' + btoa(JSON.stringify({ role: 'siswa' })) + '.sig')).toBe('siswa');
    });
  });

  describe('Dual-Auth Protection Verification', () => {
    test('1. ManualAuth: allows access when manual token is valid and backend confirms role', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const manualToken = 'header.' + btoa(JSON.stringify({ exp: futureExp, role: 'admin' })) + '.sig';
      localStorage.setItem('gamukis_manual_token', manualToken);
      manualAuth.getManualUser.mockReturnValue({ role: 'admin' });
      firebaseDatabase.getEffectiveToken.mockResolvedValue(manualToken);

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { role: 'admin' } })
      });

      await act(async () => {
        root.render(
          <MemoryRouter initialEntries={['/admin/dashboard']}>
            <Routes>
              <Route
                path="/admin/dashboard"
                element={
                  <RoleProtectedRoute allowedRoles={['admin', 'administrator']}>
                    <div data-testid="admin-panel">Admin Content</div>
                  </RoleProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(container.querySelector('[data-testid="admin-panel"]')).not.toBeNull();
      expect(container.textContent).toContain('Admin Content');
    });

    test('2. GoogleAuth: allows access when Firebase Google token is valid and backend confirms role', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const googleToken = 'header.' + btoa(JSON.stringify({ exp: futureExp, email: 'teacher@gmail.com' })) + '.sig';
      // No manual token stored
      firebaseDatabase.getEffectiveToken.mockResolvedValue(googleToken);

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { role: 'guru', authType: 'google' } })
      });

      await act(async () => {
        root.render(
          <MemoryRouter initialEntries={['/guru/dashboard']}>
            <Routes>
              <Route
                path="/guru/dashboard"
                element={
                  <RoleProtectedRoute allowedRoles={['guru']}>
                    <div data-testid="teacher-panel">Teacher Google Auth Content</div>
                  </RoleProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(container.querySelector('[data-testid="teacher-panel"]')).not.toBeNull();
      expect(container.textContent).toContain('Teacher Google Auth Content');
    });

    test('3. GoogleAuth: renders 404 when Google user role is not authorized for the route', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const googleToken = 'header.' + btoa(JSON.stringify({ exp: futureExp, email: 'student@gmail.com' })) + '.sig';
      firebaseDatabase.getEffectiveToken.mockResolvedValue(googleToken);

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { role: 'siswa', authType: 'google' } })
      });

      await act(async () => {
        root.render(
          <MemoryRouter initialEntries={['/admin/dashboard']}>
            <Routes>
              <Route
                path="/admin/dashboard"
                element={
                  <RoleProtectedRoute allowedRoles={['admin', 'administrator']}>
                    <div data-testid="admin-panel">Admin Content</div>
                  </RoleProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(container.querySelector('[data-testid="admin-panel"]')).toBeNull();
      expect(container.textContent).toMatch(/Halaman Tidak Ditemukan/i);
    });

    test('4. Token Expiration: renders 404 and clears session when token has expired', async () => {
      const pastExp = Math.floor(Date.now() / 1000) - 50;
      const expiredToken = 'header.' + btoa(JSON.stringify({ exp: pastExp, role: 'admin' })) + '.sig';
      localStorage.setItem('gamukis_manual_token', expiredToken);
      firebaseDatabase.getEffectiveToken.mockResolvedValue(expiredToken);

      await act(async () => {
        root.render(
          <MemoryRouter initialEntries={['/admin/dashboard']}>
            <Routes>
              <Route
                path="/admin/dashboard"
                element={
                  <RoleProtectedRoute allowedRoles={['admin', 'administrator']}>
                    <div data-testid="admin-panel">Admin Content</div>
                  </RoleProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(container.querySelector('[data-testid="admin-panel"]')).toBeNull();
      expect(container.textContent).toMatch(/Halaman Tidak Ditemukan/i);
      expect(manualAuth.clearManualSession).toHaveBeenCalled();
    });

    test('5. Backend 401: renders 404 and clears session when backend rejects token', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const token = 'header.' + btoa(JSON.stringify({ exp: futureExp, role: 'admin' })) + '.sig';
      localStorage.setItem('gamukis_manual_token', token);
      firebaseDatabase.getEffectiveToken.mockResolvedValue(token);

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Token tidak valid atau sudah kedaluwarsa.' })
      });

      await act(async () => {
        root.render(
          <MemoryRouter initialEntries={['/admin/dashboard']}>
            <Routes>
              <Route
                path="/admin/dashboard"
                element={
                  <RoleProtectedRoute allowedRoles={['admin', 'administrator']}>
                    <div data-testid="admin-panel">Admin Content</div>
                  </RoleProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(container.querySelector('[data-testid="admin-panel"]')).toBeNull();
      expect(container.textContent).toMatch(/Halaman Tidak Ditemukan/i);
      expect(manualAuth.clearManualSession).toHaveBeenCalled();
    });
  });
});
