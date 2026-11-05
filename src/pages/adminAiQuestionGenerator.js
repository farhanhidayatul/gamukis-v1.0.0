import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getManualUser } from "../database/manualAuth";
import {
  continueAdminAiJob,
  deleteAdminAiJob,
  getAdminAiJob,
  getAdminAiCandidates,
  getStackMemoryStats,
  harvestTeacherQuestions,
  listAdminAiJobs,
  listTeacherQuestionsForHarvest,
  publishAiCandidate,
  publishAllAiCandidates,
  reviewAiCandidate,
  reviewAllAiCandidates,
  fetchLiveProviderModels,
  uploadAdminAiJob,
  retryAdminAiJob,
  updateAiCandidate,
  deleteAiCandidate,
  getAiServiceStatus,
  startAiService,
  stopAiService,
  inspectPdfStructure,
  filterAdminAiJobWords,
  getOllamaStatus,
  pingOllama
} from "../database/aiQuestionGeneratorApi";
import { getAdminClasses } from "../database/adminApi";
import PdfUploader from "../component/component_ai_question_generator/atoms/PdfUploader";
import JobStatusPanel from "../component/component_ai_question_generator/molecules/JobStatusPanel";
import CandidateReviewList from "../component/component_ai_question_generator/molecules/CandidateReviewList";
import AiServiceToggle from "../component/component_ai_question_generator/atoms/AiServiceToggle";
import AiTrainingEvolutionPanel from "../component/component_ai_question_generator/molecules/AiTrainingEvolutionPanel";
import PdfStructureDetectorCard from "../component/component_ai_question_generator/molecules/PdfStructureDetectorCard";
import { aiWorkflowSocketClient } from "../database/aiWorkflowSocketClient";

const getUserRole = (user) =>
  String(user?.role || user?.userRole || user?.profile?.role || "").toLowerCase();

const CANONICAL_SUBJECTS = [
  { key: "semua_pelajaran", label: "🌐 Semua Pelajaran (Umum / Campuran)" },
  { key: "indonesia", label: "Bahasa Indonesia" },
  { key: "matematika", label: "Matematika" },
  { key: "bahasa_inggris", label: "Bahasa Inggris" },
  { key: "fisika", label: "Fisika" },
  { key: "kimia", label: "Kimia" },
  { key: "biologi", label: "Biologi" },
  { key: "informatika", label: "Informatika" },
  { key: "ekonomi", label: "Ekonomi" },
  { key: "geografi", label: "Geografi" },
  { key: "sosiologi", label: "Sosiologi" },
  { key: "sejarah", label: "Sejarah" }
];

