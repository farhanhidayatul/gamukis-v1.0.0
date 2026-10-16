import React from "react";
import "./RoomRow.css";

const RoomRow = ({ room, onDelete, isProcessing }) => {
  const playerCount = room.playerCount ?? (room.players || []).length;
  const cheatFlags = (room.players || []).reduce(
    (sum, player) => sum + (Number(player.cheatFlags) || 0),
    Number(room.suspiciousCount) || 0
  );
  const isActive = playerCount > 0;

  return (
    <tr className="room-row">
      <td data-label="Room">
        <strong>{room.name || room.id}</strong>
        <small>{room.id}</small>
      </td>
      <td data-label="Player">{playerCount}</td>
      <td data-label="Koneksi">{room.connectionCount ?? playerCount}</td>
      <td data-label="Cheat flag">
        <span className={cheatFlags > 0 ? "room-row__warn" : "room-row__ok"}>
          {cheatFlags}
        </span>
      </td>
      <td data-label="Status">{isActive ? "Aktif" : "Kosong"}</td>
      <td className="room-row__actions" data-label="Aksi">
        <button
          type="button"
          className="room-row__delete"
          onClick={() => onDelete(room)}
          disabled={isProcessing}
        >
          Hapus
        </button>
      </td>
    </tr>
  );
};

export default RoomRow;
