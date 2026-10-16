import React from "react";
import "./StatCard.css";

const StatCard = ({ label, value, sub, accent }) => (
  <article className="stat-card" style={{ "--stat-accent": accent }}>
    <p className="stat-card__label">{label}</p>
    <strong className="stat-card__value">{value}</strong>
    <span className="stat-card__sub">{sub}</span>
  </article>
);

export default StatCard;
