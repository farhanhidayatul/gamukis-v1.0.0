import React, { useEffect, useState } from "react";
import { getRooms } from "../../database/adminApi";
import { getAdminAnomalies, resolveAdminAnomaly } from "../../database/ingameAnomalyApi";
import LivePlayerInspector from "./molecules/LivePlayerInspector";
import AnomalyAlertBadge from "./atoms/AnomalyAlertBadge";
import AnomalyResolutionModal from "./molecules/AnomalyResolutionModal";
import "./AdminMonitoring.css";

const AdminMonitoring = ({ rooms: initialRooms = [], isLoading: initialLoading = false }) => {
  const [rooms, setRooms] = useState(initialRooms);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [anomalies, setAnomalies] = useState([]);
  const [activeAnomalyCount, setActiveAnomalyCount] = useState(0);
  const [isAnomalyModalOpen, setIsAnomalyModalOpen] = useState(false);

  // Synchronize initial rooms
  useEffect(() => {
    if (Array.isArray(initialRooms)) {
      setRooms(initialRooms);
    }
  }, [initialRooms]);

  // Live auto-refresh polling loop (every 2.5 seconds when isLive is ON).
  // Pauses while the tab is hidden and backs off exponentially (max 60s) after failures (BUG-TRF-003).
  useEffect(() => {
    if (!isLive) return undefined;

    let isCurrent = true;
    let timer = null;
    let failures = 0;
    const BASE_DELAY_MS = 2500;
    const MAX_DELAY_MS = 60000;
    const isTabHidden = () => typeof document !== "undefined" && document.hidden === true;

    const scheduleNext = () => {
      if (!isCurrent) return;
      const delay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * (2 ** failures));
      timer = setTimeout(poll, delay);
    };

    const poll = async () => {
      if (!isCurrent) return;
      if (isTabHidden()) {
        scheduleNext();
        return;
      }
      try {
        const freshRooms = await getRooms();
        if (isCurrent && Array.isArray(freshRooms)) {
          setRooms(freshRooms);
        }
        failures = 0;
      } catch (_err) {
        failures = Math.min(failures + 1, 5);
      }
      scheduleNext();
    };

    const handleVisibilityChange = () => {
      if (!isCurrent || isTabHidden()) return;
      clearTimeout(timer);
      poll();
    };

    scheduleNext();
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      isCurrent = false;
      clearTimeout(timer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [isLive]);

  // Fetch inGame anomalies for Admin Confirmation Hub
  const fetchAnomalies = async () => {
    try {
      const data = await getAdminAnomalies(null, { status: 'OPEN' });
      if (data && data.status === 'ok') {
        setAnomalies(data.anomalies || []);
        setActiveAnomalyCount(data.activeCount || 0);
      }
    } catch (err) { console.warn("[AdminMonitoring] Fallback:", err?.message || err);
      // Passive ignore
    }
  };

  useEffect(() => {
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResolveAnomaly = async (id, action) => {
    try {
      await resolveAdminAnomaly(null, id, action);
      await fetchAnomalies();
    } catch (err) {
      console.error("Gagal menyelesaikan anomali:", err);
    }
  };

  const suspiciousPlayers = rooms.flatMap((room) =>
    (room.players || [])
      .filter((player) => Number(player.cheatFlags) > 0)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AnomalyAlertBadge
            count={activeAnomalyCount}
            onClick={() => setIsAnomalyModalOpen(true)}
          />
          {!initialLoading && totalSuspicious > 0 && (
            <span className="admin-pill r">{totalSuspicious} terdeteksi</span>
          )}
          {!initialLoading && totalSuspicious === 0 && (
            <span className="admin-pill">Semua aman</span>
          )}
        </div>
      </div>

      {/* Loading */}
      {initialLoading && (
        <p className="admin-card" role="status">Memuat data monitoring...</p>
      )}

      {/* Two-column grid: Ringkasan Room + Detail Player */}
      {!initialLoading && (
        <React.Fragment>
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
                  <div
                    className="admin-alert"
                    key={`${player.roomName}-${player.id}`}
                    style={{ marginBottom: "10px", cursor: "pointer" }}
                    onClick={() => setSelectedPlayerId(player.id)}
                    title="Klik untuk lacak di radar"
                  >
                    <i>!</i>
                    <div>
                      <b>{player.name || player.id}</b>
                      <small>{player.roomName} · {player.cheatFlags} invalid move (Klik untuk lacak)</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Interactive Selectable Player Telemetry & Live Avatar Movement Radar (R5) */}
          <LivePlayerInspector
            rooms={rooms}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={setSelectedPlayerId}
            isLive={isLive}
            onToggleLive={() => setIsLive((prev) => !prev)}
          />

          {/* Anomaly Resolution Modal (Admin Confirmation Hub) */}
          <AnomalyResolutionModal
            isOpen={isAnomalyModalOpen}
            anomalies={anomalies}
            onClose={() => setIsAnomalyModalOpen(false)}
            onResolve={handleResolveAnomaly}
          />
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default AdminMonitoring;
