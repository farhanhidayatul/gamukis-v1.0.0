import { useState, useEffect } from "react";
import { getAdminAnomalies, resolveAdminAnomaly } from "../../database/ingameAnomalyApi";
import "./AdminBugDetectorPanel.css";

export default function AdminBugDetectorPanel() {
  const [anomalies, setAnomalies] = useState([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [notice, setNotice] = useState("");

  const loadAnomalies = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminAnomalies(null, filterStatus === "ALL" ? {} : { status: filterStatus });
      if (data && data.status === "ok") {
        setAnomalies(data.anomalies || []);
      }
    } catch (err) {
      console.error("Gagal memuat bug inGame:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnomalies();
    const timer = setInterval(loadAnomalies, 4000);
    return () => clearInterval(timer);
  }, [filterStatus]);

  const handleAction = async (id, action) => {
    setResolvingId(id);
    try {
      await resolveAdminAnomaly(null, id, action);
      setNotice(`Berhasil ${action === 'dismiss' ? 'mengabaikan' : 'membereskan'} anomali.`);
      setTimeout(() => setNotice(""), 3000);
      await loadAnomalies();
    } catch (err) {
      setNotice(`Gagal: ${err.message}`);
    } finally {
      setResolvingId(null);
    }
  };

  const openCount = anomalies.filter((a) => a.status === "OPEN").length;

  return (
    <div className="bug-detector-panel">
      {notice && <div className="bug-detector-notice">{notice}</div>}

      <div className="bug-detector-stats">
        <div className="bug-stat-card bug-stat-card--open">
          <small>BUG / ANOMALI AKTIF</small>
          <h2>{openCount}</h2>
          <span>Menunggu konfirmasi admin</span>
        </div>
        <div className="bug-stat-card">
          <small>TOTAL RECORD TELEMETRI</small>
          <h2>{anomalies.length}</h2>
          <span>Lapis 1 Client + Lapis 2 Netcode</span>
        </div>
        <div className="bug-stat-card bug-stat-card--healthy">
          <small>STATUS WATCHDOG ENGINE</small>
          <h2>AKTIF</h2>
          <span>Heartbeat, NaN Coords, Sprite 404, Ghost</span>
        </div>
      </div>

      <div className="bug-detector-toolbar">
        <div className="bug-filter-group">
          <button
            type="button"
            className={`bug-filter-btn ${filterStatus === "ALL" ? "active" : ""}`}
            onClick={() => setFilterStatus("ALL")}
          >
            Semua ({anomalies.length})
          </button>
          <button
            type="button"
            className={`bug-filter-btn ${filterStatus === "OPEN" ? "active" : ""}`}
            onClick={() => setFilterStatus("OPEN")}
          >
            Menunggu Tindakan ({openCount})
          </button>
          <button
            type="button"
            className={`bug-filter-btn ${filterStatus === "RESOLVED" ? "active" : ""}`}
            onClick={() => setFilterStatus("RESOLVED")}
          >
            Telah Dibereskan
          </button>
        </div>
        <button type="button" className="bug-refresh-btn" onClick={loadAnomalies}>
          🔄 Segarkan
        </button>
      </div>

      <div className="bug-table-container">
        {isLoading && anomalies.length === 0 ? (
          <div className="bug-loading">Memeriksa status detector bug inGame...</div>
        ) : anomalies.length === 0 ? (
          <div className="bug-empty">
            <span className="bug-empty-icon">🛡️</span>
            <h3>Sistem In-Game Berjalan Bersih!</h3>
            <p>Tidak ada laporan bug, freeze client, koordinat NaN, atau ghost player saat ini.</p>
          </div>
        ) : (
          <table className="bug-table">
            <thead>
              <tr>
                <th>Tingkat</th>
                <th>Tipe Anomali</th>
                <th>Pemain / Target</th>
                <th>Pesan & Detail</th>
                <th>Waktu</th>
                <th>Status</th>
                <th>Aksi Admin</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((item) => (
                <tr key={item.id} className={`bug-row--${item.status.toLowerCase()}`}>
                  <td>
                    <span className={`bug-badge-sev sev--${item.severity.toLowerCase()}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td>
                    <strong>{item.type}</strong>
                    {item.occurrences > 1 && (
                      <span className="bug-repeat-badge">x{item.occurrences}</span>
                    )}
                  </td>
                  <td>
                    <code>{item.playerId}</code>
                    <small className="bug-lobby-label">{item.lobbyId}</small>
                  </td>
                  <td>
                    <div className="bug-msg-text">{item.message}</div>
                    {item.details && Object.keys(item.details).length > 0 && (
                      <pre className="bug-meta-pre">
                        {JSON.stringify(item.details)}
                      </pre>
                    )}
                  </td>
                  <td>{new Date(item.detectedAt).toLocaleTimeString()}</td>
                  <td>
                    <span className={`bug-status-pill status--${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    {item.status === "OPEN" ? (
                      <div className="bug-action-btns">
                        <button
                          type="button"
                          className="btn-heal"
                          disabled={resolvingId === item.id}
                          onClick={() => handleAction(item.id, "auto_heal")}
                        >
                          {resolvingId === item.id ? "..." : "✅ Bereskan"}
                        </button>
                        <button
                          type="button"
                          className="btn-dismiss"
                          disabled={resolvingId === item.id}
                          onClick={() => handleAction(item.id, "dismiss")}
                        >
                          Abaikan
                        </button>
                      </div>
                    ) : (
                      <small className="bug-resolved-by">
                        Oleh: {item.resolvedBy || "admin"}
                      </small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
