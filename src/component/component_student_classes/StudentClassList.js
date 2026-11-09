import { useState } from "react";
import "./StudentClassList.css";

const StudentClassList = ({
  classes = [],
  isLoading = false,
  joinError = "",
  joinSuccess = "",
  onJoinByCode,
  onOpenClassroom
}) => {
  const [joinCode, setJoinCode] = useState("");
  const [localError, setLocalError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");
    const normalized = joinCode.trim().toUpperCase();
    if (!normalized) {
      setLocalError("Masukkan kode kelas dari Guru Anda.");
      return;
    }

    setIsJoining(true);
    try {
      await onJoinByCode(normalized);
      setJoinCode("");
    } catch (err) {
      setLocalError(err.message || "Kode kelas tidak ditemukan atau belum dipublikasikan.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <section className="student-class-list-panel" aria-label="Daftar Kelas Guru yang Diikuti">
      <div className="student-join-card">
        <div>
          <p className="student-eyebrow">GABUNG KELAS GURU</p>
          <h2>Masukkan Kode Kelas</h2>
          <p>Gunakan kode unik yang dibagikan oleh Guru untuk bergabung dan mengerjakan kuis.</p>
        </div>

        <form className="student-join-form" onSubmit={handleJoinSubmit} noValidate>
          <label htmlFor="student-join-code-input" className="sr-only">
            Kode Kelas
          </label>
          <input
            id="student-join-code-input"
            type="text"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
            placeholder="Contoh: GMK-AB12CD"
            aria-label="Kode Kelas"
          />
          <button type="submit" className="student-btn student-btn-primary" disabled={isJoining}>
            {isJoining ? "Memproses..." : "Gabung Kelas"}
          </button>
        </form>

        {localError || joinError ? (
          <div className="student-join-alert error" role="alert">
            {localError || joinError}
          </div>
        ) : null}

        {joinSuccess ? (
          <div className="student-join-alert success" role="status">
            {joinSuccess}
          </div>
        ) : null}
      </div>

      <div className="student-enrolled-section">
        <h3>Kelas yang Saya Ikuti ({classes.length})</h3>

        {isLoading ? (
          <p className="student-empty-state">Memuat kelas yang diikuti...</p>
        ) : classes.length === 0 ? (
          <div className="student-empty-state">
            <p>Anda belum bergabung ke kelas Guru mana pun. Masukkan kode kelas di atas untuk mulai belajar.</p>
          </div>
        ) : (
          <div className="student-enrolled-grid">
            {classes.map((item) => {
              const latestAttempt = item.latestAttempt || null;
              const isCompleted = latestAttempt?.status === "submitted";

              return (
                <article
                  key={item.id}
                  className="student-enrolled-card"
                  data-testid={`student-class-card-${item.id}`}
                >
                  <div className="student-card-top">
                    <span className="student-subject-badge">{item.subject}</span>
                    <span className={`student-progress-badge ${isCompleted ? "done" : "pending"}`}>
                      {isCompleted ? "Selesai" : latestAttempt ? "Sedang Dikerjakan" : "Belum Dikerjakan"}
                    </span>
                  </div>

                  <h4>{item.title}</h4>
                  <p>{item.description || "Kerjakan kuis pilihan ganda pada kelas ini."}</p>

                  {isCompleted ? (
                    <p className="student-score-summary" data-testid={`student-score-${item.id}`}>
                      Skor Anda: <strong>{latestAttempt.score}</strong> / {latestAttempt.maxScore}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    className="student-btn student-btn-primary"
                    onClick={() => onOpenClassroom && onOpenClassroom(item)}
                  >
                    {isCompleted ? "Lihat Hasil Kuis" : "Buka Kelas & Kuis"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default StudentClassList;
