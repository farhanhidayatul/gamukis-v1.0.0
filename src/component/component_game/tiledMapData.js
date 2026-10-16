import map1 from './map_assets/map1.json';
import woodsTileset from './map_assets/free_pixel_16_woods.png';
import rockSlopeTileset from './map_assets/Tileset_RockSlope.png';
import shadowTileset from './map_assets/Shadow_Sqare_24x48_Flat_Black.png';
import roadTileset from './map_assets/Tileset_Road.png';
import revampTileset from '../../images/map - revamp.jpg';
import treeTileset from './map_assets/tree.png';
import houseHay1 from './map_assets/House_Hay_1.png';
import houseHay2 from './map_assets/House_Hay_2.png';
import houseHay3 from './map_assets/House_Hay_3.png';
import { getKeyString } from './utils';

export const tiledMap = map1;
export const mapTileSize = map1.tilewidth;
export const mapWidth = map1.width * mapTileSize;
export const mapHeight = map1.height * mapTileSize;

export const tilesets = [
  { name: 'woods', firstGid: 1, tileCount: 264, columns: 22, image: woodsTileset },
  { name: 'rock-slope', firstGid: 277, tileCount: 4096, columns: 64, image: rockSlopeTileset },
  { name: 'shadow', firstGid: 4427, tileCount: 3, columns: 1, image: shadowTileset },
  { name: 'road', firstGid: 4886, tileCount: 84, columns: 6, image: roadTileset },
  { name: 'map-revamp', firstGid: 4992, tileCount: 4224, columns: 88, image: revampTileset },
  { name: 'tree', firstGid: 9216, tileCount: 256, columns: 16, image: treeTileset },
  { name: 'house-hay-1', firstGid: 9892, tileCount: 30, columns: 5, image: houseHay1 },
  { name: 'house-hay-2', firstGid: 9922, tileCount: 63, columns: 9, image: houseHay2 },
  { name: 'house-hay-3', firstGid: 9985, tileCount: 88, columns: 11, image: houseHay3 }
];

export const findLayers = (layers, predicate, parents = []) => layers.flatMap((layer) => {
  const ancestry = [...parents, layer];
  const match = predicate(layer) ? [{ layer, parents }] : [];
  return [...match, ...(layer.layers ? findLayers(layer.layers, predicate, ancestry) : [])];
});

const tileLayers = findLayers(map1.layers, ({ type }) => type === 'tilelayer');
const namedLayer = (name) => tileLayers.find(({ layer }) => layer.name === name)?.layer;
const gidAt = (layer, index) => ((layer?.data?.[index] || 0) >>> 0) & 0x0fffffff;
const grassLayer = namedLayer('grass');
const darkGrassLayer = namedLayer('dark grass');
const sandLayer = namedLayer('mud');
const house3Layer = namedLayer('house 3');
const bridgeLayers = findLayers(map1.layers, ({ type, name }) => type === 'tilelayer' && /jembatan/i.test(name));
const obstacleLayers = tileLayers
  .filter(({ layer }) => /^wall/i.test(layer.name))
  .map(({ layer }) => layer);
export const depthSortedLayers = tileLayers
  .filter(({ layer }) => /^(house|tree)/i.test(layer.name));
const objectBorderLayers = findLayers(map1.layers, ({ type, name }) => (
  type === 'objectgroup' && name.toLowerCase() !== 'spawn'
));

const getObjectBounds = (object) => {
  const points = object.polygon || object.polyline;
  if (points?.length) {
    const absolutePoints = points.map(({ x, y }) => ({ x: object.x + x, y: object.y + y }));
    return {
      minX: Math.min(...absolutePoints.map(({ x }) => x)),
      minY: Math.min(...absolutePoints.map(({ y }) => y)),
      maxX: Math.max(...absolutePoints.map(({ x }) => x)),
      maxY: Math.max(...absolutePoints.map(({ y }) => y))
    };
  }

  if (object.width > 0 && object.height > 0) {
    return {
      minX: object.x,
      minY: object.y,
      maxX: object.x + object.width,
      maxY: object.y + object.height
    };
  }

  return null;
};

const walkableSpaces = {};
const blockedSpaces = {};
const objectBorderSpaces = {};
const decorativeObjectSpaces = {};
const staircaseSpaces = {};
const house3PlatformSpaces = {};
const sandSpaces = {};
const depthSortedRowsByColumn = {};
const bridgeSpaces = {};
const staircaseConnections = {};
const coinSpawnPoints = [];
const house3StairRoute = [
  [37, 21], [37, 20], [38, 20], [38, 19], [39, 19], [39, 18]
];
const house3PlatformCells = [];
for (let y = 18; y <= 21; y += 1) {
  for (let x = 40; x <= 42; x += 1) house3PlatformCells.push([x, y]);
}

for (let y = 0; y < map1.height; y += 1) {
  for (let x = 0; x < map1.width; x += 1) {
    const index = y * map1.width + x;
    const key = getKeyString(x, y);
    const isGrass = gidAt(grassLayer, index) > 0;
    const isDarkGrass = gidAt(darkGrassLayer, index) > 0;
    const isSand = gidAt(sandLayer, index) > 0;
    const isBridge = bridgeLayers.some(({ layer }) => gidAt(layer, index) > 0);
    if (isSand) sandSpaces[key] = true;
    if (isBridge) bridgeSpaces[key] = true;
    if (isGrass || isDarkGrass || isSand || isBridge) walkableSpaces[key] = true;

    const hasDepthSortedObject = depthSortedLayers.some(({ layer }) => gidAt(layer, index) > 0);
    if (hasDepthSortedObject) {
      decorativeObjectSpaces[key] = true;
      // House/tree art is passable by default; only explicit Tiled object borders block it.
      walkableSpaces[key] = true;
      (depthSortedRowsByColumn[x] ||= []).push(y);
    }

    if (obstacleLayers.some((layer) => gidAt(layer, index) > 0)) {
      blockedSpaces[key] = true;
    }
  }
}

