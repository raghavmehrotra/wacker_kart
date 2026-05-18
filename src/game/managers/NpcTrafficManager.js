// NPC traffic loop: matches the lower-wacker track polylines exactly
const LOOP = [
  // East side going south
  { x: 1400, y: 264 }, { x: 1440, y: 520 }, { x: 1520, y: 860 }, { x: 1580, y: 1210 },
  { x: 1560, y: 1560 }, { x: 1480, y: 1910 }, { x: 1440, y: 2270 }, { x: 1510, y: 2620 },
  { x: 1550, y: 2970 }, { x: 1500, y: 3290 }, { x: 1460, y: 3450 },
  // Bottom hairpin
  { x: 1360, y: 3620 }, { x: 1160, y: 3720 }, { x: 960, y: 3660 }, { x: 840, y: 3470 },
  // West side going north
  { x: 800, y: 3210 }, { x: 760, y: 2880 }, { x: 800, y: 2560 }, { x: 860, y: 2260 },
  { x: 820, y: 1910 }, { x: 780, y: 1560 }, { x: 760, y: 1210 }, { x: 820, y: 860 },
  { x: 880, y: 520 }, { x: 920, y: 264 },
  // Top connector
  { x: 1080, y: 118 }, { x: 1250, y: 68 }, { x: 1380, y: 128 },
];

const COLLISION_RADIUS = 28;
const NPC_STOP_MS = 3000;

const CONFIGS = [
  { startIdx: 0,  speed: 235, bodyColor: 0xf0c020, label: "Yellow Cab" },
  { startIdx: 13, speed: 215, bodyColor: 0xdcdcd4, label: "Delivery Van" },
];

export class NpcTrafficManager {
  constructor(scene) {
    this.scene = scene;
    this.cars = CONFIGS.map((cfg) => this._createCar(cfg));
  }

  _createCar({ startIdx, speed, bodyColor }) {
    const wp = LOOP[startIdx];

    const gfx = this.scene.add.graphics();
    // Body (drawn centered at local origin, pointing "up" = forward)
    gfx.fillStyle(bodyColor, 1);
    gfx.fillRect(-8, -14, 16, 28);
    // Windshield tint
    gfx.fillStyle(0x99ccdd, 0.8);
    gfx.fillRect(-6, -12, 12, 8);
    // Rear window
    gfx.fillStyle(0x99ccdd, 0.45);
    gfx.fillRect(-5, 6, 10, 6);
    // Roof outline
    gfx.lineStyle(1, 0x00000044, 0.5);
    gfx.strokeRect(-8, -14, 16, 28);

    gfx.setPosition(wp.x, wp.y).setDepth(4);

    return {
      gfx,
      speed,
      waypointIdx: startIdx,
      x: wp.x,
      y: wp.y,
      stoppedMs: 0,
    };
  }

  // Returns true if the player was hit this frame
  update(deltaMs, playerCar) {
    const dt = deltaMs / 1000;
    let playerHit = false;

    for (const car of this.cars) {
      if (car.stoppedMs > 0) {
        car.stoppedMs = Math.max(0, car.stoppedMs - deltaMs);
        continue;
      }

      const target = LOOP[car.waypointIdx];
      const dx = target.x - car.x;
      const dy = target.y - car.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 8) {
        car.waypointIdx = (car.waypointIdx - 1 + LOOP.length) % LOOP.length;
      } else {
        const move = car.speed * dt;
        car.x += (dx / dist) * Math.min(move, dist);
        car.y += (dy / dist) * Math.min(move, dist);
        // atan2(dy,dx) gives angle from east; subtract 90° so 0° = north (matching car drawing)
        car.gfx.setPosition(car.x, car.y);
        car.gfx.angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      }

      // Collision check
      const b = playerCar.getBounds();
      if (Math.hypot(car.x - (b.x + b.width / 2), car.y - (b.y + b.height / 2)) < COLLISION_RADIUS) {
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
