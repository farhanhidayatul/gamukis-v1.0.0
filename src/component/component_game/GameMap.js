import React from 'react';
import './gameMap.css';
import TiledMapCanvas from './TiledMapCanvas';
import { mapWidth, mapHeight } from './tiledMapData';

const GameMap = ({ zoom = 2, children }) => {
  return (
    <div
      className="game-map"
      style={{
        width: `${mapWidth}px`,
        height: `${mapHeight}px`,
        transform: `scale(${zoom})`,
      }}
    >
      <TiledMapCanvas />
      {children}
    </div>
  );
};

export default GameMap;
