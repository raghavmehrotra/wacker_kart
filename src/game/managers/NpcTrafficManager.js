// ── Lower Wacker: oncoming city traffic ───────────────────────────────────
const WACKER_LOOP = [
  { x: 1400, y: 264 }, { x: 1440, y: 520 }, { x: 1520, y: 860 }, { x: 1580, y: 1210 },
  { x: 1560, y: 1560 }, { x: 1480, y: 1910 }, { x: 1440, y: 2270 }, { x: 1510, y: 2620 },
  { x: 1550, y: 2970 }, { x: 1500, y: 3290 }, { x: 1460, y: 3450 },
  { x: 1360, y: 3620 }, { x: 1160, y: 3720 }, { x: 960, y: 3660 }, { x: 840, y: 3470 },
  { x: 800, y: 3210 }, { x: 760, y: 2880 }, { x: 800, y: 2560 }, { x: 860, y: 2260 },
  { x: 820, y: 1910 }, { x: 780, y: 1560 }, { x: 760, y: 1210 }, { x: 820, y: 860 },
  { x: 880, y: 520 }, { x: 920, y: 264 },
  { x: 1080, y: 118 }, { x: 1250, y: 68 }, { x: 1380, y: 128 },
];
const WACKER_SPECS = [
  { startIdx: 0,  speed: 235, bodyColor: 0xf0c020, loop: WACKER_LOOP, dir: -1, large: false },
  { startIdx: 13, speed: 215, bodyColor: 0xdcdcd4, loop: WACKER_LOOP, dir: -1, large: false },
];

// ── O'Hare: oncoming cargo vehicles ───────────────────────────────────────
const OHARE_LOOP = [
  { x: 1700, y: 264 }, { x: 1700, y: 800 }, { x: 1700, y: 1500 },
  { x: 1700, y: 2200 }, { x: 1700, y: 2900 }, { x: 1700, y: 3660 },
  { x: 1440, y: 3860 }, { x: 1200, y: 3930 }, { x: 960, y: 3860 }, { x: 700, y: 3660 },
  { x: 700, y: 2900 }, { x: 700, y: 2200 }, { x: 700, y: 1500 },
  { x: 700, y: 800 },  { x: 700, y: 264 },
  { x: 960, y: 80 },   { x: 1200, y: 20 },  { x: 1440, y: 80 },
];
const OHARE_SPECS = [
  { startIdx: 4, speed: 75, bodyColor: 0xd4a820, loop: OHARE_LOOP, dir: -1, large: true },
  { startIdx: 12, speed: 62, bodyColor: 0x6a8870, loop: OHARE_LOOP, dir: -1, large: true },
];

// ── Hyde Park: moving students — east crossings, west crossings, wanderers ─
const xE = (y) => [{ x: 980, y }, { x: 1980, y }];   // crosses east lane
const xW = (y) => [{ x: 610, y }, { x: 1520, y }];   // crosses west lane
const quad = (...pts) => pts.map(([x, y]) => ({ x, y }));

