import { request as manualRequest } from "./manualAuth";
import { getEffectiveToken } from "./firebaseDatabase";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

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

/**
 * Uploads a PDF to create an admin AI question generator job.
 * Sends raw PDF bytes with Content-Type application/pdf per API_CONTRACT.md.
 */
const uploadAdminAiJob = async (fileOrFormData, options = {}) => {
  const hasManualToken =
    typeof window !== "undefined" &&
    (window.localStorage?.getItem("gamukis_manual_token") ||
      window.sessionStorage?.getItem("gamukis_manual_token"));

  let token = hasManualToken
    ? (window.localStorage?.getItem("gamukis_manual_token") ||
        window.sessionStorage?.getItem("gamukis_manual_token"))
    : await getEffectiveToken();

  let body = fileOrFormData;
  let filename = "document.pdf";
  if (typeof FormData !== "undefined" && fileOrFormData instanceof FormData) {
    const extracted = fileOrFormData.get("pdf") || fileOrFormData.get("file");
    if (extracted) {
      body = extracted;
      filename = extracted.name || "document.pdf";
    }
  } else if (fileOrFormData?.name) {
    filename = fileOrFormData.name;
  }

  const query = options.subjectKey ? `?subjectKey=${encodeURIComponent(options.subjectKey)}` : "";
  const headers = {
    "Content-Type": "application/pdf",
    "X-Filename": filename,
    ...(options.extractionMode ? { "X-AI-Extraction-Mode": options.extractionMode } : {}),
    ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
    ...(options.provider ? { "X-AI-Provider": options.provider } : {}),
    ...(options.model ? { "X-AI-Model": options.model } : {}),
    ...(options.baseUrl ? { "X-AI-Base-URL": options.baseUrl } : {}),
    ...(options.apiKey ? { "X-AI-API-Key": options.apiKey } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(
    `${API_URL}/admin/ai-question-generator/jobs${query}`,
    {
      method: "POST",
      body,
      headers
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Upload PDF gagal.");
  }
  return data;
};

/** Lists paginated admin AI question generator jobs. */
const listAdminAiJobs = ({ page, pageSize, status } = {}) => {
  const query = new URLSearchParams();
  if (page) query.set("page", String(page));
  if (pageSize) query.set("pageSize", String(pageSize));
  if (status) query.set("status", status);
  const queryString = query.toString();
  return authRequest(`/admin/ai-question-generator/jobs${queryString ? `?${queryString}` : ""}`);
};

/** Gets a specific admin AI job detail including candidates. */
const getAdminAiJob = (jobId) =>
  authRequest(`/admin/ai-question-generator/jobs/${encodeURIComponent(jobId)}`);

/** Gets candidates list for a specific admin AI job with optional filters. */
const getAdminAiCandidates = (jobId, {
  interactionType,
  stimulusType,
  category,
  minQualityScore,
  maxQualityScore,
  hasAnomaly,
  hasImage,
  search,
  page = 1,
  pageSize = 350
} = {}) => {
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (pageSize) params.set("pageSize", String(pageSize));
  if (interactionType && interactionType !== "all") params.set("interactionType", interactionType);
  if (stimulusType && stimulusType !== "all") params.set("stimulusType", stimulusType);
  if (category && category !== "all") params.set("category", category);
  if (typeof minQualityScore === "number") params.set("minQualityScore", String(minQualityScore));
  if (typeof maxQualityScore === "number") params.set("maxQualityScore", String(maxQualityScore));
  if (hasAnomaly !== undefined && hasAnomaly !== null && hasAnomaly !== "all") params.set("hasAnomaly", String(hasAnomaly));
  if (hasImage !== undefined && hasImage !== null && hasImage !== "all") params.set("hasImage", String(hasImage));
  if (search && search.trim()) params.set("search", search.trim());
  const qs = params.toString() ? `?${params.toString()}` : "";
  return authRequest(`/admin/ai-question-generator/jobs/${encodeURIComponent(jobId)}/candidates${qs}`);
};

/** Searches and filters candidates across datasets. */
const fetchFilteredCandidates = ({
  jobId,
  interactionType,
  stimulusType,
  category,
  minQualityScore,
  maxQualityScore,
  hasAnomaly,
  hasImage,
  search,
  page = 1,
  pageSize = 50
} = {}) => {
  const params = new URLSearchParams();
  if (jobId) params.set("jobId", jobId);
  if (page) params.set("page", String(page));
  if (pageSize) params.set("pageSize", String(pageSize));
  if (interactionType && interactionType !== "all") params.set("interactionType", interactionType);
  if (stimulusType && stimulusType !== "all") params.set("stimulusType", stimulusType);
  if (category && category !== "all") params.set("category", category);
  if (typeof minQualityScore === "number") params.set("minQualityScore", String(minQualityScore));
  if (typeof maxQualityScore === "number") params.set("maxQualityScore", String(maxQualityScore));
  if (hasAnomaly !== undefined && hasAnomaly !== null && hasAnomaly !== "all") params.set("hasAnomaly", String(hasAnomaly));
  if (hasImage !== undefined && hasImage !== null && hasImage !== "all") params.set("hasImage", String(hasImage));
  if (search && search.trim()) params.set("search", search.trim());
  const qs = params.toString() ? `?${params.toString()}` : "";
  return authRequest(`/admin/ai-question-generator/dataset-review${qs}`);
};

/** Saves a multimodal ground truth training specification (text, table structure, reference photo). */
const createGroundTruthSpec = (specData) =>
  authRequest(`/admin/ai-question-generator/ground-truth-specs`, {
    method: "POST",
    body: JSON.stringify(specData)
  });

/** Lists stored ground truth training specifications. */
const fetchGroundTruthSpecs = ({ subjectKey, modalityType, page = 1, pageSize = 20 } = {}) => {
  const params = new URLSearchParams();
  if (subjectKey && subjectKey !== "semua_pelajaran") params.set("subjectKey", subjectKey);
  if (modalityType && modalityType !== "all") params.set("modalityType", modalityType);
  if (page) params.set("page", String(page));
  if (pageSize) params.set("pageSize", String(pageSize));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return authRequest(`/admin/ai-question-generator/ground-truth-specs${qs}`);
};

/** Deletes a ground truth training specification by specId. */
const deleteGroundTruthSpec = (specId) =>
  authRequest(`/admin/ai-question-generator/ground-truth-specs/${encodeURIComponent(specId)}`, {
    method: "DELETE"
  });

/** Reviews a candidate question (accept or reject). */
const reviewAiCandidate = (jobId, candidateId, { decision, reason }) =>
  authRequest(
    `/admin/ai-question-generator/jobs/${encodeURIComponent(jobId)}/candidates/${encodeURIComponent(candidateId)}/review`,
    {
      method: "POST",
      body: JSON.stringify({ decision, reason })
    }
  );

/** Publishes an accepted candidate question to a class. */
const publishAiCandidate = (jobId, candidateId, { classId, idempotencyKey }) =>
  authRequest(
    `/admin/ai-question-generator/jobs/${encodeURIComponent(jobId)}/candidates/${encodeURIComponent(candidateId)}/publish`,
    {
      method: "POST",
      body: JSON.stringify({ classId, idempotencyKey })
    }
  );

/** Reviews all candidate questions for a job at once (e.g. approve all after review). */
const reviewAllAiCandidates = (jobId, { decision = "approved" } = {}) =>
  authRequest(
    `/admin/ai-question-generator/jobs/${encodeURIComponent(jobId)}/candidates/review-all`,
    {
      method: "POST",
      body: JSON.stringify({ decision })
    }
  );

/** Removes noise/unimportant words from every candidate of a job. */
const filterAdminAiJobWords = (
  jobId,
  { customWords = [], autoCleanNoise = true, rejectInvalidQuestions = false } = {}
) =>
  authRequest(
    `/admin/ai-question-generator/jobs/${encodeURIComponent(jobId)}/filter-words`,
    {
      method: "POST",
      body: JSON.stringify({ customWords, autoCleanNoise, rejectInvalidQuestions })
    }
  );

/** Saves/publishes all approved candidate questions to bank or class. */
const publishAllAiCandidates = (jobId, { destination = "bank", classId = null, idempotencyKey } = {}) =>
  authRequest(
    `/admin/ai-question-generator/jobs/${encodeURIComponent(jobId)}/candidates/publish-all`,
    {
      method: "POST",
      body: JSON.stringify({ destination, classId, idempotencyKey })
    }
  );

/** Deletes an admin AI job. */
const deleteAdminAiJob = (jobId) =>
  authRequest(
    `/admin/ai-question-generator/jobs/${encodeURIComponent(jobId)}`,
    { method: "DELETE" }
  );

/** Retries/resumes an admin AI job that failed or hit rate limits. */
const retryAdminAiJob = (jobId) =>
  authRequest(
    `/admin/ai-question-generator/jobs/${encodeURIComponent(jobId)}/retry`,
    { method: "POST" }
  );

/** Continues an admin AI job to process the next stack/material. */
const continueAdminAiJob = (jobId) =>
  authRequest(
    `/admin/ai-question-generator/jobs/${encodeURIComponent(jobId)}/continue`,
    { method: "POST" }
  );

/** Lists teacher AI jobs for a specific class. */
const listTeacherAiJobs = (classId) =>
  authRequest(
    `/teacher/ai-question-generator/classes/${encodeURIComponent(classId)}/jobs`
  );

/**
 * Creates a teacher AI question generator job for a specific class.
 * Sends raw PDF bytes with Content-Type application/pdf per API_CONTRACT.md.
 */
const createTeacherAiJob = async (classId, fileOrFormData, options = {}) => {
  const hasManualToken =
    typeof window !== "undefined" &&
    (window.localStorage?.getItem("gamukis_manual_token") ||
      window.sessionStorage?.getItem("gamukis_manual_token"));

  let token = hasManualToken
    ? (window.localStorage?.getItem("gamukis_manual_token") ||
        window.sessionStorage?.getItem("gamukis_manual_token"))
    : await getEffectiveToken();

  let body = fileOrFormData;
  let filename = "document.pdf";
  if (typeof FormData !== "undefined" && fileOrFormData instanceof FormData) {
    const extracted = fileOrFormData.get("pdf") || fileOrFormData.get("file");
    if (extracted) {
      body = extracted;
      filename = extracted.name || "document.pdf";
    }
  } else if (fileOrFormData?.name) {
    filename = fileOrFormData.name;
  }

  const headers = {
    "Content-Type": "application/pdf",
    "X-Filename": filename,
    ...(options.extractionMode ? { "X-AI-Extraction-Mode": options.extractionMode } : {}),
    ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
    ...(options.provider ? { "X-AI-Provider": options.provider } : {}),
    ...(options.model ? { "X-AI-Model": options.model } : {}),
    ...(options.baseUrl ? { "X-AI-Base-URL": options.baseUrl } : {}),
    ...(options.apiKey ? { "X-AI-API-Key": options.apiKey } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(
    `${API_URL}/teacher/ai-question-generator/classes/${encodeURIComponent(classId)}/jobs`,
    {
      method: "POST",
      body,
      headers
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Upload PDF untuk kelas gagal.");
  }
  return data;
};

/** Fetches live models directly from the provider API via backend proxy using user's API Key. */
const fetchLiveProviderModels = async ({ provider, apiKey, baseUrl }) => {
  try {
    return await authRequest("/admin/ai-question-generator/models", {
      method: "POST",
      body: JSON.stringify({ provider, apiKey, baseUrl })
    });
  } catch (backendError) {
    // If backend rejects with login session error or connection issue, try direct client fetch for CORS-friendly providers
    if (provider === "openrouter") {
      try {
        const targetUrl = (baseUrl || "https://openrouter.ai/api/v1").replace(/\/$/, "") + "/models";
        const headers = apiKey ? { Authorization: `Bearer ${apiKey.trim()}` } : {};
        const res = await fetch(targetUrl, { headers });
        if (res.ok) {
          const json = await res.json();
          const models = Array.isArray(json?.data) ? json.data.map((m) => m.id).filter(Boolean) : [];
          if (models.length > 0) return { models };
        }
      } catch {
        // proceed to error messaging
      }
    } else if (provider === "gemini") {
      try {
        const targetUrl = (baseUrl || "https://generativelanguage.googleapis.com/v1beta/openai").replace(/\/$/, "") + "/models";
        const headers = apiKey ? { Authorization: `Bearer ${apiKey.trim()}` } : {};
        const res = await fetch(targetUrl, { headers });
        if (res.ok) {
          const json = await res.json();
          const models = Array.isArray(json?.data) ? json.data.map((m) => m.id).filter(Boolean) : [];
          if (models.length > 0) return { models };
        }
      } catch {
        // proceed to error messaging
      }
    }
    const msg = String(backendError?.message || "");
    if (
      msg.toLowerCase().includes("token tidak valid") ||
      msg.toLowerCase().includes("kedaluwarsa") ||
      msg.toLowerCase().includes("unauthorized")
    ) {
      throw new Error(
        "Sesi login Admin Anda telah kedaluwarsa. Silakan refresh halaman atau login ulang ke Gamukis (ini bukan masalah API Key OpenRouter Anda)."
      );
    }
    throw backendError;
  }
};

/** Lists teacher questions from MySQL available for harvesting into Stack Memory. */
const listTeacherQuestionsForHarvest = (params = {}) => {
  const query = new URLSearchParams();
  if (params.classId) query.set("classId", params.classId);
  if (params.subjectKey) query.set("subjectKey", params.subjectKey);
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  const qStr = query.toString();
  return authRequest(`/admin/ai-question-generator/harvest/teacher-questions${qStr ? `?${qStr}` : ""}`);
};

/** Harvests teacher-created/validated questions into Stack Memory MongoDB with CBF metadata. */
const harvestTeacherQuestions = ({ classId, questionIds } = {}) =>
  authRequest("/admin/ai-question-generator/harvest/teacher-questions", {
    method: "POST",
    body: JSON.stringify({ classId, questionIds })
  });

/** Gets statistics of current Stack Memory MongoDB. */
const getStackMemoryStats = () =>
  authRequest("/admin/ai-question-generator/memory/stats");

/** Gets current power & health status of the AI service containers. */
const getAiServiceStatus = () =>
  authRequest("/admin/ai-question-generator/service/status");

/** Gets live status of the local Ollama LLM worker. */
const getOllamaStatus = () =>
  authRequest("/admin/ai-question-generator/service/ollama-status");

/** Sends a live test ping to Ollama to verify active inference response. */
const pingOllama = (payload = {}) =>
  authRequest("/admin/ai-question-generator/service/ollama-ping", {
    method: "POST",
    body: JSON.stringify(payload)
  });

/** Starts the AI service containers on-demand. */
const startAiService = () =>
  authRequest("/admin/ai-question-generator/service/start", {
    method: "POST"
  });

/** Gracefully stops the AI service containers to save computer resources. */
const stopAiService = () =>
  authRequest("/admin/ai-question-generator/service/stop", {
    method: "POST"
  });

/** Gets real-time Constitutional AI compliance metrics for a job. */
const getJobConstitutionalMetrics = (jobId) =>
  authRequest(`/admin/ai-question-generator/jobs/${encodeURIComponent(jobId)}/constitutional-metrics`);

/** Harvests approved candidate questions into RLAIF Ground-Truth Training Memory. */
const harvestJobToTrainingMemory = (jobId) =>
  authRequest(`/admin/ai-question-generator/jobs/${encodeURIComponent(jobId)}/harvest-to-training`, {
    method: "POST"
  });

/** Triggers Adversarial Self-Play Question Generation for a specific topic. */
const triggerSelfPlayGeneration = (jobId, { topic, subjectKey } = {}) =>
  authRequest(`/admin/ai-question-generator/jobs/${encodeURIComponent(jobId)}/self-play-generate`, {
    method: "POST",
    body: JSON.stringify({ topic, subjectKey })
  });

/**
 * Inspects a PDF file before starting an AI job to detect its question count,
 * numbering continuity, option scheme (A-D vs A-E), and sections dynamically.
 */
const inspectPdfStructure = async (file) => {
  const hasManualToken =
    typeof window !== "undefined" &&
    (window.localStorage?.getItem("gamukis_manual_token") ||
      window.sessionStorage?.getItem("gamukis_manual_token"));

  let token = hasManualToken
    ? (window.localStorage?.getItem("gamukis_manual_token") ||
        window.sessionStorage?.getItem("gamukis_manual_token"))
    : await getEffectiveToken();

  const filename = file?.name || "document.pdf";
  const headers = {
    "Content-Type": "application/pdf",
    "X-Filename": filename,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(
    `${API_URL}/admin/ai-question-generator/jobs/inspect-pdf`,
    {
      method: "POST",
      body: file,
      headers
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Gagal memeriksa struktur dokumen PDF.");
  }
  return data.structure;
};

const updateAiCandidate = async (jobId, candidateId, candidateData) => {
  return authRequest(
    `/admin/ai-question-generator/jobs/${jobId}/candidates/${candidateId}`,
    {
      method: "PATCH",
      body: JSON.stringify(candidateData)
    }
  );
};

const deleteAiCandidate = async (jobId, candidateId) => {
  return authRequest(
    `/admin/ai-question-generator/jobs/${jobId}/candidates/${candidateId}`,
    {
      method: "DELETE"
    }
  );
};

const updateGroundTruthSpec = async (specId, specData) => {
  return authRequest(
    `/admin/ai-question-generator/ground-truth-specs/${specId}`,
    {
      method: "PUT",
      body: JSON.stringify(specData)
    }
  );
};

export {
  continueAdminAiJob,
  createGroundTruthSpec,
  createTeacherAiJob,
  deleteAdminAiJob,
  deleteAiCandidate,
  deleteGroundTruthSpec,
  fetchFilteredCandidates,
  fetchGroundTruthSpecs,
  fetchLiveProviderModels,
  getAdminAiJob,
  getAdminAiCandidates,
  getAiServiceStatus,
  getOllamaStatus,
  getJobConstitutionalMetrics,
  getStackMemoryStats,
  harvestJobToTrainingMemory,
  harvestTeacherQuestions,
  inspectPdfStructure,
  listAdminAiJobs,
  listTeacherAiJobs,
  listTeacherQuestionsForHarvest,
  pingOllama,
  publishAiCandidate,
  publishAllAiCandidates,
  retryAdminAiJob,
  reviewAiCandidate,
  reviewAllAiCandidates,
  filterAdminAiJobWords,
  reviewAllAiCandidates as batchReviewCandidates,
  startAiService,
  stopAiService,
  triggerSelfPlayGeneration,
  updateAiCandidate,
  updateGroundTruthSpec,
  uploadAdminAiJob
};
