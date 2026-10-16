import React from "react";
import "./RoomSummaryRow.css";

const RoomSummaryRow = ({ roomName, playerCount, suspiciousCount }) => (
  <div className="room-summary-row">
    <strong>{roomName}</strong>
    <span>{playerCount} player</span>
    <span className={suspiciousCount > 0 ? "room-summary-row__warn" : "room-summary-row__ok"}>
      {suspiciousCount} mencurigakan
    </span>
  </div>
);

export default RoomSummaryRow;
