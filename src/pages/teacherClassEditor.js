import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getManualUser } from "../database/manualAuth";
import {
  addTeacherQuestion,
  createTeacherClass,
  deleteTeacherQuestion,
  getTeacherClassById,
  isApprovedGuruUser,
  publishTeacherClass,
  rotateTeacherJoinCode,
  syncCurrentAccountRole,
  updateTeacherClass,
  updateTeacherQuestion,
  uploadTeacherClassImage
} from "../database/teacherClassApi";
import TeacherClassForm from "../component/component_teacher_classes/molecules/TeacherClassForm";
import QuestionEditor from "../component/component_teacher_classes/molecules/QuestionEditor";
import ClassPreview from "../component/component_teacher_classes/molecules/ClassPreview";
import GamukisLogo from "../images/gamukis_vector.png";
import CharacterArt from "../images/gamukis editor kelas guru.png";
import "../component/component_teacher_classes/TeacherClasses.css";

const STEPS = [
  { id: "details", label: "1. Detail Kelas" },
  { id: "questions", label: "2. Soal Kuis" },
  { id: "preview", label: "3. Pratinjau" },
  { id: "publish", label: "4. Publikasikan" }
];

const isAuthorizedAuthorRole = (role) =>
  role === "guru" || role === "admin" || role === "administrator";

const getUserRole = (user) => {
  const direct = String(user?.role || user?.userRole || user?.profile?.role || "").toLowerCase();
  if (isAuthorizedAuthorRole(direct)) return direct;
  if (typeof isApprovedGuruUser === "function" && isApprovedGuruUser(user)) return "guru";
  if (direct) return direct;
  if (String(user?.teacherApplication?.status || "").toLowerCase() === "approved") return "guru";
  return "";
};

