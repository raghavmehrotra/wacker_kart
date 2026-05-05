import Phaser from "phaser";

const TILE_GRASS = 1;
const TILE_WATER = 2;
const TILE_SHOULDER = 3;
const TILE_ROAD = 4;
const TILE_POTHOLE = 5;

const TILESET_COLORS = [0x5f9151, 0x7ed1f5, 0x6f685d, 0xd5ccbe, 0x8a7a5a];
const TILESET_TILE_SIZE = 32;
const TILESET_KEY = "track-tiles";

export class TrackManager {
  constructor(scene, tilemap, trackId = "lake-shore-drive") {
    this.scene = scene;
    this.tilemap = tilemap;
    this.trackId = trackId;
    this.surfaceLayer = null;

    this.spawnPoints = [];
    this.finishLine = null;
    this.turnaround = null;
    this.itemPickups = [];
    this.treeObstacles = [];
    this.potholePositions = [];
  }

  drawWorld() {
    this.generateTilesetTexture();

    const tileset = this.tilemap.addTilesetImage(TILESET_KEY, TILESET_KEY);
    this.surfaceLayer = this.tilemap.createLayer("surface", tileset, 0, 0);

    this.extractObjects();
    this.drawTrackDecorations(this.trackId);
    this.drawOverlays();
  }

  generateTilesetTexture() {
    if (this.scene.textures.exists(TILESET_KEY)) return;

    const w = TILESET_TILE_SIZE * TILESET_COLORS.length;
    const gfx = this.scene.make.graphics({ add: false });

    TILESET_COLORS.forEach((color, i) => {
      gfx.fillStyle(color);
      gfx.fillRect(i * TILESET_TILE_SIZE, 0, TILESET_TILE_SIZE, TILESET_TILE_SIZE);
    });

    gfx.generateTexture(TILESET_KEY, w, TILESET_TILE_SIZE);
    gfx.destroy();
  }

  extractObjects() {
    const objectLayer = this.tilemap.getObjectLayer("objects");
    if (!objectLayer) return;

    this.spawnPoints = objectLayer.objects
      .filter((o) => o.type === "spawn")
      .sort((a, b) => {
        const slotA = (a.properties ?? []).find((p) => p.name === "slot")?.value ?? 0;
        const slotB = (b.properties ?? []).find((p) => p.name === "slot")?.value ?? 0;
        return slotA - slotB;
      })
      .map((o) => ({ x: o.x, y: o.y }));

    const finishObj = objectLayer.objects.find((o) => o.name === "finish-line");
    if (finishObj) {
      this.finishLine = new Phaser.Geom.Rectangle(
        finishObj.x, finishObj.y, finishObj.width, finishObj.height,
      );
    }

    const turnObj = objectLayer.objects.find((o) => o.name === "turnaround");
    if (turnObj) {
      this.turnaround = new Phaser.Geom.Rectangle(
        turnObj.x, turnObj.y, turnObj.width, turnObj.height,
      );
    }

    this.itemPickups = objectLayer.objects
      .filter((o) => o.type === "item-pickup")
      .map((o) => ({
        x: o.x + o.width / 2,
        y: o.y + o.height / 2,
        radius: o.width / 2,
        itemType: (o.properties ?? []).find((p) => p.name === "itemType")?.value ?? "malort-shot",
      }));

    this.treeObstacles = objectLayer.objects
      .filter((o) => o.type === "tree-obstacle")
      .map((o) => ({
        x: o.x + o.width / 2,
        y: o.y + o.height / 2,
        radius: o.width / 2,
      }));

    // Scan surface layer for pothole tiles (only needed for Lower Wacker visuals)
    if (this.trackId === "lower-wacker" && this.surfaceLayer) {
      for (let row = 0; row < this.tilemap.height; row++) {
        for (let col = 0; col < this.tilemap.width; col++) {
          const tile = this.surfaceLayer.getTileAt(col, row);
          if (tile?.index === TILE_POTHOLE) {
            this.potholePositions.push({ x: col * 32 + 16, y: row * 32 + 16 });
          }
        }
      }
    }
  }

