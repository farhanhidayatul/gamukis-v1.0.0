import { useState, useEffect } from "react";
import Modal from 'react-modal';
import './modal.css';
import MathText from '../common/MathText';

/**
 * Parses a question prompt to separate reading stimulus/story from the core question.
 */
export const parseQuestionPrompt = (rawPrompt = '') => {
  if (!rawPrompt || typeof rawPrompt !== 'string') {
    return { hasStory: false, story: '', question: '' };
  }

  const trimmed = rawPrompt.trim();

  // 1. Explicit tags: [BACAAN / SOAL CERITA]: ... [PERTANYAAN]: ...
  const structuredMatch = trimmed.match(/\[(?:BACAAN\s*\/\s*SOAL\s*CERITA|DESKRIPSI\s*&\s*TABEL|DESKRIPSI\s*TABEL|TABEL|BACAAN|STIMULUS|WACANA)\]:?\s*([\s\S]*?)\s*\[(?:PERTANYAAN|SOAL)\]:?\s*([\s\S]*)/i);
  if (structuredMatch) {
    return {
      hasStory: true,
      story: structuredMatch[1].trim(),
      question: structuredMatch[2].trim() || 'Jawablah pertanyaan berdasarkan bacaan di atas.'
    };
  }

  // 2. Multi-paragraph prompt with substantial length (> 150 characters)
  const paragraphs = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length >= 2 && trimmed.length > 150) {
    const question = paragraphs[paragraphs.length - 1];
    const story = paragraphs.slice(0, paragraphs.length - 1).join('\n\n');
    return {
      hasStory: true,
      story,
      question
    };
  }

  // 3. Preamble match: "GUNAKAN TEKS INI UNTUK MENJAWAB..." or "Perhatikan teks berikut..."
  const preambleMatch = trimmed.match(/^((?:GUNAKAN TEKS INI|Perhatikan teks|Bacalah kutipan|Cermatilah)[\s\S]*?)(?:(?=\n\d+\.|\n[A-Z][a-z]+.*?\?)|$)/i);
  if (preambleMatch && preambleMatch[1] && trimmed.length > 180) {
    const story = preambleMatch[1].trim();
    const question = trimmed.slice(preambleMatch[0].length).trim();
    if (question) {
      return {
        hasStory: true,
        story,
        question
      };
    }
  }

  return {
    hasStory: false,
    story: '',
    question: trimmed
  };
};

/**
 * Parses markdown table syntax and surrounding narrative from a stimulus string.
 */
export const parseTableAndText = (content = '') => {
  if (!content || typeof content !== 'string') {
    return { beforeText: '', headers: [], rows: [], afterText: '' };
  }

  const lines = content.split('\n');
  let firstTableIdx = -1;
  let lastTableIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (firstTableIdx === -1) firstTableIdx = i;
      lastTableIdx = i;
    }
  }

  if (firstTableIdx === -1) {
    return { beforeText: content.trim(), headers: [], rows: [], afterText: '' };
  }

  const beforeText = lines.slice(0, firstTableIdx).join('\n').trim();
  const tableLines = lines
    .slice(firstTableIdx, lastTableIdx + 1)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && l.endsWith('|'));
  const afterText = lines.slice(lastTableIdx + 1).join('\n').trim();

  const cleanTableLines = tableLines.filter((l) => !/^[|\s\-:]+$/.test(l));
  let headers = [];
  let rows = [];
  if (cleanTableLines.length > 0) {
    headers = cleanTableLines[0].split('|').map((s) => s.trim()).filter(Boolean);
    rows = cleanTableLines.slice(1).map((rowStr) => rowStr.split('|').map((s) => s.trim()).filter(Boolean));
  }

  return {
    beforeText,
    headers,
    rows,
    afterText
  };
};

/**
 * Renders a structured story string with styled HTML tables for markdown table data.
 */
