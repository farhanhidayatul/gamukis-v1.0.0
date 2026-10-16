import React, { useEffect, useRef } from 'react';
import {
  depthSortedLayers,
  findLayers,
  mapTileSize,
  mapHeight,
  mapWidth,
  tiledMap,
  tilesets
} from './tiledMapData';

const FLIP_HORIZONTAL = 0x80000000;
const FLIP_VERTICAL = 0x40000000;
const FLIP_DIAGONAL = 0x20000000;
const GID_MASK = 0x0fffffff;

const tileLayers = findLayers(tiledMap.layers, ({ type }) => type === 'tilelayer');
const depthSortedLayerSet = new Set(depthSortedLayers.map(({ layer }) => layer));
const tilesetsByGid = [...tilesets].sort((a, b) => a.firstGid - b.firstGid);

const findTileset = (gid) => {
  for (let index = tilesetsByGid.length - 1; index >= 0; index -= 1) {
    const tileset = tilesetsByGid[index];
    if (gid >= tileset.firstGid && gid < tileset.firstGid + tileset.tileCount) return tileset;
  }
  return null;
};

const drawTile = (context, image, tileset, rawGid, x, y) => {
  const gid = (rawGid >>> 0) & GID_MASK;
  if (!gid) return;

  const localId = gid - tileset.firstGid;
  const sourceX = (localId % tileset.columns) * mapTileSize;
  const sourceY = Math.floor(localId / tileset.columns) * mapTileSize;
  const flipHorizontal = ((rawGid >>> 0) & FLIP_HORIZONTAL) !== 0;
  const flipVertical = ((rawGid >>> 0) & FLIP_VERTICAL) !== 0;
  const flipDiagonal = ((rawGid >>> 0) & FLIP_DIAGONAL) !== 0;
  const halfTile = mapTileSize / 2;

  context.save();
  context.translate(x + halfTile, y + halfTile);
  if (flipDiagonal) context.transform(0, 1, 1, 0, 0, 0);
  context.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
  context.drawImage(
    image,
    sourceX,
    sourceY,
    mapTileSize,
    mapTileSize,
    -halfTile,
    -halfTile,
    mapTileSize,
    mapTileSize
  );
  context.restore();
};

const renderMap = (canvas, images) => {
  const context = canvas.getContext('2d');
  if (!context) return;

  canvas.width = mapWidth;
  canvas.height = mapHeight;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, mapWidth, mapHeight);

  tileLayers.forEach(({ layer, parents }) => {
    if (depthSortedLayerSet.has(layer)) return;
    if (layer.visible === false || parents.some((parent) => parent.visible === false)) return;
    const parentOpacity = parents.reduce((opacity, parent) => opacity * (parent.opacity ?? 1), 1);
    context.globalAlpha = parentOpacity * (layer.opacity ?? 1);

    const layerOffsetX = (layer.x || 0) * mapTileSize + (layer.offsetx || 0);
    const layerOffsetY = (layer.y || 0) * mapTileSize + (layer.offsety || 0);
    const width = layer.width || tiledMap.width;

    layer.data.forEach((rawGid, index) => {
      const gid = (rawGid >>> 0) & GID_MASK;
      if (!gid) return;
      const tileset = findTileset(gid);
      if (!tileset) return;
      const image = images.get(tileset.name);
      if (!image) return;

      const x = (index % width) * mapTileSize + layerOffsetX;
      const y = Math.floor(index / width) * mapTileSize + layerOffsetY;
      drawTile(context, image, tileset, rawGid, x, y);
    });
  });

  context.globalAlpha = 1;
};

const renderForegroundRow = (canvas, images, row) => {
  const context = canvas.getContext('2d');
  if (!context) return;

  const rowTop = row * mapTileSize;
  canvas.width = mapWidth;
  canvas.height = mapTileSize;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, mapWidth, mapTileSize);

  depthSortedLayers.forEach(({ layer, parents }) => {
    if (layer.visible === false || parents.some((parent) => parent.visible === false)) return;
    const parentOpacity = parents.reduce((opacity, parent) => opacity * (parent.opacity ?? 1), 1);
    context.globalAlpha = parentOpacity * (layer.opacity ?? 1);

    const layerOffsetX = (layer.x || 0) * mapTileSize + (layer.offsetx || 0);
    const layerOffsetY = (layer.y || 0) * mapTileSize + (layer.offsety || 0);
    const width = layer.width || tiledMap.width;
    const rowBottom = rowTop + mapTileSize;

    layer.data.forEach((rawGid, index) => {
      const gid = (rawGid >>> 0) & GID_MASK;
      if (!gid) return;
      const tileset = findTileset(gid);
      const image = tileset && images.get(tileset.name);
      if (!tileset || !image) return;

      const x = (index % width) * mapTileSize + layerOffsetX;
      const y = Math.floor(index / width) * mapTileSize + layerOffsetY;
      if (y >= rowBottom || y + mapTileSize <= rowTop) return;
      drawTile(context, image, tileset, rawGid, x, y - rowTop);
    });
  });

  context.globalAlpha = 1;
};

const TiledMapCanvas = () => {
  const canvasRef = useRef(null);
  const foregroundRowRefs = useRef([]);

  useEffect(() => {
    let cancelled = false;
    const images = new Map();
    const loadImage = ({ name, image: src }) => new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        images.set(name, image);
        resolve();
      };
      image.onerror = () => resolve();
      image.src = src;
    });

    Promise.all(tilesets.map(loadImage)).then(() => {
      if (cancelled || !canvasRef.current) return;
      renderMap(canvasRef.current, images);
      foregroundRowRefs.current.forEach((canvas, row) => {
        if (canvas) renderForegroundRow(canvas, images, row);
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="game-map__tiles"
        width={mapWidth}
        height={mapHeight}
        aria-label="Peta permainan"
      />
      {Array.from({ length: Math.ceil(mapHeight / mapTileSize) }, (_, row) => (
        <canvas
          key={row}
          ref={(canvas) => { foregroundRowRefs.current[row] = canvas; }}
          className="game-map__foreground-row"
          width={mapWidth}
          height={mapTileSize}
          style={{ top: `${row * mapTileSize}px`, zIndex: (row + 1) * 10 }}
          aria-hidden="true"
        />
      ))}
    </>
  );
};

export default TiledMapCanvas;
