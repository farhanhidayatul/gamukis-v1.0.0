const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "gamukis_manual_token";
const USER_KEY = "gamukis_manual_user";

const getToken = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

const request = async (path, options = {}) => {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Permintaan autentikasi gagal.");
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

const requestRegistrationOtp = ({ username, email, password, profile }) => request("/auth/manual/register/request-otp", {
  method: "POST",
  body: JSON.stringify({ username, email, password, profile })
});

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
  } catch (error) {
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
  window.dispatchEvent(new Event("gamukis-manual-auth-change"));
};

const persistManualUserResponse = (response) => {
  if (!response?.user) return response;
  const currentUser = getManualUser() || {};
  const rememberMe = Boolean(localStorage.getItem(TOKEN_KEY));
  saveManualUser({ ...currentUser, ...response.user }, rememberMe);
  return response;
};

const saveManualProfile = (profile) => request("/auth/manual/profile", {
  method: "POST",
  body: JSON.stringify(profile)
});

const getManualProfile = () => request("/auth/manual/profile");

const saveCompleteProfile = async (profile) => persistManualUserResponse(await request("/auth/manual/complete-profile", {
  method: "PUT",
  body: JSON.stringify(profile)
}));

const updateManualRole = async (data) => persistManualUserResponse(await request("/auth/manual/role", {
  method: "PATCH",
  body: JSON.stringify(data)
}));

const getManualAccount = async () => persistManualUserResponse(await request('/access/me'));

export {
  request,
  manualLogin,
  requestRegistrationOtp,
  verifyRegistrationOtp,
  saveManualProfile,
  getManualProfile,
  saveCompleteProfile,
  updateManualRole,
  getManualAccount,
  getManualUser,
  clearManualSession
};