  drawOverlays() {
    if (this.finishLine) {
      this.drawCheckerboardLine(this.finishLine.x, this.finishLine.y, 15, 4, 8);
    }

    if (this.turnaround) {
      const marker = this.scene.add.graphics();
      marker.lineStyle(4, 0x9fe8ff, 0.9);
      marker.strokeRectShape(this.turnaround);
    }

    for (const tree of this.treeObstacles) {
      this.drawTreeCluster(tree.x, tree.y, tree.radius);
    }
  }

  applyTrackSurface(car, dt) {
    const tileX = Math.floor(car.sprite.x / this.tilemap.tileWidth);
    const tileY = Math.floor(car.sprite.y / this.tilemap.tileHeight);
    const tile = this.surfaceLayer.getTileAt(tileX, tileY);

    if (!tile || tile.index === TILE_GRASS || tile.index === TILE_WATER) {
      car.bounceToPreviousPosition();
    } else if (tile.index === TILE_SHOULDER) {
      car.applySurfaceDrag(85 * dt);
    } else if (tile.index === TILE_POTHOLE) {
      car.applySurfaceDrag(160 * dt);
    }
  }

  hitTreeObstacle(carBounds) {
    return this.treeObstacles.some((tree) => {
      const obs = new Phaser.Geom.Rectangle(
        tree.x - tree.radius,
        tree.y - tree.radius,
        tree.radius * 2,
        tree.radius * 2,
      );
      return Phaser.Geom.Intersects.RectangleToRectangle(carBounds, obs);
    });
  }

  // ── Per-track decorations ─────────────────────────────────────────────────

  drawTrackDecorations(trackId) {
    switch (trackId) {
      case "lake-shore-drive": return this.decorateLakeShore();
      case "hyde-park":        return this.decorateHydePark();
      case "ohare":            return this.decorateOHare();
      case "lower-wacker":     return this.decorateLowerWacker();
    }
  }

  decorateLakeShore() {
    const bg = this.scene.add.graphics().setDepth(-1);

    // Lake Michigan — blue fill east of x=1560
    bg.fillStyle(0x5b9bd5, 1);
    bg.fillRect(1560, 0, 2600 - 1560, 4000);

    // Shoreline sandy strip
    bg.fillStyle(0xe8d5a3, 1);
    bg.fillRect(1530, 0, 40, 4000);

    // Grant Park / Lincoln Park green fills
    bg.fillStyle(0x4a8c44, 1);
    bg.fillRect(200, 400, 320, 600);
    bg.fillRect(180, 1100, 280, 500);
    bg.fillRect(220, 2000, 260, 400);

    // Downtown skyline silhouette (north portion)
    const skyline = this.scene.add.graphics().setDepth(-1);
    skyline.fillStyle(0x2a3540, 1);
    const buildings = [
      [170, 180, 55, 200], [240, 140, 40, 240], [295, 200, 50, 180],
      [360, 90, 35, 290], [410, 150, 60, 230], [485, 110, 45, 270],
      [545, 170, 55, 210], [615, 130, 40, 250], [670, 190, 50, 190],
      [735, 100, 35, 280], [785, 160, 60, 220], [860, 120, 45, 260],
    ];
    for (const [x, y, w, h] of buildings) {
      skyline.fillRect(x, y, w, h);
    }

    // Navy Pier arm (thin rectangle jutting into the lake)
    const pier = this.scene.add.graphics().setDepth(-1);
    pier.fillStyle(0xc8b99a, 1);
    pier.fillRect(1400, 550, 220, 28);
    pier.fillRect(1560, 440, 28, 140);

    // Sailboats on the water
    for (const [sx, sy] of [[1680, 900], [1750, 1500], [1690, 2200]]) {
      const boat = this.scene.add.graphics().setDepth(1);
      boat.fillStyle(0xffffff, 1);
      boat.fillTriangle(sx, sy - 30, sx - 12, sy + 10, sx + 12, sy + 10);
      boat.fillStyle(0x8b6914, 1);
      boat.fillRect(sx - 16, sy + 10, 32, 6);
    }

    // Bridge arches over the top loop
    for (const [bx, by] of [[1180, 450], [1340, 400]]) {
      const bridge = this.scene.add.graphics().setDepth(2);
      bridge.lineStyle(6, 0x8a8070, 1);
      bridge.strokeEllipse(bx, by, 100, 40);
    }
  }

