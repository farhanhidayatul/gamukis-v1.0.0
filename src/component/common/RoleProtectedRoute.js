import React, { useEffect, useState, useTransition } from 'react';
import { getManualUser, clearManualSession } from '../../database/manualAuth';
import { observeAuthState } from '../../database/firebaseAuth';
import { getEffectiveToken } from '../../database/firebaseDatabase';
import NF from '../../pages/notfound';

const API_URL = process.env.REACT_APP_API_URL || "https://api.gamukis.site/api";

/**
 * Helper to safely decode JWT payload on the client without external dependencies.
 */
export const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (_) {
    return null;
  }
};

/**
 * Checks if a JWT token has expired based on its 'exp' claim.
 */
export const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return false;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
};

/**
 * Resolves the user role safely from user object or token claims.
 */
export const resolveUserRole = (user, token) => {
  if (user) {
    const r = user.role || user.userRole || user.profile?.role;
    if (r) return String(r).trim().toLowerCase();
    if (String(user.teacherApplication?.status || '').toLowerCase() === 'approved') {
      return 'guru';
    }
  }
  if (token) {
    const payload = decodeJwtPayload(token);
    if (payload?.role) return String(payload.role).trim().toLowerCase();
  }
  return null;
};

/**
 * Fetches authenticated user account from backend /access/me using effective token
 * (supports both manual JWT and Google Firebase ID Token via backend authenticateAny).
 */
export const fetchAccountStatus = async (token) => {
  if (!token) return null;
  const response = await fetch(`${API_URL}/access/me`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    credentials: 'include'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Gagal memverifikasi status akses.');
    error.status = response.status;
    throw error;
  }
  return data;
};

/**
 * RoleProtectedRoute:
 * Supports Dual-Authentication:
 *  1. Manual JWT Auth (MySQL registered users)
 *  2. Google Firebase ID Token Auth (Google/Gmail login & registration)
 *
 * Synchronizes client session with backend authentication & role rules.
 * If token is expired, absent, invalid, or the user's role does not match
 * allowedRoles, it renders the authentic 404 page (<NF />) without leaking
 * the protected interface or route existence.
 */
const RoleProtectedRoute = ({ allowedRoles = [], children }) => {
  const [, startTransition] = useTransition();
  const [authState, setAuthState] = useState(() => {
    const manualToken = typeof window !== 'undefined'
      ? (localStorage.getItem('gamukis_manual_token') || sessionStorage.getItem('gamukis_manual_token'))
      : null;
    const initialUser = getManualUser();

    if (manualToken && isTokenExpired(manualToken)) {
      clearManualSession();
      return { isChecking: false, isAllowed: false };
    }

    const currentRole = resolveUserRole(initialUser, manualToken);
    const hasRole = currentRole && allowedRoles.includes(currentRole);

    return {
      isChecking: true,
      isAllowed: Boolean(hasRole)
    };
  });

  useEffect(() => {
    let isCurrent = true;

    const verifyWithBackend = async () => {
      let token = null;
      try {
        token = await getEffectiveToken();
      } catch (_) {
        token = null;
      }

      if (!token) {
        if (isCurrent) {
          startTransition(() => {
            setAuthState({ isChecking: false, isAllowed: false });
          });
        }
        return;
      }

      if (isTokenExpired(token)) {
        clearManualSession();
        if (isCurrent) {
          startTransition(() => {
            setAuthState({ isChecking: false, isAllowed: false });
          });
        }
        return;
      }

      try {
        const accountData = await fetchAccountStatus(token);
        if (!isCurrent) return;

        const backendUser = accountData?.user || accountData;
        const verifiedRole = resolveUserRole(backendUser, token);
        const isPermitted = Boolean(verifiedRole && allowedRoles.includes(verifiedRole));

        startTransition(() => {
          setAuthState({
            isChecking: false,
            isAllowed: isPermitted
          });
        });
      } catch (err) {
        if (!isCurrent) return;
        const errMsg = String(err?.message || '').toLowerCase();
        if (
          err.status === 401 ||
          err.status === 403 ||
          errMsg.includes('token') ||
          errMsg.includes('autentikasi') ||
          errMsg.includes('kedaluwarsa')
        ) {
          clearManualSession();
        }
        startTransition(() => {
          setAuthState({ isChecking: false, isAllowed: false });
        });
      }
    };

    verifyWithBackend();

    // 1. Reactive listener for manual auth login/logout
    const handleManualAuthChange = () => {
      verifyWithBackend();
    };
    window.addEventListener('gamukis-manual-auth-change', handleManualAuthChange);

    // 2. Reactive listener for Google Firebase auth state changes
    let unsubscribeFirebase = null;
    if (typeof observeAuthState === 'function') {
      unsubscribeFirebase = observeAuthState((_fbUser) => {
        verifyWithBackend();
      });
    }

    return () => {
      isCurrent = false;
      window.removeEventListener('gamukis-manual-auth-change', handleManualAuthChange);
      if (typeof unsubscribeFirebase === 'function') {
        unsubscribeFirebase();
      }
    };
  }, [allowedRoles]);

  if (!authState.isChecking && !authState.isAllowed) {
    return <NF />;
  }

  if (authState.isChecking) {
    if (authState.isAllowed) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#64748b' }}>
          <p>Memverifikasi akses...</p>
        </div>
      );
    }
    return <NF />;
  }

  return children;
};

export default RoleProtectedRoute;
