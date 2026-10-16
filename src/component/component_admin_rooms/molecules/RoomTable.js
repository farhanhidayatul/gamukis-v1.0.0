import React from "react";
import "./RoomTable.css";
import RoomRow from "../atoms/RoomRow";

const RoomTable = ({ rooms, onDelete, isProcessing }) => (
  <div className="room-table-wrap">
    <table className="room-table">
      <thead>
        <tr>
          <th>Room</th>
          <th>Player</th>
          <th>Koneksi</th>
          <th>Cheat flag</th>
          <th>Status</th>
          <th><span className="sr-only">Aksi</span></th>
        </tr>
      </thead>
      <tbody>
        {rooms.map((room) => (
          <RoomRow
            key={room.id}
            room={room}
            onDelete={onDelete}
            isProcessing={isProcessing}
          />
        ))}
      </tbody>
    </table>
  </div>
);

export default RoomTable;
