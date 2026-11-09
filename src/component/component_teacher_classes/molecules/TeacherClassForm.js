import { useState } from "react";
import "./TeacherClassForm.css";

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 1000;

const SUBJECT_OPTIONS = [
  { key: "matematika", label: "Matematika" },
  { key: "fisika", label: "Fisika" },
  { key: "kimia", label: "Kimia" },
  { key: "biologi", label: "Biologi" },
  { key: "informatika", label: "Informatika" },
  { key: "ekonomi", label: "Ekonomi" },
  { key: "geografi", label: "Geografi" },
  { key: "sosiologi", label: "Sosiologi" },
  { key: "sejarah", label: "Sejarah" },
  { key: "indonesia", label: "Bahasa Indonesia" },
  { key: "bahasa_inggris", label: "Bahasa Inggris" }
];

const getInitialSubjectKey = (initialValues) => {
  if (initialValues.subjectKey) return initialValues.subjectKey;
  return SUBJECT_OPTIONS.find((option) => option.label.toLowerCase() === String(initialValues.subject || '').trim().toLowerCase())?.key || "matematika";
};

const TeacherClassForm = ({
  initialValues = {},
  isSaving = false,
  onSave,
  onUploadCoverImage
}) => {
  const [title, setTitle] = useState(initialValues.title || "");
  const [subjectKey, setSubjectKey] = useState(() => getInitialSubjectKey(initialValues));
  const [gradeLevel, setGradeLevel] = useState(initialValues.gradeLevel || "");
  const [description, setDescription] = useState(initialValues.description || "");
  const [coverImageKey, setCoverImageKey] = useState(initialValues.coverImageKey || "");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError("");

    const trimmedTitle = title.trim();
    const selectedSubject = SUBJECT_OPTIONS.find((option) => option.key === subjectKey);
    const trimmedDesc = description.trim();

    if (!trimmedTitle) {
      setValidationError("Judul kelas wajib diisi.");
      return;
    }
    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      setValidationError(`Judul kelas maksimal ${MAX_TITLE_LENGTH} karakter.`);
      return;
    }
    if (!selectedSubject) {
      setValidationError("Mata pelajaran wajib dipilih.");
      return;
    }
    if (trimmedDesc.length > MAX_DESCRIPTION_LENGTH) {
      setValidationError(`Deskripsi kelas maksimal ${MAX_DESCRIPTION_LENGTH} karakter.`);
      return;
    }

    try {
      await onSave({
        title: trimmedTitle,
        subject: selectedSubject.label,
        subjectKey: selectedSubject.key,
        gradeLevel: gradeLevel.trim() || null,
        description: trimmedDesc,
        coverImageKey: coverImageKey.trim() || null
      });
    } catch (saveError) {
      setValidationError(saveError.message || "Gagal menyimpan detail kelas.");
    }
  };

  const handleCoverFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !onUploadCoverImage) return;
    setValidationError("");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const uploaded = await onUploadCoverImage({
            imageBase64: String(reader.result || ""),
            mimeType: file.type
          });
          if (uploaded?.imageKey) {
            setCoverImageKey(uploaded.imageKey);
          }
        } catch (err) {
          setValidationError(err.message || "Gagal mengunggah sampul kelas.");
        }
      };
      reader.readAsDataURL(file);
    } catch (uploadError) {
      setValidationError(uploadError.message || "Gagal memproses gambar.");
    }
  };

  return (
    <form className="teacher-class-form" onSubmit={handleSubmit} noValidate>
      <h3>Langkah 1: Detail Kelas</h3>

      {validationError ? (
        <div className="teacher-form-error" role="alert">
          {validationError}
        </div>
      ) : null}

      <div className="teacher-form-field">
        <label htmlFor="teacher-class-title">Judul Kelas *</label>
        <input
          id="teacher-class-title"
          type="text"
          maxLength={MAX_TITLE_LENGTH}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Contoh: Aljabar Linear Kelas X"
          required
        />
        <small>{title.length}/{MAX_TITLE_LENGTH} karakter</small>
      </div>

      <div className="teacher-form-row">
        <div className="teacher-form-field">
          <label htmlFor="teacher-class-subject">Mata Pelajaran *</label>
          <select
            id="teacher-class-subject"
            value={subjectKey}
            onChange={(event) => setSubjectKey(event.target.value)}
          >
            {SUBJECT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="teacher-form-field">
          <label htmlFor="teacher-class-grade">Tingkat / Kelas (Opsional)</label>
          <input
            id="teacher-class-grade"
            type="text"
            value={gradeLevel}
            onChange={(event) => setGradeLevel(event.target.value)}
            placeholder="Contoh: SMA Kelas 10"
          />
        </div>
      </div>

      <div className="teacher-form-field">
        <label htmlFor="teacher-class-description">Deskripsi Kelas</label>
        <textarea
          id="teacher-class-description"
          rows={4}
          maxLength={MAX_DESCRIPTION_LENGTH}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Ringkasan materi dan tujuan pembelajaran..."
        />
        <small>{description.length}/{MAX_DESCRIPTION_LENGTH} karakter</small>
      </div>

      <div className="teacher-form-field">
        <label htmlFor="teacher-class-cover">Gambar Sampul (Opsional, Maks 2 MB)</label>
        <input
          id="teacher-class-cover"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleCoverFileChange}
        />
        {coverImageKey ? (
          <small data-testid="cover-image-key">Tersimpan: {coverImageKey}</small>
        ) : null}
      </div>

      <div className="teacher-form-actions">
        <button type="submit" className="teacher-btn teacher-btn-primary" disabled={isSaving}>
          {isSaving ? "Menyimpan..." : "Simpan Draft Kelas"}
        </button>
      </div>
    </form>
  );
};

export default TeacherClassForm;