  decorateHydePark() {
    const bg = this.scene.add.graphics().setDepth(-1);

    // Midway Plaisance — wide green horizontal strip
    bg.fillStyle(0x5a9c50, 1);
    bg.fillRect(100, 1750, 1800, 180);

    // Jackson Park south
    bg.fillStyle(0x4a8c44, 1);
    bg.fillRect(150, 2900, 700, 350);

    // Museum of Science and Industry dome
    const msi = this.scene.add.graphics().setDepth(2);
    msi.fillStyle(0xc8c0b0, 1);
    msi.fillEllipse(1200, 3500, 180, 60);
    msi.fillRect(1110, 3480, 180, 80);
    msi.fillStyle(0xd8d0c0, 1);
    msi.fillEllipse(1200, 3480, 120, 50);

    // Campus buildings along east edge
    const bldg = this.scene.add.graphics().setDepth(2);
    bldg.fillStyle(0xb8a882, 1);
    const campusBuildings = [
      [1580, 800, 80, 55], [1620, 900, 70, 50], [1590, 1000, 90, 60],
      [1560, 1150, 75, 55], [1600, 1300, 85, 50],
    ];
    for (const [x, y, w, h] of campusBuildings) {
      bldg.fillRect(x, y, w, h);
    }
    bldg.fillStyle(0xa89870, 1);
    for (const [x, y, w, h] of campusBuildings) {
      bldg.strokeRect(x, y, w, h);
    }

    // Gothic arch gates near finish
    const gate = this.scene.add.graphics().setDepth(2);
    gate.fillStyle(0x9a8a6a, 1);
    gate.fillRect(870, 750, 12, 60);
    gate.fillRect(970, 750, 12, 60);
    gate.lineStyle(3, 0x9a8a6a, 1);
    gate.strokeEllipse(930, 760, 112, 40);
  }

  decorateOHare() {
    const bg = this.scene.add.graphics().setDepth(-1);

    // Tarmac fills alongside the road
    bg.fillStyle(0x3a3a3a, 1);
    bg.fillRect(400, 300, 280, 3400);
    bg.fillRect(1350, 300, 260, 3400);

    // Terminal buildings
    const term = this.scene.add.graphics().setDepth(2);
    term.fillStyle(0x9ab0c0, 1);
    term.fillRect(200, 280, 400, 100);  // Terminal 1 (north)
    term.fillRect(200, 3500, 360, 100); // Terminal 3 (south)
    term.fillStyle(0x7a9ab0, 1);
    term.strokeRect(200, 280, 400, 100);
    term.strokeRect(200, 3500, 360, 100);

    // Control tower — thin white tower + cap
    const tower = this.scene.add.graphics().setDepth(2);
    tower.fillStyle(0xe8e8e8, 1);
    tower.fillRect(385, 1700, 18, 180);
    tower.fillStyle(0xd0d8e0, 1);
    tower.fillRect(372, 1690, 44, 22);
    // Blinking light on top
    tower.fillStyle(0xff3300, 1);
    tower.fillCircle(394, 1692, 4);

    // Runway edge lights — yellow dots along track sides
    const lights = this.scene.add.graphics().setDepth(1);
    lights.fillStyle(0xffe566, 1);
    for (let y = 400; y < 3600; y += 80) {
      lights.fillCircle(480, y, 4);
      lights.fillCircle(1330, y, 4);
    }

    // Animated airplane (tween loops west to east across the sky)
    const plane = this.scene.add.graphics().setDepth(6);
    const drawPlane = (gfx, px, py) => {
      gfx.clear();
      gfx.fillStyle(0xeeeeee, 1);
      gfx.fillRect(px - 28, py - 5, 56, 10);  // fuselage
      gfx.fillTriangle(px + 28, py, px - 8, py - 18, px - 8, py + 18); // wings
      gfx.fillStyle(0xcc3333, 1);
      gfx.fillRect(px + 22, py - 2, 12, 4);   // tail fin
    };
    drawPlane(plane, -100, 800);

    this.scene.tweens.add({
      targets: { x: -100 },
      x: 2700,
      duration: 12000,
      repeat: -1,
      ease: "Linear",
      onUpdate: (tween) => {
        const x = tween.targets[0].x;
        drawPlane(plane, x, 800);
      },
    });
  }

