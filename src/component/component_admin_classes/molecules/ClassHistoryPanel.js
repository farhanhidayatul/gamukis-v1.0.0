import "./ClassHistoryPanel.css";

const ClassHistoryPanel = ({ historyData = null, isLoading = false, onClose }) => {
  if (isLoading) {
    return (
      <aside className="class-history-panel" aria-label="Detail Riwayat Kelas">
        <p>Memuat riwayat aktivitas kelas...</p>
      </aside>
    );
  }

  if (!historyData || !historyData.class) {
    return null;
  }

  const { class: classItem, auditEvents = [], attemptSummary = {} } = historyData;

  return (
    <aside className="class-history-panel" aria-label="Detail Riwayat Kelas" data-testid="admin-class-history-panel">
      <header className="class-history-header">
        <div>
          <p className="class-history-eyebrow">RIWAYAT SIKLUS & PERCOBAAN KELAS (READ-ONLY)</p>
          <h3>{classItem.title}</h3>
          <p className="class-history-meta">
            Guru: <strong>{classItem.teacherUserId}</strong> | Mapel: <strong>{classItem.subject}</strong> | Status:{" "}
            <strong>{classItem.status}</strong>
          </p>
        </div>
        {onClose && (
          <button type="button" className="admin-btn admin-btn-b" onClick={onClose}>
            Tutup Detail
          </button>
        )}
      </header>

      <div className="class-history-stats">
        <div className="history-stat-box">
          <span>Total Percobaan</span>
          <strong>{attemptSummary.totalAttempts || 0}</strong>
        </div>
        <div className="history-stat-box">
          <span>Selesai Dikumpulkan</span>
          <strong>{attemptSummary.submittedCount || 0}</strong>
        </div>
        <div className="history-stat-box">
          <span>Rata-rata Skor</span>
          <strong data-testid="admin-history-avg-score">{attemptSummary.averageScore || 0}</strong>
        </div>
      </div>

      <div className="class-history-events">
        <h4>Log Audit Siklus Kelas</h4>
        {auditEvents.length === 0 ? (
          <p>Belum ada log perubahan pada kelas ini.</p>
        ) : (
          <ul className="class-audit-list">
            {auditEvents.map((evt) => (
              <li key={evt.id} data-testid={`audit-event-${evt.eventType}`}>
                <span className="audit-event-type">{evt.eventType}</span>
                <span className="audit-event-actor">
                  oleh {evt.actorAuthType}:{evt.actorUserId}
                </span>
                <span className="audit-event-time">{evt.createdAt}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default ClassHistoryPanel;
