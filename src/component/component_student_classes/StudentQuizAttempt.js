import React, { useState } from "react";
import "./StudentQuizAttempt.css";

const isQuestionAnswered = (question, answerState) => {
  if (!question || answerState === undefined || answerState === null) return false;
  const qType = question.questionType || "multiple_choice";
  if (qType === "drag_drop") {
    const slots = question.dragDropSlots || [];
    if (!answerState || typeof answerState !== "object") return false;
    return slots.length > 0 && slots.every((slot, idx) => Boolean(answerState[String(slot.id ?? idx + 1)]));
  }
  if (qType === "short_text") {
    return String(answerState || "").trim().length > 0;
  }
  return Boolean(answerState);
};

const StudentQuizAttempt = ({
  classItem = {},
  questions = [],
  attempt = null,
  isSubmitting = false,
  error = "",
  onStartAttempt,
  onSubmitAttempt
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [activeDragToken, setActiveDragToken] = useState(null);

  const isSubmitted = attempt?.status === "submitted";
  const currentQuestion = questions[currentIndex] || null;
  const currentType = currentQuestion?.questionType || "multiple_choice";

  const handleSelectOption = (questionId, optionId) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleAssignDragDropSlot = (questionId, slotKey, choiceText) => {
    if (isSubmitted || !choiceText) return;
    setSelectedAnswers((prev) => {
      const currentMap =
        prev[questionId] && typeof prev[questionId] === "object" ? { ...prev[questionId] } : {};
      currentMap[String(slotKey)] = choiceText;
      return {
        ...prev,
        [questionId]: currentMap
      };
    });
    setActiveDragToken(null);
  };

  const handleClearDragDropSlot = (questionId, slotKey) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => {
      const currentMap =
        prev[questionId] && typeof prev[questionId] === "object" ? { ...prev[questionId] } : {};
      delete currentMap[String(slotKey)];
      return {
        ...prev,
        [questionId]: currentMap
      };
    });
  };

  const handleTextAnswerChange = (questionId, value) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    if (!onSubmitAttempt || !attempt || isSubmitted) return;
    const formattedAnswers = questions.map((q) => {
      const qType = q.questionType || "multiple_choice";
      const val = selectedAnswers[q.id];
      if (qType === "drag_drop") {
        return {
          questionId: q.id,
          dragDropAnswer: val && typeof val === "object" ? val : {}
        };
      }
      if (qType === "short_text") {
        return {
          questionId: q.id,
          textAnswer: val !== undefined && val !== null ? String(val).trim() : ""
        };
      }
      return {
        questionId: q.id,
        selectedOptionId: val ?? null
      };
    });
    await onSubmitAttempt(formattedAnswers);
  };

  if (isSubmitted) {
    return (
      <section className="student-quiz-result" aria-label="Hasil Kuis Siswa" data-testid="student-quiz-result">
        <p className="student-quiz-eyebrow">HASIL KUIS TERSIMPAN</p>
        <h2>{classItem.title}</h2>
        <div className="student-score-box">
          <span>Skor Akhir Anda</span>
          <strong data-testid="submitted-score-value">
            {attempt.score} / {attempt.maxScore}
          </strong>
        </div>

        {Array.isArray(attempt.answers) && attempt.answers.length > 0 ? (
          <div className="student-answer-outcomes">
            <h3>Ringkasan Jawaban</h3>
            <ul>
              {attempt.answers.map((ans, idx) => (
                <li key={ans.questionId || idx} className={ans.isCorrect ? "correct" : "incorrect"}>
                  <span>Soal #{idx + 1}</span>
                  <span>{ans.isCorrect ? `Benar (+${ans.awardedPoints} poin)` : "Belum Tepat (0 poin)"}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    );
  }

  if (!attempt) {
    return (
      <section className="student-quiz-start" aria-label="Mulai Kuis Kelas">
        <h2>{classItem.title}</h2>
        <p>{classItem.description}</p>
        <p>
          Jumlah Soal: <strong>{questions.length}</strong> soal kuis (1 kali kesempatan pengerjaan).
        </p>
        {error ? (
          <div className="student-quiz-error" role="alert">
            {error}
          </div>
        ) : null}
        <button
          type="button"
          className="student-quiz-btn primary"
          onClick={onStartAttempt}
          disabled={questions.length === 0}
        >
          Mulai Kerjakan Kuis
        </button>
      </section>
    );
  }

  return (
    <section className="student-quiz-attempt" aria-label="Lembar Pengerjaan Kuis">
      <header className="student-quiz-header">
        <div>
          <h2>{classItem.title}</h2>
          <p data-testid="quiz-question-progress">
            Soal {currentIndex + 1} dari {questions.length}
          </p>
        </div>
        <div className="student-quiz-QuickNav" role="navigation" aria-label="Navigasi nomor soal">
          {questions.map((q, idx) => (
            <button
              key={q.id || idx}
              type="button"
              className={`quiz-num-btn ${idx === currentIndex ? "current" : ""} ${
                isQuestionAnswered(q, selectedAnswers[q.id]) ? "answered" : ""
              }`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Ke soal nomor ${idx + 1}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </header>

      {error ? (
        <div className="student-quiz-error" role="alert">
          {error}
        </div>
      ) : null}

      {currentQuestion ? (
        <article className="student-question-card" data-testid="active-student-question">
          <div className="student-question-top">
            <span>Pertanyaan #{currentIndex + 1}</span>
            <span>{currentQuestion.points || 10} Poin</span>
          </div>

          <p className="student-question-prompt">{currentQuestion.prompt}</p>

          {currentQuestion.imageKey ? (
            <img
              src={currentQuestion.imageKey}
              alt={currentQuestion.imageAltText || `Gambar soal ${currentIndex + 1}`}
              className="student-question-image"
            />
          ) : null}

          {currentType === "multiple_choice" && (
            <div className="student-options-list" role="radiogroup" aria-label={currentQuestion.prompt}>
              {(currentQuestion.options || []).map((option, optIdx) => {
                const isSelected = selectedAnswers[currentQuestion.id] === option.id;
                return (
                  <button
                    key={option.id || optIdx}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`student-option-target ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + optIdx)}</span>
                    <span className="option-label">{option.optionText}</span>
                  </button>
                );
              })}
            </div>
          )}

          {currentType === "drag_drop" && (
            <div className="student-dragdrop-area" data-testid="student-drag-drop-area">
              <div className="student-dragdrop-bank">
                <p className="student-dragdrop-instruction">
                  Seret kartu jawaban di bawah ini ke kotak target, atau klik kartu lalu klik kotak target:
                </p>
                <div className="student-dragdrop-tokens">
                  {(currentQuestion.dragDropChoices || []).map((choice, cIdx) => {
                    const isTokenSelected = activeDragToken === choice;
                    return (
                      <button
                        key={cIdx}
                        type="button"
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer?.setData("text/plain", choice);
                          setActiveDragToken(choice);
                        }}
                        onClick={() => setActiveDragToken(isTokenSelected ? null : choice)}
                        className={`student-dragdrop-token ${isTokenSelected ? "active" : ""}`}
                      >
                        ⠿ {choice}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="student-dragdrop-slots">
                {(currentQuestion.dragDropSlots || []).map((slot, sIdx) => {
                  const slotKey = String(slot.id ?? sIdx + 1);
                  const currentMap = selectedAnswers[currentQuestion.id] || {};
                  const assignedValue = currentMap[slotKey] || "";
                  return (
                    <div
                      key={slotKey}
                      className={`student-dragdrop-slot ${assignedValue ? "filled" : ""}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const dropped = event.dataTransfer?.getData("text/plain") || activeDragToken;
                        if (dropped) {
                          handleAssignDragDropSlot(currentQuestion.id, slotKey, dropped);
                        }
                      }}
                    >
                      <span className="student-dragdrop-slot-label">{slot.slotLabel}</span>
                      <div className="student-dragdrop-slot-controls">
                        <button
                          type="button"
                          className="student-dragdrop-dropzone"
                          onClick={() => {
                            if (activeDragToken) {
                              handleAssignDragDropSlot(currentQuestion.id, slotKey, activeDragToken);
                            } else if (assignedValue) {
                              handleClearDragDropSlot(currentQuestion.id, slotKey);
                            }
                          }}
                        >
                          {assignedValue || "Klik / Taruh Jawaban Di Sini"}
                        </button>
                        <select
                          aria-label={`Pilih jawaban untuk ${slot.slotLabel}`}
                          value={assignedValue}
                          onChange={(event) => {
                            const val = event.target.value;
                            if (val) {
                              handleAssignDragDropSlot(currentQuestion.id, slotKey, val);
                            } else {
                              handleClearDragDropSlot(currentQuestion.id, slotKey);
                            }
                          }}
                          className="student-dragdrop-select"
                        >
                          <option value="">-- Pilih Jawaban --</option>
                          {(currentQuestion.dragDropChoices || []).map((choice, cIdx) => (
                            <option key={cIdx} value={choice}>
                              {choice}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentType === "short_text" && (
            <div className="student-shorttext-area" data-testid="student-short-text-area">
              <label htmlFor={`student-short-text-${currentQuestion.id}`} className="student-shorttext-label">
                Jawaban Tulisan Anda:
              </label>
              <input
                id={`student-short-text-${currentQuestion.id}`}
                type="text"
                className="student-shorttext-input"
                value={selectedAnswers[currentQuestion.id] || ""}
                onChange={(event) => handleTextAnswerChange(currentQuestion.id, event.target.value)}
                placeholder={currentQuestion.textAnswerPlaceholder || "Ketik jawaban singkat..."}
              />
            </div>
          )}
        </article>
      ) : null}

      <footer className="student-quiz-footer">
        <button
          type="button"
          className="student-quiz-btn outline"
          onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
          disabled={currentIndex === 0}
        >
          Sebelumnya
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            className="student-quiz-btn secondary"
            onClick={() => setCurrentIndex((idx) => Math.min(questions.length - 1, idx + 1))}
          >
            Soal Berikutnya
          </button>
        ) : (
          <button
            type="button"
            className="student-quiz-btn primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Mengirim Jawaban..." : "Kumpulkan Jawaban"}
          </button>
        )}
      </footer>
    </section>
  );
};

export default StudentQuizAttempt;
