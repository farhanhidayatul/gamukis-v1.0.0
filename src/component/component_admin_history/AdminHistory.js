import React from "react";
import HistorySummary from "./molecules/HistorySummary";
import HistoryTable from "./molecules/HistoryTable";

const AdminHistory = ({ histories, isLoading }) => {
  const totalSesi = histories.length;
  const totalBenar = histories.reduce((s, h) => s + (Number(h.answer_true) || 0), 0);
  const totalSalah = histories.reduce((s, h) => s + (Number(h.answer_false) || 0), 0);
  const totalCoin = histories.reduce((s, h) => s + (Number(h.coin) || 0), 0);

  return (
    <React.Fragment>
      <div className="admin-sec">
        <div>
          <small>Analytics</small>
          <h2>History permainan</h2>
        </div>
        {!isLoading && histories.length > 0 && (
          <span className="admin-pill">{totalSesi} sesi</span>
        )}
      </div>

      {isLoading && (
        <p className="admin-history__state" role="status">Memuat history semua pengguna...</p>
      )}

      {!isLoading && histories.length === 0 && (
        <div className="admin-card admin-empty">
          <div className="e">🕘</div>
          <b>Belum ada history permainan.</b>
          <span>History akan muncul setelah sesi player selesai.</span>
        </div>
      )}

      {!isLoading && histories.length > 0 && (
        <>
          <HistorySummary
            totalSesi={totalSesi}
            totalBenar={totalBenar}
            totalSalah={totalSalah}
            totalCoin={totalCoin}
          />
          <HistoryTable histories={histories} />
        </>
      )}
    </React.Fragment>
  );
};

export default AdminHistory;
