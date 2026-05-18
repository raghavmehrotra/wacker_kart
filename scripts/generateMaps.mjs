/**
 * Generates Tiled JSON (.tmj) map files for all 4 tracks.
 * Run with: node scripts/generateMaps.mjs
 *
 * Each map has:
 *   - surface tile layer  (grass / water / shoulder / road)
 *   - objects layer       (spawns, finish-line, turnaround, item-pickups, tree-obstacles)
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = join(__dirname, "..", "public", "maps");

const TILE_SIZE = 32;
const WORLD_WIDTH = 2600;
const WORLD_HEIGHT = 4000;
const COLS = Math.ceil(WORLD_WIDTH / TILE_SIZE); // 82
const ROWS = Math.ceil(WORLD_HEIGHT / TILE_SIZE); // 125

// 1-based tile indices, matching the tileset strip order
const TILE_GRASS = 1;
const TILE_WATER = 2;
const TILE_SHOULDER = 3;
const TILE_ROAD = 4;
const TILE_POTHOLE = 5;

// Water starts at this world X (east side of track)
const WATER_X_THRESHOLD = 1560;

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function scatterPotholes(data, seed, rate) {
  const rng = makeRng(seed);
  return data.map((tile) => (tile === TILE_ROAD && rng() < rate ? TILE_POTHOLE : tile));
}

function pt(x, y) {
  return { x, y };
}

function ptToSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

function nearestTrackDist(cx, cy, polylines) {
  let min = Infinity;
  for (const poly of polylines) {
    for (let i = 0; i < poly.length - 1; i++) {
      const d = ptToSegDist(cx, cy, poly[i].x, poly[i].y, poly[i + 1].x, poly[i + 1].y);
      if (d < min) min = d;
    }
  }
  return min;
}

function generateSurface(track) {
  const { trackPolylines, roadHalfWidth, shoulderHalfWidth } = track;
  const data = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cx = col * TILE_SIZE + TILE_SIZE / 2;
      const cy = row * TILE_SIZE + TILE_SIZE / 2;
      const dist = nearestTrackDist(cx, cy, trackPolylines);

      let tile;
      if (dist <= roadHalfWidth) {
        tile = TILE_ROAD;
      } else if (dist <= shoulderHalfWidth) {
        tile = TILE_SHOULDER;
      } else if (track.hasWaterEast && cx > WATER_X_THRESHOLD) {
        tile = TILE_WATER;
      } else {
        tile = TILE_GRASS;
      }

      data.push(tile);
    }
  }

  return data;
}

function makeObjects(track) {
  const { spawnPoint, finishLine, southTurnaround, malortPickups, treeObstacles } = track;
  const objects = [];
  let id = 1;

  // 4 spawn slots within the road half-width (42 px), offset in +X along the lane
  const spawnOffsets = [-5, 5, 15, 25];
  for (let i = 0; i < 4; i++) {
    objects.push({
      id: id++,
      name: `spawn-${i + 1}`,
      type: "spawn",
      x: spawnPoint.x + spawnOffsets[i],
      y: spawnPoint.y,
      width: 0,
      height: 0,
      point: true,
      visible: true,
      properties: [{ name: "slot", type: "int", value: i + 1 }],
    });
  }

  objects.push({
    id: id++,
    name: "finish-line",
    type: "finish-line",
    x: finishLine.x,
    y: finishLine.y,
    width: finishLine.width,
    height: finishLine.height,
    visible: true,
    rotation: 0,
  });

  objects.push({
    id: id++,
    name: "turnaround",
    type: "turnaround",
    x: southTurnaround.x,
    y: southTurnaround.y,
    width: southTurnaround.width,
    height: southTurnaround.height,
    visible: true,
    rotation: 0,
  });

  for (const pickup of malortPickups) {
    objects.push({
      id: id++,
      name: "malort-pickup",
      type: "item-pickup",
      x: pickup.x - pickup.radius,
      y: pickup.y - pickup.radius,
      width: pickup.radius * 2,
      height: pickup.radius * 2,
      visible: true,
      rotation: 0,
      properties: [{ name: "itemType", type: "string", value: "malort-shot" }],
    });
  }

  for (const tree of treeObstacles) {
    objects.push({
      id: id++,
      name: "tree-obstacle",
      type: "tree-obstacle",
      x: tree.x - tree.radius,
      y: tree.y - tree.radius,
      width: tree.radius * 2,
      height: tree.radius * 2,
      visible: true,
      rotation: 0,
    });
  }

  return objects;
}

function buildTiledJSON(track) {
  let data = generateSurface(track);
  if (track.id === "lower-wacker") {
    data = scatterPotholes(data, 0xdeadbeef, 0.08);
  }
  const objects = makeObjects(track);

  return {
    compressionlevel: -1,
    height: ROWS,
    infinite: false,
    layers: [
      {
        data,
        height: ROWS,
        id: 1,
        name: "surface",
        opacity: 1,
        type: "tilelayer",
        visible: true,
        width: COLS,
        x: 0,
        y: 0,
      },
      {
        draworder: "topdown",
        id: 2,
        name: "objects",
        objects,
        opacity: 1,
        type: "objectgroup",
        visible: true,
        x: 0,
        y: 0,
      },
    ],
    nextlayerid: 3,
    nextobjectid: objects.length + 1,
    orientation: "orthogonal",
    renderorder: "right-down",
    tiledversion: "1.10.2",
    tileheight: TILE_SIZE,
    tilesets: [
      {
        columns: 5,
        firstgid: 1,
        image: "../tilesets/track-tiles.png",
        imageheight: TILE_SIZE,
        imagewidth: TILE_SIZE * 5,
        margin: 0,
        name: "track-tiles",
        spacing: 0,
        tilecount: 5,
        tileheight: TILE_SIZE,
        tilewidth: TILE_SIZE,
      },
    ],
    tilewidth: TILE_SIZE,
    type: "map",
    version: "1.10",
    width: COLS,
  };
}

// ── Track data (pure coordinates — no Phaser dependency) ──────────────────────

const TRACKS = [
  {
    id: "lake-shore-drive",
    hasWaterEast: true,
    roadHalfWidth: 64,
    shoulderHalfWidth: 96,
    spawnPoint: pt(1450, 760),
    finishLine: { x: 872, y: 690, width: 120, height: 28 },
    southTurnaround: { x: 1010, y: 3390, width: 390, height: 170 },
    trackPolylines: [
      [pt(1450,620),pt(1510,1120),pt(1820,1650),pt(1710,1960),pt(1460,2280),pt(1590,2860),pt(1410,3220)],
      [pt(1410,3220),pt(1400,3420),pt(1290,3550),pt(1110,3560),pt(980,3450),pt(960,3220)],
      [pt(960,3220),pt(900,2830),pt(760,2440),pt(640,2100),pt(860,1640),pt(840,1120),pt(930,620)],
      [pt(930,620),pt(950,430),pt(1050,320),pt(1210,275),pt(1380,320),pt(1440,460),pt(1450,620)],
    ],
    malortPickups: [
      { x: 1715, y: 1885, radius: 24 },
      { x: 700, y: 2270, radius: 24 },
    ],
    treeObstacles: [
      { x: 1490, y: 2860, radius: 34 },
    ],
  },
  {
    // Rectangular campus loop — straight east/west legs, green infield Quad
    id: "hyde-park",
    hasWaterEast: false,
    roadHalfWidth: 64,
    shoulderHalfWidth: 96,
    spawnPoint: pt(1730, 540),
    finishLine: { x: 1700, y: 436, width: 96, height: 32 },
    southTurnaround: { x: 840, y: 3550, width: 740, height: 210 },
    trackPolylines: [
      // East side going south (straight)
      [pt(1750,456), pt(1750,1000), pt(1750,2000), pt(1750,3000), pt(1750,3500)],
      // South connector — the Midway
      [pt(1750,3500), pt(1500,3700), pt(1250,3790), pt(1000,3700), pt(750,3500)],
      // West side going north (straight)
      [pt(750,3500), pt(750,3000), pt(750,2000), pt(750,1000), pt(750,456)],
      // North connector — Quad Drive
      [pt(750,456), pt(1000,278), pt(1250,210), pt(1500,278), pt(1750,456)],
    ],
    malortPickups: [
      { x: 1750, y: 2000, radius: 24 },
      { x: 750, y: 1500, radius: 24 },
    ],
    treeObstacles: [
      { x: 1802, y: 1400, radius: 28 },
      { x: 698, y: 2600, radius: 28 },
      { x: 1802, y: 2800, radius: 28 },
    ],
  },
  {
    // Two dead-straight runways connected by short terminal/cargo curves
    id: "ohare",
    hasWaterEast: false,
    roadHalfWidth: 72,
    shoulderHalfWidth: 108,
    spawnPoint: pt(1682, 304),
    finishLine: { x: 1630, y: 232, width: 112, height: 32 },
    southTurnaround: { x: 840, y: 3740, width: 720, height: 200 },
    trackPolylines: [
      // East runway going south (straight)
      [pt(1700,264), pt(1700,700), pt(1700,1500), pt(1700,2300), pt(1700,3100), pt(1700,3660)],
      // South connector — cargo perimeter
      [pt(1700,3660), pt(1440,3860), pt(1200,3930), pt(960,3860), pt(700,3660)],
      // West runway going north (straight)
      [pt(700,3660), pt(700,3100), pt(700,2300), pt(700,1500), pt(700,700), pt(700,264)],
      // North connector — terminal departure loop
      [pt(700,264), pt(960,80), pt(1200,20), pt(1440,80), pt(1700,264)],
    ],
    malortPickups: [
      { x: 1700, y: 2000, radius: 24 },
      { x: 700, y: 1500, radius: 24 },
    ],
    treeObstacles: [
      { x: 1764, y: 1100, radius: 32 },
      { x: 636, y: 1900, radius: 32 },
      { x: 1764, y: 2700, radius: 32 },
      { x: 636, y: 3100, radius: 28 },
    ],
  },
  {
    // Tight winding loop: starts underground, emerges to surface mid-track, dives back down
    id: "lower-wacker",
    hasWaterEast: false,
    roadHalfWidth: 56,
    shoulderHalfWidth: 88,
    spawnPoint: pt(1440, 560),
    finishLine: { x: 1188, y: 208, width: 116, height: 52 },
    southTurnaround: { x: 870, y: 3460, width: 500, height: 210 },
    trackPolylines: [
      // East/right side going south (tunnel → surface → tunnel)
      [pt(1400,264), pt(1440,520), pt(1520,860), pt(1580,1210),
       pt(1560,1560), pt(1480,1910),
       pt(1440,2270), pt(1510,2620), pt(1550,2970), pt(1500,3290), pt(1460,3450)],
      // Bottom hairpin
      [pt(1460,3450), pt(1360,3620), pt(1160,3720), pt(960,3660), pt(840,3470)],
      // West/left side going north (tunnel → surface → tunnel)
      [pt(840,3470), pt(800,3210), pt(760,2880), pt(800,2560),
       pt(860,2260), pt(820,1910),
       pt(780,1560), pt(760,1210), pt(820,860), pt(880,520), pt(920,264)],
      // Top connector (tunnel level)
      [pt(920,264), pt(1080,118), pt(1250,68), pt(1380,128), pt(1400,264)],
    ],
    malortPickups: [
      { x: 1540, y: 1100, radius: 24 },
      { x: 790, y: 2060, radius: 24 },
    ],
    treeObstacles: [
      { x: 1578, y: 1760, radius: 26 },
      { x: 822, y: 1310, radius: 26 },
      { x: 1488, y: 2740, radius: 26 },
    ],
  },
];

// ── Generate ──────────────────────────────────────────────────────────────────

mkdirSync(MAPS_DIR, { recursive: true });

for (const track of TRACKS) {
  const json = buildTiledJSON(track);
  const outPath = join(MAPS_DIR, `${track.id}.tmj`);
  writeFileSync(outPath, JSON.stringify(json));
  const kb = Math.round(Buffer.byteLength(JSON.stringify(json)) / 1024);
  console.log(`  wrote ${track.id}.tmj  (${kb} KB)`);
}

console.log("done.");