export const renderStructuredStory = (storyText, { tableWrapperClass = 'story-table-wrapper', tableClass = 'story-table' } = {}) => {
  if (!storyText) return null;
  const parsed = parseTableAndText(storyText);
  if (!parsed.headers || parsed.headers.length === 0) {
    return <span style={{ whiteSpace: 'pre-wrap' }}>{storyText}</span>;
  }

  return (
    <div className="structured-story-container">
      {parsed.beforeText && (
        <div style={{ marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
          {parsed.beforeText}
        </div>
      )}
      <div className={tableWrapperClass}>
        <table className={tableClass}>
          <thead>
            <tr>
              {parsed.headers.map((h, i) => (
                <th key={i} style={{ textAlign: i === 0 ? 'left' : 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsed.rows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} style={{ textAlign: cIdx === 0 ? 'left' : 'center', fontWeight: cIdx === 0 ? 600 : 400 }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {parsed.afterText && (
        <div style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>
          {parsed.afterText}
        </div>
      )}
    </div>
  );
};

/**
 * CoinModal — displays a question when a player collects a coin.
 *
 * Props:
 *   isOpen             — controls modal visibility
 *   onRequestClose()   — called to close the modal
 *   onQuestionAnswered(question, answer, correct) — original local-scored callback
 *   onServerAnswer(selectedOptionId)             — callback for server-scored mode
 *   serverScored       — if true, answer correctness comes from server (no local check)
 *   playerId           — current player id
 *   questionData       — { question, options, correct, _classQuestion, _questionId, _serverOptions }
 */

/**
 * Interactive Drag-and-Drop / Click-to-Place Matrix Statement Question Component.
 */
export const MatrixDragDropQuiz = ({
  matrixData,
  onComplete,
  disabled
}) => {
  const [placements, setPlacements] = useState({});
  const [, setDraggedItem] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isAllCorrect, setIsAllCorrect] = useState(false);

  const columns = matrixData?.columns || [
    { key: 'memperlemah', label: 'Memperlemah', badgeColor: '#ef4444' },
    { key: 'tidak_memperlemah', label: 'Tidak Memperlemah', badgeColor: '#10b981' }
  ];
  const statements = matrixData?.statements || [];

  const handleDrop = (statementId, colKey) => {
    if (disabled || submitted) return;
    setPlacements((prev) => ({
      ...prev,
      [statementId]: colKey
    }));
  };

  const handleCellClick = (statementId, colKey) => {
    if (disabled || submitted) return;
    setPlacements((prev) => ({
      ...prev,
      [statementId]: prev[statementId] === colKey ? null : colKey
    }));
  };

  const isComplete = statements.length > 0 && statements.every((s) => Boolean(placements[s.id]));

  const handleSubmit = () => {
    if (!isComplete || submitted) return;
    const correct = statements.every((s) => placements[s.id] === s.correctCategory);
    setIsAllCorrect(correct);
    setSubmitted(true);
    if (onComplete) {
      onComplete(correct);
    }
  };

  return (
    <div className="matrix-drag-drop-container">
      <div className="matrix-drag-palette">
        <span className="matrix-palette-label">💡 Tarik (Drag) atau Klik tombol centang hijau ke kolom jawaban yang sesuai:</span>
        <div
          className="matrix-draggable-token"
          draggable={!disabled && !submitted}
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', 'checkmark');
            setDraggedItem('checkmark');
          }}
          onDragEnd={() => setDraggedItem(null)}
          title="Tarik tombol ini atau klik langsung kotak pada tabel"
        >
          <span className="matrix-token-check">✔</span> Centang Hijau
        </div>
      </div>

      <div className="matrix-table-wrapper">
        <table className="matrix-statement-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>No</th>
              <th style={{ textAlign: 'left' }}>Pernyataan</th>
              {columns.map((col) => (
                <th key={col.key} style={{ textAlign: 'center', width: '135px' }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statements.map((stmt, idx) => (
              <tr key={stmt.id}>
                <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                <td className="matrix-statement-cell">
                  <MathText text={stmt.statement} />
                </td>
                {columns.map((col) => {
                  const isChecked = placements[stmt.id] === col.key;
                  return (
                    <td
                      key={col.key}
                      className={`matrix-drop-slot ${isChecked ? 'matrix-drop-slot--checked' : ''}`}
                      onClick={() => handleCellClick(stmt.id, col.key)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(stmt.id, col.key);
                      }}
                    >
                      {isChecked ? (
                        <div className="matrix-placed-check">
                          <span>✔</span>
                          <span className="matrix-check-sublabel">{col.label}</span>
                        </div>
                      ) : (
                        <div className="matrix-empty-slot-hint">
                          <span>+ Letakkan</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="matrix-submit-bar">
        {!submitted ? (
          <button
            type="button"
            className="matrix-submit-btn"
            disabled={!isComplete || disabled}
            onClick={handleSubmit}
          >
            {isComplete ? '✅ Kirim Jawaban Matriks' : `Lengkapi centang (${Object.values(placements).filter(Boolean).length}/${statements.length})`}
          </button>
        ) : (
          <div className={`matrix-feedback-banner ${isAllCorrect ? 'matrix-feedback--correct' : 'matrix-feedback--incorrect'}`}>
            {isAllCorrect ? '🎉 Jawaban Matriks Tepat!' : '❌ Beberapa centang pernyataan belum sesuai.'}
          </div>
        )}
      </div>
    </div>
  );
};

const CoinModal = ({ isOpen, onRequestClose, onQuestionAnswered, onServerAnswer, serverScored, playerId, questionData }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [isStoryMinimized, setIsStoryMinimized] = useState(false);

  const rawPrompt = questionData?.question || questionData?.prompt || "";
  const { hasStory, story, question } = parseQuestionPrompt(rawPrompt);

  useEffect(() => {
    if (isOpen) {
      setSelectedAnswer(null);
      setIsCorrect(false);
      setIsStoryMinimized(false);
      if (questionData && Array.isArray(questionData.options)) {
        // Fisher-Yates shuffle to randomize answer positions in the UI
        const opts = [...questionData.options];
        for (let i = opts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [opts[i], opts[j]] = [opts[j], opts[i]];
        }
        setShuffledOptions(opts);
      } else {
        setShuffledOptions([]);
      }
    }
  }, [isOpen, questionData]);

  const handleAnswerClick = (answer) => {
    if (selectedAnswer === null) {
      setSelectedAnswer(answer);

      if (serverScored) {
        // Server-scored mode: resolve optionId from _serverOptions and notify parent
        const serverOptions = questionData?._serverOptions || [];
        const matchedOption = serverOptions.find((o) => o.text === answer);
        const selectedOptionId = matchedOption?.optionId || answer;

        if (typeof onServerAnswer === 'function') {
          onServerAnswer(selectedOptionId);
        }

        // Close modal after brief pause (no local correctness indicator)
        setTimeout(() => {
          onRequestClose();
        }, 1200);
      } else {
        // Original local-scored mode
        const correct = answer === questionData.correct;
        setIsCorrect(correct);
        onQuestionAnswered(questionData.question, answer, correct);

        setTimeout(() => {
          onRequestClose();
        }, 1500);
      }
    }
  };

  const displayedOptions = shuffledOptions.length > 0 ? shuffledOptions : (questionData?.options || []);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Coin Collection Modal"
      ariaHideApp={false}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
      className="coin-modal"
      overlayClassName="coin-modal-overlay"
    >
      <div className="modal-content">
        {onRequestClose && (
          <button
            type="button"
            onClick={onRequestClose}
            aria-label="Tutup Modal"
            style={{
              position: "absolute",
              top: "14px",
              right: "18px",
              background: "transparent",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              color: "#94a3b8",
              fontWeight: 700
            }}
          >
            ✕
          </button>
        )}

        {hasStory && (
          <div className={`story-container ${isStoryMinimized ? 'story-container--minimized' : ''}`}>
            <div
              className="story-header"
              onClick={() => setIsStoryMinimized((v) => !v)}
              title={isStoryMinimized ? "Klik untuk membaca teks wacana" : "Klik untuk minimize agar pilihan jawaban lebih luas"}
            >
              <div className="story-title">
                <span className="story-icon">📖</span>
                <span className="story-label">
                  {isStoryMinimized
                    ? (/\|/i.test(story) ? "Deskripsi & Tabel Data (Diminimize)" : "Teks Bacaan Cerita (Diminimize)")
                    : (/\|/i.test(story) ? "📊 Deskripsi Soal & Data Tabel" : "Teks Wacana / Soal Cerita")}
                </span>
              </div>
              <button
                type="button"
                className="story-toggle-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsStoryMinimized((v) => !v);
                }}
                aria-expanded={!isStoryMinimized}
              >
                {isStoryMinimized ? "➕ Buka Bacaan" : "➖ Minimize Bacaan"}
              </button>
            </div>

            {!isStoryMinimized && (
              <>
                <div className="story-body">
                  {renderStructuredStory(story)}
                </div>
                <div className="story-footer">
                  <button
                    type="button"
                    className="story-minimize-hint"
                    onClick={() => setIsStoryMinimized(true)}
                  >
                    ▲ Sembunyikan Bacaan (Minimize agar pilihan jawaban terlihat jelas)
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {(questionData?.imageBase64 || questionData?.imageUrl || questionData?.imagePath) && (
          <div className="modal-diagram-container" style={{ margin: "10px 0", textAlign: "center" }}>
            <img
              src={(() => {
                if (questionData.imageBase64) {
                  return questionData.imageBase64.startsWith("data:")
                    ? questionData.imageBase64
                    : `data:image/png;base64,${questionData.imageBase64}`;
                }
                const raw = questionData.imageUrl || (questionData.imagePath ? `/uploads/ai-question-generator/images/${questionData.imagePath}` : "");
                if (raw.startsWith("http") || raw.startsWith("data:")) return raw;
                const backendBase = (process.env.REACT_APP_API_URL || "https://api.gamukis.site/api").replace(/\/api\/?$/, "");
                return `${backendBase}${raw.startsWith("/") ? "" : "/"}${raw}`;
              })()}
              alt="Diagram Soal"
              style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>
        )}

        <h2 className="modal-question-heading">
          <MathText text={hasStory ? question : (questionData?.question || "")} />
        </h2>

        {questionData?.interactionType === 'matrix_drag_drop' && questionData?.matrixData ? (
          <MatrixDragDropQuiz
            matrixData={questionData.matrixData}
            disabled={selectedAnswer !== null}
            onComplete={(correct) => {
              setIsCorrect(correct);
              setSelectedAnswer(correct ? 'Benar' : 'Salah');
              if (onServerAnswer && serverScored) {
                onServerAnswer(correct ? 'correct' : 'incorrect');
              } else if (onQuestionAnswered) {
                onQuestionAnswered(questionData.question, correct ? 'Benar' : 'Salah', correct);
                setTimeout(() => {
                  onRequestClose?.();
                }, 1800);
              }
            }}
          />
        ) : (
          <div className="options">
            {displayedOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerClick(option)}
                className={`option-button ${selectedAnswer !== null && selectedAnswer !== option ? 'blurred' : ''} ${selectedAnswer === option ? (!serverScored && isCorrect ? 'correct' : !serverScored ? 'incorrect' : 'selected') : ''}`}
                disabled={selectedAnswer !== null && selectedAnswer !== option}
              >
                <MathText text={option} />
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CoinModal;
