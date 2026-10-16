import React from "react";
import "./HistorySummary.css";
import HistoryAggCard from "../atoms/HistoryAggCard";

const HistorySummary = ({ totalSesi, totalBenar, totalSalah, totalCoin }) => (
  <div className="history-summary">
    <HistoryAggCard label="Total sesi" value={totalSesi} color="#5b86f5" />
    <HistoryAggCard label="Total jawaban benar" value={totalBenar} color="#176b68" />
    <HistoryAggCard label="Total jawaban salah" value={totalSalah} color="#d85e4d" />
    <HistoryAggCard label="Total coin dikumpulkan" value={totalCoin} color="#f8cf45" />
  </div>
);

export default HistorySummary;