const HYDEPARK_SPECS = [
  // East-lane crossers — gowned
  { startIdx: 0, speed: 55, bodyColor: 0x1a2a99, loop: xE(680),  dir: -1, pedestrian: true, isGown: true },
  { startIdx: 1, speed: 60, bodyColor: 0x1a2a99, loop: xE(1100), dir: -1, pedestrian: true, isGown: true },
  { startIdx: 0, speed: 52, bodyColor: 0x1a2a99, loop: xE(1680), dir: -1, pedestrian: true, isGown: true },
  { startIdx: 1, speed: 58, bodyColor: 0x1a2a99, loop: xE(2300), dir: -1, pedestrian: true, isGown: true },
  // East-lane crossers — casual
  { startIdx: 0, speed: 62, bodyColor: 0xcc3322, loop: xE(900),  dir: -1, pedestrian: true, isGown: false },
  { startIdx: 1, speed: 57, bodyColor: 0x22aa44, loop: xE(1400), dir: -1, pedestrian: true, isGown: false },
  { startIdx: 0, speed: 64, bodyColor: 0xff8800, loop: xE(1950), dir: -1, pedestrian: true, isGown: false },
  { startIdx: 1, speed: 53, bodyColor: 0x9933cc, loop: xE(2700), dir: -1, pedestrian: true, isGown: false },
  // West-lane crossers — gowned
  { startIdx: 0, speed: 56, bodyColor: 0x1a2a99, loop: xW(780),  dir: -1, pedestrian: true, isGown: true },
  { startIdx: 1, speed: 61, bodyColor: 0x1a2a99, loop: xW(1350), dir: -1, pedestrian: true, isGown: true },
  { startIdx: 0, speed: 54, bodyColor: 0x1a2a99, loop: xW(2100), dir: -1, pedestrian: true, isGown: true },
  // West-lane crossers — casual
  { startIdx: 1, speed: 65, bodyColor: 0x3399ff, loop: xW(1050), dir: -1, pedestrian: true, isGown: false },
  { startIdx: 0, speed: 59, bodyColor: 0xee4411, loop: xW(1700), dir: -1, pedestrian: true, isGown: false },
  { startIdx: 1, speed: 55, bodyColor: 0x22cc55, loop: xW(2500), dir: -1, pedestrian: true, isGown: false },
  // Infield wanderers — gowned
  { startIdx: 0, speed: 48, bodyColor: 0x1a2a99,
    loop: quad([1050,550],[1610,605],[1510,890],[1000,880]), dir: 1, pedestrian: true, isGown: true },
  { startIdx: 2, speed: 46, bodyColor: 0x1a2a99,
    loop: quad([1200,1810],[1610,1900],[1400,2100],[910,2010]), dir: 1, pedestrian: true, isGown: true },
  { startIdx: 1, speed: 50, bodyColor: 0x1a2a99,
    loop: quad([1100,2400],[1510,2510],[1400,2720],[1000,2610]), dir: 1, pedestrian: true, isGown: true },
  { startIdx: 2, speed: 45, bodyColor: 0x1a2a99,
    loop: quad([1200,3010],[1510,3110],[1300,3260],[950,3160]), dir: 1, pedestrian: true, isGown: true },
  // Infield wanderers — casual
  { startIdx: 1, speed: 52, bodyColor: 0xe8d010,
    loop: quad([1100,1200],[1610,1310],[1510,1550],[1050,1450]), dir: 1, pedestrian: true, isGown: false },
  { startIdx: 0, speed: 55, bodyColor: 0xdd2255,
    loop: quad([950,600],[1400,700],[1300,800],[920,750]), dir: 1, pedestrian: true, isGown: false },
  { startIdx: 1, speed: 58, bodyColor: 0x44aaff,
    loop: quad([1050,1510],[1560,1610],[1450,1810],[950,1710]), dir: 1, pedestrian: true, isGown: false },
  { startIdx: 0, speed: 60, bodyColor: 0x993399,
    loop: quad([1100,900],[1510,1010],[1400,1110],[1000,1050]), dir: 1, pedestrian: true, isGown: false },
];

const COLLISION_RADIUS = 28;
const CARGO_COLLISION_RADIUS = 40;
const PEDESTRIAN_COLLISION_RADIUS = 18;
const NPC_STOP_MS = 3000;

export class NpcTrafficManager {
  constructor(scene, trackId) {
    this.scene = scene;
    const specs =
      trackId === 'ohare'     ? OHARE_SPECS :
      trackId === 'hyde-park' ? HYDEPARK_SPECS :
                                WACKER_SPECS;
    this.cars = specs.map((spec) => this._createCar(spec));
  }

