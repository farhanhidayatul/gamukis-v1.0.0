import React from "react";
import "./SuspiciousPlayerCard.css";

const SuspiciousPlayerCard = ({ playerName, roomName, cheatFlags }) => (
  <article className="suspicious-card">
    <span className="suspicious-card__icon" aria-hidden="true">!</span>
    <div>
      <strong>{playerName}</strong>
      <span>{roomName} · {cheatFlags} flag</span>
    </div>
  </article>
);

export default SuspiciousPlayerCard;
