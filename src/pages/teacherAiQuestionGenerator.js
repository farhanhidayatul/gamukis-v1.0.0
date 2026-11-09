import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getManualUser } from "../database/manualAuth";
import { createTeacherAiJob, listTeacherAiJobs } from "../database/aiQuestionGeneratorApi";
import { isApprovedGuruUser } from "../database/teacherClassApi";
import PdfUploader from "../component/component_ai_question_generator/atoms/PdfUploader";
import JobStatusPanel from "../component/component_ai_question_generator/molecules/JobStatusPanel";

const getUserRole = (user) => {
  if (typeof isApprovedGuruUser === "function" && isApprovedGuruUser(user)) return "guru";
  const direct = String(user?.role || user?.userRole || user?.profile?.role || "").toLowerCase();
  if (direct) return direct;
  if (String(user?.teacherApplication?.status || "").toLowerCase() === "approved") return "guru";
  return "";
};

/**
 * TeacherAiQuestionGenerator — lean page for teachers to upload a PDF
 * and generate AI questions for one of their classes.
 */
const TeacherAiQuestionGenerator = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [user] = useState(() => getManualUser());
  const role = getUserRole(user);

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [latestJob, setLatestJob] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  if (!user || role !== "guru") {
    return (
      <main style={{ padding: "40px 24px" }}>
        <h1>Akses Ditolak</h1>
        <p>Halaman ini hanya tersedia untuk Guru yang telah disetujui.</p>
        <button type="button" onClick={() => navigate("/login")}>
          Masuk
        </button>
      </main>
    );
  }

  const handleFileSelected = (file, fileError) => {
    if (fileError) {
      setUploadError(fileError);
      setUploadFile(null);
      return;
    }
    setUploadError("");
    setUploadFile(file);
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
      const idempotencyKey = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const result = await createTeacherAiJob(classId, uploadFile, { idempotencyKey });
      const newJob = result?.job || result;
      setLatestJob(newJob);
      setUploadFile(null);
      setStatusMessage("Job AI berhasil dibuat! Tunggu proses selesai lalu kembali ke editor kelas.");
    } catch (err) {
      setError(err.message || "Upload PDF gagal.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRefresh = async () => {
    if (!classId) return;
    setIsRefreshing(true);
    setError("");
    try {
      const data = await listTeacherAiJobs(classId);
      const jobList = data?.jobs || data || [];
      if (Array.isArray(jobList) && jobList.length > 0) {
        setLatestJob(jobList[0]);
      }
    } catch (err) {
      setError(err.message || "Gagal menyegarkan status job.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div style={{ padding: "clamp(14px, 3vw, 24px)", maxWidth: "720px", margin: "0 auto" }}>
      <header style={{ marginBottom: "24px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px" }}>
        <button
          type="button"
          onClick={() => navigate(`/guru/classes/${classId}/edit`)}
          style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer" }}
        >
          ← Kembali ke Editor Kelas
        </button>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>GURU</p>
          <h1 style={{ margin: 0, fontSize: "clamp(1.2rem, 4vw, 1.4rem)", fontWeight: 700 }}>Buat Soal dengan AI</h1>
        </div>
      </header>

      {error && (
        <div role="alert" style={{ background: "#fee2e2", color: "#991b1b", borderRadius: "8px", padding: "10px 16px", marginBottom: "16px" }}>
          {error}
        </div>
      )}
      {statusMessage && (
        <div role="status" style={{ background: "#dcfce7", color: "#166534", borderRadius: "8px", padding: "10px 16px", marginBottom: "16px" }}>
          {statusMessage}
        </div>
      )}

      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "10px" }}>Upload PDF Materi</h2>
        <PdfUploader
          onFile={handleFileSelected}
          isLoading={isUploading}
          error={uploadError}
          maxMb={10}
          maxPages={50}
        />
        {uploadFile && (
          <p style={{ marginTop: "8px", fontSize: "0.85rem", color: "#334155", overflowWrap: "anywhere", wordBreak: "break-word" }}>
            File: <strong>{uploadFile.name}</strong> ({(uploadFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
        <button
          type="button"
          onClick={handleUpload}
          disabled={!uploadFile || isUploading}
          style={{
            marginTop: "12px", padding: "8px 20px", borderRadius: "8px", border: "none",
            background: (!uploadFile || isUploading) ? "#94a3b8" : "#3b82f6",
            color: "#fff", fontWeight: 600, cursor: (!uploadFile || isUploading) ? "not-allowed" : "pointer"
          }}
        >
          {isUploading ? "Mengunggah..." : "Buat Soal dengan AI"}
        </button>
      </section>

      {latestJob && (
        <section>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "10px" }}>Status Job Terbaru</h2>
          <JobStatusPanel
            job={latestJob}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
          {latestJob.status === "done" && (
            <p style={{ marginTop: "12px", fontSize: "0.88rem", color: "#374151" }}>
              ✅ Soal telah dibuat. Admin akan melakukan review dan mempublikasikan soal ke kelas Anda.
            </p>
          )}
        </section>
      )}
    </div>
  );
};

export default TeacherAiQuestionGenerator;
