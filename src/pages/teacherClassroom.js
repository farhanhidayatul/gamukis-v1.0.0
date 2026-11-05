import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getManualUser } from "../database/manualAuth";
import {
  getStudentClassroomDetail,
  startStudentClassGameSession,
  startStudentQuizAttempt,
  submitStudentQuizAttempt
} from "../database/studentClassroomApi";
import { syncCurrentAccountRole } from "../database/teacherClassApi";
import StudentQuizAttempt from "../component/component_student_classes/StudentQuizAttempt";
import "../component/component_student_classes/StudentClassList.css";

const getUserRole = (user) =>
  String(user?.role || user?.userRole || user?.profile?.role || "").toLowerCase();

const TeacherClassroom = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getManualUser());
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => getUserRole(getManualUser()) !== "siswa");
  const [classItem, setClassItem] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isStartingGame, setIsStartingGame] = useState(false);

  const role = getUserRole(user);

  useEffect(() => {
    let isCurrent = true;

    const initClassroom = async () => {
      let currentUser = user;
      if (getUserRole(currentUser) !== "siswa" && typeof syncCurrentAccountRole === "function") {
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

      if (!currentUser || getUserRole(currentUser) !== "siswa" || !classId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await getStudentClassroomDetail(classId);
        if (!isCurrent) return;
        setClassItem(data.class || null);
        setQuestions(Array.isArray(data.questions) ? data.questions : []);
        setAttempt(data.attempt || null);
      } catch (loadErr) {
        if (!isCurrent) return;
        setError(loadErr.message || "Gagal memuat ruang kelas.");
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    initClassroom();

    return () => {
      isCurrent = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  if (isCheckingAuth) {
    return (
      <main className="student-dashboard-message">
        <p>Memverifikasi akses ruang kelas...</p>
      </main>
    );
  }

  if (!user || role !== "siswa") {
    return (
      <main className="student-dashboard-message">
        <h1>Akses Ruang Kelas Siswa</h1>
        <p>Silakan masuk dengan akun Siswa untuk mengerjakan kuis kelas ini.</p>
        <button type="button" className="student-btn student-btn-primary" onClick={() => navigate("/login")}>
          Ke halaman masuk
        </button>
      </main>
    );
  }

  const handleStartAttempt = async () => {
    setError("");
    try {
      const started = await startStudentQuizAttempt(classId);
      setAttempt(started.attempt || null);
      if (Array.isArray(started.questions) && started.questions.length > 0) {
        setQuestions(started.questions);
      }
    } catch (startErr) {
      setError(startErr.message || "Gagal memulai percobaan kuis.");
    }
  };

  const handleSubmitAttempt = async (answers) => {
    if (!attempt?.id) return;
    setIsSubmitting(true);
    setError("");
    try {
      const result = await submitStudentQuizAttempt(classId, attempt.id, answers);
      setAttempt(result.attempt || null);
    } catch (subErr) {
      setError(subErr.message || "Gagal mengumpulkan jawaban kuis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartClassGame = async () => {
    setIsStartingGame(true);
    setError("");
    try {
      const idempotencyKey = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const response = await startStudentClassGameSession(classId, idempotencyKey);
      navigate("/inGame", {
        state: {
          classGameMode: true,
          classId,
          sessionId: response.sessionId,
          subjectKey: response.subjectKey
        }
      });
    } catch (gameErr) {
      setError(gameErr.message || "Gagal memulai sesi game kelas.");
    } finally {
      setIsStartingGame(false);
    }
  };

  return (
    <div className="teacher-classroom-page" data-testid="student-classroom-root">
      <header className="teacher-classroom-header">
        <div className="student-dashboard-title-group">
          <p className="student-eyebrow">RUANG KELAS GURU</p>
          <h1>{classItem?.title || "Ruang Kelas"}</h1>
        </div>
        <button type="button" className="student-btn" onClick={() => navigate("/siswa/dashboard")}>
          Kembali ke Dashboard Siswa
        </button>
      </header>

      {isLoading ? (
        <p>Memuat materi dan soal kelas...</p>
      ) : !classItem ? (
        <div role="alert">{error || "Kelas tidak ditemukan atau Anda belum terdaftar."}</div>
      ) : (
        <>
          <StudentQuizAttempt
            classItem={classItem}
            questions={questions}
            attempt={attempt}
            isSubmitting={isSubmitting}
            error={error}
            onStartAttempt={handleStartAttempt}
            onSubmitAttempt={handleSubmitAttempt}
          />
          <div style={{ marginTop: "16px" }}>
            <button
              type="button"
              className="student-btn student-btn-primary"
              onClick={handleStartClassGame}
              disabled={isStartingGame}
              data-testid="start-class-game-btn"
            >
              {isStartingGame ? "Memulai..." : "Main Game dari Kelas"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherClassroom;
