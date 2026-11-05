import React, { useState } from "react";
import "./TeacherClasses.css";

const STATUS_LABELS = {
  all: "Semua Status",
  draft: "Draft",
  published: "Published",
  archived: "Diarsipkan"
};

const TeacherClasses = ({
  classes = [],
  quota = { activeCount: 0, maxClasses: 3, remaining: 3 },
  isLoading = false,
  error = "",
  onCreateNew,
  onEditClass,
  onPublishClass,
  onRotateCode,
  onArchiveClass,
  onInspectResults
}) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClasses = classes.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const haystack = `${item.title || ""} ${item.subject || ""} ${item.joinCode || ""}`.toLowerCase();
      return haystack.includes(q);
    }
    return true;
  });

  const canCreateNew = Number(quota?.remaining ?? 1) > 0;

  return (
    <section className="teacher-classes-panel" aria-label="Daftar Kelas Guru">
      <header className="teacher-classes-header">
        <div>
          <p className="teacher-classes-eyebrow">RUANG KERJA GURU</p>
          <h2>Kelas &amp; Kuis Saya</h2>
          <p className="teacher-classes-quota" data-testid="teacher-class-quota">
            Kuota Kelas Aktif: <strong>{quota.activeCount || 0}</strong> / <strong>{quota.maxClasses || 3}</strong>{" "}
            (Sisa: {quota.remaining ?? 3})
          </p>
        </div>
        <button
          type="button"
          className="teacher-btn teacher-btn-primary teacher-create-btn-3d"
          onClick={onCreateNew}
          disabled={!canCreateNew}
        >
          + Buat Kelas Baru
        </button>
      </header>

      <div className="teacher-classes-toolbar">
        <div className="teacher-status-tabs" role="tablist" aria-label="Filter status kelas">
          {Object.keys(STATUS_LABELS).map((statusKey) => (
            <button
              key={statusKey}
              type="button"
              role="tab"
              aria-selected={statusFilter === statusKey}
              className={`teacher-status-tab ${statusFilter === statusKey ? "active" : ""}`}
              onClick={() => setStatusFilter(statusKey)}
            >
              {STATUS_LABELS[statusKey]}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="teacher-search-input"
          placeholder="Cari judul, mapel, atau kode join..."
          aria-label="Cari kelas guru"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      {error ? (
        <div className="teacher-classes-alert" role="alert">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <p className="teacher-classes-empty">Memuat daftar kelas...</p>
      ) : filteredClasses.length === 0 ? (
        <div className="teacher-classes-empty">
          <p>Belum ada kelas pada filter ini.</p>
        </div>
      ) : (
        <div className="teacher-classes-grid">
          {filteredClasses.map((item) => (
            <article key={item.id} className="teacher-class-card" data-testid={`teacher-class-card-${item.id}`}>
              <div className="teacher-class-card-top">
                <span className={`teacher-badge status-${item.status}`}>
                  {STATUS_LABELS[item.status] || item.status}
                </span>
                <span className="teacher-subject-pill">{item.subject}</span>
              </div>
              <h3 className="teacher-class-card-title">{item.title}</h3>
              <p className="teacher-class-desc">{item.description || "Belum ada deskripsi kelas."}</p>

              <dl className="teacher-class-metrics">
                <div>
                  <dt>Kode Join</dt>
                  <dd data-testid={`join-code-${item.id}`}>{item.joinCode || "Belum dipublikasikan"}</dd>
                </div>
                <div>
                  <dt>Siswa Terdaftar</dt>
                  <dd>{item.enrolledCount ?? item.enrollmentCount ?? 0}</dd>
                </div>
                <div>
                  <dt>Kuis Diselesaikan</dt>
                  <dd>{item.attemptCount || 0}</dd>
                </div>
              </dl>

              <div className="teacher-class-actions">
                <button
                  type="button"
                  className="teacher-btn teacher-btn-secondary"
                  onClick={() => onEditClass && onEditClass(item)}
                >
                  Kelola &amp; Soal
                </button>
                {item.status === "draft" && (
                  <button
                    type="button"
                    className="teacher-btn teacher-btn-primary"
                    onClick={() => onPublishClass && onPublishClass(item.id)}
                  >
                    Publikasikan
                  </button>
                )}
                {item.status === "published" && (
                  <button
                    type="button"
                    className="teacher-btn teacher-btn-outline"
                    onClick={() => onRotateCode && onRotateCode(item.id)}
                  >
                    Putar Kode Join
                  </button>
                )}
                {onInspectResults && (
                  <button
                    type="button"
                    className="teacher-btn teacher-btn-outline"
                    onClick={() => onInspectResults(item)}
                  >
                    Hasil Siswa
                  </button>
                )}
                {item.status !== "archived" && onArchiveClass && (
                  <button
                    type="button"
                    className="teacher-btn teacher-btn-danger"
                    onClick={() => onArchiveClass(item.id)}
                  >
                    Arsipkan
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default TeacherClasses;
