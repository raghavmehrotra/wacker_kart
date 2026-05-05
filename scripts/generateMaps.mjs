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
      } else if (cx > WATER_X_THRESHOLD) {
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
    roadHalfWidth: 42,
    shoulderHalfWidth: 62,
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
    id: "hyde-park",
    roadHalfWidth: 42,
    shoulderHalfWidth: 62,
    spawnPoint: pt(1280, 790),
    finishLine: { x: 880, y: 780, width: 130, height: 28 },
    southTurnaround: { x: 910, y: 3380, width: 350, height: 170 },
    trackPolylines: [
      [pt(1280,640),pt(1380,1010),pt(1470,1330),pt(1610,1690),pt(1560,2090),pt(1380,2470),pt(1280,2870),pt(1330,3210)],
      [pt(1330,3210),pt(1240,3460),pt(1080,3550),pt(920,3480),pt(820,3310)],
      [pt(820,3310),pt(720,2950),pt(620,2590),pt(700,2240),pt(890,1880),pt(970,1520),pt(900,1110),pt(940,720)],
      [pt(940,720),pt(1020,470),pt(1160,380),pt(1310,420),pt(1280,640)],
    ],
    malortPickups: [
      { x: 1550, y: 1810, radius: 24 },
      { x: 750, y: 2380, radius: 24 },
    ],
    treeObstacles: [
      { x: 1460, y: 2470, radius: 34 },
      { x: 860, y: 2580, radius: 28 },
    ],
  },
  {
    id: "ohare",
    roadHalfWidth: 42,
    shoulderHalfWidth: 62,
    spawnPoint: pt(1190, 690),
    finishLine: { x: 720, y: 780, width: 120, height: 28 },
    southTurnaround: { x: 820, y: 3390, width: 320, height: 170 },
    trackPolylines: [
      [pt(1200,540),pt(1210,960),pt(1320,1350),pt(1480,1710),pt(1500,2150),pt(1370,2530),pt(1220,2910),pt(1180,3270)],
      [pt(1180,3270),pt(1120,3470),pt(970,3560),pt(790,3500),pt(670,3330)],
      [pt(670,3330),pt(650,2910),pt(730,2470),pt(820,2080),pt(780,1580),pt(700,1160),pt(760,730)],
      [pt(760,730),pt(860,500),pt(1010,410),pt(1160,440),pt(1200,540)],
    ],
    malortPickups: [
      { x: 1470, y: 1860, radius: 24 },
      { x: 760, y: 2450, radius: 24 },
    ],
    treeObstacles: [
      { x: 760, y: 2080, radius: 30 },
      { x: 1400, y: 2520, radius: 30 },
    ],
  },
  {
    id: "lower-wacker",
    roadHalfWidth: 42,
    shoulderHalfWidth: 62,
    spawnPoint: pt(1400, 790),
    finishLine: { x: 940, y: 930, width: 120, height: 28 },
    southTurnaround: { x: 1080, y: 3380, width: 360, height: 170 },
    trackPolylines: [
      [pt(1410,620),pt(1560,980),pt(1540,1360),pt(1360,1680),pt(1210,1980),pt(1280,2360),pt(1490,2730),pt(1500,3130)],
      [pt(1500,3130),pt(1450,3430),pt(1270,3560),pt(1050,3510),pt(930,3300)],
      [pt(930,3300),pt(850,2890),pt(700,2470),pt(630,2020),pt(760,1630),pt(930,1270),pt(980,910)],
      [pt(980,910),pt(1080,620),pt(1230,500),pt(1380,520),pt(1410,620)],
    ],
    malortPickups: [
      { x: 1340, y: 1780, radius: 24 },
      { x: 730, y: 2280, radius: 24 },
    ],
    treeObstacles: [
      { x: 1210, y: 2030, radius: 28 },
      { x: 810, y: 2460, radius: 28 },
      { x: 1460, y: 2770, radius: 28 },
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