const AI_PLATFORMS = [
  {
    id: "openrouter",
    name: "OpenRouter AI",
    badge: "Multi-Model Hub",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    keyPlaceholder: "sk-or-v1-...",
    requiresKey: true,
    models: [
      { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash (Free Tier)" },
      { id: "google/gemini-flash-1.5", name: "Gemini 1.5 Flash (Super Cepat)" },
      { id: "google/gemini-pro-1.5", name: "Gemini 1.5 Pro (Penalaran Kuat)" },
      { id: "openai/gpt-4o", name: "OpenAI GPT-4o (Multimodal Cerdas)" },
      { id: "openai/gpt-4o-mini", name: "OpenAI GPT-4o Mini (Hemat & Cepat)" },
      { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (Presisi Tinggi)" },
      { id: "meta-llama/llama-3.3-70b-instruct", name: "Meta LLaMA 3.3 70B Instruct" },
      { id: "deepseek/deepseek-chat", name: "DeepSeek V3 (Chat)" },
      { id: "deepseek/deepseek-r1", name: "DeepSeek R1 (Penalaran Logis)" },
      { id: "custom", name: "✏️ Ketik Model Manual / Kustom..." }
    ]
  },
  {
    id: "openai",
    name: "OpenAI (ChatGPT)",
    badge: "Populer",
    defaultBaseUrl: "https://api.openai.com/v1",
    keyPlaceholder: "sk-proj-...",
    requiresKey: true,
    models: [
      { id: "gpt-4o", name: "GPT-4o (Rekomendasi - Cerdas & Cepat)" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini (Hemat Token & Cepat)" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
      { id: "custom", name: "✏️ Ketik Model Manual / Kustom..." }
    ]
  },
  {
    id: "gemini",
    name: "Google Gemini",
    badge: "Multimodal",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    keyPlaceholder: "AIzaSy...",
    requiresKey: true,
    models: [
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Rekomendasi - Cepat & Stabil)" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Konteks Panjang & Penalaran Kuat)" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Next-Gen)" },
      { id: "custom", name: "✏️ Ketik Model Manual / Kustom..." }
    ]
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    badge: "High Precision",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    keyPlaceholder: "sk-ant-...",
    requiresKey: true,
    models: [
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet (Rekomendasi - Penalaran Tinggi)" },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku (Super Cepat)" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus (Tugas Kompleks)" },
      { id: "custom", name: "✏️ Ketik Model Manual / Kustom..." }
    ]
  },
  {
    id: "kiro",
    name: "Kiro AI (Gamukis Gateway)",
    badge: "Internal Gateway",
    defaultBaseUrl: "http://host.docker.internal:20128/v1",
    keyPlaceholder: "kiro-gamukis-key...",
    requiresKey: true,
    models: [
      { id: "kiro-educational-v1", name: "Kiro Educational V1 (Kurikulum Indonesia)" },
      { id: "9router/auto", name: "9Router Auto Smart Gateway" },
      { id: "custom", name: "✏️ Ketik Model Manual / Kustom..." }
    ]
  },
  {
    id: "grok",
    name: "Grok (xAI)",
    badge: "Direct",
    defaultBaseUrl: "https://api.x.ai/v1",
    keyPlaceholder: "xai-...",
    requiresKey: true,
    models: [
      { id: "grok-beta", name: "Grok Beta (Rekomendasi)" },
      { id: "grok-2-1212", name: "Grok 2 (Versi Terbaru)" },
      { id: "grok-2-vision-1212", name: "Grok 2 Vision" },
      { id: "custom", name: "✏️ Ketik Model Manual / Kustom..." }
    ]
  },
  {
    id: "qwen",
    name: "Qwen / GWEN (Alibaba Cloud)",
    badge: "Multilingual",
    defaultBaseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    keyPlaceholder: "sk-...",
    requiresKey: true,
    models: [
      { id: "qwen-plus", name: "Qwen Plus (Rekomendasi - Akurat & Cepat)" },
      { id: "qwen-turbo", name: "Qwen Turbo (Super Cepat & Efisien)" },
      { id: "qwen-max", name: "Qwen Max (Kemampuan Tertinggi)" },
      { id: "qwen-2.5-72b-instruct", name: "Qwen 2.5 72B Instruct" },
      { id: "custom", name: "✏️ Ketik Model Manual / Kustom..." }
    ]
  },
  {
    id: "deepseek",
    name: "DeepSeek AI",
    badge: "Open Weights",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    keyPlaceholder: "sk-...",
    requiresKey: true,
    models: [
      { id: "deepseek-chat", name: "DeepSeek Chat (V3 - Rekomendasi)" },
      { id: "deepseek-reasoner", name: "DeepSeek Reasoner (R1 - Penalaran Logis)" },
      { id: "deepseek-coder", name: "DeepSeek Coder (Khusus Informatika/Kode)" },
      { id: "custom", name: "✏️ Ketik Model Manual / Kustom..." }
    ]
  },
  {
    id: "local",
    name: "Model Buatan Sendiri / Local (Gamukis & Ollama)",
    badge: "Self-Trained",
    defaultBaseUrl: "http://host.docker.internal:11434/v1",
    keyPlaceholder: "local / tidak diperlukan",
    requiresKey: false,
    models: [
      { id: "gamukis-r1:latest", name: "🤖 gamukis-r1:latest (DeepSeek-R1 Distilled - Rekomendasi Utama)" },
      { id: "gamukis-qwen:latest", name: "⚡ gamukis-qwen:latest (Qwen 2.5 Fast Worker)" },
      { id: "deepseek-r1:7b", name: "deepseek-r1:7b (Ollama Local)" },
      { id: "qwen2.5:3b", name: "qwen2.5:3b (Ollama Local)" },
      { id: "gamukis-internal-distilled-v1", name: "Gamukis Internal Distilled V1 (Model Latihan Gamukis)" },
      { id: "llama3.1:8b", name: "Llama 3.1 8B (Ollama Local)" },
      { id: "mistral:7b", name: "Mistral 7B (Ollama Local)" },
      { id: "custom", name: "✏️ Ketik Model Manual / Kustom..." }
    ]
  }
];

const normalizeJob = (j) => {
  if (!j) return null;
  const raw = j.job || j;
  const id = String(raw.jobId || raw.id || raw._id || "");
  return { ...raw, id, jobId: id };
};

/**
 * AdminAiQuestionGenerator — admin page to generate questions via AI (PDF)
 * or manage manual question authoring, monitor job status, and publish candidates to classes.
 */
const AdminAiQuestionGenerator = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [user] = useState(() => getManualUser());

  const role = getUserRole(user);
  const isAdmin = ["admin", "administrator"].includes(role);

  const [activeMode, setActiveMode] = useState("ai"); // "ai" | "manual"
  const [selectedSubject, setSelectedSubject] = useState("indonesia");
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [detectedPdfStructure, setDetectedPdfStructure] = useState(null);
  const [isScanningPdf, setIsScanningPdf] = useState(false);
  const [customTargetCount, setCustomTargetCount] = useState(null);
  const [liveProgress, setLiveProgress] = useState(null);
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [serviceStatus, setServiceStatus] = useState(null);
  const [isServiceToggling, setIsServiceToggling] = useState(false);
  const [ollamaPingResult, setOllamaPingResult] = useState(null);
  const [isPingingOllama, setIsPingingOllama] = useState(false);

  // AI Strategy & Model Selection State
  // "internal": Metode Mandiri Gamukis (Bebas Kuota, Cepat, Otomatis)
  // "cloud": Metode Cloud AI / Hybrid (OpenAI, Gemini, Claude, Kiro, dll.)
  const [generationStrategy, setGenerationStrategy] = useState("internal");
  const [selectedPlatform, setSelectedPlatform] = useState("openai");
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem("gamukis_ai_api_key_openai") || "";
    } catch {
      return "";
    }
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [customModelName, setCustomModelName] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [showAdvancedGateway, setShowAdvancedGateway] = useState(false);
  const [liveModels, setLiveModels] = useState(null);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelsFetchError, setModelsFetchError] = useState("");
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [retryingJobId, setRetryingJobId] = useState(null);

  // Teacher Harvesting State (Data Flywheel)
  const [teacherQuestions, setTeacherQuestions] = useState([]);
  const [memoryStats, setMemoryStats] = useState({ total: 0, bySubject: {} });
  const [isLoadingHarvest, setIsLoadingHarvest] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [selectedHarvestIds, setSelectedHarvestIds] = useState([]);
  const [harvestSubjectFilter, setHarvestSubjectFilter] = useState("all");
  const [harvestSearchQuery, setHarvestSearchQuery] = useState("");

  const activePlatformConfig =
    AI_PLATFORMS.find((p) => p.id === selectedPlatform) || AI_PLATFORMS[0];
  const isKeyEntered =
    Boolean(apiKey.trim()) || !activePlatformConfig.requiresKey;

  // Realtime Socket.IO Connection to dedicated /ai-workflow namespace
  useEffect(() => {
    aiWorkflowSocketClient.connect();
    const unsubStatus = aiWorkflowSocketClient.onStatusChange(({ status }) => {
      setSocketStatus(status);
    });

    const unsubProgress = aiWorkflowSocketClient.onProgress((data) => {
      const targetId = selectedJob?.jobId || selectedJob?.id;
      if (targetId && String(data.jobId) === String(targetId)) {
        setLiveProgress(data);
        if (data.status) {
          setSelectedJob((prev) => (prev ? { ...prev, status: data.status, candidateCount: data.extractedCount } : prev));
        }
      }
    });

    const unsubCandidate = aiWorkflowSocketClient.onCandidateStreamed((data) => {
      const targetId = selectedJob?.jobId || selectedJob?.id;
      if (targetId && String(data.jobId) === String(targetId)) {
        setCandidates((prev) => {
          const cand = data.candidate;
          if (data.candidateIndex !== undefined && cand.candidateIndex === undefined) {
            cand.candidateIndex = data.candidateIndex;
          }
          const exists = prev.some((c) => (c.candidateId && c.candidateId === cand.candidateId) || (c.prompt && c.prompt === cand.prompt));
          if (exists) return prev;
          const updated = [...prev, cand];
          return updated.sort((a, b) => {
            const numA = a.candidateIndex ?? a.questionNumber ?? 0;
            const numB = b.candidateIndex ?? b.questionNumber ?? 0;
            return numA - numB;
          });
        });
      }
    });

    const unsubCompleted = aiWorkflowSocketClient.onCompleted((data) => {
      const targetId = selectedJob?.jobId || selectedJob?.id;
      if (targetId && String(data.jobId) === String(targetId)) {
        setLiveProgress(null);
        setSelectedJob((prev) => (prev ? { ...prev, status: "review", candidateCount: data.candidateCount } : prev));
      }
    });

    const unsubFailed = aiWorkflowSocketClient.onFailed((data) => {
      const targetId = selectedJob?.jobId || selectedJob?.id;
      if (targetId && String(data.jobId) === String(targetId)) {
        setLiveProgress(null);
        setSelectedJob((prev) => (prev ? { ...prev, status: "failed", failureCode: data.failureCode, failureReason: data.failureReason } : prev));
      }
    });

    return () => {
      unsubStatus();
      unsubProgress();
      unsubCandidate();
      unsubCompleted();
      unsubFailed();
      aiWorkflowSocketClient.disconnect();
    };
  }, [selectedJob?.jobId, selectedJob?.id]);

  useEffect(() => {
    const targetId = selectedJob?.jobId || selectedJob?.id;
    if (targetId) {
      aiWorkflowSocketClient.joinJob(targetId);
    }
    return () => {
      if (targetId) {
        aiWorkflowSocketClient.leaveJob(targetId);
      }
    };
  }, [selectedJob?.jobId, selectedJob?.id]);

  const handlePlatformChange = (platformId) => {
    setSelectedPlatform(platformId);
    const platform = AI_PLATFORMS.find((p) => p.id === platformId);
    let savedKey = "";
    try {
      savedKey = localStorage.getItem(`gamukis_ai_api_key_${platformId}`) || "";
    } catch {}
    setApiKey(savedKey);
    const defaultModel = platform?.models[0]?.id || "default";
    setSelectedModel(defaultModel);
    setCustomModelName("");
    setCustomBaseUrl("");
    setLiveModels(null);
    setModelsFetchError("");
  };

  const handleApiKeyChange = (value) => {
    setApiKey(value);
    setLiveModels(null);
    setModelsFetchError("");
    try {
      if (value) {
        localStorage.setItem(`gamukis_ai_api_key_${selectedPlatform}`, value);
      } else {
        localStorage.removeItem(`gamukis_ai_api_key_${selectedPlatform}`);
      }
    } catch {}
  };

  const handleFetchLiveModels = async () => {
    if (!apiKey.trim() && activePlatformConfig.requiresKey) {
      setModelsFetchError("Masukkan API Key terlebih dahulu untuk mengambil model dari API.");
      return;
    }
    setIsFetchingModels(true);
    setModelsFetchError("");
    try {
      const res = await fetchLiveProviderModels({
        provider: selectedPlatform,
        apiKey: apiKey.trim(),
        baseUrl: customBaseUrl.trim() || activePlatformConfig.defaultBaseUrl || undefined
      });
      const list = res?.models || [];
      if (Array.isArray(list) && list.length > 0) {
        setLiveModels(list);
        if (!list.includes(selectedModel)) {
          setSelectedModel(list[0]);
        }
      } else {
        setModelsFetchError("Tidak ada model yang ditemukan dari respons API.");
      }
    } catch (err) {
      setModelsFetchError(err.message || "Gagal mengambil daftar model dari API.");
    } finally {
      setIsFetchingModels(false);
    }
  };

  // Load job list and available classes on mount
  useEffect(() => {
    if (!isAdmin) return;
    let isCurrent = true;

    const init = async () => {
      setIsLoading(true);
      try {
        const [jobsData, classesData] = await Promise.allSettled([
          listAdminAiJobs(),
          getAdminClasses({ pageSize: 100 })
        ]);
        if (!isCurrent) return;
        if (jobsData.status === "fulfilled") {
          const rawList = jobsData.value?.jobs || jobsData.value || [];
          const jobList = Array.isArray(rawList) ? rawList.map(normalizeJob).filter(Boolean) : [];
          setJobs(jobList);
        } else if (jobsData.reason?.message && (jobsData.reason.message.includes("Token") || jobsData.reason.message.includes("kedaluwarsa"))) {
          setError("Sesi login akun Admin Gamukis Anda telah kedaluwarsa di browser (ini sesi akun Admin Gamukis, BUKAN API Key OpenRouter). Silakan login ulang untuk melanjutkan.");
        }
        if (classesData.status === "fulfilled") {
          setAvailableClasses(classesData.value?.classes || []);
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    init();
    return () => { isCurrent = false; };
  }, [isAdmin]);

  const fetchServiceStatus = useCallback(async () => {
    try {
      const res = await getAiServiceStatus();
      setServiceStatus(res);
      return true;
    } catch {
      setServiceStatus({ online: false, status: "stopped", message: "Status layanan AI offline atau belum terjangkau." });
      return false;
    }
  }, []);

  // Poll AI service status every 15s; pause while the tab is hidden and back off up to 60s on failures (BUG-TRF-003)
  useEffect(() => {
    if (!isAdmin) return undefined;
    let isActive = true;
    let timer = null;
    let failures = 0;
    const BASE_DELAY_MS = 15000;
    const MAX_DELAY_MS = 60000;
    const isTabHidden = () => typeof document !== "undefined" && document.hidden === true;

    const scheduleNext = () => {
      if (!isActive) return;
      timer = setTimeout(poll, Math.min(MAX_DELAY_MS, BASE_DELAY_MS * (2 ** failures)));
    };
    const poll = async () => {
      if (!isActive) return;
      if (isTabHidden()) {
        scheduleNext();
        return;
      }
      const ok = await fetchServiceStatus();
      failures = ok ? 0 : Math.min(failures + 1, 2);
      scheduleNext();
    };
    const handleVisibilityChange = () => {
      if (!isActive || isTabHidden()) return;
      clearTimeout(timer);
      poll();
    };

    poll();
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    return () => {
      isActive = false;
      clearTimeout(timer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [isAdmin, fetchServiceStatus]);

  const handleStartService = async () => {
    setIsServiceToggling(true);
    setStatusMessage("Sedang menyalakan container AI (FastAPI & MongoDB AI)...");
    try {
      const res = await startAiService();
      setServiceStatus(res);
      setStatusMessage(res?.message || "Layanan AI berhasil dinyalakan!");
    } catch (err) {
      setError("Gagal menyalakan layanan AI: " + (err.message || "Error"));
    } finally {
      setIsServiceToggling(false);
    }
  };

  const handleStopService = async () => {
    setIsServiceToggling(true);
    setStatusMessage("Sedang mematikan container AI untuk menghemat memori komputer...");
    try {
      const res = await stopAiService();
      setServiceStatus(res);
      setStatusMessage("Layanan AI telah dimatikan (mode hemat daya aktif).");
    } catch (err) {
      setError("Gagal mematikan layanan AI: " + (err.message || "Error"));
    } finally {
      setIsServiceToggling(false);
    }
  };

  const handlePingOllama = async () => {
    setIsPingingOllama(true);
    setOllamaPingResult(null);
    try {
      const res = await pingOllama({
        model: selectedPlatform === "local" ? (selectedModel || "gamukis-r1:latest") : "gamukis-r1:latest",
        prompt: "Konfirmasi status kesiapanmu mengekstrak dan memproses soal dalam satu kalimat singkat."
      });
      setOllamaPingResult(res);
      fetchServiceStatus();
    } catch (err) {
      setOllamaPingResult({
        success: false,
        message: err.message || "Gagal menghubungi Ollama di port 11434."
      });
    } finally {
      setIsPingingOllama(false);
    }
  };

  // Load candidates when a job is selected and done
  useEffect(() => {
    const targetId = selectedJob?.jobId || selectedJob?.id;
    if (!targetId) return;
    let isCurrent = true;

    const loadCandidates = async () => {
      try {
        const detail = await getAdminAiJob(targetId);
        if (!isCurrent) return;
        let candidateList = detail?.candidates || detail?.job?.candidates || [];
        const expectedCount = detail?.job?.candidateCount || selectedJob?.candidateCount || 0;
        if (!candidateList.length || (expectedCount > candidateList.length)) {
          const candidatesData = await getAdminAiCandidates(targetId, { pageSize: 350 }).catch(() => null);
          if (candidatesData?.candidates?.length) {
            candidateList = candidatesData.candidates;
          }
        }
        setCandidates(candidateList);
        setSelectedJob((prev) => normalizeJob({ ...prev, ...detail, ...(detail?.job || {}) }));
      } catch (err) {
        if (!isCurrent) return;
        setError(err.message || "Gagal memuat kandidat soal.");
      }
    };

    if (selectedJob?.status === "done" || selectedJob?.status === "review") {
      loadCandidates();
    }
  }, [selectedJob?.jobId, selectedJob?.id, selectedJob?.status, selectedJob?.candidateCount]);

  const handleFileSelected = async (file, fileError) => {
    if (fileError) {
      setUploadError(fileError);
      setUploadFile(null);
      setDetectedPdfStructure(null);
      setCustomTargetCount(null);
      return;
    }
    setUploadError("");
    setUploadFile(file);
    setDetectedPdfStructure(null);
    setCustomTargetCount(null);
    if (file?.name) {
      const lower = file.name.toLowerCase();
      if (
        lower.includes("tps") ||
        lower.includes("utbk") ||
        lower.includes("sbmptn") ||
        lower.includes("snbt") ||
        lower.includes("tryout") ||
        lower.includes("ujian") ||
        lower.includes("campur") ||
        lower.includes("semua") ||
        lower.includes("multi")
      ) {
        setSelectedSubject("semua_pelajaran");
      } else {
        for (const sub of CANONICAL_SUBJECTS) {
          if (sub.key !== "semua_pelajaran" && (lower.includes(sub.key) || lower.includes(sub.label.toLowerCase()))) {
            setSelectedSubject(sub.key);
            break;
          }
        }
      }
    }

    if (file) {
      setIsScanningPdf(true);
      try {
        const structure = await inspectPdfStructure(file);
        if (structure && typeof structure.totalQuestions === "number") {
          setDetectedPdfStructure(structure);
          setCustomTargetCount(structure.totalQuestions);
        }
      } catch (err) {
        console.warn("Pre-flight PDF scan skipped:", err);
      } finally {
        setIsScanningPdf(false);
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setUploadError("Pilih file PDF terlebih dahulu.");
      return;
    }
    setIsUploading(true);
    setError("");
    setStatusMessage("");
    try {
      if (serviceStatus && !serviceStatus.online) {
        setStatusMessage("Layanan AI sedang nonaktif. Menyalakan container AI secara otomatis...");
        const autoStarted = await startAiService().catch(() => null);
        if (autoStarted) setServiceStatus(autoStarted);
      }

      const idempotencyKey = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const isInternal = generationStrategy === "local" || generationStrategy === "internal";
      const isHybrid = generationStrategy === "hybrid";
      const effectiveMode = isInternal ? "local" : (isHybrid ? "hybrid" : "cloud");
      const effectiveProvider = isInternal ? "local" : selectedPlatform;
      const effectiveModel = isInternal
        ? "internal"
        : selectedModel === "custom"
        ? customModelName.trim()
        : selectedModel;
      const effectiveBaseUrl = isInternal
        ? "internal"
        : customBaseUrl.trim() || activePlatformConfig.defaultBaseUrl || undefined;

      const result = await uploadAdminAiJob(uploadFile, {
        subjectKey: selectedSubject,
        idempotencyKey,
        extractionMode: effectiveMode,
        provider: effectiveProvider,
        model: effectiveModel || undefined,
        apiKey: isInternal ? undefined : (apiKey.trim() || undefined),
        baseUrl: effectiveBaseUrl
      });
      const newJob = normalizeJob(result?.job || result);
      setJobs((prev) => [newJob, ...prev]);
      setSelectedJob(newJob);
      setCandidates([]);
      setUploadFile(null);
      setStatusMessage("Job AI berhasil dibuat! Pantau proses ekstraksi pada status job.");
    } catch (err) {
      const msg = err.message || "Upload PDF gagal.";
      if (msg.includes("Token tidak valid") || msg.includes("kedaluwarsa") || msg.includes("Token login diperlukan")) {
        setError("Sesi login akun Admin Gamukis Anda telah kedaluwarsa di browser (ini adalah sesi akun Admin web, BUKAN API Key OpenRouter). Silakan login ulang untuk melanjutkan.");
      } else {
        setError(msg);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetryJob = async (jobId) => {
    if (!jobId) return;
    setRetryingJobId(jobId);
    setError("");
    setStatusMessage("");
    setLiveProgress(null);
    try {
      const res = await retryAdminAiJob(jobId);
      const updated = normalizeJob(res?.job || res);
      setJobs((prev) => prev.map((j) => ((j.jobId || j.id) === jobId ? updated : j)));
      if ((selectedJob?.jobId || selectedJob?.id) === jobId) {
        setSelectedJob(updated);
      }
      setStatusMessage("Job AI berhasil distack & dilanjutkan kembali!");
    } catch (err) {
      setError(err.message || "Gagal melanjutkan job AI.");
    } finally {
      setRetryingJobId(null);
    }
  };

  const handleRefreshJob = useCallback(async () => {
    const targetId = selectedJob?.jobId || selectedJob?.id;
    if (!targetId) return;
    setIsRefreshing(true);
    setError("");
    try {
      const detail = await getAdminAiJob(targetId);
      const normalized = normalizeJob(detail);
      setSelectedJob(normalized);
      let cList = detail?.candidates || detail?.job?.candidates || [];
      if (!cList.length && (normalized?.status === 'review' || normalized?.status === 'done' || normalized?.status === 'awaiting_continuation' || normalized?.awaitingContinuation)) {
        const cRes = await getAdminAiCandidates(targetId).catch(() => null);
        cList = cRes?.candidates || [];
      }
      setCandidates(cList);
    } catch (err) {
      setError(err.message || "Gagal menyegarkan status job.");
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedJob?.jobId, selectedJob?.id]);

  const handleContinueJob = async () => {
    const targetId = selectedJob?.jobId || selectedJob?.id;
    if (!targetId) return;
    try {
      setIsRefreshing(true);
      setError("");
      await continueAdminAiJob(targetId);
      await handleRefreshJob();
    } catch (err) {
      setError(err.message || "Gagal melanjutkan pemrosesan materi berikutnya.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReview = async (candidateId, decision, reason) => {
    const targetId = selectedJob?.jobId || selectedJob?.id;
    if (!targetId) return;
    setError("");
    const normalizedDecision = (decision === "accept" || decision === "approved") ? "approved" : "rejected";

    setCandidates((prev) =>
      prev.map((c) => {
        const cId = c.candidateId || c.id || c._id;
        if (String(cId) === String(candidateId)) {
          return {
            ...c,
            reviewStatus: normalizedDecision,
            status: normalizedDecision === "approved" ? "accepted" : "rejected"
          };
        }
        return c;
      })
    );

    try {
      await reviewAiCandidate(targetId, candidateId, { decision: normalizedDecision, reason });
      setStatusMessage(`Kandidat berhasil di-${normalizedDecision === "approved" ? "terima" : "tolak"}.`);
      const detail = await getAdminAiJob(targetId).catch(() => null);
      if (detail?.candidates) {
        setCandidates(detail.candidates);
      }
    } catch (err) {
      const detail = await getAdminAiJob(targetId).catch(() => null);
      if (detail?.candidates) {
        setCandidates(detail.candidates);
      }
      setError(err.message || "Gagal mereview kandidat.");
    }
  };

  const handlePublish = async (candidateId, classId) => {
    const targetId = selectedJob?.jobId || selectedJob?.id;
    if (!targetId) return;
    setError("");
    const idempotencyKey = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    try {
      await publishAiCandidate(targetId, candidateId, { classId, idempotencyKey });
      const detail = await getAdminAiJob(targetId);
      setCandidates(detail?.candidates || []);
      setStatusMessage("Soal berhasil dipublikasikan ke kelas!");
    } catch (err) {
      setError(err.message || "Gagal mempublikasikan soal.");
    }
  };

  const handleFilterWords = async (filterConfig) => {
    const targetId = selectedJob?.jobId || selectedJob?.id;
    if (!targetId) return;
    setError("");
    try {
      const result = await filterAdminAiJobWords(targetId, filterConfig);
      const detail = await getAdminAiJob(targetId);
      setCandidates(detail?.candidates || []);
      setStatusMessage(
        `Filter selesai: ${result.cleanedCount || 0} soal dibersihkan, ${result.rejectedCount || 0} soal ditolak.`
      );
    } catch (err) {
      setError(err.message || "Gagal menerapkan filter kata.");
    }
  };

  const handleReviewAll = async (decision = "approved") => {
    const targetId = selectedJob?.jobId || selectedJob?.id;
    if (!targetId) return;
    setError("");
    try {
      await reviewAllAiCandidates(targetId, { decision });
      const detail = await getAdminAiJob(targetId);
      setCandidates(detail?.candidates || []);
      setStatusMessage("Semua kandidat soal berhasil ditandai sebagai disetujui (benar)!");
    } catch (err) {
      setError(err.message || "Gagal menyetujui semua kandidat.");
    }
  };

  const handlePublishAll = async ({ destination, classId }) => {
    const targetId = selectedJob?.jobId || selectedJob?.id;
    if (!targetId) return;
    setIsSavingAll(true);
    setError("");
    try {
      const res = await publishAllAiCandidates(targetId, {
        destination,
        classId: classId ? Number(classId) : null,
        idempotencyKey: `${Date.now()}_bulk`
      });
      const detail = await getAdminAiJob(targetId);
      setCandidates(detail?.candidates || []);
      const targetLabel =
        destination === "memory"
          ? "Stack Memory MongoDB (ai_question_ml_memory) — Dataset Latihan AI Mandiri"
          : destination === "class"
          ? `kelas #${classId}`
          : `Bank Soal Game (Mapel: ${res.subjectKey || "Umum"})`;
      setStatusMessage(`Berhasil menyimpan ${res.savedCount} soal ke ${targetLabel}!`);
    } catch (err) {
      setError(err.message || "Gagal menyimpan semua soal.");
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleUpdateCandidate = async (candidateId, updatedData) => {
    const targetJobId = selectedJob?.jobId || selectedJob?.id || selectedJob?._id;
    if (!targetJobId) return;
    try {
      const res = await updateAiCandidate(targetJobId, candidateId, updatedData);
      const updated = res.candidate || res;
      setCandidates((prev) =>
        prev.map((c) =>
          (c.id === candidateId || c.candidateId === candidateId || c._id === candidateId)
            ? { ...c, ...updated }
            : c
        )
      );
      setStatusMessage("Koreksi parameter soal berhasil disimpan.");
    } catch (err) {
      console.error("Gagal mengupdate kandidat soal:", err);
      alert(err.message || "Gagal mengupdate kandidat soal.");
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    const targetJobId = selectedJob?.jobId || selectedJob?.id || selectedJob?._id;
    if (!targetJobId) return;
    try {
      await deleteAiCandidate(targetJobId, candidateId);
      setCandidates((prev) =>
        prev.filter((c) => c.id !== candidateId && c.candidateId !== candidateId && c._id !== candidateId)
      );
      setStatusMessage("Kandidat soal berhasil dihapus.");
    } catch (err) {
      console.error("Gagal menghapus kandidat soal:", err);
      alert(err.message || "Gagal menghapus kandidat soal.");
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!jobId) return;
    setError("");
    try {
      await deleteAdminAiJob(jobId);
      setJobs((prev) => prev.filter((j) => (j.jobId || j.id) !== jobId));
      if ((selectedJob?.jobId || selectedJob?.id) === jobId) {
        setSelectedJob(null);
        setCandidates([]);
      }
      setStatusMessage("Job berhasil dihapus.");
    } catch (err) {
      setError(err.message || "Gagal menghapus job.");
    }
  };

  const loadHarvestData = useCallback(async () => {
    setIsLoadingHarvest(true);
    setError("");
    try {
      const [questionsRes, statsRes] = await Promise.allSettled([
        listTeacherQuestionsForHarvest(),
        getStackMemoryStats()
      ]);
      if (questionsRes.status === "fulfilled") {
        setTeacherQuestions(questionsRes.value?.questions || []);
      }
      if (statsRes.status === "fulfilled") {
        setMemoryStats(statsRes.value?.stats || { total: 0, bySubject: {} });
      }
    } catch (err) {
      setError(err.message || "Gagal memuat data soal guru atau statistik memory.");
    } finally {
      setIsLoadingHarvest(false);
    }
  }, []);

  const handleHarvest = async (questionIds) => {
    if (!questionIds || questionIds.length === 0) return;
    setIsHarvesting(true);
    setError("");
    setStatusMessage("");
    try {
      const res = await harvestTeacherQuestions({ questionIds });
      setStatusMessage(`Berhasil memanen ${res.harvestedCount || questionIds.length} soal ke Stack Memory AI dengan tagging CBF!`);
      setSelectedHarvestIds((prev) => prev.filter((id) => !questionIds.includes(id)));
      await loadHarvestData();
    } catch (err) {
      setError(err.message || "Gagal memanen soal guru.");
    } finally {
      setIsHarvesting(false);
    }
  };

  const handleToggleSelectHarvest = (id) => {
    setSelectedHarvestIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllHarvest = (filteredIds) => {
    if (selectedHarvestIds.length === filteredIds.length) {
      setSelectedHarvestIds([]);
    } else {
      setSelectedHarvestIds(filteredIds);
    }
  };

  useEffect(() => {
    if (activeMode === "harvest") {
      loadHarvestData();
    }
  }, [activeMode, loadHarvestData]);

  // Auth guard for standalone rendering
  if (!user && !embedded) {
    return (
      <main className="admin-dashboard-message" style={{ padding: "40px 20px", textAlign: "center" }}>
        <p>Silakan masuk untuk mengakses halaman ini.</p>
        <button type="button" onClick={() => navigate("/login")} style={{ padding: "8px 18px", borderRadius: "8px", background: "#2563eb", color: "#fff", border: "none" }}>
          Ke halaman masuk
        </button>
      </main>
    );
  }

  if (!isAdmin && !embedded) {
    return (
      <main className="admin-dashboard-message" style={{ padding: "40px 20px", textAlign: "center" }}>
        <h1>Akses Ditolak</h1>
        <p>Halaman ini hanya tersedia untuk akun Admin.</p>
        <button type="button" onClick={() => navigate("/home")} style={{ padding: "8px 18px", borderRadius: "8px", background: "#64748b", color: "#fff", border: "none" }}>
          Kembali ke beranda
        </button>
      </main>
    );
  }

  const filteredQuestions = teacherQuestions.filter((q) => {
    if (harvestSubjectFilter !== "all") {
      const qSub = (q.subject_key || q.subject || "").toLowerCase();
      if (qSub !== harvestSubjectFilter.toLowerCase()) return false;
    }
    if (harvestSearchQuery.trim()) {
      const query = harvestSearchQuery.toLowerCase();
      const matchPrompt = (q.prompt || "").toLowerCase().includes(query);
      const matchTeacher = (q.teacher_name || "").toLowerCase().includes(query);
      const matchClass = (q.class_title || "").toLowerCase().includes(query);
      if (!matchPrompt && !matchTeacher && !matchClass) return false;
    }
    return true;
  });

  const content = (
    <div className="admin-ai-container" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Fallback header for standalone mode */}
      {!embedded && (
        <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px", paddingBottom: "16px", borderBottom: "1px solid #e2e8f0" }}>
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: 600 }}
          >
            ← Dashboard Admin
          </button>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>GAMUKIS ADMIN</p>
            <h1 style={{ margin: 0, fontSize: "clamp(1.25rem, 4vw, 1.5rem)", fontWeight: 700, color: "#0f172a" }}>AI Pembuat Soal</h1>
          </div>
        </header>
      )}

      {/* Mode Switcher: AI vs Manual */}
      <section aria-label="Pilihan Metode Pembuatan Soal" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "14px" }}>
        <div
          onClick={() => setActiveMode("ai")}
          style={{
            padding: "16px 20px",
            borderRadius: "12px",
            border: activeMode === "ai" ? "2px solid #f5b900" : "1px solid #e1e5ea",
            background: activeMode === "ai" ? "#fffdf2" : "#ffffff",
            cursor: "pointer",
            boxShadow: activeMode === "ai" ? "0 4px 12px rgba(245,185,0,0.18)" : "0 1px 3px rgba(0,0,0,0.04)",
            transition: "all 0.2s"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "1.3rem" }}>✨</span>
            <strong style={{ fontSize: "1rem", color: activeMode === "ai" ? "#1976d2" : "#333333" }}>Opsi 1: AI Question Generator</strong>
            {activeMode === "ai" && (
              <span style={{ marginLeft: "auto", fontSize: "0.72rem", background: "#fcd03e", color: "#292929", border: "1px solid #f5b900", padding: "2px 8px", borderRadius: "999px", fontWeight: 700 }}>
                AKTIF
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#475569", lineHeight: 1.45 }}>
            Unggah dokumen PDF materi pelajaran. AI akan mengekstrak teks dan merumuskan draf soal pilihan ganda secara otomatis.
          </p>
        </div>

        <div
          onClick={() => setActiveMode("manual")}
          style={{
            padding: "16px 20px",
            borderRadius: "12px",
            border: activeMode === "manual" ? "2px solid #f5b900" : "1px solid #e1e5ea",
            background: activeMode === "manual" ? "#fffdf2" : "#ffffff",
            cursor: "pointer",
            boxShadow: activeMode === "manual" ? "0 4px 12px rgba(245,185,0,0.18)" : "0 1px 3px rgba(0,0,0,0.04)",
            transition: "all 0.2s"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "1.3rem" }}>✍️</span>
            <strong style={{ fontSize: "1rem", color: activeMode === "manual" ? "#1976d2" : "#333333" }}>Opsi 2: Form Manual (Tanpa AI)</strong>
            {activeMode === "manual" && (
              <span style={{ marginLeft: "auto", fontSize: "0.72rem", background: "#fcd03e", color: "#292929", border: "1px solid #f5b900", padding: "2px 8px", borderRadius: "999px", fontWeight: 700 }}>
                AKTIF
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#475569", lineHeight: 1.45 }}>
            Ketik pertanyaan, opsi jawaban A/B/C/D, dan kunci jawaban sendiri melalui formulir manual editor kelas.
          </p>
        </div>

        <div
          onClick={() => setActiveMode("harvest")}
          style={{
            padding: "16px 20px",
            borderRadius: "12px",
            border: activeMode === "harvest" ? "2px solid #f5b900" : "1px solid #e1e5ea",
            background: activeMode === "harvest" ? "#fffdf2" : "#ffffff",
            cursor: "pointer",
            boxShadow: activeMode === "harvest" ? "0 4px 12px rgba(245,185,0,0.18)" : "0 1px 3px rgba(0,0,0,0.04)",
            transition: "all 0.2s"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "1.3rem" }}>📥</span>
            <strong style={{ fontSize: "1rem", color: activeMode === "harvest" ? "#1976d2" : "#333333" }}>Opsi 3: Panen Soal Guru (Data Flywheel)</strong>
            {activeMode === "harvest" && (
              <span style={{ marginLeft: "auto", fontSize: "0.72rem", background: "#fcd03e", color: "#292929", border: "1px solid #f5b900", padding: "2px 8px", borderRadius: "999px", fontWeight: 700 }}>
                AKTIF
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#475569", lineHeight: 1.45 }}>
            Kurasi & panen bank soal dari kelas guru ke Stack Memory MongoDB dengan penandaan CBF untuk dataset latihan model AI Gamukis.
          </p>
        </div>
      </section>

      {/* Notifications */}
      {error && (
        <div role="alert" style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", borderRadius: "10px", padding: "14px 18px", fontSize: "0.9rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ flex: 1, minWidth: "min(100%, 240px)", overflowWrap: "anywhere", wordBreak: "break-word" }}>
              <strong>⚠️ Perhatian:</strong> {error}
            </div>
            {(error.includes("Token") || error.includes("kedaluwarsa") || error.includes("login") || error.includes("Unauthorized")) && (
              <button
                type="button"
                onClick={() => navigate("/login")}
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  boxShadow: "0 2px 4px rgba(220, 38, 38, 0.2)"
                }}
              >
                🔑 Login Ulang Sekarang
              </button>
            )}
          </div>
        </div>
      )}
      {statusMessage && (
        <div role="status" style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#166534", borderRadius: "10px", padding: "12px 16px", fontSize: "0.9rem" }}>
          ✅ {statusMessage}
        </div>
      )}

      {/* MANUAL MODE PANEL */}
      {activeMode === "manual" && (
        <section
          aria-label="Panduan Pembuatan Soal Manual"
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div style={{ fontSize: "2rem" }}>📝</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                Pembuatan Soal Kuis Kelas Secara Manual
              </h3>
              <p style={{ margin: "0 0 14px", fontSize: "0.9rem", color: "#475569", lineHeight: 1.5 }}>
                Pembuatan soal secara manual dilakukan langsung di dalam masing-masing kelas. Guru maupun Administrator dapat menambah, mengedit, atau menghapus pertanyaan pilihan ganda, menentukan kunci jawaban benar, bobot poin, dan penjelasan langsung pada form editor.
              </p>
              <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                <strong style={{ fontSize: "0.88rem", color: "#1e293b", display: "block", marginBottom: "6px" }}>
                  💡 Karakteristik Soal Manual:
                </strong>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.85rem", color: "#475569", lineHeight: 1.6 }}>
                  <li>Tersimpan dengan tanda <code>source_type: 'manual'</code> di database.</li>
                  <li>Bisa dipadukan dalam kelas yang sama dengan soal hasil terbitan AI.</li>
                  <li>Siswa menerima soal yang sama di inGame sesuai mata pelajaran kelas yang dipilih.</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => navigate("/admin/classes")}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer"
                }}
              >
                Buka Menu Kelas Guru →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* HARVEST MODE PANEL (Data Flywheel) */}
      {activeMode === "harvest" && (
        <section
          aria-label="Panel Panen Soal Guru Data Flywheel"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}
        >
          {/* Top Banner / Explanation */}
          <div
            style={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
              color: "#ffffff",
              borderRadius: "14px",
              padding: "24px",
              boxShadow: "0 4px 16px rgba(30, 58, 138, 0.15)"
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ fontSize: "2.4rem" }}>🧠</div>
              <div style={{ flex: 1, minWidth: "min(100%, 240px)" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "1.25rem", fontWeight: 700 }}>
                  Data Flywheel & Content-Based Filtering (CBF)
                </h3>
                <p style={{ margin: "0 0 14px", fontSize: "0.9rem", color: "#bfdbfe", lineHeight: 1.5 }}>
                  Admin dapat mengurasi dan memanen butir soal berkualitas yang dibuat oleh para Guru. Setiap soal yang dipanen akan disimpan ke <strong>Stack Memory MongoDB (ai_question_ml_memory)</strong> dengan penandaan taksonomi CBF (kategori mata pelajaran, stimulus bacaan/konsep, token teks, dan tingkat kesulitan) sebagai dataset latihan model AI Gamukis berikutnya.
                </p>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ background: "rgba(255,255,255,0.15)", padding: "6px 14px", borderRadius: "8px", fontSize: "0.85rem" }}>
                    📚 Total Stack Memory: <strong>{memoryStats.total || 0} Soal</strong>
                  </div>
                  {Object.entries(memoryStats.bySubject || {}).map(([sub, count]) => (
                    <span
                      key={sub}
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "0.78rem"
                      }}
                    >
                      {sub}: {count}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={loadHarvestData}
                  disabled={isLoadingHarvest}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.3)",
                    background: "rgba(255,255,255,0.2)",
                    color: "#ffffff",
                    fontWeight: 600,
                    cursor: isLoadingHarvest ? "not-allowed" : "pointer",
                    fontSize: "0.85rem"
                  }}
                >
                  {isLoadingHarvest ? "Memuat..." : "↻ Segarkan Data"}
                </button>
              </div>
            </div>
          </div>

          {/* Filtering and Actions Bar */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", flex: 1, minWidth: "min(100%, 220px)" }}>
              <input
                type="text"
                placeholder="Cari teks soal atau guru..."
                value={harvestSearchQuery}
                onChange={(e) => setHarvestSearchQuery(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.85rem",
                  minWidth: "min(100%, 220px)",
                  flex: "1 1 180px",
                  boxSizing: "border-box"
                }}
              />
              <select
                value={harvestSubjectFilter}
                onChange={(e) => setHarvestSubjectFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.85rem",
                  background: "#ffffff",
                  maxWidth: "100%"
                }}
              >
                <option value="all">Semua Mata Pelajaran</option>
                {CANONICAL_SUBJECTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => handleSelectAllHarvest(filteredQuestions.map((q) => q.id))}
                disabled={isLoadingHarvest || filteredQuestions.length === 0}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#334155",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {selectedHarvestIds.length === filteredQuestions.length && filteredQuestions.length > 0
                  ? "Batal Pilih Semua"
                  : "Pilih Semua"}
              </button>
              <button
                type="button"
                onClick={() => handleHarvest(selectedHarvestIds)}
                disabled={isHarvesting || selectedHarvestIds.length === 0}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: selectedHarvestIds.length > 0 ? "#16a34a" : "#94a3b8",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: selectedHarvestIds.length > 0 && !isHarvesting ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>📥</span>
                {isHarvesting
                  ? "Memproses Panen..."
                  : `Panen Soal Terpilih (${selectedHarvestIds.length})`}
              </button>
            </div>
          </div>

          {/* Teacher Questions List */}
          {isLoadingHarvest ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⏳</div>
              <p>Memuat bank soal dari kelas guru...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 20px",
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px dashed #cbd5e1"
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>📭</div>
              <h4 style={{ margin: "0 0 6px", color: "#1e293b", fontSize: "1.1rem" }}>
                Tidak Ada Soal Guru yang Ditemukan
              </h4>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem" }}>
                Belum ada soal dari kelas guru yang sesuai dengan filter atau dibuat di kelas guru.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {filteredQuestions.map((q) => {
                const isSelected = selectedHarvestIds.includes(q.id);
                return (
                  <div
                    key={q.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "12px",
                      border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                      padding: "18px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      boxShadow: isSelected ? "0 4px 12px rgba(37,99,235,0.08)" : "none",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectHarvest(q.id)}
                          style={{ width: "18px", height: "18px", cursor: "pointer" }}
                        />
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: "999px",
                            background: "#e0e7ff",
                            color: "#3730a3",
                            fontSize: "0.75rem",
                            fontWeight: 700
                          }}
                        >
                          {q.subject_key || q.subject || "Umum"}
                        </span>
                        <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                          Kelas: <strong>{q.class_title || `#${q.class_id}`}</strong>
                        </span>
                        <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                          Guru: <strong>{q.teacher_name || "Guru"}</strong>
                        </span>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => handleHarvest([q.id])}
                          disabled={isHarvesting}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "6px",
                            border: "1px solid #16a34a",
                            background: "#f0fdf4",
                            color: "#166534",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          📥 Panen Soal Ini
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: "0.95rem", color: "#1e293b", lineHeight: 1.5, fontWeight: 500, overflowWrap: "anywhere", wordBreak: "break-word" }}>
                      {q.prompt}
                    </div>

                    {Array.isArray(q.options) && q.options.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "8px", background: "#f8fafc", padding: "12px", borderRadius: "8px" }}>
                        {q.options.map((opt, idx) => {
                          const isCorrect = String(opt.id) === String(q.correct_option_id);
                          return (
                            <div
                              key={opt.id || idx}
                              style={{
                                fontSize: "0.82rem",
                                color: isCorrect ? "#166534" : "#475569",
                                fontWeight: isCorrect ? 600 : 400,
                                background: isCorrect ? "#dcfce7" : "#ffffff",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                border: isCorrect ? "1px solid #86efac" : "1px solid #e2e8f0"
                              }}
                            >
                              <span style={{ fontWeight: 700, marginRight: "4px" }}>
                                {String.fromCharCode(65 + idx)}.
                              </span>{" "}
                              {opt.option_text}
                              {isCorrect && " ✓"}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* AI GENERATOR MODE PANELS */}
      {activeMode === "ai" && (
        <>
          <AiServiceToggle
            serviceStatus={serviceStatus}
            loading={isServiceToggling}
            onStart={handleStartService}
            onStop={handleStopService}
            onRefresh={fetchServiceStatus}
          />

          {/* Live Ollama AI Realtime Monitor Card */}
          <div
            className="ai-ollama-realtime-card"
            data-testid="ai-ollama-realtime-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e1e5ea",
              borderRadius: "14px",
              padding: "16px 20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <span style={{ fontSize: "1.4rem" }}>🤖</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontSize: "0.95rem", color: "#1e293b" }}>
                      Monitor Kerja Realtime: Ollama AI Local
                    </strong>
                    <span
                      style={{
                        fontSize: "0.74rem",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: serviceStatus?.ollama?.online ? (serviceStatus?.ollama?.isBusy ? "#dbeafe" : "#dcfce7") : "#f1f5f9",
                        color: serviceStatus?.ollama?.online ? (serviceStatus?.ollama?.isBusy ? "#1e40af" : "#166534") : "#64748b",
                        fontWeight: 700,
                        border: serviceStatus?.ollama?.online ? "1px solid #bbf7d0" : "1px solid #e2e8f0"
                      }}
                    >
                      {serviceStatus?.ollama?.online
                        ? (serviceStatus.ollama.isBusy ? "⚡ Sedang Bekerja (Inferencing)" : "🟢 Online & Siap (Port 11434)")
                        : "⚪ Offline / Belum Dijalankan"}
                    </span>
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                    Model Utama: <strong>gamukis-r1:latest</strong> (DeepSeek-R1 Distilled) &bull; Mode Otonom Mandiri Bebas Kuota
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={handlePingOllama}
                  disabled={isPingingOllama}
                  style={{
                    padding: "7px 16px",
                    borderRadius: "8px",
                    background: "#fcd03e",
                    color: "#292929",
                    border: "1px solid #f5b900",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: isPingingOllama ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 4px rgba(245, 185, 0, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                  title="Kirim prompt tes ke model gamukis-r1 untuk menguji respon dan status kerja realtime"
                >
                  <span>{isPingingOllama ? "⏳ Menguji..." : "⚡ Cek Kerja Ollama Realtime"}</span>
                </button>
              </div>
            </div>

            {/* Live Ping Output */}
            {ollamaPingResult && (
              <div
                style={{
                  background: ollamaPingResult.success ? "#f0fdf4" : "#fef2f2",
                  border: ollamaPingResult.success ? "1px solid #86efac" : "1px solid #fca5a5",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "0.82rem",
                  color: ollamaPingResult.success ? "#166534" : "#991b1b"
                }}
              >
                {ollamaPingResult.success ? (
                  <div>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "4px", fontWeight: 700 }}>
                      <span>✅ Ollama Berhasil Merespons!</span>
                      <span style={{ fontSize: "0.75rem", background: "#dcfce7", padding: "1px 6px", borderRadius: "4px" }}>
                        Waktu Respon: {ollamaPingResult.latencyMs} ms
                      </span>
                      <span style={{ fontSize: "0.75rem", background: "#e0e7ff", color: "#3730a3", padding: "1px 6px", borderRadius: "4px" }}>
                        Model: {ollamaPingResult.model}
                      </span>
                    </div>
                    <div style={{ fontStyle: "italic", color: "#1e293b", background: "#ffffff", padding: "6px 10px", borderRadius: "6px", border: "1px solid #bbf7d0", overflowWrap: "anywhere", wordBreak: "break-word" }}>
                      "{ollamaPingResult.reply}"
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
                    <strong>⚠️ Kendala Koneksi Ollama:</strong> {ollamaPingResult.message || "Ollama tidak merespon di port 11434."}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 1: Upload PDF */}
          <section
            aria-label="Unggah Materi PDF"
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
                1. Upload PDF
              </h2>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
                Pilih file PDF materi belajar (maksimal 10 MB dan 50 halaman). AI akan mengekstrak teks materi untuk dirumuskan menjadi soal.
              </p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label htmlFor="subject-select" style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                Mata Pelajaran Soal *
              </label>
              <select
                id="subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "340px",
                  padding: "9px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: "0.9rem",
                  color: "#0f172a",
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                {CANONICAL_SUBJECTS.map((sub) => (
                  <option key={sub.key} value={sub.key}>
                    {sub.label}
                  </option>
                ))}
              </select>
              <span style={{ display: "block", fontSize: "0.78rem", color: "#64748b", marginTop: "4px" }}>
                {selectedSubject === "semua_pelajaran"
                  ? "🌐 Mode Umum / Campuran: LLM akan mengekstrak soal dari semua materi pelajaran yang tercakup di dalam dokumen PDF."
                  : "AI akan memfokuskan ekstraksi draf soal secara spesifik pada mata pelajaran ini."}
              </span>
            </div>

            {/* PLATFORM & MODEL CONFIGURATION PANEL */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", marginBottom: "20px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "1.2rem" }}>🤖</span>
                <strong style={{ fontSize: "0.95rem", color: "#1e293b" }}>Metode Pembuatan & Konfigurasi AI</strong>
                <span style={{ fontSize: "0.72rem", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "999px", fontWeight: 700 }}>
                  TAHAP 2
                </span>
              </div>

              {/* 3-FEATURE MODE SELECTOR: Local, Cloud, Hybrid */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
                  Pilih Fitur / Metode Ekstraksi Soal:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "10px" }}>
                  {/* Fitur 1: Local / Mandiri */}
                  <div
                    onClick={() => setGenerationStrategy("local")}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: (generationStrategy === "local" || generationStrategy === "internal") ? "2px solid #16a34a" : "1px solid #cbd5e1",
                      background: (generationStrategy === "local" || generationStrategy === "internal") ? "#f0fdf4" : "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "1.1rem" }}>🏠</span>
                      <strong style={{ fontSize: "0.88rem", color: (generationStrategy === "local" || generationStrategy === "internal") ? "#15803d" : "#1e293b" }}>
                        Fitur Local (Mandiri)
                      </strong>
                      <span style={{ marginLeft: "auto", fontSize: "0.68rem", background: "#16a34a", color: "#fff", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                        0 TOKEN
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#475569", lineHeight: 1.4 }}>
                      100% diproses di server lokal tanpa internet/API key. Super cepat, bebas kuota, aman offline.
                    </p>
                  </div>

                  {/* Fitur 2: Cloud / Vision AI */}
                  <div
                    onClick={() => setGenerationStrategy("cloud")}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: generationStrategy === "cloud" ? "2px solid #1976d2" : "1px solid #cbd5e1", background: generationStrategy === "cloud" ? "#ebf3fc" : "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "1.1rem" }}>☁️</span>
                      <strong style={{ fontSize: "0.88rem", color: generationStrategy === "cloud" ? "#1976d2" : "#333333" }}>
                        Fitur Cloud (Vision AI)
                      </strong>
                      <span style={{ marginLeft: "auto", fontSize: "0.68rem", background: "#2563eb", color: "#fff", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                        MULTI-LLM
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#475569", lineHeight: 1.4 }}>
                      100% menggunakan Cloud Vision (Gemini, GPT-4o, Claude) untuk membaca tata letak dokumen secara visual.
                    </p>
                  </div>

                  {/* Fitur 3: Hybrid (Cerdas) */}
                  <div
                    onClick={() => setGenerationStrategy("hybrid")}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: generationStrategy === "hybrid" ? "2px solid #f5b900" : "1px solid #cbd5e1", background: generationStrategy === "hybrid" ? "#fffdf2" : "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "1.1rem" }}>⚡</span>
                      <strong style={{ fontSize: "0.88rem", color: generationStrategy === "hybrid" ? "#b45309" : "#333333" }}>
                        Fitur Hybrid (Cerdas)
                      </strong>
                      <span style={{ marginLeft: "auto", fontSize: "0.68rem", background: "#fcd03e", color: "#292929", border: "1px solid #f5b900", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                        REKOMENDASI
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#475569", lineHeight: 1.4 }}>
                      Kombinasi mandiri + cloud: Teks diproses instan lokal, Cloud khusus untuk rumus pecahan LaTeX & penambal soal.
                    </p>
                  </div>
                </div>
              </div>

              {(generationStrategy === "local" || generationStrategy === "internal") ? (
                <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "1rem" }}>✅</span>
                    <strong style={{ fontSize: "0.88rem", color: "#166534" }}>
                      Fitur Local (Mandiri) Aktif
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#15803d", lineHeight: 1.45 }}>
                    Sistem mengekstrak soal secara instan di server Gamukis dengan proteksi angka ribuan (300.000) dan label opsi. Tidak menggunakan kuota token API luar sama sekali.
                  </p>
                </div>
              ) : (
                <>
                  {generationStrategy === "hybrid" && (
                    <div style={{ padding: "10px 14px", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "8px", marginBottom: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                        <span style={{ fontSize: "0.95rem" }}>⚡</span>
                        <strong style={{ fontSize: "0.84rem", color: "#5b21b6" }}>
                          Mode Hybrid: Hemat Kuota 85% & Akurasi 100%
                        </strong>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.77rem", color: "#6d28d9", lineHeight: 1.4 }}>
                        Server mandiri memproses soal teks standar seketika, dan menghubungkan model Cloud pilihan Anda di bawah ini secara otomatis bila mendeteksi rumus matematika pecahan/LaTeX atau tabel matriks.
                      </p>
                    </div>
                  )}
                  {/* Step 1: Platform Selection */}
                  <div style={{ marginBottom: "14px" }}>
                    <label htmlFor="ai-platform-select" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      1. Pilih Platform AI *
                    </label>
                    <select
                      id="ai-platform-select"
                      value={selectedPlatform}
                      onChange={(e) => handlePlatformChange(e.target.value)}
                      style={{
                        width: "100%",
                        maxWidth: "380px",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        color: "#0f172a"
                      }}
                    >
                      {AI_PLATFORMS.map((platform) => (
                        <option key={platform.id} value={platform.id}>
                          {platform.name} ({platform.badge})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: API Key Input Field */}
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "6px", maxWidth: "480px", marginBottom: "6px" }}>
                      <label htmlFor="ai-api-key-input" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
                        2. Masukkan API Key {activePlatformConfig.name} {activePlatformConfig.requiresKey ? "*" : "(Opsional untuk Local)"}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        style={{ background: "transparent", border: "none", color: "#2563eb", fontSize: "0.78rem", cursor: "pointer", fontWeight: 600 }}
                      >
                        {showApiKey ? "🙈 Sembunyikan" : "👁️ Tampilkan"}
                      </button>
                    </div>
                    <input
                      id="ai-api-key-input"
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => handleApiKeyChange(e.target.value)}
                      placeholder={activePlatformConfig.keyPlaceholder}
                      style={{
                        width: "100%",
                        maxWidth: "480px",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: isKeyEntered ? "1.5px solid #10b981" : "1px solid #cbd5e1",
                        background: "#ffffff",
                        fontSize: "0.88rem",
                        fontFamily: "monospace"
                      }}
                    />
                    <span style={{ display: "block", fontSize: "0.76rem", color: "#64748b", marginTop: "4px" }}>
                      {activePlatformConfig.requiresKey
                        ? "Kunci API tersimpan di sesi browser untuk memanggil gateway AI secara terautentikasi."
                        : "Model buatan sendiri / lokal Gamukis dapat berjalan langsung tanpa kunci API komersial."}
                    </span>

                    <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={handleFetchLiveModels}
                        disabled={isFetchingModels || (!apiKey.trim() && activePlatformConfig.requiresKey)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          border: "1px solid #2563eb",
                          background: isFetchingModels ? "#93c5fd" : "#2563eb",
                          color: "#ffffff",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          cursor: (isFetchingModels || (!apiKey.trim() && activePlatformConfig.requiresKey)) ? "not-allowed" : "pointer"
                        }}
                      >
                        {isFetchingModels ? "🔄 Menghubungi API..." : "🔍 Cek & Muat Model Langsung dari API"}
                      </button>
                      {liveModels && (
                        <span style={{ fontSize: "0.78rem", color: "#166534", background: "#dcfce7", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: "6px", fontWeight: 700 }}>
                          ✓ {liveModels.length} Model Resmi Ditemukan dari API
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: "4px", fontSize: "0.75rem", color: "#64748b" }}>
                      💡 <em>Catatan: Tombol di atas bersifat opsional. Anda sudah bisa langsung memilih model pada langkah ke-3 di bawah tanpa perlu menekan tombol ini.</em>
                    </div>
                    {modelsFetchError && (
                      <div style={{ marginTop: "6px", fontSize: "0.8rem", color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", padding: "8px 12px", borderRadius: "6px" }}>
                        ⚠️ {modelsFetchError}
                      </div>
                    )}
                  </div>

                  {/* Step 3: Model Selection (Revealed once API Key is entered) */}
                  {isKeyEntered ? (
                    <div style={{ marginTop: "14px", padding: "14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <label htmlFor="ai-model-select" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#166534" }}>
                          3. ✅ Pilih Jenis Model ({activePlatformConfig.name}) *
                        </label>
                        {liveModels && (
                          <span style={{ fontSize: "0.7rem", background: "#16a34a", color: "#fff", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            LIVE DARI API
                          </span>
                        )}
                      </div>
                      <select
                        id="ai-model-select"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        style={{
                          width: "100%",
                          maxWidth: "440px",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          border: "1px solid #86efac",
                          background: "#ffffff",
                          fontSize: "0.88rem",
                          fontWeight: 600,
                          color: "#0f172a",
                          cursor: "pointer"
                        }}
                      >
                        {liveModels ? (
                          <>
                            <optgroup label={`Model Resmi dari Akun API Anda (${liveModels.length})`}>
                              {liveModels.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Lainnya">
                              <option value="custom">✏️ Ketik Model Manual / Kustom...</option>
                            </optgroup>
                          </>
                        ) : (
                          activePlatformConfig.models.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                            </option>
                          ))
                        )}
                      </select>

                      {/* If custom model selected */}
                      {selectedModel === "custom" && (
                        <div style={{ marginTop: "10px" }}>
                          <label htmlFor="ai-custom-model-input" style={{ display: "block", fontSize: "0.78rem", color: "#166534", marginBottom: "4px" }}>
                            Ketik nama model kustom:
                          </label>
                          <input
                            id="ai-custom-model-input"
                            type="text"
                            value={customModelName}
                            onChange={(e) => setCustomModelName(e.target.value)}
                            placeholder="Contoh: gpt-4o-2024-11-20 atau checkpoint-v2"
                            style={{
                              width: "100%",
                              maxWidth: "360px",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              border: "1px solid #cbd5e1",
                              fontSize: "0.85rem"
                            }}
                          />
                        </div>
                      )}

                      {/* Distillation Loop Notice */}
                      {selectedPlatform !== "local" ? (
                        <span style={{ display: "block", fontSize: "0.76rem", color: "#15803d", marginTop: "8px", lineHeight: 1.4 }}>
                          💡 <strong>Siklus Pelatihan Model Sendiri:</strong> Draf pertanyaan dan kunci jawaban terverifikasi dari model eksternal ini akan otomatis diarsipkan sebagai dataset fine-tuning model internal Gamukis.
                        </span>
                      ) : (
                        <span style={{ display: "block", fontSize: "0.76rem", color: "#15803d", marginTop: "8px", lineHeight: 1.4 }}>
                          🧠 <strong>Model Mandiri Aktif:</strong> Berjalan menggunakan model internal/lokal Gamukis tanpa ketergantungan API pihak ketiga.
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: "10px 14px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "8px", fontSize: "0.82rem", color: "#92400e" }}>
                      🔒 Masukkan API Key di atas terlebih dahulu untuk membuka dan memilih jenis model {activePlatformConfig.name}.
                    </div>
                  )}

                  {/* Advanced Base URL Toggle */}
                  <div style={{ marginTop: "12px" }}>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedGateway(!showAdvancedGateway)}
                      style={{ background: "transparent", border: "none", color: "#64748b", fontSize: "0.76rem", cursor: "pointer", textDecoration: "underline" }}
                    >
                      {showAdvancedGateway ? "▼ Tutup Pengaturan Gateway Lanjutan" : "▶ Pengaturan Gateway / Base URL Kustom (Opsional)"}
                    </button>
                    {showAdvancedGateway && (
                      <div style={{ marginTop: "8px" }}>
                        <label htmlFor="ai-base-url-input" style={{ display: "block", fontSize: "0.78rem", color: "#475569", marginBottom: "4px", overflowWrap: "anywhere", wordBreak: "break-word" }}>
                          Endpoint Base URL (Default: {activePlatformConfig.defaultBaseUrl})
                        </label>
                        <input
                          id="ai-base-url-input"
                          type="text"
                          value={customBaseUrl}
                          onChange={(e) => setCustomBaseUrl(e.target.value)}
                          placeholder={activePlatformConfig.defaultBaseUrl}
                          style={{
                            width: "100%",
                            maxWidth: "440px",
                            padding: "7px 10px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "0.8rem",
                            fontFamily: "monospace",
                            boxSizing: "border-box"
                          }}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <PdfUploader
              onFile={handleFileSelected}
              isLoading={isUploading}
              error={uploadError}
              maxMb={10}
              maxPages={50}
            />

            {uploadFile && (
              <div style={{ marginTop: "12px", padding: "10px 14px", background: "#f1f5f9", borderRadius: "8px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
                <span>📄</span>
                <span style={{ fontSize: "0.88rem", color: "#1e293b", fontWeight: 500, minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word" }}>
                  File siap diunggah: <strong>{uploadFile.name}</strong> ({(uploadFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}

            {(isScanningPdf || detectedPdfStructure) && (
              <PdfStructureDetectorCard
                structure={detectedPdfStructure}
                isScanning={isScanningPdf}
                customCount={customTargetCount}
                onCustomCountChange={setCustomTargetCount}
              />
            )}

            <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px" }}>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!uploadFile || isUploading}
                style={{
                  padding: "10px 24px",
                  borderRadius: "8px",
                  border: "none",
                  background: (!uploadFile || isUploading) ? "#e2e8f0" : "#fcd03e", color: (!uploadFile || isUploading) ? "#94a3b8" : "#292929", border: (!uploadFile || isUploading) ? "1px solid #cbd5e1" : "1px solid #f5b900", fontWeight: 700, fontSize: "0.92rem", boxShadow: (!uploadFile || isUploading) ? "none" : "0 2px 8px rgba(245, 185, 0, 0.25)",
                  cursor: (!uploadFile || isUploading) ? "not-allowed" : "pointer",
                  transition: "background 0.2s"
                }}
              >
                {isUploading ? "Mengunggah & Memproses..." : "Buat Job AI"}
              </button>
              <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                *Proses ekstraksi dilakukan di latar belakang secara otomatis.
              </span>
            </div>
          </section>

          {/* Card 2: Riwayat & Status Job AI */}
          <section
            aria-label="Riwayat dan Status Job Pembuatan Soal"
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
                  2. Riwayat & Status Job AI
                </h2>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
                  Daftar antrean dan pemantauan status proses pembuatan soal dari dokumen PDF yang telah diunggah.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  listAdminAiJobs().then((res) => {
                    const rawList = res?.jobs || res || [];
                    const list = Array.isArray(rawList) ? rawList.map(normalizeJob).filter(Boolean) : [];
                    setJobs(list);
                  }).catch(() => {});
                }}
                style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}
              >
                ↻ Refresh List
              </button>
            </div>

            {/* Selected Job Status Embedded Panel */}
            {selectedJob && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "16px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px"
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>
                    📊 Status Job Aktif: Job #{String(selectedJob.jobId || selectedJob.id || "").slice(-8)}
                  </span>
                  <button
                    type="button"
                    onClick={handleRefreshJob}
                    disabled={isRefreshing}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: "0.78rem",
                      cursor: isRefreshing ? "not-allowed" : "pointer"
                    }}
                  >
                    {isRefreshing ? "Menyegarkan..." : "↻ Cek Status Terkini"}
                  </button>
                </div>
                <JobStatusPanel
                  job={selectedJob}
                  onRefresh={handleRefreshJob}
                  onContinue={handleContinueJob}
                  onDelete={() => {
                    const targetId = selectedJob.jobId || selectedJob.id;
                    if (window.confirm("Hapus job ini beserta seluruh kandidat soalnya?")) {
                      handleDeleteJob(targetId);
                    }
                  }}
                  isRefreshing={isRefreshing}
                  liveProgress={liveProgress}
                  socketStatus={socketStatus}
                />

                {selectedJob.detectedExamStructure && (
                  <div style={{ marginTop: "14px" }}>
                    <PdfStructureDetectorCard structure={selectedJob.detectedExamStructure} />
                  </div>
                )}

                {(selectedJob.status === "failed" || selectedJob.status === "retry_wait") && (
                  <div style={{ marginTop: "12px", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <span style={{ fontSize: "0.85rem", color: "#991b1b", flex: "1 1 220px", minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word" }}>
                      {["SCANNED_PDF_NO_TEXT", "PDF_NO_TEXT", "NO_TEXT_FOUND"].includes(selectedJob.failureCode)
                        ? "⚠️ Dokumen PDF ini berupa pindaian/foto (tidak memiliki lapisan teks digital). Silakan gunakan file PDF berbasis teks digital asli (hasil ekspor dari Word / Google Docs / naskah teks) agar seluruh soal terbaca oleh AI secara presisi."
                        : selectedJob.failureCode === "PDF_LIMIT_EXCEEDED"
                        ? "⚠️ Dokumen melebihi batas ukuran atau batas 50 halaman."
                        : "⚠️ Job mengalami kendala (kuota habis atau gangguan AI). Anda dapat men-stack & melanjutkan prosesnya kembali sekarang."}
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleRetryJob(selectedJob.jobId || selectedJob.id)}
                        disabled={retryingJobId === (selectedJob.jobId || selectedJob.id)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          border: "none",
                          background: "#dc2626",
                          color: "#ffffff",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                          cursor: retryingJobId === (selectedJob.jobId || selectedJob.id) ? "not-allowed" : "pointer"
                        }}
                      >
                        {retryingJobId === (selectedJob.jobId || selectedJob.id) ? "🔄 Melanjutkan..." : "↻ Lanjutkan / Coba Lagi"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const targetId = selectedJob.jobId || selectedJob.id;
                          if (window.confirm("Hapus job ini beserta seluruh kandidat soalnya?")) {
                            handleDeleteJob(targetId);
                          }
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          border: "1px solid #fca5a5",
                          background: "#ffffff",
                          color: "#dc2626",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                          cursor: "pointer"
                        }}
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isLoading ? (
              <p style={{ color: "#64748b", margin: "16px 0" }}>Memuat daftar job...</p>
            ) : jobs.length === 0 ? (
              /* Informative Empty State */
              <div style={{ textAlign: "center", padding: "36px 20px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                <div style={{ fontSize: "2.2rem", marginBottom: "8px" }}>📋</div>
                <h4 style={{ margin: "0 0 6px", fontSize: "1rem", color: "#1e293b", fontWeight: 700 }}>
                  Belum Ada Riwayat Job AI
                </h4>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b", maxWidth: "460px", marginInline: "auto", lineHeight: 1.5 }}>
                  Pilih file PDF materi di bagian atas lalu klik <strong>"Buat Job AI"</strong> untuk memulai ekstraksi dan pembuatan soal otomatis.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {jobs.map((job) => {
                  const jId = String(job?.jobId || job?.id || "");
                  const isSelected = (selectedJob?.jobId || selectedJob?.id) === jId;
                  const isDone = job.status === "done" || job.status === "review";
                  const isFailed = job.status === "failed";
                  return (
                    <div
                      key={jId || Math.random()}
                      onClick={() => {
                        const norm = normalizeJob(job);
                        setSelectedJob(norm);
                        setError("");
                        if (norm?.status === "done" || norm?.status === "review") {
                          getAdminAiJob(norm.jobId || norm.id).then((d) => {
                            let cList = d?.candidates || d?.job?.candidates || [];
                            if (!cList.length) {
                              getAdminAiCandidates(norm.jobId || norm.id).then((cd) => setCandidates(cd?.candidates || [])).catch(() => {});
                            } else {
                              setCandidates(cList);
                            }
                          }).catch(() => {});
                        } else {
                          setCandidates([]);
                        }
                      }}
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "14px",
                        padding: "14px 18px",
                        borderRadius: "10px",
                        border: isSelected ? "2px solid #f5b900" : "1px solid #e1e5ea", background: isSelected ? "#fffdf2" : "#ffffff", cursor: "pointer", boxShadow: isSelected ? "0 2px 8px rgba(245, 185, 0, 0.15)" : "0 1px 2px rgba(0,0,0,0.03)",
                        transition: "all 0.15s"
                      }}
                    >
                      <span style={{ fontSize: "1.3rem" }}>📄</span>
                      <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                          <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>
                            Job #{jId ? jId.slice(-8) : "Baru"}
                          </strong>
                          {jId && (
                            <code style={{ fontSize: "0.76rem", color: "#64748b", background: "#f1f5f9", padding: "1px 6px", borderRadius: "4px", wordBreak: "break-all" }}>
                              {jId}
                            </code>
                          )}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                          Mata Pelajaran: <strong>{job.subjectKey || "Umum"}</strong> · Dibuat: {job.createdAt ? new Date(job.createdAt).toLocaleString("id-ID") : "Baru"}
                        </div>
                        {isFailed && (
                          <div style={{ fontSize: "0.76rem", color: "#b91c1c", marginTop: "4px", fontWeight: 500, overflowWrap: "anywhere", wordBreak: "break-word" }}>
                            ⚠️ Kendala: {job.failureReason || (job.failureCode === "AI_UNAVAILABLE" ? "Pemindaian dokumen melebihi batas waktu (Timeout). Klik tombol 'Coba Lagi'." : job.failureCode || "Proses gagal")}
                          </div>
                        )}
                      </div>

                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: "999px",
                          background: isDone ? "#dcfce7" : isFailed ? "#fee2e2" : "#fef9c3",
                          color: isDone ? "#166534" : isFailed ? "#991b1b" : "#92400e"
                        }}
                      >
                        {job.status?.toUpperCase()}
                      </span>

                      {(isFailed || job.status === "retry_wait") && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetryJob(jId);
                          }}
                          disabled={retryingJobId === jId}
                          style={{
                            padding: "5px 12px",
                            borderRadius: "6px",
                            border: "1px solid #2563eb",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            cursor: retryingJobId === jId ? "not-allowed" : "pointer",
                            fontSize: "0.8rem",
                            fontWeight: 700
                          }}
                          title="Lanjutkan atau coba ulang job ini"
                        >
                          {retryingJobId === jId ? "Melanjutkan..." : "↻ Lanjutkan"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Hapus job ini?")) {
                            handleDeleteJob(jId);
                          }
                        }}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "6px",
                          border: "1px solid #fca5a5",
                          background: "#ffffff",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          fontWeight: 600
                        }}
                      >
                        Hapus
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Card 3: Review & Simulasi Soal Game (InGame Modal Preview) */}
          <section
            aria-label="Review dan Simulasi Soal Game"
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  3. Review & Simulasi Soal Game (InGame Modal Preview)
                </h2>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    background: "#ebf3fc", color: "#1976d2", border: "1px solid #bbdefb",
                    padding: "2px 8px",
                    borderRadius: "999px"
                  }}
                >
                  MongoDB JSON
                </span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "0.88rem", color: "#64748b", lineHeight: 1.5 }}>
                Soal hasil ekstraksi dan penyaringan AI tersimpan dalam format dokumen JSON di MongoDB (<code>ai_question_candidates</code>).
                Sebelum disimpan, Anda dapat meninjau kunci jawaban, bukti teks referensi, serta mencoba langsung visualisasinya melalui tombol <strong>[🎮 Simulasi Modal Game]</strong> yang memanggil komponen modal game interaktif.
                Setelah direview dan dinyatakan benar semua, soal dapat disimpan ke <strong>🧠 Stack Memory MongoDB (<code>ai_question_ml_memory</code>)</strong> untuk akumulasi dataset machine learning model mandiri Gamukis, Bank Soal Game, atau Kelas Siswa.
              </p>
            </div>

            {selectedJob?.status === "done" || selectedJob?.status === "review" || candidates.length > 0 ? (
              <>
                <CandidateReviewList
                  candidates={candidates}
                  onReview={handleReview}
                  onPublish={handlePublish}
                  onReviewAll={handleReviewAll}
                  onFilterWords={handleFilterWords}
                  onPublishAll={handlePublishAll}
                  onUpdateCandidate={handleUpdateCandidate}
                  onDeleteCandidate={handleDeleteCandidate}
                  filteredSubject={
                    candidates.some((c) => c.category)
                      ? Array.from(new Set(candidates.map((c) => c.category).filter(Boolean))).slice(0, 3).join(", ")
                      : CANONICAL_SUBJECTS.find((s) => s.key === selectedJob?.subjectKey)?.label ||
                        selectedJob?.subjectKey ||
                        "Umum"
                  }
                  isSavingAll={isSavingAll}
                  availableClasses={availableClasses}
                />
                {candidates.length > 0 && selectedJob && (
                  <AiTrainingEvolutionPanel
                    jobId={selectedJob.jobId || selectedJob.id || selectedJob._id}
                    totalCandidates={candidates.length}
                    onHarvested={() => setStatusMessage(`${candidates.length} Soal berhasil dipanen ke Memory Pelatihan RLAIF!`)}
                  />
                )}
              </>
            ) : !selectedJob ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 20px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px dashed #cbd5e1"
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "6px" }}>🎮</div>
                <h4 style={{ margin: "0 0 6px", fontSize: "0.96rem", color: "#1e293b", fontWeight: 700 }}>
                  Pilih Job AI untuk Melihat Soal & Simulasi Modal Game
                </h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  Pilih salah satu job AI yang telah selesai (status <strong>DONE</strong>) dari daftar riwayat di atas untuk menampilkan seluruh soal dan membuka uji coba inGame modal.
                </p>
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 20px",
                  background: "#fffbeb",
                  borderRadius: "12px",
                  border: "1px dashed #fde68a"
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "6px" }}>⏳</div>
                <h4 style={{ margin: "0 0 6px", fontSize: "0.96rem", color: "#92400e", fontWeight: 700 }}>
                  Job Sedang Diproses (Status: {selectedJob.status?.toUpperCase()})
                </h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#b45309" }}>
                  Tunggu beberapa saat hingga pemrosesan ekstraksi dokumen PDF selesai. Soal JSON dan simulasi modal game akan aktif secara otomatis.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );

  return content;
};

export default AdminAiQuestionGenerator;
