const resolveApiUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("test") || host.includes("preview") || host.includes("9iuowj595")) {
      return "https://api-test.gamukis.site/api";
    }
    if (envUrl && envUrl.startsWith("http")) {
      return envUrl;
    }
    if (host.endsWith("gamukis.site") || host.includes("vercel.app")) {
      return "https://api.gamukis.site/api";
    }
  }
  return envUrl && envUrl.startsWith("http") ? envUrl : "https://api.gamukis.site/api";
};

const API_URL = resolveApiUrl();
const TOKEN_KEY = "gamukis_manual_token";
const USER_KEY = "gamukis_manual_user";

const getToken = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

const resolveAuthToken = async () => {
  const manualToken = getToken();
  if (manualToken) return manualToken;

  try {
    const fbUser = typeof window !== "undefined" ? window.__gamukis_auth?.auth?.currentUser : null;
    if (fbUser && !fbUser.isAnonymous && typeof fbUser.getIdToken === "function") {
      const idToken = await fbUser.getIdToken();
      if (idToken) return idToken;
    }
  } catch (_) {
    // Ignore Firebase token fallback errors
  }
  return null;
};

const request = async (path, options = {}) => {
  const token = await resolveAuthToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      const errMsg = String(data.message || '').toLowerCase();
      if (errMsg.includes('token') || errMsg.includes('kedaluwarsa') || errMsg.includes('expired') || response.status === 401) {
        clearManualSession();
      }
    }
    throw new Error(data.message || "Permintaan autentikasi gagal.");
  }
  return data;
};

const saveToken = (token, rememberMe = false) => {
  if (rememberMe) localStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.setItem(TOKEN_KEY, token);
};

const saveManualUser = (user, rememberMe = false) => {
  const serializedUser = JSON.stringify(user);
  if (rememberMe) {
    localStorage.setItem(USER_KEY, serializedUser);
    sessionStorage.removeItem(USER_KEY);
  } else {
    sessionStorage.setItem(USER_KEY, serializedUser);
    localStorage.removeItem(USER_KEY);
  }
  window.dispatchEvent(new Event("gamukis-manual-auth-change"));
};

const manualLogin = async (identifier, password, rememberMe) => {
  const data = await request("/auth/manual/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password })
  });
  saveToken(data.token, rememberMe);
  saveManualUser(data.user, rememberMe);
  return data;
};

const requestRegistrationOtp = async ({ username, email, password, profile }) => {
  const data = await request("/auth/manual/register/request-otp", {
    method: "POST",
    body: JSON.stringify({ username, email, password, profile })
  });
  if (data?.devOtp && typeof window !== "undefined") {
    window.__gamukis_dev_otp = data.devOtp;
    try {
      sessionStorage.setItem("gamukis_dev_otp", data.devOtp);
    } catch (_) {
      // Ignore storage access restrictions in sandboxed or privacy environments
    }
  }
  return data;
};

const verifyRegistrationOtp = async (email, otp) => {
  const data = await request("/auth/manual/register/verify-otp", {
  method: "POST",
  body: JSON.stringify({ email, otp })
  });
  saveToken(data.token, true);
  saveManualUser(data.user, true);
  return data;
};

const getManualUser = () => {
  const serializedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!serializedUser) return null;

  try {
    return JSON.parse(serializedUser);
  } catch (_error) {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
    return null;
  }
};

const clearManualSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
  fetch(`${API_URL}/auth/manual/logout`, {
    method: "POST",
    credentials: "include"
  }).catch(() => {});
  window.dispatchEvent(new Event("gamukis-manual-auth-change"));
};

const persistManualUserResponse = (response) => {
  if (!response?.user) return response;
  const currentUser = getManualUser() || {};
  const rememberMe = Boolean(localStorage.getItem(TOKEN_KEY));
  saveManualUser({ ...currentUser, ...response.user }, rememberMe);
  return response;
};

const saveManualProfile = async (profile) => persistManualUserResponse(await request("/auth/manual/profile", {
  method: "POST",
  body: JSON.stringify(profile)
}));

const getManualProfile = async () => persistManualUserResponse(await request("/auth/manual/profile"));

const saveCompleteProfile = async (profile) => persistManualUserResponse(await request("/auth/manual/complete-profile", {
  method: "PUT",
  body: JSON.stringify(profile)
}));

const updateManualRole = async (data) => persistManualUserResponse(await request("/auth/manual/role", {
  method: "PATCH",
  body: JSON.stringify(data)
}));

const getManualAccount = async () => persistManualUserResponse(await request('/access/me'));

const requestForgotPasswordOtp = (identifier, options = {}) => request("/auth/manual/forgot-password/request-otp", {
  method: "POST",
  body: JSON.stringify({
    identifier,
    email: identifier,
    useRecoveryEmail: Boolean(options.useRecoveryEmail),
    recoveryEmail: options.recoveryEmail || ''
  })
});

const resetForgotPassword = (identifier, otp, newPassword, linkAsRecoveryEmail = '') => request("/auth/manual/forgot-password/reset", {
  method: "POST",
  body: JSON.stringify({
    identifier,
    email: identifier,
    otp,
    newPassword,
    linkAsRecoveryEmail
  })
});

export {
  request,
  manualLogin,
  requestRegistrationOtp,
  verifyRegistrationOtp,
  requestForgotPasswordOtp,
  resetForgotPassword,
  saveManualProfile,
  getManualProfile,
  saveCompleteProfile,
  updateManualRole,
  getManualAccount,
  getManualUser,
  clearManualSession
};
