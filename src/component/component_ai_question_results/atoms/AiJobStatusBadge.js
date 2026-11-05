import React from "react";
import "./AiJobStatusBadge.css";

const STATUS_LABELS = {
  queued: "Menunggu",
  processing: "Diproses",
  retry_wait: "Menunggu ulang",
  candidates_ready: "Kandidat siap",
  review: "Perlu ditinjau",
  awaiting_continuation: "Menunggu lanjutan",
  completed: "Selesai",
  failed: "Gagal",
  cancelled: "Dibatalkan"
};

const AiJobStatusBadge = ({ status }) => {
  const normalizedStatus = String(status || "unknown").toLowerCase();
  const label = STATUS_LABELS[normalizedStatus] || "Tidak diketahui";

  return (
    <span className={`ai-job-status ai-job-status--${normalizedStatus}`}>
      {label}
    </span>
  );
};

export default AiJobStatusBadge;
