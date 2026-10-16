import React from "react";
import "./MonitoringGrid.css";
import SuspiciousPlayerCard from "../atoms/SuspiciousPlayerCard";
import RoomSummaryRow from "../atoms/RoomSummaryRow";

const MonitoringGrid = ({ rooms, suspiciousPlayers }) => (
  <div className="monitoring-grid">
    {rooms.length > 0 && (
      <div className="monitoring-room-summary">
        <p className="monitoring-room-summary__title">Ringkasan room</p>
        {rooms.map((room) => (
          <RoomSummaryRow
            key={room.id}
            roomName={room.name || room.id}
            playerCount={room.playerCount ?? 0}
            suspiciousCount={room.suspiciousCount ?? 0}
          />
        ))}
      </div>
    )}

    <div className="monitoring-players">
      <p className="monitoring-players__title">Detail player bermasalah</p>
      {suspiciousPlayers.length === 0 ? (
        <div className="monitoring-clear">
          <strong>Tidak ada aktivitas mencurigakan.</strong>
          <span>Validasi movement server berjalan normal.</span>
        </div>
      ) : (
        <div className="monitoring-cards">
          {suspiciousPlayers.map((player) => (
            <SuspiciousPlayerCard
              key={`${player.roomName}-${player.id}`}
              playerName={player.name || player.id}
              roomName={player.roomName}
              cheatFlags={player.cheatFlags}
            />
          ))}
        </div>
      )}
    </div>
  </div>
);

export default MonitoringGrid;
