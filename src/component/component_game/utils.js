export const randomFromArray = (array) => array[Math.floor(Math.random() * array.length)];

export const getKeyString = (x, y) => `${x}x${y}`;

export const TILE_SIZE = 16;

export const createName = () => {
  const prefix = randomFromArray([
    "COOL", "SUPER", "HIP", "SMUG", "COOL", "SILKY", "GOOD",
    "SAFE", "DEAR", "DAMP", "WARM", "RICH", "LONG", "DARK",
    "SOFT", "BUFF", "DOPE",
  ]);
  const animal = randomFromArray([
    "BEAR", "DOG", "CAT", "FOX", "LAMB", "LION", "BOAR",
    "GOAT", "VOLE", "SEAL", "PUMA", "MULE", "BULL", "BIRD", "BUG",
  ]);
  return `${prefix} ${animal}`;
};

export const isSolid = (x, y, mapData) => {
  const key = getKeyString(x, y);
  if (x >= mapData.maxX || x < mapData.minX || y >= mapData.maxY || y < mapData.minY) return true;
  if (mapData.bridgeSpaces?.[key]) return false;
  return (
    Boolean(mapData.blockedSpaces?.[key]) ||
    (mapData.walkableSpaces && !mapData.walkableSpaces[key])
  );
};

export const canMoveTo = (fromX, fromY, toX, toY, mapData) => {
  if (isSolid(toX, toY, mapData)) return false;

  const fromKey = getKeyString(fromX, fromY);
  const toKey = getKeyString(toX, toY);
  const fromOnStairs = Boolean(mapData.staircaseSpaces?.[fromKey]);
  const toOnStairs = Boolean(mapData.staircaseSpaces?.[toKey]);
  const fromOnPlatform = Boolean(mapData.house3PlatformSpaces?.[fromKey]);
  const toOnPlatform = Boolean(mapData.house3PlatformSpaces?.[toKey]);
  const fromInHouse3Route = fromOnStairs || fromOnPlatform;
  const toInHouse3Route = toOnStairs || toOnPlatform;

  if (!fromInHouse3Route && !toInHouse3Route) return true;

  const bottom = mapData.staircaseBottom;
  const entry = mapData.staircaseEntry;
  if ((fromKey === bottom && toKey === entry) || (fromKey === entry && toKey === bottom)) return true;

  if (fromOnStairs && toOnStairs) {
    return Boolean(mapData.staircaseConnections?.[fromKey]?.includes(toKey));
  }
  if (fromOnPlatform && toOnPlatform) {
    return Math.abs(fromX - toX) + Math.abs(fromY - toY) === 1;
  }

  const isAdjacent = Math.abs(fromX - toX) + Math.abs(fromY - toY) === 1;
  if (fromOnStairs && toOnPlatform) {
    // The visible stair landing can meet the porch at more than one tile.
    // Allow the player to step onto that landing instead of requiring a
    // single hard-coded top tile; once on the porch, route rules still apply.
    return isAdjacent;
  }
  if (fromOnPlatform && toOnStairs) {
    return isAdjacent;
  }
  return false;
};

export const isBehindDepthSortedObject = (x, y, mapData) => {
  // The rendered character occupies 48px and is shifted 12px upward from its grid position.
  const footY = y + (48 - 12) / TILE_SIZE;
  return mapData.depthSortedColumnRanges?.[x]?.some(({ top, bottom }) => (
    footY > top && footY < bottom
  )) || false;
};

const findSafeSpawn = (point, mapData) => {
  const maxDistance = Math.max(mapData.maxX - mapData.minX, mapData.maxY - mapData.minY);
  for (let distance = 0; distance <= maxDistance; distance += 1) {
    for (let y = point.y - distance; y <= point.y + distance; y += 1) {
      for (let x = point.x - distance; x <= point.x + distance; x += 1) {
        if (Math.abs(x - point.x) + Math.abs(y - point.y) !== distance) continue;
        if (!isSolid(x, y, mapData)) return { x, y };
      }
    }
  }
  return null;
};

export const getRandomSafeSpot = (mapData) => {
  if (mapData?.spawnPoints?.length) {
    const candidates = mapData.spawnPoints
      .map((point) => findSafeSpawn(point, mapData))
      .filter(Boolean);
    if (candidates.length) return randomFromArray(candidates);
  }

  return randomFromArray([
    { x: 8, y: 5 }, { x: 12, y: 5 }, { x: 16, y: 5 }, { x: 20, y: 5 },
    { x: 8, y: 8 }, { x: 12, y: 8 }, { x: 16, y: 8 }, { x: 20, y: 8 },
    { x: 8, y: 11 }, { x: 12, y: 11 }, { x: 16, y: 11 }, { x: 20, y: 11 },
  ]);
};
