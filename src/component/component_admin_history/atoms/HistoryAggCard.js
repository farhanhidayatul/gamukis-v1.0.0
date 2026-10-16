import React from "react";
import "./HistoryAggCard.css";

const HistoryAggCard = ({ label, value, color }) => (
  <article className="history-agg-card" style={{ "--agg-color": color }}>
    <span className="history-agg-card__label">{label}</span>
    <strong className="history-agg-card__value">{value}</strong>
  </article>
);

export default HistoryAggCard;
