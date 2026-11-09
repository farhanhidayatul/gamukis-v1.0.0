import "./JobStatusPanel.css";

const STATUS_LABELS = {
  pending: "Menunggu diproses...",
  processing: "Sedang memproses PDF...",
  review: null,
  done: null, // dynamic
  failed: null // dynamic
};

/**
 * JobStatusPanel — molecule component displaying AI job processing state with live streaming progress.
 * Props:
 *   job          — job object or null when no job created yet
 *   onRefresh()  — called when user requests status refresh
 *   onDelete()   — optional callback when user requests deletion
 *   onContinue() — optional callback when user continues next stack
 *   isRefreshing — boolean, disables refresh button while refreshing
 *   liveProgress — optional realtime streaming progress data from Socket.IO
 *   socketStatus — optional realtime connection status ('connected' | 'connecting' | 'disconnected')
 */
const JobStatusPanel = ({
  job,
  onRefresh,
  onDelete,
  onContinue,
  isRefreshing = false,
  liveProgress = null,
  socketStatus = "connected"
}) => {
  if (!job) {
    return (
      <div className="job-status-panel job-status-panel--empty">
        <p>Belum ada job yang dibuat. Upload PDF untuk memulai.</p>
      </div>
    );
  }

  const {
    status: rawStatus,
    candidateCount: rawCount,
    failureReason,
    failureCode,
    awaitingContinuation,
    currentSectionTitle,
    nextSectionTitle,
    currentStackIndex
  } = job;

  // Terminal statuses from backend job must strictly take priority over stale live streaming progress
  const isTerminalStatus = rawStatus === "done" || rawStatus === "review" || rawStatus === "failed" || rawStatus === "awaiting_continuation";
  const status = isTerminalStatus ? rawStatus : (liveProgress?.status || rawStatus);
  const candidateCount = (isTerminalStatus && typeof rawCount === "number") ? rawCount : (liveProgress?.extractedCount ?? rawCount ?? 0);
  const totalEstimated = liveProgress?.totalEstimated || job?.detectedExamStructure?.totalQuestions || 155;
  const progressPercent = Math.min(100, Math.round((candidateCount / Math.max(1, totalEstimated)) * 100));

  const getStatusLabel = () => {
    if (status === "awaiting_continuation" || awaitingContinuation) {
      return `⏸️ Selesai Sebagian — ${candidateCount} soal berhasil tersimpan otomatis di MongoDB. Menunggu konfirmasi untuk melanjutkan ke materi berikutnya.`;
    }
    if (status === "done" || status === "review") {
      return `✓ Selesai — ${candidateCount} kandidat soal berhasil diekstrak (Siap Direview di Bagian 3)`;
    }
    if (status === "processing") {
      const activeSection = liveProgress?.currentSection || currentSectionTitle;
      return activeSection
        ? `⏳ Sedang memproses: "${activeSection}" (${candidateCount} / ${totalEstimated} soal terdeteksi)...`
        : `⏳ Sedang memproses dokumen PDF... Memindai teks dan struktur soal di latar belakang (${candidateCount} / ${totalEstimated} soal).`;
    }
    if (status === "failed") {
      const code = failureCode || "";
      const reason = failureReason || "";
      if (code === "SCANNED_PDF_NO_TEXT" || code === "PDF_NO_TEXT" || code === "NO_TEXT_FOUND") {
        return "❌ Gagal (Scan Tanpa Teks): Dokumen PDF berupa scan gambar tanpa lapisan teks digital yang terbaca. Gunakan PDF dengan teks digital (Word/Docs to PDF).";
      }
      if (code === "AI_UNAVAILABLE") {
        return "⚠️ Gagal (Batas Waktu Habis / AI Sibuk): Pemrosesan dokumen memakan waktu terlalu lama melebihi batas waktu (timeout). Silakan klik 'Coba Lagi'.";
      }
      if (code === "PDF_LIMIT_EXCEEDED") {
        return "❌ Gagal: Dokumen melebihi batas maksimal ukuran (25 MB) atau jumlah halaman (150 halaman).";
      }
      if (code === "LEASE_EXPIRED") {
        return "⚠️ Gagal (Waktu Habis): Pemrosesan terputus karena antrean worker melewati batas lease. Silakan klik 'Coba Lagi'.";
      }
      return `❌ Gagal (${code || "ERROR"}): ${reason || "Terjadi kendala pada proses ekstraksi AI."}`;
    }
    return STATUS_LABELS[status] || `Status: ${status || "Sedang diperbarui..."}`;
  };

  return (
    <div className={`job-status-panel job-status-panel--${status || "pending"}`} data-testid="job-status-panel">
      <div className="job-status-panel__header">
        <span className={`job-status-badge job-status-badge--${status || "pending"}`}>
          {(status || "MEMUAT").toUpperCase()}
        </span>

        {socketStatus === "connected" && (
          <span className="job-status-socket-pill" title="Terhubung ke Dedicated WebSocket AI Workflow">
            <span className="job-status-socket-dot" /> Live Streaming
          </span>
        )}

        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "auto" }}>
          {onDelete && (
            <button
              type="button"
              className="job-status-panel__delete"
              onClick={onDelete}
              style={{
                background: "#fee2e2",
                color: "#dc2626",
                border: "1px solid #fca5a5",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
              title="Hapus job ini"
              aria-label="Hapus job ini"
            >
              🗑️ Hapus
            </button>
          )}
          <button
            type="button"
            className="job-status-panel__refresh"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Perbarui status job"
          >
            {isRefreshing ? "Memperbarui..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      <p className="job-status-panel__message">{getStatusLabel()}</p>

      {/* Realtime Live Progress Bar */}
      {(status === "processing" || status === "review" || status === "done" || candidateCount > 0) && (
        <div className="job-status-live-progress" data-testid="job-status-progress">
          <div className="job-status-progress-info">
            <span className="job-status-progress-label">
              Progres Ekstraksi: <strong>{candidateCount}</strong> / <strong>{totalEstimated}</strong> Soal
            </span>
            <span className="job-status-progress-percent">{progressPercent}%</span>
          </div>
          <div className="job-status-progress-track">
            <div
              className={`job-status-progress-fill ${status === "processing" ? "job-status-progress-fill--animated" : ""}`}
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>
        </div>
      )}

      {(status === "awaiting_continuation" || awaitingContinuation) && (
        <div
          className="job-status-panel__continuation"
          style={{
            marginTop: "12px",
            marginBottom: "12px",
            padding: "14px 16px",
            background: "#ecfdf5",
            border: "1.5px solid #10b981",
            borderRadius: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div style={{ fontWeight: 700, color: "#065f46", fontSize: "0.95rem" }}>
            ✅ Materi "{currentSectionTitle || `Bagian ${(currentStackIndex || 0) + 1}`}" selesai diproses! ({candidateCount} soal tersimpan otomatis di database)
          </div>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#047857" }}>
            {nextSectionTitle
              ? `Materi berikutnya yang siap dibaca: "${nextSectionTitle}"`
              : "Masih terdapat materi berikutnya pada dokumen ini yang siap diproses."}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "4px" }}>
            {onContinue && (
              <button
                type="button"
                onClick={onContinue}
                disabled={isRefreshing}
                style={{
                  background: "#059669",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 18px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  textAlign: "center"
                }}
              >
                ▶ Lanjutkan ke Materi Berikutnya {nextSectionTitle ? `(${nextSectionTitle})` : ""}
              </button>
            )}
          </div>
        </div>
      )}
      {job.jobId && (
        <p className="job-status-panel__id">
          Job ID: <code>{job.jobId}</code>
        </p>
      )}
    </div>
  );
};

export default JobStatusPanel;
