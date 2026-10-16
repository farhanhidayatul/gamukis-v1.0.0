import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './miniMap.css';

/**
 * Calculates percentage position (0% - 100%) within the arena.
 * Supports both tile grid coordinates and pixel coordinates.
 */
export const calculateMapPercent = (coord, maxDimensionTiles) => {
  if (coord === null || coord === undefined || isNaN(coord)) return 0;
  let val = Number(coord);
  // If coordinate exceeds twice the map dimension, treat as pixel space and convert to tiles
  if (val > maxDimensionTiles * 2) {
    val = val / 16;
  }
  const clamped = Math.max(0, Math.min(maxDimensionTiles, val));
  return (clamped / maxDimensionTiles) * 100;
};

const MiniMap = ({
  player,
  players = {},
  coins = {},
  bots = {},
  mapWidthTiles = 85,
  mapHeightTiles = 48,
  isMuted = false,
  onToggleMute = null,
  showToolbar = true
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeCoins = Object.entries(coins).filter(([, c]) => (
    c && typeof c.x === 'number' && typeof c.y === 'number'
  ));

  const activeBots = Object.entries(bots).filter(([, b]) => (
    b && typeof b.x === 'number' && typeof b.y === 'number' && (b.health === undefined || Number(b.health) > 0) && !b.isDying && b.state !== 'dead' && b.state !== 'death'
  ));

  const otherPlayers = Object.entries(players).filter(([id, p]) => (
    p && id !== player?.id && typeof p.x === 'number' && typeof p.y === 'number'
  ));

  return (
    <div className="gamukis-minimap-container" data-testid="gamukis-minimap">
      <div
        className="gamukis-minimap-glass"
        style={{ height: isCollapsed ? '28px' : '102px' }}
      >
        <div
          className="gamukis-minimap-header"
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ cursor: 'pointer' }}
          title={isCollapsed ? 'Klik untuk memperluas Radar' : 'Klik untuk memperkecil Radar'}
        >
          <div className="gamukis-minimap-title">
            <span className="gamukis-minimap-indicator" />
            <span>RADAR</span>
          </div>
          <div className="gamukis-minimap-stats">
            <span title="Koin aktif">🪙 {activeCoins.length}</span>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
              {isCollapsed ? '▼' : '▲'}
            </span>
          </div>
        </div>

        {!isCollapsed && (
          <div className="gamukis-minimap-arena">
            <div className="gamukis-minimap-grid" />
            <div className="gamukis-minimap-sweep" />

            {/* Active Coin Dots */}
            {activeCoins.map(([key, coin]) => {
              const leftPercent = calculateMapPercent(coin.x, mapWidthTiles);
              const topPercent = calculateMapPercent(coin.y, mapHeightTiles);
              return (
                <div
                  key={key}
                  className="gamukis-minimap-coin"
                  data-testid="minimap-coin"
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`
                  }}
                />
              );
            })}

            {/* Enemy Bots */}
            {activeBots.map(([key, bot]) => {
              const leftPercent = calculateMapPercent(bot.x, mapWidthTiles);
              const topPercent = calculateMapPercent(bot.y, mapHeightTiles);
              return (
                <div
                  key={key}
                  className="gamukis-minimap-bot"
                  data-testid="minimap-bot"
                  title={`${bot.name || 'Monster'} (${bot.x}, ${bot.y})`}
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`
                  }}
                />
              );
            })}

            {/* Other Players */}
            {otherPlayers.map(([id, other]) => {
              const leftPercent = calculateMapPercent(other.x, mapWidthTiles);
              const topPercent = calculateMapPercent(other.y, mapHeightTiles);
              return (
                <div
                  key={id}
                  className="gamukis-minimap-other-player"
                  data-testid="minimap-other-player"
                  title={other.name || 'Pemain lain'}
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`
                  }}
                />
              );
            })}

            {/* Current Player Dot */}
            {player && typeof player.x === 'number' && typeof player.y === 'number' && (
              <div
                className="gamukis-minimap-current-player"
                data-testid="minimap-player"
                title={`Posisi Anda (${player.x}, ${player.y})`}
                style={{
                  left: `${calculateMapPercent(player.x, mapWidthTiles)}%`,
                  top: `${calculateMapPercent(player.y, mapHeightTiles)}%`
                }}
              />
            )}
          </div>
        )}
      </div>

      {showToolbar && onToggleMute && (
        <div className="gamukis-hud-toolbar">
          <button
            type="button"
            className={`gamukis-hud-btn ${isMuted ? 'active-muted' : ''}`}
            onClick={onToggleMute}
            aria-label={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
            title={isMuted ? 'Nyalakan Suara Game' : 'Matikan Suara Game'}
          >
            <span>{isMuted ? '🔇 Muted' : '🔊 SFX On'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

MiniMap.propTypes = {
  player: PropTypes.object,
  players: PropTypes.object,
  coins: PropTypes.object,
  bots: PropTypes.object,
  mapWidthTiles: PropTypes.number,
  mapHeightTiles: PropTypes.number,
  isMuted: PropTypes.bool,
  onToggleMute: PropTypes.func,
  showToolbar: PropTypes.bool
};

export default MiniMap;