objectBorderLayers.forEach(({ layer, parents }) => {
  const inheritedOffset = parents.reduce((offset, parent) => ({
    x: offset.x + (parent.offsetx || 0),
    y: offset.y + (parent.offsety || 0)
  }), { x: 0, y: 0 });
  const layerOffsetX = inheritedOffset.x + (layer.offsetx || 0) + (layer.x || 0) * mapTileSize;
  const layerOffsetY = inheritedOffset.y + (layer.offsety || 0) + (layer.y || 0) * mapTileSize;

  (layer.objects || []).forEach((object) => {
    const bounds = getObjectBounds(object);
    if (!bounds) return;

    const minTileX = Math.max(0, Math.floor((bounds.minX + layerOffsetX) / mapTileSize));
    const maxTileX = Math.min(map1.width - 1, Math.ceil((bounds.maxX + layerOffsetX) / mapTileSize) - 1);
    const maxTileY = Math.min(map1.height - 1, Math.ceil((bounds.maxY + layerOffsetY) / mapTileSize) - 1);
    const isHouseFoundationBorder = layer.name.toLowerCase() === 'house_border';
    const minTileY = Math.max(0, isHouseFoundationBorder
      ? maxTileY
      : Math.floor((bounds.minY + layerOffsetY) / mapTileSize));

    for (let y = minTileY; y <= maxTileY; y += 1) {
      for (let x = minTileX; x <= maxTileX; x += 1) {
        objectBorderSpaces[getKeyString(x, y)] = true;
      }
    }
  });
});

Object.assign(blockedSpaces, objectBorderSpaces);

// House 3's upper roof is a passable, elevated background area: players can
// walk behind its artwork and are depth-occluded by the foreground rows.
// Keep the lower wall/foundation solid; the existing staircase and porch
// route below remain the only way across that part of the house.
if (house3Layer) {
  const width = house3Layer.width || map1.width;
  house3Layer.data.forEach((gid, index) => {
    if (!gidAt(house3Layer, index)) return;
    const x = index % width + (house3Layer.x || 0);
    const y = Math.floor(index / width) + (house3Layer.y || 0);
    const key = getKeyString(x, y);
    if (y <= 18) {
      delete blockedSpaces[key];
      walkableSpaces[key] = true;
    } else {
      blockedSpaces[key] = true;
    }
  });
}

// Bridge object borders and shoreline wall tiles describe the river banks;
// bridge deck tiles take precedence so players can cross the whole bridge.
Object.keys(bridgeSpaces).forEach((key) => {
  delete blockedSpaces[key];
});

// House 3's visible stairs climb from the lower-left foundation toward its
// upper-left doorway. Only this route is open through the house.
house3StairRoute.forEach(([x, y], index) => {
  const key = getKeyString(x, y);
  delete blockedSpaces[key];
  staircaseSpaces[key] = true;
  const next = house3StairRoute[index + 1];
  if (next) {
    const nextKey = getKeyString(next[0], next[1]);
    (staircaseConnections[key] ||= []).push(nextKey);
    (staircaseConnections[nextKey] ||= []).push(key);
  }
});
house3PlatformCells.forEach(([x, y]) => {
  const key = getKeyString(x, y);
  delete blockedSpaces[key];
  house3PlatformSpaces[key] = true;
});

const depthSortedColumnRanges = Object.fromEntries(
  Object.entries(depthSortedRowsByColumn).map(([x, rows]) => {
    const sortedRows = [...new Set(rows)].sort((a, b) => a - b);
    const ranges = [];
    let top = sortedRows[0];
    let bottom = top + 1;

    sortedRows.slice(1).forEach((row) => {
      if (row > bottom) {
        ranges.push({ top, bottom });
        top = row;
      }
      bottom = row + 1;
    });
    ranges.push({ top, bottom });
    return [x, ranges];
  })
);

for (let y = 0; y < map1.height; y += 1) {
  for (let x = 0; x < map1.width; x += 1) {
    const key = getKeyString(x, y);
    const index = y * map1.width + x;
    const hasCoinGround = gidAt(grassLayer, index) > 0 || gidAt(darkGrassLayer, index) > 0;
    if (hasCoinGround && !blockedSpaces[key] && !decorativeObjectSpaces[key] && !bridgeSpaces[key]) {
      coinSpawnPoints.push({ x, y });
    }
  }
}

const spawnLayer = findLayers(map1.layers, ({ type, name }) => type === 'objectgroup' && name === 'spawn')[0]?.layer;

export const mapSpawnPoints = (spawnLayer?.objects || []).map(({ x, y }) => ({
  x: Math.max(0, Math.min(map1.width - 1, Math.round(x / mapTileSize))),
  y: Math.max(0, Math.min(map1.height - 1, Math.round(y / mapTileSize)))
}));

export const mapData = {
  minX: 0,
  maxX: map1.width,
  minY: 0,
  maxY: map1.height,
  walkableSpaces,
  blockedSpaces,
  depthSortedColumnRanges,
  depthSortedSpaces: decorativeObjectSpaces,
  staircaseSpaces,
  staircaseConnections,
  staircaseEntry: getKeyString(37, 22),
  staircaseBottom: getKeyString(37, 21),
  staircaseTop: getKeyString(39, 18),
  house3PlatformSpaces,
  bridgeSpaces,
  sandSpaces,
  coinSpawnPoints,
  spawnPoints: mapSpawnPoints
};
