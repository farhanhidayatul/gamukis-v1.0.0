import React, { useState, useMemo } from "react";
import CoinModal, { parseQuestionPrompt, renderStructuredStory } from "../../component_game/modal";
import MathText from "../../common/MathText";
import TableStructureBadge from "../atoms/TableStructureBadge";
import DatasetFilterToolbar from "./DatasetFilterToolbar";
import CandidateEditModal from "./CandidateEditModal";
import "./CandidateReviewList.css";

const OPTION_LABELS = ["A", "B", "C", "D", "E"];

const STATUS_LABELS = {
  pending_review: "Menunggu Review",
  accepted: "Diterima",
  rejected: "Ditolak",
  published: "Dipublikasikan"
};

/**
 * CandidateCard — renders a single candidate question card with review actions, classification badges, and inGame simulation trigger.
 */
const CandidateCard = ({
  candidate,
  index,
  onReview,
  onPublish,
  availableClasses = [],
  onSimulate,
  onEdit,
  onDelete
}) => {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [showStory, setShowStory] = useState(false);

  const candidateId = candidate.candidateId || candidate.id;
  const prompt = candidate.prompt;
  const { hasStory, story, question: parsedQuestion } = parseQuestionPrompt(prompt);
  const options = Array.isArray(candidate.options) ? candidate.options : [];
  const evidencePages =
    candidate.evidencePages ||
    (Array.isArray(candidate.evidence) ? candidate.evidence.map((e) => e.page) : []);

  const normalizedStatus =
    candidate.reviewStatus === "approved" || candidate.status === "accepted"
      ? "accepted"
      : candidate.reviewStatus === "rejected" || candidate.status === "rejected"
      ? "rejected"
      : candidate.reviewStatus === "published" || candidate.status === "published"
      ? "published"
      : "pending_review";

  const isImageQuestion =
    candidate.stimulusType === "image" ||
    candidate.stimulusType === "soal_bergambar" ||
    Boolean(candidate.imageUrl) ||
    Boolean(candidate.imageBase64) ||
    Boolean(candidate.imagePath);

  const isTableDesc =
    candidate.stimulusType === "table_description" ||
    candidate.stimulusType === "deskripsi_tabel" ||
    (prompt && (prompt.includes("[DESKRIPSI & TABEL]:") || prompt.includes("[TABEL DATA]:") || /\|\s*[^|\n]+\s*\|\s*[^|\n]+\s*\|/.test(prompt))) ||
    (story && /\|\s*[^|\n]+\s*\|\s*[^|\n]+\s*\|/.test(story));

  const isCaseStudy =
    candidate.stimulusType === "case_study" ||
    (prompt && /(?:studi kasus|dalam suatu eksperimen|percobaan|penelitian menguji)/i.test(prompt));

  const isReadingPassage =
    !isImageQuestion &&
    !isTableDesc &&
    !isCaseStudy &&
    (candidate.stimulusType === "reading_passage" || (prompt && prompt.length > 300));

  const displaySubject = candidate.category || candidate.subjectKey || "Umum";

  const handleAccept = () => {
    onReview(candidateId, "approved", "");
  };

  const handleRejectSubmit = () => {
    onReview(candidateId, "rejected", rejectReason);
    setShowRejectInput(false);
    setRejectReason("");
  };

  const handlePublish = () => {
    if (!selectedClassId) return;
    onPublish(candidateId, selectedClassId);
  };

  return (
    <div className={`candidate-card candidate-card--${normalizedStatus}`} data-testid="candidate-card">
      <div className="candidate-card__header">
        {/* Question Index Badge */}
        <span className="candidate-card__number-badge">
          #{index}
        </span>

        <span className={`candidate-status-badge candidate-status-badge--${normalizedStatus}`}>
          {STATUS_LABELS[normalizedStatus] || normalizedStatus}
        </span>

        {/* Subject Classification Badge */}
        <span className="candidate-card__badge-subject" title="Kategori Mata Pelajaran Hasil Klasifikasi AI">
          🏷️ {candidate.category || displaySubject}
        </span>
        <TableStructureBadge
          interactionType={candidate.interactionType}
          modalityType={candidate.stimulusType}
          matrixData={candidate.matrixData}
          hasImage={isImageQuestion}
        />

        {/* Topic Badge if present */}
        {candidate.topic && candidate.topic !== (candidate.category || displaySubject) && (
          <span className="candidate-card__badge-topic" title="Topik / Subtes Pembahasan">
            📌 {candidate.topic}
          </span>
        )}

        {/* AI Quality Guard Score Badge */}
        {typeof candidate.qualityScore === "number" && (
          <span
            className={`candidate-card__badge-quality ${
              candidate.qualityScore >= 0.90
                ? "candidate-card__badge-quality--high"
                : "candidate-card__badge-quality--warning"
            }`}
            title={`Skor Kualitas AI: ${(candidate.qualityScore * 100).toFixed(0)}% ${
              candidate.isAutoVerified ? "(Lolos Verifikasi Otomatis)" : "(Memerlukan Pengecekan)"
            }`}
            data-testid="quality-score-badge"
          >
            {candidate.qualityScore >= 0.90 ? "🛡️ " : "⚠️ "}
            {(candidate.qualityScore * 100).toFixed(0)}% {candidate.qualityScore >= 0.90 ? "Bersih" : "Perlu Cek"}
          </span>
        )}

        {/* Stimulus Type Badge */}
        {isTableDesc ? (
          <span className="candidate-card__badge-stimulus candidate-card__badge-stimulus--table" style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", padding: "2px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700 }} title="Tipe Soal: Deskripsi Detail + Tabel Data Terstruktur">
            📊 Deskripsi Tabel
          </span>
        ) : isImageQuestion ? (
          <span className="candidate-card__badge-stimulus candidate-card__badge-stimulus--image" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700 }} title="Tipe Soal: Soal Bergambar / Diagram / Grafik">
            🖼️ Soal Bergambar
          </span>
        ) : isCaseStudy ? (
          <span className="candidate-card__badge-stimulus" style={{ background: "#fdf2f8", color: "#9d174d", border: "1px solid #fbcfe8", padding: "2px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700 }} title="Tipe Soal: Studi Kasus / Skenario Eksperimen">
            🔬 Studi Kasus
          </span>
        ) : isReadingPassage ? (
          <span className="candidate-card__badge-stimulus candidate-card__badge-stimulus--passage" title="Tipe Soal: Wacana / Cerita Panjang">
            📖 Soal Cerita / Wacana
          </span>
        ) : (
          <span className="candidate-card__badge-stimulus candidate-card__badge-stimulus--concept" title="Tipe Soal: Konsep Teori Singkat">
            ⚡ Konsep
          </span>
        )}

        {candidate.interactionType === "matrix_drag_drop" ? (
          <span style={{ background: "#e0e7ff", color: "#3730a3", border: "1px solid #c7d2fe", padding: "2px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700 }} title="Tipe Jawaban: Drag & Drop Matriks Pernyataan">
            🎯 Drag & Drop Matriks
          </span>
        ) : candidate.interactionType === "multiple_choice" ? (
          <span style={{ background: "#fef08a", color: "#854d0e", border: "1px solid #fde047", padding: "2px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700 }} title="Tipe Jawaban: Pilihan Ganda Kompleks (Multi-Select / Kombinasi)">
            ☑️ Pilihan Ganda Kompleks
          </span>
        ) : (
          <span style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", padding: "2px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }} title="Tipe Jawaban: Pilihan Ganda Tunggal (A/B/C/D/E)">
            🔘 Pilihan Ganda
          </span>
        )}

        {candidate.isManuallyEdited && (
          <span
            style={{
              fontSize: "0.72rem",
              background: "#dbeafe",
              color: "#1e40af",
              border: "1px solid #93c5fd",
              padding: "2px 8px",
              borderRadius: "999px",
              fontWeight: 700
            }}
            title={`Diedit manual oleh ${candidate.editedBy || "Admin"}`}
          >
            ✏️ Diedit Manual
          </span>
        )}

        {candidate.difficulty && (
          <span style={{ fontSize: "0.72rem", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "999px", fontWeight: 600 }}>
            Tingkat: {String(candidate.difficulty).toUpperCase()}
          </span>
        )}

        {evidencePages.length > 0 && (
          <span className="candidate-card__pages">
            📄 Hal PDF: {evidencePages.join(", ")}
          </span>
        )}
      </div>

      {Array.isArray(candidate.anomalyFlags) && candidate.anomalyFlags.length > 0 && (
        <div className="candidate-card__anomalies" data-testid="candidate-anomalies">
          <span>⚠️ <strong>Catatan Quality Guard:</strong></span>
          <div className="candidate-card__anomaly-list">
            {candidate.anomalyFlags.map((flag) => (
              <span key={flag} className="candidate-card__anomaly-tag">
                {flag === "spacing_glued_words"
                  ? "Ejaan/Spasi Menempel"
                  : flag === "incomplete_matrix_rows"
                  ? "Baris Matriks Belum Lengkap"
                  : flag === "missing_options"
                  ? "Opsi Kurang"
                  : flag === "fewer_options_than_expected"
                  ? "Opsi < 4"
                  : flag === "unconfirmed_answer_key"
                  ? "Kunci Perlu Konfirmasi"
                  : flag === "short_prompt"
                  ? "Soal Terlalu Singkat"
                  : flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {candidate.teacherVerdict && (
        <div style={{ marginBottom: "10px", fontSize: "0.78rem", padding: "6px 12px", borderRadius: "8px", background: candidate.isAligned ? "#f0fdf4" : "#fffbeb", border: candidate.isAligned ? "1px solid #bbf7d0" : "1px solid #fef08a", color: candidate.isAligned ? "#166534" : "#854d0e" }}>
          <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🎓 Evaluasi Bimbingan Guru AI:</span>
            <span style={{ padding: "1px 6px", borderRadius: "4px", background: candidate.isAligned ? "#dcfce7" : "#fef9c3", fontSize: "0.72rem" }}>
              {candidate.isAligned ? "Keputusan Tepat (Aligned)" : `Dikoreksi dari '${candidate.modelDecision}' → '${candidate.correctedStimulusType || candidate.stimulusType}'`}
            </span>
          </div>
          {candidate.teacherNotes && (
            <div style={{ marginTop: "4px", fontSize: "0.74rem", opacity: 0.95 }}>
              💡 {candidate.teacherNotes}
            </div>
          )}
        </div>
      )}

      {hasStory && (
        <div style={{ marginBottom: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px 12px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>
              {isTableDesc ? "📊 Deskripsi Soal & Data Tabel Terstruktur:" : `📖 Teks Wacana / Soal Cerita (${story.length} karakter):`}
            </span>
            <button
              type="button"
              onClick={() => setShowStory((v) => !v)}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                padding: "2px 8px",
                fontSize: "0.75rem",
                cursor: "pointer",
                fontWeight: 600,
                color: "#1d4ed8"
              }}
            >
              {showStory ? "➖ Sembunyikan" : "➕ Tampilkan Bacaan"}
            </button>
          </div>
          {showStory && (
            <div style={{ maxHeight: "180px", overflowY: "auto", fontSize: "0.85rem", color: "#334155", marginTop: "6px", lineHeight: 1.5, background: "#ffffff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              {renderStructuredStory(story, { tableWrapperClass: "candidate-table-wrapper", tableClass: "candidate-table" })}
            </div>
          )}
        </div>
      )}

      {(candidate.imageBase64 || candidate.imageUrl || candidate.imagePath) && (
        <div style={{ marginBottom: "12px", textAlign: "center", background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <img
            src={(() => {
              if (candidate.imageBase64) {
                return candidate.imageBase64.startsWith("data:")
                  ? candidate.imageBase64
                  : `data:image/png;base64,${candidate.imageBase64}`;
              }
              const raw = candidate.imageUrl || (candidate.imagePath ? `/uploads/ai-question-generator/images/${candidate.imagePath}` : "");
              if (raw.startsWith("http") || raw.startsWith("data:")) return raw;
              const backendBase = (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
              return `${backendBase}${raw.startsWith("/") ? "" : "/"}${raw}`;
            })()}
            alt={`Diagram Soal #${index}`}
            style={{ maxWidth: "100%", maxHeight: "260px", objectFit: "contain", borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
            onError={(e) => {
              console.warn("Diagram image failed to load:", e.target.src);
            }}
          />
        </div>
      )}

      <div className="candidate-card__prompt"><MathText text={hasStory ? parsedQuestion : prompt} /></div>

      {candidate.interactionType === "matrix_drag_drop" && candidate.matrixData ? (
        <div style={{ marginBottom: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <div style={{ background: "#eef2ff", padding: "8px 12px", borderBottom: "1px solid #e2e8f0", fontSize: "0.82rem", fontWeight: 700, color: "#3730a3" }}>
            📊 Matriks Kategori Pernyataan (Interaksi Drag & Drop InGame):
          </div>
          <table style={{ width: "100%", minWidth: "420px", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                <th style={{ padding: "6px 10px", width: "40px", textAlign: "center" }}>No</th>
                <th style={{ padding: "6px 10px", textAlign: "left" }}>Pernyataan</th>
                {(candidate.matrixData.columns || []).map((col) => (
                  <th key={col.key} style={{ padding: "6px 10px", textAlign: "center", width: "140px" }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(candidate.matrixData.statements || []).map((stmt, sIdx) => (
                <tr key={stmt.id || sIdx} style={{ borderBottom: "1px solid #e2e8f0", background: sIdx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                  <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 600 }}>{sIdx + 1}</td>
                  <td style={{ padding: "8px 10px", textAlign: "left", lineHeight: 1.45 }}><MathText text={stmt.statement} /></td>
                  {(candidate.matrixData.columns || []).map((col) => {
                    const isTarget = stmt.correctCategory === col.key;
                    return (
                      <td key={col.key} style={{ padding: "8px 10px", textAlign: "center" }}>
                        {isTarget ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#dcfce7", color: "#166534", border: "1px solid #86efac", padding: "2px 8px", borderRadius: "6px", fontWeight: 700, fontSize: "0.78rem" }}>
                            ✔ {col.label}
                          </span>
                        ) : (
                          <span style={{ color: "#cbd5e1" }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ol className="candidate-card__options">
          {options.map((opt, idx) => {
            const optText = typeof opt === "string" ? opt : opt?.text;
            const isCorrect = typeof candidate.correctOptionIndex === "number" && idx === candidate.correctOptionIndex;
            return (
              <li
                key={opt?.optionId || idx}
                className={`candidate-card__option ${isCorrect ? "candidate-card__option--correct" : ""}`}
              >
                <strong>{OPTION_LABELS[idx] || idx + 1}.</strong> <MathText text={optText} />
                {isCorrect && (
                  <span className="candidate-card__correct-tag">✓ (Kunci Jawaban)</span>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {candidate.explanation && (
        <div className="candidate-card__explanation">
          💡 <strong>Penjelasan:</strong> <MathText text={candidate.explanation} />
        </div>
      )}

      {Array.isArray(candidate.evidence) && candidate.evidence.length > 0 && candidate.evidence[0]?.quote && (
        <div style={{ fontSize: "0.78rem", color: "#64748b", fontStyle: "italic", background: "#f8fafc", padding: "6px 10px", borderRadius: "6px", marginBottom: "12px", overflowWrap: "anywhere", wordBreak: "break-word" }}>
          📖 Bukti Dokumen (Hal {candidate.evidence[0].page}): "{candidate.evidence[0].quote}"
        </div>
      )}

      <div className="candidate-card__actions">
        <button
          type="button"
          className="candidate-btn candidate-btn--edit"
          onClick={() => onEdit && onEdit(candidate)}
          title="Koreksi parameter teks soal, opsi jawaban, atau kunci jawaban"
        >
          ✏️ Edit Soal
        </button>

        <button
          type="button"
          className="candidate-btn candidate-btn--delete"
          onClick={() => onDelete && onDelete(candidate)}
          title="Hapus soal ini dari daftar kandidat"
        >
          🗑️ Hapus
        </button>

        <button
          type="button"
          className="candidate-btn candidate-btn--simulate"
          onClick={() => onSimulate(candidate)}
          title="Uji coba tampilan kuis seperti yang dilihat siswa di dalam game modal"
        >
          🎮 Uji Coba Simulasi InGame
        </button>

        {normalizedStatus !== "accepted" && (
          <button
            type="button"
            className="candidate-btn candidate-btn--accept" data-testid="accept-candidate-btn"
            onClick={handleAccept}
          >
            ✓ Terima Soal
          </button>
        )}

        {normalizedStatus !== "rejected" && (
          <button
            type="button"
            className="candidate-btn candidate-btn--reject" data-testid="reject-candidate-btn"
            onClick={() => setShowRejectInput((v) => !v)}
          >
            ✕ Tolak
          </button>
        )}
      </div>

      {showRejectInput && (
        <div className="candidate-card__reject-form">
          <input
            type="text"
            className="candidate-card__reject-input"
            placeholder="Alasan penolakan (opsional)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <button
            type="button"
            className="candidate-btn candidate-btn--reject-confirm"
            onClick={handleRejectSubmit}
          >
            Konfirmasi Tolak
          </button>
        </div>
      )}

      {normalizedStatus === "accepted" && availableClasses && availableClasses.length > 0 && (
        <div className="candidate-card__publish-row">
          <select
            className="candidate-card__class-select"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">-- Pilih Kelas Tujuan Publikasi --</option>
            {availableClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.title || cls.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="candidate-btn candidate-btn--publish"
            onClick={handlePublish}
            disabled={!selectedClassId}
          >
            Publikasikan ke Kelas
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * CandidateReviewList — molecule component listing AI-generated candidate questions with Search, Multi-Filter, Pagination, and InGame simulation preview.
 */
const CandidateReviewList = ({
  candidates = [],
  onReview,
  onPublish,
  availableClasses = [],
  onReviewAll,
  onFilterWords,
  onPublishAll,
  filteredSubject = "Umum",
  isSavingAll = false,
  onUpdateCandidate,
  onDeleteCandidate
}) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterAutoNoise, setFilterAutoNoise] = useState(true);
  const [filterRejectInvalid, setFilterRejectInvalid] = useState(false);
  const [filterWords, setFilterWords] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [simulatingCandidate, setSimulatingCandidate] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [saveDestination, setSaveDestination] = useState("memory");
  const [datasetFilters, setDatasetFilters] = useState({
    modality: "all",
    category: "all",
    qualityTier: "all",
    search: ""
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [pageFilter, setPageFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [stimulusFilter, setStimulusFilter] = useState("all");
  const [interactionFilter, setInteractionFilter] = useState("all");
  const [anomalyOnly, setAnomalyOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const anomalyCount = useMemo(() => {
    return candidates.filter(
      (c) =>
        c.teacherVerdict === 'corrected' ||
        c.isAligned === false ||
        c.validationStatus !== 'valid' ||
        c.isAutoVerified === false ||
        (Array.isArray(c.anomalyFlags) && c.anomalyFlags.length > 0) ||
        (typeof c.qualityScore === 'number' && c.qualityScore < 0.90)
    ).length;
  }, [candidates]);

  const autoVerifiedCount = useMemo(() => {
    return candidates.filter(
      (c) => c.isAutoVerified === true || (typeof c.qualityScore === 'number' && c.qualityScore >= 0.90)
    ).length;
  }, [candidates]);

  // Extract unique PDF pages from all candidates
  const allPages = useMemo(() => {
    const pages = new Set();
    candidates.forEach((c) => {
      const pList = c.evidencePages || (Array.isArray(c.evidence) ? c.evidence.map((e) => Number(e.page)) : []);
      pList.forEach((p) => { if (p) pages.add(Number(p)); });
    });
    return Array.from(pages).sort((a, b) => a - b);
  }, [candidates]);

  // Extract unique subjects/categories and counts from all candidates
  const categoryStats = useMemo(() => {
    const map = new Map();
    candidates.forEach((c) => {
      const cat = c.category || c.subjectKey || "Umum";
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
  }, [candidates]);

  const allSubjects = useMemo(() => {
    return categoryStats.map((item) => item.label);
  }, [categoryStats]);

  // Filter candidates based on search query and active dropdowns
  const filteredCandidatesWithIndex = useMemo(() => {
    return candidates
      .map((c, originalIdx) => ({ candidate: c, originalIndex: originalIdx + 1 }))
      .filter(({ candidate: c, originalIndex }) => {
        // DatasetFilterToolbar modality filter
        if (datasetFilters.modality !== "all") {
          if (datasetFilters.modality === "single_choice" && c.interactionType !== "single_choice") return false;
          if (datasetFilters.modality === "matrix_drag_drop" && c.interactionType !== "matrix_drag_drop") return false;
          if (datasetFilters.modality === "reading_passage") {
            const isPassage = c.stimulusType === "reading_passage" || (c.prompt && c.prompt.length > 300);
            if (!isPassage) return false;
          }
          if (datasetFilters.modality === "image") {
            const hasImg = Boolean(c.imageUrl || c.imageBase64 || c.imagePath || c.stimulusType === "image" || c.stimulusType === "soal_bergambar");
            if (!hasImg) return false;
          }
        }

        // DatasetFilterToolbar category filter
        if (datasetFilters.category !== "all") {
          const cat = (c.category || "").toLowerCase();
          const subKey = (c.subjectKey || "").toLowerCase();
          const target = datasetFilters.category.toLowerCase();
          if (cat !== target && subKey !== target) return false;
        }

        // DatasetFilterToolbar quality tier filter
        if (datasetFilters.qualityTier === "verified") {
          const isVerified = c.isAutoVerified === true || (typeof c.qualityScore === "number" && c.qualityScore >= 0.85);
          if (!isVerified) return false;
        } else if (datasetFilters.qualityTier === "anomaly") {
          const isAnomaly =
            c.teacherVerdict === 'corrected' ||
            c.isAligned === false ||
            c.validationStatus !== 'valid' ||
            c.isAutoVerified === false ||
            (Array.isArray(c.anomalyFlags) && c.anomalyFlags.length > 0) ||
            (typeof c.qualityScore === 'number' && c.qualityScore < 0.85);
          if (!isAnomaly) return false;
        }

        // DatasetFilterToolbar search filter
        if (datasetFilters.search && datasetFilters.search.trim()) {
          const q = datasetFilters.search.toLowerCase().trim();
          const matchesPrompt = (c.prompt || "").toLowerCase().includes(q);
          const matchesExplanation = (c.explanation || "").toLowerCase().includes(q);
          const matchesSubject = (c.category || "").toLowerCase().includes(q) || (c.subjectKey || "").toLowerCase().includes(q);
          const matchesOptions = Array.isArray(c.options) && c.options.some((opt) => {
            const text = typeof opt === "string" ? opt : opt?.text || "";
            return text.toLowerCase().includes(q);
          });
          if (!matchesPrompt && !matchesExplanation && !matchesSubject && !matchesOptions) {
            return false;
          }
        }

        // Page filter
        if (pageFilter !== "all") {
          const pages = c.evidencePages || (Array.isArray(c.evidence) ? c.evidence.map((e) => Number(e.page)) : []);
          if (!pages.includes(Number(pageFilter))) return false;
        }

        // Subject filter (match category name, subjectKey, or canonical title)
        if (subjectFilter !== "all") {
          const cat = (c.category || "").toLowerCase();
          const subKey = (c.subjectKey || "").toLowerCase();
          const target = subjectFilter.toLowerCase();
          if (cat !== target && subKey !== target) return false;
        }

        // Anomaly / Exception filter
        if (anomalyOnly) {
          const isAnomaly =
            c.teacherVerdict === 'corrected' ||
            c.isAligned === false ||
            c.validationStatus !== 'valid' ||
            c.isAutoVerified === false ||
            (Array.isArray(c.anomalyFlags) && c.anomalyFlags.length > 0) ||
            (typeof c.qualityScore === 'number' && c.qualityScore < 0.90);
          if (!isAnomaly) return false;
        }

        // Stimulus filter
        if (stimulusFilter !== "all") {
          const isTable = c.stimulusType === "table_description" || c.stimulusType === "deskripsi_tabel" || (c.prompt && (c.prompt.includes("[DESKRIPSI & TABEL]:") || /\|\s*[^|\n]+\s*\|\s*[^|\n]+\s*\|/.test(c.prompt)));
          const isImg = c.stimulusType === "image" || c.stimulusType === "soal_bergambar" || Boolean(c.imageUrl) || Boolean(c.imageBase64) || Boolean(c.imagePath);
          const isCase = c.stimulusType === "case_study" || (c.prompt && /(?:studi kasus|eksperimen|percobaan)/i.test(c.prompt));
          const isPassage = !isTable && !isImg && (c.stimulusType === "reading_passage" || (c.prompt && c.prompt.length > 300));
          const isConcept = !isTable && !isImg && !isPassage && !isCase;

          if (stimulusFilter === "reading_passage" && !isPassage) return false;
          if (stimulusFilter === "image" && !isImg) return false;
          if (stimulusFilter === "table_description" && !isTable) return false;
          if (stimulusFilter === "case_study" && !isCase) return false;
          if (stimulusFilter === "concept" && !isConcept) return false;
        }

        // Interaction filter
        if (interactionFilter !== "all") {
          const itype = c.interactionType || "single_choice";
          if (itype !== interactionFilter) return false;
        }

        // Search text
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesIndex = `#${originalIndex}`.includes(q) || `soal ${originalIndex}`.includes(q) || String(originalIndex) === q;
          const matchesPrompt = (c.prompt || "").toLowerCase().includes(q);
          const matchesExplanation = (c.explanation || "").toLowerCase().includes(q);
          const matchesSubject = (c.category || "").toLowerCase().includes(q) || (c.subjectKey || "").toLowerCase().includes(q);
          const matchesOptions = Array.isArray(c.options) && c.options.some((opt) => {
            const text = typeof opt === "string" ? opt : opt?.text || "";
            return text.toLowerCase().includes(q);
          });
          if (!matchesIndex && !matchesPrompt && !matchesExplanation && !matchesSubject && !matchesOptions) {
            return false;
          }
        }

        return true;
      });
  }, [candidates, pageFilter, subjectFilter, stimulusFilter, interactionFilter, searchQuery, anomalyOnly, datasetFilters]);

  // Pagination calculation
  const totalItems = filteredCandidatesWithIndex.length;
  const effectivePageSize = pageSize === "all" ? Math.max(1, totalItems) : Number(pageSize);
  const totalPages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

  const paginatedCandidates = useMemo(() => {
    if (pageSize === "all") return filteredCandidatesWithIndex;
    const start = (currentPage - 1) * effectivePageSize;
    return filteredCandidatesWithIndex.slice(start, start + effectivePageSize);
  }, [filteredCandidatesWithIndex, currentPage, effectivePageSize, pageSize]);

  if (!candidates.length) {
    return (
      <div className="candidate-review-list candidate-review-list--empty">
        <p>Belum ada kandidat soal. Tunggu proses AI selesai atau upload PDF terlebih dahulu.</p>
      </div>
    );
  }

  const approvedCandidates = candidates.filter(
    (c) => c.reviewStatus === "approved" || c.status === "accepted" || c.reviewStatus === "accepted"
  );
  const pendingCandidates = candidates.filter(
    (c) => !["approved", "accepted", "rejected", "published"].includes(c.reviewStatus || c.status)
  );
  const publishedCandidates = candidates.filter(
    (c) => c.reviewStatus === "published" || c.status === "published"
  );

  const handleSaveAll = () => {
    if (!onPublishAll) return;
    const isMemory = saveDestination === "memory";
    const isClass = saveDestination.startsWith("class_");
    const classId = isClass ? saveDestination.replace("class_", "") : null;
    onPublishAll({
      destination: isMemory ? "memory" : isClass ? "class" : "bank",
      classId
    });
  };

  const prepareQuestionData = (c) => {
    if (!c) return null;
    const opts = Array.isArray(c.options)
      ? c.options.map((o) => (typeof o === "string" ? o : o?.text))
      : [];
    const correctAns =
      typeof c.correctOptionIndex === "number" && opts[c.correctOptionIndex]
        ? opts[c.correctOptionIndex]
        : opts[0] || "";
    return {
      question: c.prompt,
      prompt: c.prompt,
      options: opts,
      correct: correctAns,
      imageBase64: c.imageBase64 || null,
      imageUrl: c.imageUrl || null,
      imagePath: c.imagePath || null,
      interactionType: c.interactionType || "single_choice",
      matrixData: c.matrixData || null,
      stimulusType: c.stimulusType || "concept",
      explanation: c.explanation || null
    };
  };

  return (
    <div className="candidate-review-list" data-testid="candidate-review-list">
      {/* Bulk Action & Save Control Panel */}
      <div className="candidate-bulk-panel">
        <div className="candidate-bulk-panel__info">
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span className="candidate-chip candidate-chip--total">
              📋 Total: <strong>{candidates.length} Soal</strong>
            </span>
            <span className="candidate-chip candidate-chip--approved">
              ✓ Disetujui (Benar): <strong>{approvedCandidates.length}</strong>
            </span>
            <span className="candidate-chip candidate-chip--pending">
              ⏳ Menunggu Review: <strong>{pendingCandidates.length}</strong>
            </span>
            <span className="candidate-chip candidate-chip--published">
              💾 Tersimpan: <strong>{publishedCandidates.length}</strong>
            </span>
            <span className="candidate-chip candidate-chip--verified" title="Soal yang lolos uji kelayakan Quality Guard (>= 90%)">
              🛡️ Lolos Quality Guard: <strong>{autoVerifiedCount}</strong>
            </span>
          </div>

          {pendingCandidates.length > 0 && onReviewAll && (
            <button
              type="button"
              className="candidate-btn candidate-btn--approve-all"
              onClick={() => onReviewAll("approved")}
              data-testid="batch-approve-btn"
              title="Setujui semua soal sekaligus setelah direview dan dinyatakan benar semua"
            >
              ✓ Tandai Benar Semua ({pendingCandidates.length})
            </button>
          )}
        </div>

        {/* Save to Dataset Row */}
        <div className="candidate-bulk-save-row">
          <div className="candidate-bulk-save-target">
            <label htmlFor="bulk-dest-select" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
              Tujuan Penyimpanan Soal yang Terfilter ({filteredSubject}):
            </label>
            <select
              id="bulk-dest-select"
              value={saveDestination}
              onChange={(e) => setSaveDestination(e.target.value)}
              className="candidate-bulk-select"
            >
              <option value="memory">
                🧠 Stack Memory MongoDB (ai_question_ml_memory) — Dataset Latihan AI Mandiri (Admin)
              </option>
              <option value="bank">
                🏛️ Bank Soal Game (MySQL questions_bank) — Mapel: {filteredSubject}
              </option>
              {availableClasses && availableClasses.length > 0 && (
                <optgroup label="Pilihan Kelas Guru / Admin">
                  {availableClasses.map((cls) => (
                    <option key={cls.id} value={`class_${cls.id}`}>
                      🏫 Kelas: {cls.name || cls.title || `Kelas #${cls.id}`} ({cls.subjectKey || cls.subject || "Umum"})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <button
            type="button"
            className="candidate-btn candidate-btn--save-all"
            disabled={approvedCandidates.length === 0 || isSavingAll}
            onClick={handleSaveAll}
            title={
              approvedCandidates.length === 0
                ? "Belum ada soal yang disetujui (klik 'Tandai Benar Semua' atau terima soal per butir)"
                : "Simpan semua soal yang sudah disetujui ke data soal"
            }
          >
            {isSavingAll
              ? "Menyimpan ke Database..."
              : `💾 Simpan Semua Soal Terfilter (${approvedCandidates.length} Siap Disimpan)`}
          </button>
        </div>
      </div>

      {/* WORD & NOISE FILTERING PANEL */}
      {onFilterWords && (
        <div className="candidate-word-filter" data-testid="word-filter-panel">
          <button
            type="button"
            className="candidate-btn candidate-word-filter__toggle"
            onClick={() => setFilterOpen((open) => !open)}
            aria-expanded={filterOpen}
          >
            🧹 Filter Kata &amp; Bersihkan Soal Tidak Penting
          </button>
          {filterOpen && (
            <div className="candidate-word-filter__body">
              <label className="candidate-word-filter__check">
                <input
                  type="checkbox"
                  checked={filterAutoNoise}
                  onChange={(e) => setFilterAutoNoise(e.target.checked)}
                />
                Hapus header, nomor halaman &amp; URL sumber; sambung kata terpenggal
              </label>
              <label className="candidate-word-filter__check">
                <input
                  type="checkbox"
                  checked={filterRejectInvalid}
                  onChange={(e) => setFilterRejectInvalid(e.target.checked)}
                />
                Tolak otomatis soal kosong / placeholder (Pilihan A..E)
              </label>
              <input
                type="text"
                className="candidate-search-input"
                placeholder="Kata/frasa tidak penting kustom, pisahkan dengan koma"
                value={filterWords}
                onChange={(e) => setFilterWords(e.target.value)}
                data-testid="word-filter-input"
              />
              <button
                type="button"
                className="candidate-btn candidate-btn--approve-all"
                disabled={isFiltering}
                data-testid="word-filter-apply"
                onClick={async () => {
                  setIsFiltering(true);
                  try {
                    await onFilterWords({
                      customWords: filterWords.split(",").map((w) => w.trim()).filter(Boolean),
                      autoCleanNoise: filterAutoNoise,
                      rejectInvalidQuestions: filterRejectInvalid
                    });
                  } finally {
                    setIsFiltering(false);
                  }
                }}
              >
                {isFiltering ? "Memfilter..." : "✨ Terapkan Filter Kata & Bersihkan Soal"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* DATASET FILTER TOOLBAR (MODALITY & QUALITY MULTI-DIMENSIONAL) */}
      <DatasetFilterToolbar
        filters={datasetFilters}
        categories={allSubjects}
        totalCount={candidates.length}
        filteredCount={filteredCandidatesWithIndex.length}
        onFilterChange={(newFilters) => {
          setDatasetFilters(newFilters);
          setCurrentPage(1);
        }}
        onResetFilters={() => {
          setDatasetFilters({
            modality: "all",
            category: "all",
            qualityTier: "all",
            search: ""
          });
          setPageFilter("all");
          setSubjectFilter("all");
          setStimulusFilter("all");
          setInteractionFilter("all");
          setAnomalyOnly(false);
          setSearchQuery("");
          setCurrentPage(1);
        }}
      />

      {/* SUBTEST NAVIGATION TABS */}
      <div className="candidate-subtest-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={subjectFilter === "all" && !anomalyOnly}
          className={`candidate-subtest-tab ${subjectFilter === "all" && !anomalyOnly ? "candidate-subtest-tab--active" : ""}`}
          onClick={() => {
            setSubjectFilter("all");
            setAnomalyOnly(false);
            setCurrentPage(1);
          }}
          data-testid="subtest-tab-all"
        >
          Semua Subtes ({candidates.length})
        </button>
        {categoryStats.map(({ label, count }) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={subjectFilter === label && !anomalyOnly}
            className={`candidate-subtest-tab ${subjectFilter === label && !anomalyOnly ? "candidate-subtest-tab--active" : ""}`}
            onClick={() => {
              setSubjectFilter(label);
              setAnomalyOnly(false);
              setCurrentPage(1);
            }}
            data-testid="subtest-tab"
          >
            {label} ({count})
          </button>
        ))}
        {anomalyCount > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={anomalyOnly}
            className={`candidate-subtest-tab candidate-subtest-tab--anomaly ${anomalyOnly ? "candidate-subtest-tab--active" : ""}`}
            onClick={() => {
              setAnomalyOnly(!anomalyOnly);
              setCurrentPage(1);
            }}
            data-testid="anomaly-filter-btn"
            title="Hanya tampilkan soal yang telah dikoreksi guru atau memerlukan verifikasi khusus"
          >
            ⚠️ Perlu Dicek / Koreksi Guru ({anomalyCount})
          </button>
        )}
      </div>

      {/* SMART SEARCH & MULTI-FILTER TOOLBAR */}
      <div className="candidate-filter-bar">
        <div className="candidate-filter-group candidate-filter-group--search">
          <span className="candidate-filter-icon">🔍</span>
          <input
            type="text"
            className="candidate-search-input"
            placeholder="Cari nomor (#1), kata kunci soal, opsi, atau pembahasan..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchQuery && (
            <button
              type="button"
              className="candidate-clear-btn"
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>

        <div className="candidate-filter-row">
          {/* Page Filter */}
          <div className="candidate-filter-select-wrapper">
            <label className="candidate-filter-label">📄 Halaman PDF:</label>
            <select
              className="candidate-filter-select"
              value={pageFilter}
              onChange={(e) => {
                setPageFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Semua Halaman ({allPages.length ? `${allPages[0]} - ${allPages[allPages.length - 1]}` : "0"})</option>
              {allPages.map((p) => (
                <option key={p} value={p}>
                  Halaman {p}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="candidate-filter-select-wrapper">
            <label className="candidate-filter-label">🏷️ Kategori / Mapel:</label>
            <select
              className="candidate-filter-select"
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Semua Kategori ({allSubjects.length || 1})</option>
              {allSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Stimulus Type Filter */}
          <div className="candidate-filter-select-wrapper">
            <label className="candidate-filter-label">📑 Tipe Soal:</label>
            <select
              className="candidate-filter-select"
              value={stimulusFilter}
              onChange={(e) => {
                setStimulusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Semua Tipe Soal</option>
              <option value="reading_passage">📖 Soal Cerita / Wacana</option>
              <option value="image">🖼️ Soal Bergambar</option>
              <option value="table_description">📊 Deskripsi Tabel</option>
              <option value="case_study">🔬 Studi Kasus</option>
              <option value="concept">⚡ Konsep Teori</option>
            </select>
          </div>

          {/* Interaction Type Filter */}
          <div className="candidate-filter-select-wrapper">
            <label className="candidate-filter-label">🎯 Tipe Jawaban:</label>
            <select
              className="candidate-filter-select"
              value={interactionFilter}
              onChange={(e) => {
                setInteractionFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Semua Tipe Jawaban</option>
              <option value="single_choice">🔘 Pilihan Ganda Tunggal</option>
              <option value="multiple_choice">☑️ Pilihan Ganda Kompleks</option>
              <option value="matrix_drag_drop">🔲 Drag & Drop Matriks</option>
            </select>
          </div>

          {/* Page Size Filter */}
          <div className="candidate-filter-select-wrapper">
            <label className="candidate-filter-label">📌 Tampilkan:</label>
            <select
              className="candidate-filter-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(e.target.value === "all" ? "all" : Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10 per lembar</option>
              <option value={25}>25 per lembar</option>
              <option value={50}>50 per lembar</option>
              <option value="all">Semua ({totalItems})</option>
            </select>
          </div>
        </div>

        {/* Filter Stats & Reset */}
        <div className="candidate-filter-status">
          <span>
            Menampilkan <strong>{paginatedCandidates.length}</strong> dari <strong>{totalItems}</strong> soal terfilter (Total Dokumen: <strong>{candidates.length} Soal</strong>)
          </span>
          {(searchQuery || pageFilter !== "all" || subjectFilter !== "all" || stimulusFilter !== "all") && (
            <button
              type="button"
              className="candidate-btn-reset-filters"
              onClick={() => {
                setSearchQuery("");
                setPageFilter("all");
                setSubjectFilter("all");
                setStimulusFilter("all");
                setCurrentPage(1);
              }}
            >
              ↻ Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Bar */}
      {categoryStats.length > 1 && (
        <div className="candidate-category-pills" data-testid="candidate-category-pills">
          <span className="candidate-category-pills__label">🏷️ Kategori Otomatis:</span>
          <button
            type="button"
            className={`candidate-category-pill ${subjectFilter === "all" ? "candidate-category-pill--active" : ""}`}
            onClick={() => {
              setSubjectFilter("all");
              setCurrentPage(1);
            }}
          >
            Semua ({candidates.length})
          </button>
          {categoryStats.map(({ label, count }) => (
            <button
              key={label}
              type="button"
              className={`candidate-category-pill ${subjectFilter.toLowerCase() === label.toLowerCase() ? "candidate-category-pill--active" : ""}`}
              onClick={() => {
                setSubjectFilter(label);
                setCurrentPage(1);
              }}
            >
              🏷️ {label} ({count})
            </button>
          ))}
        </div>
      )}

      {simulationResult && (
        <div className="candidate-simulation-banner">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", justifyContent: "space-between" }}>
            <span>
              🎮 <strong>Hasil Uji Coba Simulasi:</strong> Jawaban "<strong>{simulationResult.selectedAnswer}</strong>" dinyatakan{" "}
              {simulationResult.isCorrect ? "✅ BENAR" : "❌ SALAH"}
            </span>
            <button
              type="button"
              onClick={() => setSimulationResult(null)}
              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "14px", color: "#5b21b6", fontWeight: "bold" }}
            >
              ✕
            </button>
          </div>
          {simulationResult.explanation && (
            <p>💡 <em>{simulationResult.explanation}</em></p>
          )}
        </div>
      )}

      {/* Candidate List */}
      {paginatedCandidates.length === 0 ? (
        <div className="candidate-review-list candidate-review-list--empty">
          <p>Tidak ada soal yang cocok dengan filter atau kata kunci pencarian Anda.</p>
        </div>
      ) : (
        paginatedCandidates.map(({ candidate, originalIndex }) => (
          <CandidateCard
            key={candidate.candidateId || candidate.id || originalIndex}
            index={originalIndex}
            candidate={candidate}
            onReview={onReview}
            onPublish={onPublish}
            availableClasses={availableClasses}
            onSimulate={(c) => {
              setSimulationResult(null);
              setSimulatingCandidate(c);
            }}
            onEdit={(c) => setEditingCandidate(c)}
            onDelete={async (c) => {
              const cid = c.candidateId || c.id || c._id;
              if (window.confirm("Hapus kandidat soal ini dari daftar?")) {
                if (onDeleteCandidate) await onDeleteCandidate(cid);
              }
            }}
          />
        ))
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="candidate-pagination-bar">
          <button
            type="button"
            className="candidate-pagination-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            ← Sebelumnya
          </button>
          <span className="candidate-pagination-info">
            Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
          </span>
          <button
            type="button"
            className="candidate-pagination-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Berikutnya →
          </button>
        </div>
      )}

      {simulatingCandidate && (
        <CoinModal
          isOpen={Boolean(simulatingCandidate)}
          onRequestClose={() => setSimulatingCandidate(null)}
          questionData={prepareQuestionData(simulatingCandidate)}
          onQuestionAnswered={(question, answer, correct) => {
            setSimulationResult({
              candidateId: simulatingCandidate.candidateId || simulatingCandidate.id,
              isCorrect: correct,
              selectedAnswer: answer,
              explanation: simulatingCandidate.explanation
            });
          }}
          serverScored={false}
        />
      )}
      {editingCandidate && (
        <CandidateEditModal
          isOpen={Boolean(editingCandidate)}
          candidate={editingCandidate}
          onClose={() => setEditingCandidate(null)}
          onSave={async (updatedData) => {
            if (onUpdateCandidate) {
              const cid = editingCandidate.candidateId || editingCandidate.id || editingCandidate._id;
              await onUpdateCandidate(cid, updatedData);
            }
            setEditingCandidate(null);
          }}
        />
      )}
    </div>
  );
};

export default CandidateReviewList;
