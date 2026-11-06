import { request as manualRequest } from "./manualAuth";
import { getEffectiveToken } from "./firebaseDatabase";

const API_URL = process.env.REACT_APP_API_URL || "https://api.gamukis.site/api";

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

  const response = await fetch(`${API_URL}${path}`, {
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

const submitStudentClassGameAnswer = (classId, gameSessionId, answer) =>
  authRequest(
    `/classrooms/${encodeURIComponent(classId)}/game-sessions/${encodeURIComponent(gameSessionId)}/answers`,
    {
      method: "POST",
      body: JSON.stringify(answer)
    }
  );

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