  _createCar(spec) {
    const { startIdx, speed, bodyColor, loop, dir, large, pedestrian, isGown } = spec;
    const wp = loop[startIdx];
    const gfx = this.scene.add.graphics();

    if (pedestrian) {
      if (isGown) {
        gfx.fillStyle(0xf5c5a0, 1);
        gfx.fillCircle(0, -9, 3);             // head
        gfx.fillStyle(0x1a2a99, 1);
        gfx.fillRect(-3, -5, 6, 10);          // gown
        gfx.fillStyle(0x111111, 1);
        gfx.fillRect(-5, -14, 10, 2);         // mortarboard flat
        gfx.fillRect(-1, -13, 2, 3);          // stem
        gfx.fillStyle(0xffcc00, 1);
        gfx.fillRect(3, -13, 1, 6);           // tassel
      } else {
        gfx.fillStyle(0xf5c5a0, 1);
        gfx.fillCircle(0, -9, 3);             // head
        gfx.fillStyle(bodyColor, 1);
        gfx.fillRect(-3, -5, 6, 7);           // casual top
        gfx.fillStyle(0x223344, 1);
        gfx.fillRect(-3, 2, 3, 5);            // left leg
        gfx.fillRect(0, 2, 3, 5);             // right leg
      }
    } else if (large) {
      gfx.fillStyle(bodyColor, 1);
      gfx.fillRect(-14, -22, 28, 44);
      gfx.fillStyle(0x334433, 1);
      gfx.fillRect(-14, -22, 28, 8);
      gfx.fillStyle(0x99ccdd, 0.7);
      gfx.fillRect(-10, -20, 10, 6);
      gfx.fillStyle(0x223322, 1);
      gfx.fillRect(-14, 16, 12, 6);
      gfx.fillRect(2, 16, 12, 6);
      gfx.lineStyle(1, 0x00000066, 0.6);
      gfx.strokeRect(-14, -22, 28, 44);
    } else {
      gfx.fillStyle(bodyColor, 1);
      gfx.fillRect(-8, -14, 16, 28);
      gfx.fillStyle(0x99ccdd, 0.8);
      gfx.fillRect(-6, -12, 12, 8);
      gfx.fillStyle(0x99ccdd, 0.45);
      gfx.fillRect(-5, 6, 10, 6);
      gfx.lineStyle(1, 0x00000044, 0.5);
      gfx.strokeRect(-8, -14, 16, 28);
    }

    gfx.setPosition(wp.x, wp.y).setDepth(4);

    return { gfx, speed, loop, dir, large, pedestrian, waypointIdx: startIdx, x: wp.x, y: wp.y, stoppedMs: 0 };
  }

  update(deltaMs, playerCar) {
    const dt = deltaMs / 1000;
    let playerHit = false;

    for (const car of this.cars) {
      if (car.stoppedMs > 0) {
        car.stoppedMs = Math.max(0, car.stoppedMs - deltaMs);
        continue;
      }

      const target = car.loop[car.waypointIdx];
      const dx = target.x - car.x;
      const dy = target.y - car.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 8) {
        car.waypointIdx = (car.waypointIdx + car.dir + car.loop.length) % car.loop.length;
      } else {
        const move = car.speed * dt;
        car.x += (dx / dist) * Math.min(move, dist);
        car.y += (dy / dist) * Math.min(move, dist);
        car.gfx.setPosition(car.x, car.y);
        car.gfx.angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      }

      const radius = car.pedestrian ? PEDESTRIAN_COLLISION_RADIUS
                   : car.large      ? CARGO_COLLISION_RADIUS
                                    : COLLISION_RADIUS;
      const b = playerCar.getBounds();
      if (Math.hypot(car.x - (b.x + b.width / 2), car.y - (b.y + b.height / 2)) < radius) {
        car.stoppedMs = NPC_STOP_MS;
        playerHit = true;
      }
    }

    return playerHit;
  }

  destroy() {
    for (const car of this.cars) car.gfx.destroy();
    this.cars = [];
  }
}
