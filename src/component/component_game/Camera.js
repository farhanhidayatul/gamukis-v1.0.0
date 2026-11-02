import React, { useEffect, useRef, useState } from 'react';
import './camera.css';

const Camera = ({ player, mapWidth, mapHeight, tileSize, zoom = 2, children }) => {
  const viewportRef = useRef(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateViewportSize = () => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      setViewportSize({
        width: viewport.clientWidth,
        height: viewport.clientHeight
      });
    };

    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateViewportSize);
      if (viewportRef.current) resizeObserver.observe(viewportRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateViewportSize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  const scaledMapWidth = (mapWidth || 0) * zoom;
  const scaledMapHeight = (mapHeight || 0) * zoom;
  const scaledTileSize = (tileSize || 0) * zoom;

  // Use measured viewport or fallback to window dimensions to prevent initial 0x0 glitch
  const currentVpWidth = viewportSize.width || (typeof window !== 'undefined' ? window.innerWidth : 800);
  const currentVpHeight = viewportSize.height || (typeof window !== 'undefined' ? window.innerHeight : 600);

  const maxCameraX = Math.max(scaledMapWidth - currentVpWidth, 0);
  const maxCameraY = Math.max(scaledMapHeight - currentVpHeight, 0);

  // Fallback to island center (12, 12) rather than ocean (0, 0)
  const defaultSpawnGridX = 12;
  const defaultSpawnGridY = 12;
  const playerX = (player && typeof player.x === 'number' && !isNaN(player.x)) ? player.x : defaultSpawnGridX;
  const playerY = (player && typeof player.y === 'number' && !isNaN(player.y)) ? player.y : defaultSpawnGridY;

  const cameraX = Math.min(Math.max(playerX * scaledTileSize - currentVpWidth / 2 + scaledTileSize / 2, 0), maxCameraX);
  const cameraY = Math.min(Math.max(playerY * scaledTileSize - currentVpHeight / 2 + scaledTileSize / 2, 0), maxCameraY);

  return (
    <div className="game-camera" ref={viewportRef}>
      <div
        className="game-camera__content"
        style={{ transform: `translate3d(${-cameraX}px, ${-cameraY}px, 0)` }}
      >
        {children}
      </div>
    </div>
  );
};

export default Camera;
