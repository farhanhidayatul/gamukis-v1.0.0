import React from "react";
import "./HistoryRow.css";

const HistoryRow = ({ history, formattedDate }) => (
  <tr className="history-row">
    <td data-label="ID">{history.id_history}</td>
    <td data-label="Waktu main">{history.time_playing ?? "—"}</td>
    <td data-label="Benar">{Number(history.answer_true) || 0}</td>
    <td data-label="Salah">{Number(history.answer_false) || 0}</td>
    <td data-label="Total soal">{Number(history.all_question) || 0}</td>
    <td data-label="Coin">{Number(history.coin) || 0}</td>
    <td data-label="Death">{Number(history.death) || 0}</td>
    <td data-label="Dibuat">{formattedDate}</td>
  </tr>
);

export default HistoryRow;
