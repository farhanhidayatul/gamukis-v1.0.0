import React, { useEffect, useRef, useState } from "react";
import Camera from "../../component_game/Camera";
import GameMap from "../../component_game/GameMap";
import Player, { CustomCharacterRenderer } from "../../component_game/playerInfo";
import { mapTileSize, mapWidth, mapHeight } from "../../component_game/tiledMapData";
import "./PlayerTrackerRadar.css";

const MAP_WIDTH_TILES = 85;
const MAP_HEIGHT_TILES = 48;

const DIRECTION_ARROWS = {
  up: "▲ UTARA",
  down: "▼ SELATAN",
  left: "◀ BARAT",
  right: "▶ TIMUR"
};

const PlayerTrackerRadar = ({ player, otherPlayers = [] }) => {
  const prevPosRef = useRef({ x: player?.x, y: player?.y });
  const [isMoving, setIsMoving] = useState(false);
  const [viewMode, setViewMode] = useState("ingame"); // "ingame" | "radar"
  const [zoomLevel, setZoomLevel] = useState(2);
  const moveTimeoutRef = useRef(null);

  // Monitor real-time position changes to animate walking state
  useEffect(() => {
    if (!player) return;
    const currentX = Number(player.x) || 0;
    const currentY = Number(player.y) || 0;
    const prevX = Number(prevPosRef.current.x) || 0;
    const prevY = Number(prevPosRef.current.y) || 0;

    if (currentX !== prevX || currentY !== prevY) {
      setIsMoving(true);
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }
      // Keep moving state active for 800ms during position interpolation
      moveTimeoutRef.current = setTimeout(() => {
        setIsMoving(false);
      }, 800);
      prevPosRef.current = { x: currentX, y: currentY };
    }

    return () => {
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.x, player?.y]);

  if (!player) {
    return (
      <div className="player-tracker-radar player-tracker-radar--empty">
        <p className="player-tracker-radar__placeholder">Pilih pemain untuk melihat radar pergerakan</p>
      </div>
    );
  }

  const posX = Math.max(0, Math.min(MAP_WIDTH_TILES, Number(player.x) || 0));
  const posY = Math.max(0, Math.min(MAP_HEIGHT_TILES, Number(player.y) || 0));
  const percentX = (posX / MAP_WIDTH_TILES) * 100;
  const percentY = (posY / MAP_HEIGHT_TILES) * 100;
  const direction = String(player.direction || "down").toLowerCase();
  const directionLabel = DIRECTION_ARROWS[direction] || DIRECTION_ARROWS.down;
  const isSuspicious = Number(player.cheatFlags) > 0;
  const hasCustomAppearance = Boolean(player.appearance && typeof player.appearance === "object");

  return (
    <div className="player-tracker-radar" role="region" aria-label="Live Radar Pergerakan Player">
      <div className="player-tracker-radar__header">
        <div className="player-tracker-radar__title-wrap">
          <span className="player-tracker-radar__label">RADAR TILE MAP (85 × 48)</span>
          <h4 className="player-tracker-radar__name">{player.name || player.id}</h4>
        </div>

        {/* View Switcher: Live inGame Camera vs Full Arena Radar */}
        <div className="player-tracker-radar__view-switch">
          <button
            type="button"
            className={`player-tracker-radar__tab-btn ${viewMode === "ingame" ? "is-active" : ""}`}
            onClick={() => setViewMode("ingame")}
            title="Tampilan kamera dunia nyata seperti di inGame"
          >
            🎮 Kamera In-Game
          </button>
          <button
            type="button"
            className={`player-tracker-radar__tab-btn ${viewMode === "radar" ? "is-active" : ""}`}
            onClick={() => setViewMode("radar")}
            title="Tampilan pulau radar pulau keseluruhan"
          >
            🗺️ Radar Overview
          </button>
        </div>

        <div className="player-tracker-radar__coords">
          <span className="player-tracker-radar__coord-pill">X: <strong>{posX}</strong></span>
          <span className="player-tracker-radar__coord-pill">Y: <strong>{posY}</strong></span>
          <span className="player-tracker-radar__dir-pill">{directionLabel}</span>
          <span className={`player-tracker-radar__motion-pill ${isMoving ? "is-walking" : "is-idle"}`}>
            {isMoving ? "🏃 Berjalan" : "🧍 Diam"}
          </span>
        </div>
      </div>

      {viewMode === "ingame" ? (
        /* ================= INGAME LIVE CAMERA VIEWPORT ================= */
        <div className="player-tracker-radar__ingame-monitor">
          <div className="player-tracker-radar__monitor-bar">
            <span className="player-tracker-radar__live-tag">
              <span className="player-tracker-radar__pulse-red" /> LIVE CCTV
            </span>
            <div className="player-tracker-radar__zoom-controls">
              <button
                type="button"
                className="player-tracker-radar__zoom-btn"
                onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
                title="Perkecil Zoom"
              >
                −
              </button>
              <span className="player-tracker-radar__zoom-indicator">{zoomLevel}x</span>
              <button
                type="button"
                className="player-tracker-radar__zoom-btn"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.5))}
                title="Perbesar Zoom"
              >
                +
              </button>
            </div>
          </div>

          <div className="player-tracker-radar__ingame-wrapper game-wrapper">
            <Camera
              player={player}
              mapWidth={mapWidth}
              mapHeight={mapHeight}
              tileSize={mapTileSize}
              zoom={zoomLevel}
            >
              <GameMap zoom={zoomLevel}>
                {/* Render Selected Target Player */}
                <Player
                  player={player}
                  isCurrentPlayer={true}
                  isGuest={player.isGuest}
                  appearance={player.appearance}
                />

                {/* Render Other Players in the Room */}
                {otherPlayers.map((other) => {
                  if (!other || other.id === player.id) return null;
                  return (
                    <Player
                      key={other.id}
                      player={other}
                      isCurrentPlayer={false}
                      isGuest={other.isGuest}
                      appearance={other.appearance}
                    />
                  );
                })}
              </GameMap>
            </Camera>
          </div>
        </div>
      ) : null}

      {/* ================= RADAR TILE MAP OVERVIEW ================= */}
      <div
        className="player-tracker-radar__viewport"
        style={{ display: viewMode === "radar" ? "block" : "none" }}
      >
        {/* Tactical terrain map layers */}
        <div className="player-tracker-radar__ocean-bg" />
        <div className="player-tracker-radar__island-terrain" />
        <div className="player-tracker-radar__grid-lines" />
        
        {/* Compass Cardinal Points */}
        <span className="player-tracker-radar__compass player-tracker-radar__compass--n">U</span>
        <span className="player-tracker-radar__compass player-tracker-radar__compass--s">S</span>
        <span className="player-tracker-radar__compass player-tracker-radar__compass--w">B</span>
        <span className="player-tracker-radar__compass player-tracker-radar__compass--e">T</span>

        {/* Other active players in the same room */}
        {otherPlayers.map((other) => {
          if (!other || other.id === player.id) return null;
          const otherX = Math.max(0, Math.min(MAP_WIDTH_TILES, Number(other.x) || 0));
          const otherY = Math.max(0, Math.min(MAP_HEIGHT_TILES, Number(other.y) || 0));
          const oX = (otherX / MAP_WIDTH_TILES) * 100;
          const oY = (otherY / MAP_HEIGHT_TILES) * 100;
          return (
            <div
              key={other.id}
              className="player-tracker-radar__other-player"
              style={{ left: `${oX}%`, top: `${oY}%` }}
              title={`${other.name || other.id} (${otherX}, ${otherY})`}
            >
              <div className="player-tracker-radar__other-dot" />
              <span className="player-tracker-radar__other-tag">{other.name || "Pemain"}</span>
            </div>
          );
        })}

        {/* Selected Player Live Moving Avatar in Radar Overview */}
        <div
          className={`player-tracker-radar__marker player-tracker-radar__marker--${direction} ${
            isMoving ? "player-tracker-radar__marker--walking" : ""
          } ${isSuspicious ? "player-tracker-radar__marker--suspicious" : ""}`}
          style={{
            left: `${percentX}%`,
            top: `${percentY}%`
          }}
          data-direction={direction}
          title={`${player.name} (${posX}, ${posY})`}
        >
          {/* Target lock ring & pulse */}
          <div className="player-tracker-radar__pulse" />
          <div className="player-tracker-radar__target-ring" />
          <div className="player-tracker-radar__dot" />

          {/* Visual Avatar Entity */}
          <div className="player-tracker-radar__avatar-container">
            <div className="player-tracker-radar__avatar-shadow" />
            {hasCustomAppearance ? (
              <div className="player-tracker-radar__custom-avatar">
                <CustomCharacterRenderer
                  appearance={player.appearance}
                  direction={direction}
                  isMoving={isMoving}
                />
              </div>
            ) : (
              <div
                className={`player-tracker-radar__default-avatar ${isMoving ? "is-walking" : ""}`}
                data-direction={direction}
              />
            )}
          </div>

          {/* Name & coordinate tag */}
          <span className="player-tracker-radar__tag">
            {isSuspicious && <span className="player-tracker-radar__tag-alert">!</span>}
            {player.name || "Player"} ({posX}, {posY})
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlayerTrackerRadar;
