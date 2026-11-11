import { request as manualRequest, resolveApiUrl } from "./manualAuth";
import { getEffectiveToken } from "./firebaseDatabase";

const getApiUrl = () => {
  if (typeof resolveApiUrl === "function") {
    return resolveApiUrl();
  }
  return process.env.REACT_APP_API_URL || "https://api.gamukis.site/api";
};

const authRequest = async (path, options = {}) => {
  const hasManualToken =
    typeof window !== "undefined" &&
    (window.localStorage?.getItem("gamukis_manual_token") ||
      window.sessionStorage?.getItem("gamukis_manual_token"));

  if (hasManualToken) {
    return manualRequest(path, options);
  }

  const token = await getEffectiveToken();
  if (!token) {
    return manualRequest(path, options);
  }

  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Permintaan ke server gagal.");
  }
  return data;
};

const getStudentClassrooms = async () => {
  const response = await authRequest("/classrooms");
  return response.classes || [];
};

const joinClassroomByCode = async (joinCode) => {
  const response = await authRequest("/classrooms/join", {
    method: "POST",
    body: JSON.stringify({ joinCode })
  });
  return response;
};

const getStudentClassroomDetail = async (classId) => {
  const response = await authRequest(`/classrooms/${encodeURIComponent(classId)}`);
  return response;
};

const startStudentQuizAttempt = async (classId) => {
  const response = await authRequest(`/classrooms/${encodeURIComponent(classId)}/attempts`, {
    method: "POST"
  });
  return response;
};

const submitStudentQuizAttempt = async (classId, attemptId, answers) => {
  const response = await authRequest(
    `/classrooms/${encodeURIComponent(classId)}/attempts/${encodeURIComponent(attemptId)}/submit`,
    {
      method: "POST",
      body: JSON.stringify({ answers })
    }
  );
  return response;
};

const startStudentClassGameSession = async (classId, idempotencyKey) => {
  const response = await authRequest(`/classrooms/${encodeURIComponent(classId)}/game-sessions`, {
    method: "POST",
    body: JSON.stringify({ idempotencyKey })
  });
  return response;
};

const getNextStudentClassGameQuestion = (classId, gameSessionId) =>
  authRequest(
    `/classrooms/${encodeURIComponent(classId)}/game-sessions/${encodeURIComponent(gameSessionId)}/questions/next`
  );

const submitStudentClassGameAnswer = (classId, gameSessionId, answer = {}) => {
  const qId = answer?.questionId || "0";
  const fallbackKey = `ans_${Date.now()}_${Math.random().toString(36).slice(2, 12)}_${qId}`;
  const payload = {
    ...answer,
    idempotencyKey: answer?.idempotencyKey || fallbackKey
  };
  return authRequest(
    `/classrooms/${encodeURIComponent(classId)}/game-sessions/${encodeURIComponent(gameSessionId)}/answers`,
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
};

const completeStudentClassGameSession = (classId, gameSessionId) =>
  authRequest(
    `/classrooms/${encodeURIComponent(classId)}/game-sessions/${encodeURIComponent(gameSessionId)}/complete`,
    { method: "POST" }
  );

export {
  completeStudentClassGameSession,
  getStudentClassroomDetail,
  getStudentClassrooms,
  getNextStudentClassGameQuestion,
  joinClassroomByCode,
  startStudentClassGameSession,
  startStudentQuizAttempt,
  submitStudentClassGameAnswer,
  submitStudentQuizAttempt
};