const TeacherClassEditor = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getManualUser());
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => !isAuthorizedAuthorRole(getUserRole(getManualUser())));
  const [activeStep, setActiveStep] = useState("details");
  const [classItem, setClassItem] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(classId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const role = getUserRole(user);

  useEffect(() => {
    let isCurrent = true;

    const initEditor = async () => {
      let currentUser = user;
      if (!isAuthorizedAuthorRole(getUserRole(currentUser)) && typeof syncCurrentAccountRole === "function") {
        try {
          const synced = await syncCurrentAccountRole();
          if (!isCurrent) return;
          if (synced) {
            currentUser = synced;
            setUser(synced);
          }
        } catch (_) {
          // ignore
        }
      }
      if (!isCurrent) return;
      setIsCheckingAuth(false);

      if (!classId || !isAuthorizedAuthorRole(getUserRole(currentUser))) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const loaded = await getTeacherClassById(classId);
        if (!isCurrent) return;
        setClassItem(loaded);
        setQuestions(Array.isArray(loaded?.questions) ? loaded.questions : []);
      } catch (loadError) {
        if (!isCurrent) return;
        setError(loadError.message || "Gagal memuat detail kelas.");
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    initEditor();

    return () => {
      isCurrent = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  if (isCheckingAuth) {
    return (
      <main className="teacher-dashboard-message">
        <p>Memverifikasi akses Guru...</p>
      </main>
    );
  }

  if (!user || !isAuthorizedAuthorRole(role)) {
    return (
      <main className="teacher-dashboard-message" data-testid="teacher-editor-forbidden">
        <h1>Akses Editor Kelas Ditolak</h1>
        <p>Halaman pembuatan kelas hanya tersedia untuk akun Guru yang telah disetujui.</p>
        <button type="button" className="teacher-btn teacher-btn-primary" onClick={() => navigate("/login")}>
          Kembali
        </button>
      </main>
    );
  }

  const handleSaveMetadata = async (payload) => {
    setIsSaving(true);
    setError("");
    setStatusMessage("");
    try {
      if (classItem?.id) {
        const updated = await updateTeacherClass(classItem.id, payload);
        setClassItem(updated);
        setQuestions(Array.isArray(updated?.questions) ? updated.questions : questions);
        setStatusMessage("Perubahan kelas berhasil disimpan.");
      } else {
        const created = await createTeacherClass(payload);
        setClassItem(created);
        setQuestions(Array.isArray(created?.questions) ? created.questions : []);
        setStatusMessage("Draft kelas berhasil dibuat.");
        setActiveStep("questions");
      }
    } catch (saveError) {
      setError(saveError.message || "Gagal menyimpan kelas. Draft belum tersimpan.");
      throw saveError;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuestion = async (questionPayload) => {
    if (!classItem?.id) {
      throw new Error("Simpan detail kelas terlebih dahulu sebelum menambahkan soal.");
    }
    setIsSaving(true);
    setError("");
    setStatusMessage("");
    try {
      const createdQuestion = await addTeacherQuestion(classItem.id, questionPayload);
      setQuestions((prev) => [...prev, createdQuestion]);
      setStatusMessage("Soal pilihan ganda berhasil ditambahkan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateQuestion = async (questionId, questionPayload) => {
    if (!classItem?.id) return;
    setIsSaving(true);
    setError("");
    setStatusMessage("");
    try {
      const updated = await updateTeacherQuestion(classItem.id, questionId, questionPayload);
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, ...updated } : q))
      );
      setStatusMessage("Soal kuis berhasil diperbarui.");
    } catch (err) {
      setError(err.message || "Gagal memperbarui soal.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!classItem?.id) return;
    setError("");
    try {
      await deleteTeacherQuestion(classItem.id, questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      setStatusMessage("Soal dihapus dari kelas.");
    } catch (delError) {
      setError(delError.message || "Gagal menghapus soal.");
    }
  };

  const handlePublish = async () => {
    if (!classItem?.id) return;
    setIsSaving(true);
    setError("");
    setStatusMessage("");
    try {
      const published = await publishTeacherClass(classItem.id);
      setClassItem(published);
      setStatusMessage(`Kelas berhasil dipublikasikan! Kode Join: ${published.joinCode}`);
    } catch (pubError) {
      setError(pubError.message || "Gagal mempublikasikan kelas.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRotateCode = async () => {
    if (!classItem?.id) return;
    setIsSaving(true);
    setError("");
    try {
      const rotated = await rotateTeacherJoinCode(classItem.id);
      setClassItem(rotated);
      setStatusMessage(`Kode join baru: ${rotated.joinCode}`);
    } catch (rotError) {
      setError(rotError.message || "Gagal memutar kode join.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="teacher-editor-page" data-testid="teacher-editor-root">
      <div className="teacher-editor-layout">
        <aside className="teacher-editor-art-side" aria-hidden="true">
          <img src={GamukisLogo} alt="GAMUKIS Logo" className="teacher-editor-logo" />
          <img
            src={CharacterArt}
            alt="Gamukis Editor Kelas Guru"
            className="teacher-editor-character"
          />
          <div className="teacher-editor-circle teacher-editor-circle-navy">
            <div className="teacher-editor-circle teacher-editor-circle-cream" />
          </div>
        </aside>

        <div className="teacher-editor-right">
          <main className="teacher-editor-card">
          <header className="teacher-editor-header">
            <div className="teacher-editor-title-group">
              <p className="teacher-classes-eyebrow">EDITOR KELAS GURU</p>
              <h1>{classItem?.title || "Buat Kelas Baru"}</h1>
              <span data-testid="editor-class-status" className="teacher-editor-status">
                Status:{" "}
                <span className={`teacher-editor-status-pill status-${classItem?.status || "draft"}`}>
                  {classItem?.status || "draft"}
                </span>
                {!classItem?.status && <strong style={{ display: "none" }}> (belum disimpan)</strong>}
              </span>
            </div>
            <button type="button" className="teacher-btn teacher-btn-outline teacher-btn-back" onClick={() => navigate("/guru/dashboard")}>
              Kembali ke Dashboard Guru
            </button>
          </header>

          <nav
            aria-label="Langkah pembuatan kelas"
            className="teacher-editor-steps"
          >
            {STEPS.map((step) => (
              <button
                key={step.id}
                type="button"
                className={`teacher-step-btn ${activeStep === step.id ? "active teacher-btn-primary" : "teacher-btn-outline"}`}
                onClick={() => setActiveStep(step.id)}
                disabled={step.id !== "details" && !classItem?.id}
              >
                {step.label}
              </button>
            ))}
          </nav>

      {error ? (
        <div
          role="alert"
          className="teacher-classes-alert"
        >
          {error}
        </div>
      ) : null}

      {statusMessage ? (
        <div
          role="status"
          className="teacher-editor-status-banner"
        >
          {statusMessage}
        </div>
      ) : null}

      {isLoading ? (
        <p>Memuat data kelas...</p>
      ) : (
        <>
          {activeStep === "details" && (
            <TeacherClassForm
              initialValues={classItem || {}}
              isSaving={isSaving}
              onSave={handleSaveMetadata}
              onUploadCoverImage={uploadTeacherClassImage}
            />
          )}

          {activeStep === "questions" && (
            <>
              <QuestionEditor
                questions={questions}
                isSaving={isSaving}
                onAddQuestion={handleAddQuestion}
                onUpdateQuestion={handleUpdateQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onUploadImage={uploadTeacherClassImage}
              />
              {classItem?.id && (
                <section aria-label="AI Buat Soal" style={{ marginTop: "16px", padding: "14px 18px", border: "1px dashed #93c5fd", borderRadius: "10px", background: "#eff6ff" }}>
                  <h3 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 700, color: "#1e40af" }}>Buat Soal dengan AI</h3>
                  <p style={{ margin: "0 0 10px", fontSize: "0.88rem", color: "#374151" }}>
                    Upload materi PDF dan biarkan AI membuat draf soal pilihan ganda untuk kelas ini.
                  </p>
                  <button
                    type="button"
                    className="teacher-btn teacher-btn-outline"
                    onClick={() => navigate(`/guru/classes/${classItem.id}/ai-soal`)}
                  >
                    Buat Soal dengan AI →
                  </button>
                </section>
              )}
            </>
          )}

          {activeStep === "preview" && <ClassPreview classItem={classItem || {}} questions={questions} />}

          {activeStep === "publish" && (
            <section
              aria-label="Publikasi Kelas"
              className="teacher-publish-section"
            >
              <h3>Langkah 4: Publikasi & Kode Join</h3>
              <p>
                Pastikan kelas memiliki minimal 1 soal pilihan ganda sebelum dipublikasikan. Siswa hanya dapat
                bergabung ke kelas berstatus <strong>published</strong>.
              </p>
              <p>
                Jumlah Soal Saat Ini: <strong>{questions.length}</strong> soal
              </p>
              {classItem?.joinCode ? (
                <p data-testid="published-join-code">
                  Kode Join Aktif: <strong>{classItem.joinCode}</strong>
                </p>
              ) : null}

              <div className="teacher-publish-actions">
                <button
                  type="button"
                  className="teacher-btn teacher-btn-primary"
                  onClick={handlePublish}
                  disabled={isSaving || questions.length === 0}
                >
                  {classItem?.status === "published" ? "Perbarui Publikasi" : "Publikasikan Kelas Sekarang"}
                </button>

                {classItem?.status === "published" && (
                  <button
                    type="button"
                    className="teacher-btn teacher-btn-outline"
                    onClick={handleRotateCode}
                    disabled={isSaving}
                  >
                    Putar Ulang Kode Join
                  </button>
                )}
              </div>
            </section>
          )}
        </>
      )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default TeacherClassEditor;
