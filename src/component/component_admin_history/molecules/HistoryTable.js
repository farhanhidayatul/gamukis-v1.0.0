import React from "react";
import "./HistoryTable.css";
import HistoryRow from "../atoms/HistoryRow";

const formatDate = (value) => {
  if (!value) return "Tanggal belum tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
};

const HistoryTable = ({ histories }) => (
  <div className="history-table-wrap">
    <table className="history-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Waktu main</th>
          <th>Benar</th>
          <th>Salah</th>
          <th>Total soal</th>
          <th>Coin</th>
          <th>Death</th>
          <th>Dibuat</th>
        </tr>
      </thead>
      <tbody>
        {histories.map((history) => (
          <HistoryRow
            key={history.id_history}
            history={history}
            formattedDate={formatDate(history.created_at)}
          />
        ))}
      </tbody>
    </table>
  </div>
);

export default HistoryTable;