  decorateLowerWacker() {
    // Tunnel ceiling overlay — dark semi-transparent to create underground feel
    const ceiling = this.scene.add.graphics().setDepth(3);
    ceiling.fillStyle(0x111820, 0.5);
    ceiling.fillRect(0, 0, 2600, 4000);

    // Support pillars every ~500px along track edges
    const pillars = this.scene.add.graphics().setDepth(2);
    pillars.fillStyle(0x3a3228, 1);
    for (let y = 300; y < 3800; y += 480) {
      pillars.fillRect(880, y, 22, 80);
      pillars.fillRect(1480, y, 22, 80);
    }

    // Emergency lights — red/orange dots along track edges
    const emergencyLights = this.scene.add.graphics().setDepth(2);
    for (let y = 400; y < 3700; y += 300) {
      emergencyLights.fillStyle(0xff4400, 0.9);
      emergencyLights.fillCircle(920, y, 5);
      emergencyLights.fillStyle(0xff6600, 0.7);
      emergencyLights.fillCircle(920, y, 9);

      emergencyLights.fillStyle(0xff4400, 0.9);
      emergencyLights.fillCircle(1460, y, 5);
      emergencyLights.fillStyle(0xff6600, 0.7);
      emergencyLights.fillCircle(1460, y, 9);
    }

    // Pothole visuals — dark oval at each pothole tile center
    if (this.potholePositions.length > 0) {
      const holes = this.scene.add.graphics().setDepth(2);
      holes.fillStyle(0x2a1f10, 1);
      for (const { x, y } of this.potholePositions) {
        holes.fillEllipse(x, y, 18, 12);
      }
    }
  }

  // ── Shared draw helpers ───────────────────────────────────────────────────

  drawTreeCluster(x, y, radius = 18) {
    const crownA = this.scene.add.circle(x, y, radius, 0x4f9555);
    const crownB = this.scene.add.circle(x + radius * 0.55, y - radius * 0.2, radius * 0.78, 0x5aa35c);
    const crownC = this.scene.add.circle(x - radius * 0.45, y - radius * 0.15, radius * 0.7, 0x3f7f47);
    const trunk = this.scene.add.rectangle(x, y + radius * 1.1, radius * 0.28, radius * 0.9, 0x5c4024);
    crownA.setDepth(2);
    crownB.setDepth(2);
    crownC.setDepth(2);
    trunk.setDepth(1);
  }

  drawCheckerboardLine(x, y, cols, rows, tileSize) {
    const gfx = this.scene.add.graphics();
    gfx.setDepth(1);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const isLight = (row + col) % 2 === 0;
        gfx.fillStyle(isLight ? 0xffffff : 0x111111, 1);
        gfx.fillRect(x + col * tileSize, y + row * tileSize, tileSize, tileSize);
      }
    }
  }
}
