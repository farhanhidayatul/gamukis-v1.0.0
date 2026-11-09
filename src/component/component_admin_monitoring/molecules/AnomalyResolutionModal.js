import { useState } from "react";
import './AnomalyResolutionModal.css';

export default function AnomalyResolutionModal({
  isOpen,
  anomalies = [],
  onClose,
  onResolve
}) {
  const [resolvingId, setResolvingId] = useState(null);

  if (!isOpen) return null;

  const handleAction = async (anomalyId, action) => {
    setResolvingId(anomalyId);
    try {
      await onResolve(anomalyId, action);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="anomaly-modal-backdrop" onClick={onClose}>
      <div className="anomaly-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="anomaly-modal-header">
          <div className="anomaly-modal-title">
            <span className="anomaly-modal-icon">🛡️</span>
            <h3>Konfirmasi Bug & Kejanggalan In-Game</h3>
          </div>
          <button type="button" className="anomaly-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="anomaly-modal-body">
          {(!anomalies || anomalies.length === 0) ? (
            <div className="anomaly-empty-state">
              <span className="anomaly-empty-icon">✅</span>
              <p>Tidak ada laporan bug atau anomali aktif saat ini. Semua gameplay berjalan normal.</p>
            </div>
          ) : (
            <div className="anomaly-list">
              {anomalies.map((item) => (
                <div key={item.id} className={`anomaly-item anomaly-item--${item.severity.toLowerCase()}`}>
                  <div className="anomaly-item-top">
                    <span className={`anomaly-severity-chip chip--${item.severity.toLowerCase()}`}>
                      {item.severity}
                    </span>
                    <span className="anomaly-type-chip">{item.type}</span>
                    <span className="anomaly-time">
                      {new Date(item.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="anomaly-message">{item.message}</p>

                  <div className="anomaly-meta">
                    <span><strong>Pemain:</strong> {item.playerId}</span>
                    <span><strong>Lobby:</strong> {item.lobbyId}</span>
                    {item.occurrences > 1 && (
                      <span className="anomaly-occurrences">
                        Berulang {item.occurrences}x
                      </span>
                    )}
                  </div>

                  {item.details && Object.keys(item.details).length > 0 && (
                    <pre className="anomaly-details">
                      {JSON.stringify(item.details, null, 2)}
                    </pre>
                  )}

                  <div className="anomaly-actions">
                    <button
                      type="button"
                      className="btn-anomaly-resolve"
                      disabled={resolvingId === item.id}
                      onClick={() => handleAction(item.id, 'auto_heal')}
                    >
                      {resolvingId === item.id ? 'Memproses...' : '✅ Konfirmasi & Bereskan'}
                    </button>
                    <button
                      type="button"
                      className="btn-anomaly-dismiss"
                      disabled={resolvingId === item.id}
                      onClick={() => handleAction(item.id, 'dismiss')}
                    >
                      Abaikan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="anomaly-modal-footer">
          <button type="button" className="btn-anomaly-close" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
