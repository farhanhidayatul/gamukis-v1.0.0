import React from 'react';
import './AnomalyAlertBadge.css';

export default function AnomalyAlertBadge({ count = 0, onClick }) {
  if (!count || count <= 0) {
    return (
      <span className="anomaly-badge anomaly-badge--healthy" title="Status Gameplay: Normal">
        <span className="anomaly-pulse-dot healthy-dot"></span>
        Sistem In-Game: Normal
      </span>
    );
  }

  return (
    <button
      type="button"
      className="anomaly-badge anomaly-badge--alert"
      onClick={onClick}
      title={`${count} Kejanggalan/Bug In-Game Terdeteksi! Klik untuk verifikasi & konfirmasi.`}
    >
      <span className="anomaly-pulse-dot alert-dot"></span>
      <span className="anomaly-alert-text">⚠️ {count} Bug In-Game Terdeteksi</span>
    </button>
  );
}
