import React, { useState } from "react";
import "./QuestionEditor.css";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;
const MAX_QUESTIONS = 50;

export const QUESTION_TYPES = [
  {
    value: "multiple_choice",
    label: "Pilihan Ganda",
    badge: "Pilihan Ganda",
    description: "Siswa memilih 1 jawaban benar dari beberapa opsi (A–E)."
  },
  {
    value: "drag_drop",
    label: "Drag and Drop Jawaban",
    badge: "Drag & Drop",
    description: "Siswa menyeret atau memasangkan kartu jawaban ke pernyataan / target yang sesuai."
  },
  {
    value: "short_text",
    label: "Mengisi Jawaban dengan Tulisan",
    badge: "Isian Tulisan",
    description: "Siswa mengetik jawaban singkat dan dinilai otomatis sesuai kunci jawaban."
  }
];

export const getQuestionTypeBadge = (type) => {
  const found = QUESTION_TYPES.find((item) => item.value === (type || "multiple_choice"));
  return found ? found.badge : "Pilihan Ganda";
};

const createInitialDragDropItems = () => [
  { slotLabel: "", answerText: "" },
  { slotLabel: "", answerText: "" },
  { slotLabel: "", answerText: "" }
];

const QuestionEditor = ({
  questions = [],
  isSaving = false,
  onAddQuestion,
  onDeleteQuestion,
  onUploadImage,
  onUpdateQuestion
}) => {
  const [editingId, setEditingId] = useState(null);
  const [questionType, setQuestionType] = useState("multiple_choice");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [dragDropItems, setDragDropItems] = useState(createInitialDragDropItems);
  const [primaryTextAnswer, setPrimaryTextAnswer] = useState("");
  const [alternateTextAnswers, setAlternateTextAnswers] = useState("");
  const [explanation, setExplanation] = useState("");
  const [points, setPoints] = useState(10);
  const [imageKey, setImageKey] = useState("");
  const [imageAltText, setImageAltText] = useState("");
  const [error, setError] = useState("");

  const handleOptionChange = (index, value) => {
    setOptions((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const addOptionSlot = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, ""]);
  };

  const removeOptionSlot = (index) => {
    if (options.length <= MIN_OPTIONS) return;
    const next = options.filter((_, idx) => idx !== index);
    setOptions(next);
    if (correctOptionIndex >= next.length) {
      setCorrectOptionIndex(0);
    }
  };

  const handleDragDropChange = (index, field, value) => {
    setDragDropItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const addDragDropSlot = () => {
    if (dragDropItems.length >= MAX_OPTIONS) return;
    setDragDropItems((prev) => [...prev, { slotLabel: "", answerText: "" }]);
  };

  const removeDragDropSlot = (index) => {
    if (dragDropItems.length <= MIN_OPTIONS) return;
    setDragDropItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleImageFile = (event) => {
    const file = event.target.files?.[0];
    if (!file || !onUploadImage) return;
    setError("");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await onUploadImage({
          imageBase64: String(reader.result || ""),
          mimeType: file.type
        });
        if (result?.imageKey) {
          setImageKey(result.imageKey);
        }
      } catch (uploadError) {
        setError(uploadError.message || "Gagal mengunggah gambar soal.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (questions.length >= MAX_QUESTIONS) {
      setError(`Maksimal ${MAX_QUESTIONS} soal per kelas.`);
      return;
    }

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError("Teks pertanyaan wajib diisi.");
      return;
    }

    if (imageKey && !imageAltText.trim()) {
      setError("Teks alternatif (alt text) wajib diisi untuk gambar soal demi aksesibilitas.");
      return;
    }

    let questionPayload = {
      questionType,
      prompt: trimmedPrompt,
      explanation: explanation.trim() || null,
      points: Math.max(1, Number(points) || 10),
      imageKey: imageKey || null,
      imageAltText: imageAltText.trim() || null
    };

    if (questionType === "drag_drop") {
      const cleanedPairs = dragDropItems.map((pair) => ({
        slotLabel: String(pair.slotLabel || "").trim(),
        answerText: String(pair.answerText || "").trim()
      }));
      if (cleanedPairs.length < MIN_OPTIONS || cleanedPairs.length > MAX_OPTIONS) {
        setError(`Jumlah pasangan drag and drop harus antara ${MIN_OPTIONS} hingga ${MAX_OPTIONS}.`);
        return;
      }
      if (cleanedPairs.some((pair) => !pair.slotLabel || !pair.answerText)) {
        setError("Semua pernyataan target dan jawaban drag and drop wajib diisi.");
        return;
      }
      questionPayload = {
        ...questionPayload,
        dragDropItems: cleanedPairs,
        options: cleanedPairs.map((pair) => pair.answerText),
        correctOptionIndex: 0
      };
    } else if (questionType === "short_text") {
      const mainAnswer = primaryTextAnswer.trim();
      if (!mainAnswer) {
        setError("Kunci jawaban tulisan utama wajib diisi.");
        return;
      }
      const alternates = alternateTextAnswers
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const acceptedAnswers = Array.from(new Set([mainAnswer, ...alternates]));
      questionPayload = {
        ...questionPayload,
        acceptedAnswers,
        options: acceptedAnswers.length >= 2 ? acceptedAnswers.slice(0, 5) : [mainAnswer, mainAnswer],
        correctOptionIndex: 0
      };
    } else {
      const cleanedOptions = options.map((opt) => opt.trim());
      if (cleanedOptions.length < MIN_OPTIONS || cleanedOptions.length > MAX_OPTIONS) {
        setError(`Jumlah pilihan jawaban harus antara ${MIN_OPTIONS} hingga ${MAX_OPTIONS}.`);
        return;
      }
      if (cleanedOptions.some((opt) => !opt)) {
        setError("Semua pilihan jawaban wajib diisi.");
        return;
      }
      if (correctOptionIndex < 0 || correctOptionIndex >= cleanedOptions.length) {
        setError("Pilih tepat satu jawaban yang benar.");
        return;
      }
      questionPayload = {
        ...questionPayload,
        options: cleanedOptions,
        correctOptionIndex: Number(correctOptionIndex)
      };
    }

    try {
      if (editingId && onUpdateQuestion) {
        await onUpdateQuestion(editingId, questionPayload);
      } else {
        await onAddQuestion(questionPayload);
      }
      handleCancelEdit();
    } catch (submitError) {
      setError(submitError.message || (editingId ? "Gagal memperbarui soal." : "Gagal menambahkan soal."));
    }
  };

  const handleStartEdit = (q) => {
    setEditingId(q.id || null);
    setQuestionType(q.questionType || "multiple_choice");
    setPrompt(q.prompt || "");
    const qOptions = Array.isArray(q.options) && q.options.length >= 2
      ? q.options.map((o) => (typeof o === "string" ? o : o?.text || o?.option_text || ""))
      : ["", "", "", ""];
    setOptions(qOptions);
    setCorrectOptionIndex(typeof q.correctOptionIndex === "number" ? q.correctOptionIndex : 0);
    setExplanation(q.explanation || "");
    setPoints(typeof q.points === "number" ? q.points : 10);
    setImageKey(q.imageKey || "");
    setImageAltText(q.imageAltText || "");
    if (q.questionType === "drag_drop" && Array.isArray(q.dragDropItems) && q.dragDropItems.length >= 2) {
      setDragDropItems(q.dragDropItems);
    }
    if (q.questionType === "short_text") {
      setPrimaryTextAnswer(q.correctTextAnswer || "");
      setAlternateTextAnswers(Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers.join(", ") : "");
    }
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setPrompt("");
    setOptions(["", "", "", ""]);
    setCorrectOptionIndex(0);
    setDragDropItems(createInitialDragDropItems());
    setPrimaryTextAnswer("");
    setAlternateTextAnswers("");
    setExplanation("");
    setPoints(10);
    setImageKey("");
    setImageAltText("");
    setError("");
  };

  return (
    <div className="question-editor-panel">
      <div className="question-editor-header">
        <h3>
          {editingId ? `Langkah 2: Edit Soal (${questions.length}/${MAX_QUESTIONS})` : `Langkah 2: Daftar Soal Kuis (${questions.length}/${MAX_QUESTIONS})`}
        </h3>
      </div>

      {error ? (
        <div className="question-editor-error" role="alert">
          {error}
        </div>
      ) : null}

      <form className="question-editor-form" onSubmit={handleSubmit} noValidate>
        <div className="question-field">
          <label htmlFor="question-type-select">Tipe Soal Kuis *</label>
          <div
            className="question-type-selector"
            role="radiogroup"
            aria-label="Pilih tipe soal kuis"
            data-testid="question-type-selector"
          >
            {QUESTION_TYPES.map((typeOption) => {
              const isSelected = questionType === typeOption.value;
              return (
                <button
                  key={typeOption.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  data-testid={`question-type-option-${typeOption.value}`}
                  className={`question-type-card ${isSelected ? "active" : ""}`}
                  onClick={() => {
                    setError("");
                    setQuestionType(typeOption.value);
                  }}
                >
                  <span className="question-type-card-title">{typeOption.label}</span>
                  <span className="question-type-card-desc">{typeOption.description}</span>
                </button>
              );
            })}
          </div>
          <select
            id="question-type-select"
            className="question-type-native-select"
            value={questionType}
            onChange={(event) => {
              setError("");
              setQuestionType(event.target.value);
            }}
            aria-label="Opsi pilih tipe soal kuis"
          >
            {QUESTION_TYPES.map((typeOption) => (
              <option key={typeOption.value} value={typeOption.value}>
                {typeOption.label}
              </option>
            ))}
          </select>
        </div>

        <div className="question-field">
          <label htmlFor="question-prompt">Pertanyaan *</label>
          <textarea
            id="question-prompt"
            rows={3}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={
              questionType === "drag_drop"
                ? "Tulis instruksi soal drag and drop (contoh: Pasangkan besaran fisika berikut dengan satuannya)..."
                : questionType === "short_text"
                ? "Tulis pertanyaan isian singkat di sini..."
                : "Tulis pertanyaan pilihan ganda di sini..."
            }
          />
        </div>

        {questionType === "multiple_choice" && (
          <div className="question-options-group" role="group" aria-label="Pilihan jawaban dan kunci">
            <p className="question-options-title">Pilihan Jawaban (Pilih 1 jawaban benar) *</p>
            {options.map((optionText, index) => (
              <div key={index} className="question-option-row">
                <input
                  type="radio"
                  id={`correct-option-${index}`}
                  name="correctOptionIndex"
                  checked={correctOptionIndex === index}
                  onChange={() => setCorrectOptionIndex(index)}
                  aria-label={`Tandai pilihan ${index + 1} sebagai jawaban benar`}
                />
                <input
                  type="text"
                  value={optionText}
                  onChange={(event) => handleOptionChange(index, event.target.value)}
                  placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                  aria-label={`Teks pilihan ${index + 1}`}
                />
                {options.length > MIN_OPTIONS && (
                  <button
                    type="button"
                    className="question-option-remove"
                    onClick={() => removeOptionSlot(index)}
                  >
                    Hapus
                  </button>
                )}
              </div>
            ))}
            {options.length < MAX_OPTIONS && (
              <button type="button" className="teacher-btn teacher-btn-outline" onClick={addOptionSlot}>
                + Tambah Pilihan Jawaban
              </button>
            )}
          </div>
        )}

        {questionType === "drag_drop" && (
          <div
            className="question-options-group question-dragdrop-group"
            role="group"
            aria-label="Pasangan pernyataan dan jawaban drag and drop"
            data-testid="drag-drop-editor-group"
          >
            <p className="question-options-title">
              Pasangan Target &amp; Jawaban Drag and Drop (2–5 Pasangan) *
            </p>
            <p className="question-options-hint">
              Kartu jawaban di kolom kanan akan diacak secara otomatis saat ditampilkan kepada siswa.
            </p>
            {dragDropItems.map((pair, index) => (
              <div key={index} className="question-dragdrop-row">
                <span className="question-dragdrop-badge">#{index + 1}</span>
                <input
                  type="text"
                  value={pair.slotLabel}
                  onChange={(event) => handleDragDropChange(index, "slotLabel", event.target.value)}
                  placeholder={`Pernyataan / Slot Target ${index + 1}`}
                  aria-label={`Pernyataan target drag and drop ${index + 1}`}
                />
                <span className="question-dragdrop-arrow" aria-hidden="true">
                  ↔
                </span>
                <input
                  type="text"
                  value={pair.answerText}
                  onChange={(event) => handleDragDropChange(index, "answerText", event.target.value)}
                  placeholder={`Kartu Jawaban ${index + 1}`}
                  aria-label={`Jawaban drag and drop ${index + 1}`}
                />
                {dragDropItems.length > MIN_OPTIONS && (
                  <button
                    type="button"
                    className="question-option-remove"
                    onClick={() => removeDragDropSlot(index)}
                  >
                    Hapus
                  </button>
                )}
              </div>
            ))}
            {dragDropItems.length < MAX_OPTIONS && (
              <button type="button" className="teacher-btn teacher-btn-outline" onClick={addDragDropSlot}>
                + Tambah Pasangan Drag &amp; Drop
              </button>
            )}
          </div>
        )}

        {questionType === "short_text" && (
          <div
            className="question-options-group question-shorttext-group"
            role="group"
            aria-label="Kunci jawaban isian tulisan"
            data-testid="short-text-editor-group"
          >
            <div className="question-field">
              <label htmlFor="question-short-text-primary">Kunci Jawaban Tulisan Utama *</label>
              <input
                id="question-short-text-primary"
                type="text"
                value={primaryTextAnswer}
                onChange={(event) => setPrimaryTextAnswer(event.target.value)}
                placeholder="Contoh: Fotosintesis"
                aria-label="Kunci jawaban tulisan utama"
              />
            </div>
            <div className="question-field">
              <label htmlFor="question-short-text-alternates">
                Alternatif Jawaban yang Diterima (Opsional, pisahkan dengan koma)
              </label>
              <input
                id="question-short-text-alternates"
                type="text"
                value={alternateTextAnswers}
                onChange={(event) => setAlternateTextAnswers(event.target.value)}
                placeholder="Contoh: proses fotosintesis, reaksi fotosintesis"
                aria-label="Alternatif jawaban tulisan"
              />
              <small className="question-options-hint">
                Pemeriksaan jawaban tidak membedakan huruf besar/kecil (case-insensitive).
              </small>
            </div>
          </div>
        )}

        <div className="question-meta-row">
          <div className="question-field">
            <label htmlFor="question-points">Poin Soal *</label>
            <input
              id="question-points"
              type="number"
              min={1}
              max={100}
              value={points}
              onChange={(event) => setPoints(event.target.value)}
            />
          </div>

          <div className="question-field">
            <label htmlFor="question-image">Gambar Soal (Opsional, PNG/JPG/WEBP)</label>
            <input
              id="question-image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageFile}
            />
          </div>

          {imageKey ? (
            <div className="question-field">
              <label htmlFor="question-image-alt">Alt Text Gambar *</label>
              <input
                id="question-image-alt"
                type="text"
                value={imageAltText}
                onChange={(event) => setImageAltText(event.target.value)}
                placeholder="Deskripsi gambar untuk pembaca layar"
              />
            </div>
          ) : null}
        </div>

        <div className="question-field">
          <label htmlFor="question-explanation">Pembahasan (Ditampilkan setelah siswa mengumpulkan)</label>
          <textarea
            id="question-explanation"
            rows={2}
            value={explanation}
            onChange={(event) => setExplanation(event.target.value)}
            placeholder="Penjelasan mengapa jawaban tersebut benar..."
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <button type="submit" className="teacher-btn teacher-btn-primary" disabled={isSaving} style={{ flex: 1 }}>
            {isSaving ? "Menyimpan Soal..." : editingId ? "✓ Simpan Perubahan Soal" : "+ Simpan Soal ke Kelas"}
          </button>
          {editingId && (
            <button
              type="button"
              className="teacher-btn teacher-btn-outline"
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              Batal Edit
            </button>
          )}
        </div>
      </form>

      <div className="question-saved-list" aria-label="Daftar soal tersimpan">
        {questions.length === 0 ? (
          <p className="question-empty">Belum ada soal. Tambahkan minimal 1 soal sebelum mempublikasikan kelas.</p>
        ) : (
          questions.map((q, index) => (
            <article key={q.id || index} className="question-saved-item">
              <div className="question-saved-top">
                <div className="question-saved-title-group">
                  <strong>
                    Soal #{index + 1} ({q.points || 10} poin)
                  </strong>
                  <span className={`question-saved-type-badge type-${q.questionType || "multiple_choice"}`}>
                    {getQuestionTypeBadge(q.questionType)}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {onUpdateQuestion && (
                    <button
                      type="button"
                      className="teacher-btn teacher-btn-outline"
                      onClick={() => handleStartEdit(q)}
                      title="Edit parameter soal ini"
                      data-testid={`edit-teacher-question-${index}`}
                    >
                      ✏️ Edit
                    </button>
                  )}
                  {onDeleteQuestion && (
                    <button
                      type="button"
                      className="teacher-btn teacher-btn-danger"
                      onClick={() => onDeleteQuestion(q.id)}
                    >
                      Hapus Soal
                    </button>
                  )}
                </div>
              </div>
              <p>{q.prompt}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default QuestionEditor;
