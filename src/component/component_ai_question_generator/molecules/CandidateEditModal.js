import React, { useState, useEffect } from "react";
import TableStructurePreview from "./TableStructurePreview";
import "./CandidateEditModal.css";

const CandidateEditModal = ({
  isOpen,
  candidate,
  onClose,
  onSave
}) => {
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState(["", "", "", "", ""]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [subtestTitle, setSubtestTitle] = useState("");
  const [stimulusType, setStimulusType] = useState("concept");
  const [imageUrl, setImageUrl] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [interactionType, setInteractionType] = useState("single_choice");
  const [matrixData, setMatrixData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (candidate) {
      setPrompt(candidate.prompt || "");
      const opts = Array.isArray(candidate.options) && candidate.options.length >= 2
        ? [...candidate.options]
        : ["", "", "", "", ""];
      setOptions(opts);
      setCorrectOptionIndex(
        typeof candidate.correctOptionIndex === "number" ? candidate.correctOptionIndex : 0
      );
      setExplanation(candidate.explanation || "");
      setDifficulty(candidate.difficulty || "medium");
      setCategory(candidate.category || candidate.subtestTitle || "");
      setTopic(candidate.topic || "");
      setSubtestTitle(candidate.subtestTitle || candidate.category || "");
      setStimulusType(candidate.stimulusType || "concept");
      const existingImg = candidate.imageBase64 || candidate.imageUrl || candidate.imagePath || null;
      setImagePreview(existingImg);
      setImageBase64(candidate.imageBase64 || null);
      setImageUrl(candidate.imageUrl || "");
      setInteractionType(candidate.interactionType || "single_choice");
      setMatrixData(
        candidate.matrixData
          ? JSON.parse(JSON.stringify(candidate.matrixData))
          : null
      );
      setError(null);
    }
  }, [candidate, isOpen]);

  if (!isOpen || !candidate) return null;

  const handleOptionChange = (idx, value) => {
    const updated = [...options];
    updated[idx] = value;
    setOptions(updated);
  };

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (idx) => {
    if (options.length > 2) {
      const updated = options.filter((_, i) => i !== idx);
      setOptions(updated);
      if (correctOptionIndex >= updated.length) {
        setCorrectOptionIndex(updated.length - 1);
      }
    }
  };

  const handleMatrixChange = (field, value) => {
    setMatrixData((prev) => {
      const current = prev || { columns: ["Benar", "Salah"], statements: [] };
      if (field === "statements" && Array.isArray(value)) {
        const cols = current.columns || ["Benar", "Salah"];
        const normalizedStatements = value.map((stmt, idx) => {
          const textVal = stmt?.statement ?? stmt?.text ?? "";
          const keyVal = stmt?.expectedKey ?? stmt?.correctCategory ?? (typeof stmt?.categoryIndex === "number" ? (cols[stmt.categoryIndex]?.key || cols[stmt.categoryIndex] || "Benar") : "Benar");
          return {
            ...stmt,
            id: stmt?.id || `stmt_${idx + 1}`,
            statement: textVal,
            expectedKey: keyVal,
            correctCategory: keyVal
          };
        });
        return { ...current, statements: normalizedStatements };
      }
      return { ...current, [field]: value };
    });
  };

  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type || !file.type.startsWith("image/")) {
      setError("File harus berupa gambar (PNG, JPG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setImageBase64(reader.result);
      setImageUrl("");
      setStimulusType("image");
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    processImageFile(file);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setImageUrl("");
    if (stimulusType === "image" || stimulusType === "soal_bergambar") {
      setStimulusType("concept");
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          break;
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length < 8) {
      setError("Teks soal minimal 8 karakter.");
      return;
    }

    const trimmedOptions = options.map((opt) => opt.trim());
    if (trimmedOptions.some((opt) => !opt)) {
      setError("Semua pilihan jawaban harus diisi dan tidak boleh kosong.");
      return;
    }

    if (correctOptionIndex < 0 || correctOptionIndex >= trimmedOptions.length) {
      setError("Pilih salah satu kunci jawaban yang benar.");
      return;
    }

    const payload = {
      prompt: trimmedPrompt,
      options: trimmedOptions,
      correctOptionIndex,
      explanation: explanation.trim() || "Penjelasan telah diperbarui oleh Admin.",
      difficulty,
      category: category.trim() || undefined,
      topic: topic.trim() || undefined,
      subtestTitle: subtestTitle.trim() || category.trim() || undefined,
      stimulusType,
      imageUrl: imageUrl || null,
      imageBase64: imageBase64 || null,
      interactionType,
      matrixData: interactionType === "matrix_drag_drop" ? matrixData : undefined
    };

    try {
      setSaving(true);
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || "Gagal menyimpan perubahan kandidat soal.");
    } finally {
      setSaving(false);
    }
  };

  const optionLetters = ["A", "B", "C", "D", "E"];

  return (
    <div className="candidate-edit-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="candidate-edit-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="candidate-edit-modal-header">
          <div className="candidate-edit-header-title">
            <span className="candidate-edit-header-icon">✏️</span>
            <div>
              <h3>Koreksi Parameter Soal (Human-in-the-Loop)</h3>
              <p>Perbaiki teks soal, kunci jawaban OCR, diagram foto, atau struktur matriks sebelum dipublikasikan.</p>
            </div>
          </div>
          <button
            type="button"
            className="candidate-edit-close-btn"
            onClick={onClose}
            aria-label="Tutup modal"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="candidate-edit-alert-error" role="alert">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="candidate-edit-form">
          <div className="candidate-edit-body">
            {/* 1. Baris Meta & Kategori */}
            <div className="candidate-edit-row-meta">
              <div className="candidate-edit-form-group">
                <label>Kategori / Subtes</label>
                <input
                  type="text"
                  value={subtestTitle}
                  onChange={(e) => {
                    setSubtestTitle(e.target.value);
                    setCategory(e.target.value);
                  }}
                  placeholder="Contoh: Literasi Bahasa Indonesia, Penalaran Umum..."
                  className="candidate-edit-input"
                />
              </div>

              <div className="candidate-edit-form-group">
                <label>Tingkat Kesulitan</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="candidate-edit-select"
                >
                  <option value="easy">Mudah (Easy)</option>
                  <option value="medium">Sedang (Medium)</option>
                  <option value="hard">Sulit (Hard)</option>
                </select>
              </div>

              <div className="candidate-edit-form-group">
                <label>Tipe Interaksi</label>
                <select
                  value={interactionType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setInteractionType(newType);
                    if (newType === "matrix_drag_drop" && !matrixData) {
                      setMatrixData({
                        columns: ["Benar", "Salah"],
                        statements: [
                          { statement: "Pernyataan 1", expectedKey: "Benar" },
                          { statement: "Pernyataan 2", expectedKey: "Salah" }
                        ]
                      });
                    }
                  }}
                  className="candidate-edit-select"
                >
                  <option value="single_choice">Pilihan Ganda Biasa (A-E)</option>
                  <option value="matrix_drag_drop">Matriks Tabel (Benar / Salah)</option>
                </select>
              </div>
            </div>

            {/* 2. Teks Soal / Pertanyaan */}
            <div className="candidate-edit-form-group">
              <label>
                Teks Soal / Prompt Pertanyaan
                <span className="candidate-edit-field-hint">
                  (Dapat memuat teks cerita wacana atau nomor soal)
                </span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                className="candidate-edit-textarea"
                placeholder="Tuliskan butir soal di sini..."
                required
              />
            </div>

            {/* 3. Foto Diagram / Stimulus Visual Uploader */}
            <div className="candidate-edit-form-group">
              <label>
                Foto / Diagram Soal (Visual Stimulus)
                <span className="candidate-edit-field-hint">
                  (Opsional: Seret & letakkan, pilih gambar, atau tekan Ctrl+V untuk menempel)
                </span>
              </label>
              <div
                className={`candidate-photo-dropzone ${isDragging ? "candidate-photo-dropzone--dragging" : ""}`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPaste={handlePaste}
                tabIndex={0}
                role="region"
                aria-label="Area Unggah Diagram Soal"
              >
                {imagePreview ? (
                  <div className="candidate-photo-preview-box">
                    <img src={imagePreview} alt="Pratinjau Diagram Soal" className="candidate-photo-thumb" />
                    <div className="candidate-photo-actions">
                      <label className="candidate-photo-replace-btn">
                        Ganti Foto
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleImageChange}
                          style={{ display: "none" }}
                        />
                      </label>
                      <button
                        type="button"
                        className="candidate-photo-remove-btn"
                        onClick={handleClearImage}
                      >
                        Hapus Foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="candidate-photo-upload-label">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                    />
                    <span className="candidate-photo-icon" aria-hidden="true">
                      {isDragging ? "📥" : "🖼️"}
                    </span>
                    <span style={{ fontWeight: 600, color: isDragging ? "#2563eb" : "#334155" }}>
                      {isDragging ? "Lepaskan Foto Diagram Di Sini!" : "Seret & Letakkan Diagram, atau Klik Telusuri"}
                    </span>
                    <small style={{ color: "#94a3b8" }}>
                      Mendukung Drag-and-Drop, File Gambar, atau Ctrl+V Screenshot Snipping Tool (Maks 5MB)
                    </small>
                  </label>
                )}
              </div>
            </div>

            {/* 4. Pilihan Jawaban A s/d E */}
            <div className="candidate-edit-options-section">
              <div className="candidate-edit-options-header">
                <label>Pilihan Jawaban & Kunci Benar (Klik radio untuk menandai kunci)</label>
                {options.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="candidate-edit-add-option-btn"
                  >
                    + Tambah Opsi
                  </button>
                )}
              </div>

              <div className="candidate-edit-options-list">
                {options.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`candidate-edit-option-item ${correctOptionIndex === idx ? "is-correct" : ""}`}
                  >
                    <label className="candidate-edit-radio-label">
                      <input
                        type="radio"
                        name="correctAnswerOption"
                        checked={correctOptionIndex === idx}
                        onChange={() => setCorrectOptionIndex(idx)}
                      />
                      <span className="candidate-edit-opt-letter">
                        {optionLetters[idx] || idx + 1}
                      </span>
                    </label>

                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Pilihan ${optionLetters[idx] || idx + 1}...`}
                      className="candidate-edit-option-input"
                      required
                    />

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="candidate-edit-remove-option-btn"
                        title="Hapus opsi ini"
                        aria-label={`Hapus pilihan ${optionLetters[idx] || idx + 1}`}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Matriks Tabel Jika Tipe Matrix */}
            {interactionType === "matrix_drag_drop" && (
              <div className="candidate-edit-matrix-section">
                <div className="candidate-edit-matrix-header">
                  <h4>📊 Struktur Matriks Tabel Interaktif</h4>
                  <p>Sesuaikan kolom dan pernyataan baris untuk interaksi drag-and-drop siswa.</p>
                </div>
                <TableStructurePreview
                  matrixData={matrixData}
                  isEditable={true}
                  onRowChange={(statements) => handleMatrixChange("statements", statements)}
                  onColumnChange={(columns) => handleMatrixChange("columns", columns)}
                />
              </div>
            )}

            {/* 6. Pembahasan */}
            <div className="candidate-edit-form-group">
              <label>Pembahasan Soal / Kunci Penjelasan</label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={3}
                className="candidate-edit-textarea"
                placeholder="Tuliskan pembahasan atau alasan jawaban yang benar..."
              />
            </div>
          </div>

          <div className="candidate-edit-modal-footer">
            <button
              type="button"
              className="candidate-edit-btn-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="submit"
              className="candidate-edit-btn-save"
              disabled={saving}
            >
              {saving ? "Menyimpan Koreksi..." : "💾 Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CandidateEditModal;
