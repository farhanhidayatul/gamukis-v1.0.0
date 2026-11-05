import React from "react";
import "./AiCandidatePreviewList.css";

const OPTION_LABELS = ["A", "B", "C", "D", "E"];

const getOptionText = (option) =>
  typeof option === "string" ? option : option?.text || "";

const getCorrectAnswer = (candidate) => {
  const options = Array.isArray(candidate.options) ? candidate.options : [];
  const correctIndex = Number(candidate.correctOptionIndex);
  const correctText = options[correctIndex] ? getOptionText(options[correctIndex]) : "";
  return correctText ? `${OPTION_LABELS[correctIndex] || correctIndex + 1}. ${correctText}` : "Jawaban belum tersedia";
};

const AiCandidatePreviewList = ({ selectedJob, candidates, page, pageSize, total, isLoading, errorMessage, onPageChange }) => {
  if (!selectedJob) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="ai-candidate-preview" aria-label="Pratinjau soal AI">
      <div className="ai-candidate-preview__heading">
        <p className="ai-candidate-preview__eyebrow">PRATINJAU MONGODB</p>
        <h2>Soal dari job {selectedJob.jobId || selectedJob.id}</h2>
        <p>Jawaban dan penjelasan pada bagian ini hanya terlihat untuk Administrator.</p>
      </div>

      {isLoading && <p className="ai-candidate-preview__message">Memuat soal dari memory AI...</p>}
      {!isLoading && errorMessage && <p className="ai-candidate-preview__message ai-candidate-preview__message--error">{errorMessage}</p>}
      {!isLoading && !errorMessage && !candidates.length && <p className="ai-candidate-preview__message">Job ini belum memiliki soal yang tersimpan.</p>}

      {!isLoading && !errorMessage && candidates.map((candidate, position) => {
        const options = Array.isArray(candidate.options) ? candidate.options : [];
        const questionNumber = Number.isFinite(Number(candidate.index)) ? Number(candidate.index) + 1 : ((page - 1) * pageSize) + position + 1;

        return (
          <article className="ai-candidate-preview__card" key={candidate.id || `${candidate.jobId}-${questionNumber}`}>
            <div className="ai-candidate-preview__meta">
              <span>Soal {questionNumber}</span>
              <span>{candidate.difficulty || "—"}</span>
              <span>{candidate.validationStatus || "—"}</span>
              <span>{candidate.reviewStatus || "—"}</span>
            </div>
            <h3>{candidate.prompt || "Soal tidak tersedia"}</h3>
            <ol className="ai-candidate-preview__options" type="A">
              {options.map((option, optionIndex) => <li key={optionIndex}>{getOptionText(option)}</li>)}
            </ol>
            <p className="ai-candidate-preview__answer"><strong>Jawaban benar:</strong> {getCorrectAnswer(candidate)}</p>
            {candidate.explanation && <p className="ai-candidate-preview__explanation"><strong>Penjelasan:</strong> {candidate.explanation}</p>}
          </article>
        );
      })}

      {!isLoading && !errorMessage && total > 0 && (
        <div className="ai-candidate-preview__pagination" aria-label="Pagination pratinjau soal AI">
          <span>Halaman {page} dari {totalPages} · {total} soal</span>
          <div>
            <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Sebelumnya</button>
            <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Berikutnya</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default AiCandidatePreviewList;
