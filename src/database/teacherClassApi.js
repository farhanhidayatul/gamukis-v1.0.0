import {
  clearManualSession,
  getManualUser,
  request as manualRequest
} from "./manualAuth";
import { auth, waitForAuth } from "./firebaseAuth";
import { getEffectiveToken } from "./firebaseDatabase";

const API_URL = process.env.REACT_APP_API_URL || "https://api.gamukis.site/api";

const fetchWithToken = async (path, token, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Permintaan ke server gagal.");
  }
  return data;
};

const resolveActiveFirebaseToken = async () => {
  try {
    let fbUser = auth?.currentUser;
    if (!fbUser && typeof waitForAuth === "function") {
      fbUser = await waitForAuth();
    }
    if (fbUser && !fbUser.isAnonymous && typeof fbUser.getIdToken === "function") {
      return await fbUser.getIdToken();
    }
  } catch (_) {
    // ignore
  }
  return null;
};

const authRequest = async (path, options = {}) => {
  const hasManualToken =
    typeof window !== "undefined" &&
    Boolean(
      window.localStorage?.getItem("gamukis_manual_token") ||
        window.sessionStorage?.getItem("gamukis_manual_token")
    );

  if (hasManualToken) {
    return manualRequest(path, options);
  }

  const fbToken = await resolveActiveFirebaseToken();
  if (fbToken) {
    return fetchWithToken(path, fbToken, options);
  }

  const token = await getEffectiveToken();
  if (!token) {
    return manualRequest(path, options);
  }

  return fetchWithToken(path, token, options);
};

const isApprovedGuruUser = (user) => {
  if (!user) return false;
  const role = String(user?.role || user?.userRole || user?.profile?.role || "").toLowerCase();
  if (role === "guru") return true;
  const appStatus = String(
    user?.teacherApplication?.status || user?.teacherApplicationStatus || ""
  ).toLowerCase();
  return appStatus === "approved";
};

const normalizeResolvedUser = (rawUser) => {
  if (!rawUser) return null;
  return {
    ...(getManualUser() || {}),
    ...rawUser,
    role:
      rawUser.role ||
      (String(rawUser.teacherApplication?.status || "").toLowerCase() === "approved"
        ? "guru"
        : null)
  };
};

const persistResolvedUser = (normalizedUser) => {
  if (!normalizedUser) return null;
  try {
    if (typeof window !== "undefined") {
      window.localStorage?.setItem("gamukis_manual_user", JSON.stringify(normalizedUser));
      window.dispatchEvent(new Event("gamukis-manual-auth-change"));
    }
  } catch (_) {
    // ignore storage errors
  }
  return normalizedUser;
};

const syncCurrentAccountRole = async () => {
  try {
    const response = await authRequest("/access/me");
    const normalized = normalizeResolvedUser(response?.user);
    if (normalized && isApprovedGuruUser(normalized)) {
      return persistResolvedUser(normalized);
    }

    const googleToken = await resolveActiveFirebaseToken();
    if (googleToken) {
      const googleRes = await fetchWithToken("/access/me", googleToken);
      const googleUser = normalizeResolvedUser(googleRes?.user);
      if (googleUser) {
        if (typeof clearManualSession === "function") {
          clearManualSession();
        }
        return persistResolvedUser(googleUser);
      }
    }

    if (normalized) {
      return persistResolvedUser(normalized);
    }
  } catch (_) {
    try {
      const googleToken = await resolveActiveFirebaseToken();
      if (googleToken) {
        const googleRes = await fetchWithToken("/access/me", googleToken);
        const googleUser = normalizeResolvedUser(googleRes?.user);
        if (googleUser) {
          if (typeof clearManualSession === "function") {
            clearManualSession();
          }
          return persistResolvedUser(googleUser);
        }
      }
    } catch (_err) {
      // ignore
    }
  }
  return getManualUser();
};

const getTeacherClasses = async () => {
  const response = await authRequest("/teacher/classes");
  return {
    classes: response.classes || [],
    quota: response.quota || { activeCount: 0, maxClasses: 3, remaining: 3 }
  };
};

const createTeacherClass = async (payload) => {
  const response = await authRequest("/teacher/classes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response.class || response;
};

const getTeacherClassById = async (classId) => {
  const response = await authRequest(`/teacher/classes/${encodeURIComponent(classId)}`);
  if (response?.class) {
    return {
      ...response.class,
      questions: response.questions || response.class.questions || []
    };
  }
  return response;
};

const updateTeacherClass = async (classId, payload) => {
  const response = await authRequest(`/teacher/classes/${encodeURIComponent(classId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  return response.class || response;
};

const addTeacherQuestion = async (classId, payload) => {
  const response = await authRequest(`/teacher/classes/${encodeURIComponent(classId)}/questions`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response.question || response;
};

const updateTeacherQuestion = async (classId, questionId, payload) => {
  const response = await authRequest(
    `/teacher/classes/${encodeURIComponent(classId)}/questions/${encodeURIComponent(questionId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    }
  );
  return response.question || response;
};

const deleteTeacherQuestion = async (classId, questionId) =>
  authRequest(
    `/teacher/classes/${encodeURIComponent(classId)}/questions/${encodeURIComponent(questionId)}`,
    {
      method: "DELETE"
    }
  );

const publishTeacherClass = async (classId) => {
  const response = await authRequest(`/teacher/classes/${encodeURIComponent(classId)}/publish`, {
    method: "POST"
  });
  return response.class || response;
};

const rotateTeacherJoinCode = async (classId) => {
  const response = await authRequest(`/teacher/classes/${encodeURIComponent(classId)}/rotate-code`, {
    method: "POST"
  });
  return response.class || response;
};

const getTeacherClassResults = async (classId, { page = 1, pageSize = 20 } = {}) => {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return authRequest(`/teacher/classes/${encodeURIComponent(classId)}/results?${params.toString()}`);
};

const uploadTeacherClassImage = async ({ imageBase64, mimeType }) => {
  const response = await authRequest("/teacher/class-images", {
    method: "POST",
    body: JSON.stringify({ imageBase64, mimeType })
  });
  return response.image || response;
};

export {
  addTeacherQuestion,
  createTeacherClass,
  deleteTeacherQuestion,
  getTeacherClassById,
  getTeacherClassResults,
  getTeacherClasses,
  isApprovedGuruUser,
  publishTeacherClass,
  rotateTeacherJoinCode,
  syncCurrentAccountRole,
  updateTeacherClass,
  updateTeacherQuestion,
  uploadTeacherClassImage
};
