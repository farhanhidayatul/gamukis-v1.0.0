import React, { useState } from "react";
import "./LivePlayerInspector.css";
import PlayerTrackerRadar from "../atoms/PlayerTrackerRadar";

const LivePlayerInspector = ({ rooms = [], selectedPlayerId, onSelectPlayer, isLive = false, onToggleLive }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Flatten all players across all rooms with room metadata
  const allPlayers = rooms.flatMap((room) =>
    (room.players || []).map((player) => ({
      ...player,
      roomId: room.id,
      roomName: room.name || room.id
    }))
  );

  const filteredPlayers = allPlayers.filter((player) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      (player.name && player.name.toLowerCase().includes(term)) ||
      (player.id && String(player.id).toLowerCase().includes(term)) ||
      (player.roomName && player.roomName.toLowerCase().includes(term))
    );
  });

  const selectedPlayer = allPlayers.find((p) => p.id === selectedPlayerId) || filteredPlayers[0] || null;

  return (
    <div className="live-player-inspector">
      <div className="live-player-inspector__header">
        <div>
          <h3>INSPEKSI LIVE PLAYER</h3>
          <p className="live-player-inspector__subtitle">
            Pilih pemain untuk memantau pergerakan avatar dan status secara realtime.
          </p>
        </div>
        <div className="live-player-inspector__controls">
          <button
            type="button"
            className={`live-player-inspector__live-btn ${isLive ? "live-player-inspector__live-btn--active" : ""}`}
            onClick={onToggleLive}
            title={isLive ? "Jeda live stream" : "Mulai live stream otomatis"}
          >
            <span className="live-player-inspector__live-dot" />
            {isLive ? "Live Sync: ON" : "Live Sync: OFF"}
          </button>
        </div>
      </div>

      <div className="live-player-inspector__content">
        {/* Left column: Player list */}
        <div className="live-player-inspector__list-card">
          <div className="live-player-inspector__search-bar">
            <input
              type="text"
              placeholder="Cari player / room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="live-player-inspector__input"
            />
            <span className="live-player-inspector__count">
              {filteredPlayers.length} online
            </span>
          </div>

          <div className="live-player-inspector__players-scroll">
            {filteredPlayers.length === 0 ? (
              <p className="live-player-inspector__empty">Tidak ada pemain aktif yang cocok.</p>
            ) : (
              filteredPlayers.map((player) => {
                const isSelected = selectedPlayer && selectedPlayer.id === player.id;
                const isSuspicious = Number(player.cheatFlags) > 0;
                return (
                  <button
                    key={`${player.roomId}-${player.id}`}
                    type="button"
                    className={`live-player-inspector__item ${isSelected ? "live-player-inspector__item--selected" : ""}`}
                    onClick={() => onSelectPlayer(player.id)}
                  >
                    <div className="live-player-inspector__item-main">
                      <strong className="live-player-inspector__item-name">
                        {player.name || player.id}
                      </strong>
                      <span className="live-player-inspector__item-room">
                        {player.roomName} · ({player.x ?? 12}, {player.y ?? 12})
                      </span>
                    </div>

                    <div className="live-player-inspector__item-meta">
                      {isSuspicious && (
                        <span className="live-player-inspector__badge-flag" title={`${player.cheatFlags} flag pelanggaran`}>
                          ! {player.cheatFlags}
                        </span>
                      )}
                      <span className="live-player-inspector__item-role">
                        {player.isGuest ? "Tamu" : "User"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Selected Player Telemetry & Live Radar */}
        <div className="live-player-inspector__details-card">
          {selectedPlayer ? (
            <React.Fragment>
              <div className="live-player-inspector__stat-grid">
                <div className="live-player-inspector__stat-box">
                  <small>Nama / ID</small>
                  <strong>{selectedPlayer.name || selectedPlayer.id}</strong>
                </div>
                <div className="live-player-inspector__stat-box">
                  <small>Room</small>
                  <strong>{selectedPlayer.roomName}</strong>
                </div>
                <div className="live-player-inspector__stat-box">
                  <small>Darah / Koin</small>
                  <strong>♥ {selectedPlayer.health ?? 3} · 🪙 {selectedPlayer.coins ?? 0}</strong>
                </div>
                <div className="live-player-inspector__stat-box">
                  <small>Status Keamanan</small>
                  {Number(selectedPlayer.cheatFlags) > 0 ? (
                    <strong style={{ color: "#ef4444" }}>⚠ {selectedPlayer.cheatFlags} Pelanggaran</strong>
                  ) : (
                    <strong style={{ color: "#22c55e" }}>✔ Normal</strong>
                  )}
                </div>
              </div>

              {Number(selectedPlayer.cheatFlags) > 0 && (
                <div className="live-player-inspector__alert-banner" role="alert">
                  <strong>Indikasi Pelanggaran Terdeteksi:</strong>
                  <span> Pemain ini tercatat melakukan {selectedPlayer.cheatFlags} kali gerakan tidak sah pada server.</span>
                </div>
              )}

              {/* Live Tactical Radar Viewport */}
              <PlayerTrackerRadar
                player={selectedPlayer}
                otherPlayers={allPlayers.filter((p) => p.roomId === selectedPlayer.roomId)}
              />
            </React.Fragment>
          ) : (
            <div className="live-player-inspector__no-selection">
              <p>Pilih pemain dari daftar di samping untuk melihat radar live.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LivePlayerInspector;
