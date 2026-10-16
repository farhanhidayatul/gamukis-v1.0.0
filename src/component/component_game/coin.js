import React from 'react';
import { getKeyString, TILE_SIZE } from './utils';

const Coin = ({ coin }) => {
  if (!coin) return null;
  const { x, y } = coin;
  // The 16px coin/shadow artwork is centered inside a 48px rendered cell.
  // Offset the cell so that the artwork center lands on the center of its
  // Tiled spawn coordinate (x, y).
  const left = TILE_SIZE * x - 13 + 'px';
  const top = TILE_SIZE * y - 12 + 'px';
  const key = getKeyString(x, y);

  return (
    <div
      className="Coin grid-cell"
      style={{
        transform: `translate3d(${left}, ${top}, 0)`,
        zIndex: (y + 1) * 10 + 5
      }}
      key={key}
    >
      <div className="Coin_shadow grid-cell"></div>
      <div className="Coin_sprite grid-cell"></div>
    </div>
  );
};

export default Coin;
