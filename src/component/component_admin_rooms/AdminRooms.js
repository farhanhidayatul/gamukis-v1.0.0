import React, { useState } from "react";
import { createRoom, deleteRoom } from "../../database/adminApi";

const AdminRooms = ({ rooms, setRooms, isLoading }) => {
  const [roomName, setRoomName] = useState("");
  const [roomCapacity, setRoomCapacity] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (event) => {
    event.preventDefault();
    setIsProcessing(true);
    setError("");
    try {
      const response = await createRoom({
        name: roomName.trim() || undefined,
        capacity: roomCapacity
      });
      setRooms((prev) => [...prev, response.room]);
      setRoomName("");
    } catch (err) {
      setError(err.message || "Room gagal dibuat.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Hapus ${room.name || room.id}? Player di room ini akan dikeluarkan.`)) return;
    setIsProcessing(true);
    setError("");
    try {
      await deleteRoom(room.id);
      setRooms((prev) => prev.filter((r) => r.id !== room.id));
    } catch (err) {
      setError(err.message || "Room gagal dihapus.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <React.Fragment>
      {/* Section header */}
      <div className="admin-sec">
        <div>
          <small>Realtime game</small>
          <h2>Room aktif</h2>
        </div>
        {!isLoading && (
          <span className="admin-pill">{rooms.length} Room</span>
        )}
      </div>

      {error && (
        <div className="admin-alert" style={{ marginBottom: "18px" }}>
          <i>!</i>
          <div><b>{error}</b></div>
        </div>
      )}

      {/* Create room form card */}
      <div className="admin-card">
        <h3>BUAT ROOM BARU</h3>
        <form className="admin-form" onSubmit={handleCreate}>
          <div>
            <label htmlFor="admin-rm-name">NAMA ROOM</label>
            <input
              id="admin-rm-name"
              placeholder="Room baru"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={80}
            />
          </div>
          <div>
            <label htmlFor="admin-rm-cap">KAPASITAS</label>
            <input
              id="admin-rm-cap"
              type="number"
              value={roomCapacity}
              onChange={(e) => setRoomCapacity(e.target.value)}
              min="1"
              max="1000"
              style={{ width: "120px" }}
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-y" disabled={isProcessing}>
            {isProcessing ? "Membuat…" : "Buat room"}
          </button>
        </form>
      </div>

      {/* Loading */}
      {isLoading && (
        <p className="admin-card" role="status">Memuat room...</p>
      )}

      {/* Empty state */}
      {!isLoading && rooms.length === 0 && (
        <div className="admin-card admin-empty">
          <div className="e">🎮</div>
          <b>Belum ada room.</b>
          <span>Room otomatis dibuat saat player mulai bermain, atau buat manual lewat form di atas.</span>
        </div>
      )}

      {/* Room table */}
      {!isLoading && rooms.length > 0 && (
        <div className="admin-card admin-tw">
          <table>
            <thead>
              <tr>
                <th>ROOM</th>
                <th>PLAYER</th>
                <th>KONEKSI</th>
                <th>CHEAT FLAG</th>
                <th>STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>
                    <b>{room.name || room.id}</b>
                    <small>{room.id}</small>
                  </td>
                  <td>{room.playerCount ?? 0}/{room.capacity ?? "∞"}</td>
                  <td>{room.connections ?? 0}</td>
                  <td style={{ color: (room.suspiciousCount ?? 0) > 0 ? "var(--red)" : undefined, fontWeight: 700 }}>
                    {room.suspiciousCount ?? 0}
                  </td>
                  <td><span className="admin-tag">active</span></td>
                  <td>
                    <button
                      className="admin-del"
                      onClick={() => handleDelete(room)}
                      disabled={isProcessing}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </React.Fragment>
  );
};

export default AdminRooms;
