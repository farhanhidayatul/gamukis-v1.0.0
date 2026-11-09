import { useState } from "react";
import { getQuestionTypeBadge } from "./QuestionEditor";
import "./ClassPreview.css";

const buildShuffledChoices = (items = [], fallbackChoices = []) => {
  const raw =
    Array.isArray(fallbackChoices) && fallbackChoices.length > 0
      ? fallbackChoices.map((c) => String(c || "").trim()).filter(Boolean)
      : items.map((item) => String(item?.answerText || "").trim()).filter(Boolean);
  if (raw.length <= 1) return raw;
  const sorted = [...raw].sort((a, b) => a.localeCompare(b, "id"));
  const sameOrder = sorted.every((val, idx) => val === raw[idx]);
  return sameOrder ? [...raw.slice(1), raw[0]] : sorted;
};

/**
 * Projects a question into a student-safe view by stripping all answer keys and explanations.
 */
const toStudentSafeQuestion = (question) => {
  const questionType = question.questionType || "multiple_choice";
  const base = {
    id: question.id,
    questionType,
    prompt: question.prompt,
    points: question.points,
    imageKey: question.imageKey || null,
    imageAltText: question.imageAltText || null,
    options:
      questionType === "multiple_choice"
        ? (question.options || []).map((opt, idx) => ({
            id: opt.id ?? `opt-${idx}`,
            position: opt.position ?? idx,
            optionText: typeof opt === "string" ? opt : opt.optionText
          }))
        : []
  };

  if (questionType === "drag_drop") {
    const rawSlots = question.dragDropSlots || question.dragDropItems || [];
    base.dragDropSlots = rawSlots.map((slot, idx) => ({
      id: slot.id ?? idx + 1,
      position: slot.position ?? idx + 1,
      slotLabel: slot.slotLabel || ""
    }));
    base.dragDropChoices = buildShuffledChoices(rawSlots, question.dragDropChoices);
  } else if (questionType === "short_text") {
    base.textAnswerPlaceholder = question.textAnswerPlaceholder || "Ketik jawaban singkat...";
  }

  return base;
};

