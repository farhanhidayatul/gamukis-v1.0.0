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
  const maxCameraX = Math.max(scaledMapWidth - (viewportSize.width || 0), 0);
  const maxCameraY = Math.max(scaledMapHeight - (viewportSize.height || 0), 0);
  const playerX = (player && typeof player.x === 'number' && !isNaN(player.x)) ? player.x : 0;
  const playerY = (player && typeof player.y === 'number' && !isNaN(player.y)) ? player.y : 0;
  const cameraX = player
    ? Math.min(Math.max(playerX * scaledTileSize - (viewportSize.width || 0) / 2 + scaledTileSize / 2, 0), maxCameraX)
    : 0;
  const cameraY = player
    ? Math.min(Math.max(playerY * scaledTileSize - (viewportSize.height || 0) / 2 + scaledTileSize / 2, 0), maxCameraY)
    : 0;

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
