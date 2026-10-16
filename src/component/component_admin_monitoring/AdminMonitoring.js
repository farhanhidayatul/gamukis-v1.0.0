import React from "react";

const AdminMonitoring = ({ rooms, isLoading }) => {
  const suspiciousPlayers = rooms.flatMap((room) =>
    (room.players || [])
      .filter((player) => player.cheatFlags > 0)
      .map((player) => ({ ...player, roomName: room.name || room.id }))
  );

  const totalSuspicious = suspiciousPlayers.length;

  return (
    <React.Fragment>
      {/* Section header */}
      <div className="admin-sec">
        <div>
          <small>Security watch</small>
          <h2>Aktivitas mencurigakan</h2>
        </div>
        {!isLoading && totalSuspicious > 0 && (
          <span className="admin-pill r">{totalSuspicious} terdeteksi</span>
        )}
        {!isLoading && totalSuspicious === 0 && (
          <span className="admin-pill">Semua aman</span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <p className="admin-card" role="status">Memuat data monitoring...</p>
      )}

      {/* Two-column grid: Ringkasan Room + Detail Player */}
      {!isLoading && (
        <div className="admin-two">
          {/* Left card: Ringkasan Room */}
          <div className="admin-card">
            <h3>RINGKASAN ROOM</h3>
            {rooms.length === 0 ? (
              <p style={{ color: "var(--mut)", fontSize: "14px" }}>Belum ada room aktif.</p>
            ) : (
              rooms.map((room) => {
                const playerCount = room.playerCount ?? 0;
                const cheatCount = room.suspiciousCount ?? 0;
                return (
                  <div className="admin-rw" key={room.id} style={{ marginBottom: "8px" }}>
                    <b>{room.name || room.id}</b>
                    <span>
                      {playerCount} player{cheatCount > 0 && (
                        <> · <em>{cheatCount} cheat flag</em></>
                      )}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Right card: Detail Player Bermasalah */}
          <div className="admin-card">
            <h3>DETAIL PLAYER BERMASALAH</h3>
            {suspiciousPlayers.length === 0 ? (
              <p style={{ color: "var(--mut)", fontSize: "14px" }}>
                Tidak ada aktivitas mencurigakan. Validasi movement server berjalan normal.
              </p>
            ) : (
              suspiciousPlayers.map((player) => (
                <div className="admin-alert" key={`${player.roomName}-${player.id}`} style={{ marginBottom: "10px" }}>
                  <i>!</i>
                  <div>
                    <b>{player.name || player.id}</b>
                    <small>{player.roomName} · {player.cheatFlags} invalid move</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default AdminMonitoring;