const ClassPreview = ({ classItem = {}, questions = [] }) => {
  const [previewMode, setPreviewMode] = useState("teacher");

  const isTeacherMode = previewMode === "teacher";

  return (
    <section className="class-preview-panel" aria-label="Pratinjau Kelas">
      <div className="class-preview-header">
        <div>
          <h3>Langkah 3: Pratinjau Kelas</h3>
          <p className="class-preview-subtitle">
            Bandingkan tampilan penulis (dengan kunci jawaban) dan tampilan siswa (tanpa kunci jawaban).
          </p>
        </div>

        <div className="class-preview-toggle" role="tablist" aria-label="Mode pratinjau">
          <button
            type="button"
            role="tab"
            aria-selected={isTeacherMode}
            className={`preview-tab-btn ${isTeacherMode ? "active" : ""}`}
            onClick={() => setPreviewMode("teacher")}
          >
            Pratinjau Guru (Kunci Jawaban)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isTeacherMode}
            className={`preview-tab-btn ${!isTeacherMode ? "active" : ""}`}
            onClick={() => setPreviewMode("student")}
          >
            Pratinjau Siswa (Aman)
          </button>
        </div>
      </div>

      <div className="class-preview-meta">
        <h4>{classItem.title || "Kelas Tanpa Judul"}</h4>
        <p>{classItem.subject || "Mata Pelajaran"}</p>
        <p>{classItem.description || "Tidak ada deskripsi."}</p>
      </div>

      {questions.length === 0 ? (
        <p className="class-preview-empty">Belum ada soal untuk ditampilkan.</p>
      ) : (
        <div className="class-preview-questions">
          {questions.map((rawQuestion, qIndex) => {
            const safeQuestion = toStudentSafeQuestion(rawQuestion);
            const qType = safeQuestion.questionType;
            return (
              <article
                key={rawQuestion.id || qIndex}
                className="class-preview-card"
                data-testid={`preview-question-${qIndex}`}
              >
                <div className="class-preview-card-head">
                  <div className="question-saved-title-group">
                    <span>Soal #{qIndex + 1}</span>
                    <span className={`question-saved-type-badge type-${qType}`}>
                      {getQuestionTypeBadge(qType)}
                    </span>
                  </div>
                  <span>{safeQuestion.points || 10} Poin</span>
                </div>
                <p className="class-preview-prompt">{safeQuestion.prompt}</p>
                {safeQuestion.imageKey ? (
                  <img
                    src={safeQuestion.imageKey}
                    alt={safeQuestion.imageAltText || `Ilustrasi soal ${qIndex + 1}`}
                    className="class-preview-image"
                  />
                ) : null}

                {qType === "multiple_choice" && (
                  <ul className="class-preview-options">
                    {safeQuestion.options.map((opt, optIdx) => {
                      const isCorrectOption =
                        isTeacherMode &&
                        (rawQuestion.correctOptionId === opt.id ||
                          Number(rawQuestion.correctOptionIndex) === optIdx);

                      return (
                        <li
                          key={opt.id || optIdx}
                          className={`class-preview-option ${isCorrectOption ? "correct" : ""}`}
                        >
                          <span>
                            {String.fromCharCode(65 + optIdx)}. {opt.optionText}
                          </span>
                          {isCorrectOption ? (
                            <strong className="preview-answer-key-badge" data-testid="teacher-answer-key-badge">
                              Kunci Jawaban Benar
                            </strong>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {qType === "drag_drop" && (
                  <div className="class-preview-dragdrop" data-testid="preview-drag-drop-view">
                    {isTeacherMode ? (
                      <ul className="class-preview-options">
                        {(rawQuestion.dragDropItems || []).map((pair, idx) => (
                          <li key={pair.id || idx} className="class-preview-option correct">
                            <span>
                              <strong>{pair.slotLabel}</strong> → {pair.answerText}
                            </span>
                            <strong className="preview-answer-key-badge" data-testid="teacher-answer-key-badge">
                              Pasangan Kunci
                            </strong>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="class-preview-student-dragdrop">
                        <div className="preview-dragdrop-tokens">
                          <span className="preview-dragdrop-label">Kartu Jawaban (Drag &amp; Drop):</span>
                          <div className="preview-dragdrop-token-list">
                            {(safeQuestion.dragDropChoices || []).map((choice, cIdx) => (
                              <span key={cIdx} className="preview-dragdrop-token">
                                ⠿ {choice}
                              </span>
                            ))}
                          </div>
                        </div>
                        <ul className="class-preview-options">
                          {(safeQuestion.dragDropSlots || []).map((slot, sIdx) => (
                            <li key={slot.id || sIdx} className="class-preview-option">
                              <span>{slot.slotLabel}</span>
                              <span className="preview-dropzone-placeholder">[ Letakkan Jawaban Di Sini ]</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {qType === "short_text" && (
                  <div className="class-preview-shorttext" data-testid="preview-short-text-view">
                    {isTeacherMode ? (
                      <div className="class-preview-option correct">
                        <span>
                          <strong>Jawaban Diterima:</strong>{" "}
                          {(rawQuestion.acceptedAnswers || []).join(" / ")}
                        </span>
                        <strong className="preview-answer-key-badge" data-testid="teacher-answer-key-badge">
                          Kunci Jawaban Tulisan
                        </strong>
                      </div>
                    ) : (
                      <div className="preview-student-text-input">
                        <input
                          type="text"
                          disabled
                          placeholder={safeQuestion.textAnswerPlaceholder || "Ketik jawaban singkat..."}
                          aria-label="Pratinjau kolom isian siswa"
                        />
                      </div>
                    )}
                  </div>
                )}

                {isTeacherMode && rawQuestion.explanation ? (
                  <p className="class-preview-explanation" data-testid="teacher-explanation-preview">
                    <strong>Pembahasan Guru:</strong> {rawQuestion.explanation}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export { toStudentSafeQuestion };
export default ClassPreview;
