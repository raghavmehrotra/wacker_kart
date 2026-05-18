import Phaser from "phaser";

const TILE_GRASS = 1;
const TILE_WATER = 2;
const TILE_SHOULDER = 3;
const TILE_ROAD = 4;
const TILE_POTHOLE = 5;

const TILESET_TILE_SIZE = 32;
const TILESET_KEY = "track-tiles";

// Per-track tile colors: [grass, water, shoulder, road, pothole]
const TRACK_TILE_COLORS = {
  "lake-shore-drive": [0x5f9151, 0x7ed1f5, 0x6f685d, 0xd5ccbe, 0x8a7a5a],
  "ohare":            [0x3c3c3c, 0x3c3c3c, 0x585450, 0xd5ccbe, 0x8a7a5a],
  "hyde-park":        [0x4a7c3a, 0x4a7c3a, 0x6f685d, 0xd5ccbe, 0x8a7a5a],
  "lower-wacker":     [0x1e1e1c, 0x1e1e1c, 0x3a3230, 0x3c3838, 0x2a2420],
};

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
    const textureKey = this.generateTilesetTexture();

    const tileset = this.tilemap.addTilesetImage(TILESET_KEY, textureKey);
    this.surfaceLayer = this.tilemap.createLayer("surface", tileset, 0, 0);
    this.surfaceLayer.setCullPadding(6, 6);

    this.extractObjects();
    this.drawTrackDecorations(this.trackId);
    this.drawOverlays();
  }

  generateTilesetTexture() {
    const key = `${TILESET_KEY}-${this.trackId}`;
    if (this.scene.textures.exists(key)) return key;

    const colors = TRACK_TILE_COLORS[this.trackId] ?? TRACK_TILE_COLORS["lake-shore-drive"];
    const w = TILESET_TILE_SIZE * colors.length;
    const gfx = this.scene.make.graphics({ add: false });

    colors.forEach((color, i) => {
      gfx.fillStyle(color);
      gfx.fillRect(i * TILESET_TILE_SIZE, 0, TILESET_TILE_SIZE, TILESET_TILE_SIZE);
    });

    gfx.generateTexture(key, w, TILESET_TILE_SIZE);
    gfx.destroy();
    return key;
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
    // Faint city street grid on west side (over the grass-colored tiles)
    const grid = this.scene.add.graphics().setDepth(1);
    grid.lineStyle(1, 0x3a3a34, 0.5);
    for (let y = 100; y < 4000; y += 180) grid.strokeRect(80, y, 900, 140);
    for (let x = 100; x < 1100; x += 220) grid.strokeRect(x, 100, 160, 3800);

    // Main Quad — the iconic central green
    const quad = this.scene.add.graphics().setDepth(-1);
    quad.fillStyle(0x5aaa48, 1);
    quad.fillRect(1420, 900, 350, 520);
    quad.lineStyle(3, 0x3a8030, 1);
    quad.strokeRect(1420, 900, 350, 520);
    // Quad paths (cross pattern)
    quad.lineStyle(4, 0xd8c89a, 0.7);
    quad.strokeRect(1595, 900, 1, 520);
    quad.strokeRect(1420, 1160, 350, 1);

    // Midway Plaisance — wide green horizontal strip
    const midway = this.scene.add.graphics().setDepth(-1);
    midway.fillStyle(0x5a9c50, 1);
    midway.fillRect(0, 1750, 2600, 180);
    // Midway border paths
    midway.lineStyle(3, 0x3a7c38, 0.8);
    midway.strokeRect(0, 1750, 2600, 180);

    // Jackson Park south
    const park = this.scene.add.graphics().setDepth(-1);
    park.fillStyle(0x4a8c44, 1);
    park.fillRect(0, 2900, 800, 380);
    park.fillRect(1300, 2900, 1300, 380);

    // Regenstein Library — imposing brutalist block on east edge
    const reg = this.scene.add.graphics().setDepth(2);
    reg.fillStyle(0x8a7a5f, 1);
    reg.fillRect(1620, 1480, 200, 220);
    reg.lineStyle(3, 0x6a5a48, 1);
    reg.strokeRect(1620, 1480, 200, 220);
    // Window bands
    reg.lineStyle(2, 0x5a4a38, 0.8);
    for (let wy = 1510; wy < 1680; wy += 32) reg.strokeRect(1628, wy, 184, 20);

    // Campus Gothic buildings along east edge — limestone with arch details
    const bldg = this.scene.add.graphics().setDepth(2);
    const campusBuildings = [
      [1610, 720, 120, 70], [1640, 820, 100, 60], [1600, 1720, 130, 80],
      [1630, 1830, 110, 65], [1600, 2050, 125, 75], [1620, 2200, 105, 60],
      [1590, 2450, 135, 85], [1610, 2600, 115, 70],
    ];
    bldg.fillStyle(0xc8b890, 1);
    for (const [x, y, w, h] of campusBuildings) bldg.fillRect(x, y, w, h);
    bldg.lineStyle(2, 0x9a8a68, 1);
    for (const [x, y, w, h] of campusBuildings) {
      bldg.strokeRect(x, y, w, h);
      // Gothic arch windows
      bldg.strokeEllipse(x + w * 0.3, y + 8, w * 0.25, 16);
      bldg.strokeEllipse(x + w * 0.7, y + 8, w * 0.25, 16);
    }

    // Gothic arch gates — north (near finish) and south (near Midway)
    const gate = this.scene.add.graphics().setDepth(2);
    gate.fillStyle(0x9a8a6a, 1);
    // North gate
    gate.fillRect(870, 750, 14, 65);
    gate.fillRect(975, 750, 14, 65);
    gate.lineStyle(4, 0x9a8a6a, 1);
    gate.strokeEllipse(934, 762, 120, 44);
    // South gate (near Midway)
    gate.fillRect(840, 1720, 12, 55);
    gate.fillRect(930, 1720, 12, 55);
    gate.lineStyle(3, 0x9a8a6a, 1);
    gate.strokeEllipse(893, 730 + 998, 104, 36);

    // Museum of Science and Industry
    const msi = this.scene.add.graphics().setDepth(2);
    msi.fillStyle(0xc8c0b0, 1);
    msi.fillEllipse(1180, 3480, 200, 64);
    msi.fillRect(1080, 3460, 200, 90);
    msi.fillStyle(0xd8d0c0, 1);
    msi.fillEllipse(1180, 3462, 130, 52);
    msi.lineStyle(2, 0xa0988a, 1);
    msi.strokeRect(1080, 3460, 200, 90);
  }

  decorateOHare() {
    // Airfield grass verges — brighter green strips alongside the shoulder
    // (tile colors handle background; these add visible grass strips at depth 1)
    const grass = this.scene.add.graphics().setDepth(1);
    grass.fillStyle(0x48722a, 1);
    grass.fillRect(530, 0, 160, 4000);
    grass.fillRect(1280, 0, 160, 4000);

    // Runway centerline dashes along approximate road centers
    const dashes = this.scene.add.graphics().setDepth(1);
    dashes.fillStyle(0xffffff, 0.6);
    for (let y = 300; y < 3800; y += 100) {
      dashes.fillRect(1210, y, 6, 44);   // right-lane center dash
      dashes.fillRect(730, y, 6, 44);    // left-lane center dash
    }

    // Terminal buildings
    const term = this.scene.add.graphics().setDepth(2);
    term.fillStyle(0x9ab0c0, 1);
    term.fillRect(60, 240, 440, 110);   // Terminal 1 (north)
    term.fillRect(60, 3580, 400, 110);  // Terminal 3 (south)
    term.lineStyle(2, 0x6a8aa0, 1);
    term.strokeRect(60, 240, 440, 110);
    term.strokeRect(60, 3580, 400, 110);
    // Gate fingers jutting from terminals
    term.fillStyle(0x8aa0b0, 1);
    for (let gx = 80; gx < 460; gx += 90) {
      term.fillRect(gx, 350, 30, 70);
      term.fillRect(gx, 3510, 30, 70);
    }

    // Hangar — large flat shed on west side mid-track
    const hangar = this.scene.add.graphics().setDepth(2);
    hangar.fillStyle(0x606868, 1);
    hangar.fillRect(60, 1900, 280, 130);
    hangar.lineStyle(3, 0x484e4e, 1);
    hangar.strokeRect(60, 1900, 280, 130);
    // Hangar door seams
    hangar.lineStyle(2, 0x383e3e, 0.8);
    for (let hx = 120; hx < 340; hx += 60) hangar.strokeRect(hx, 1905, 50, 120);

    // Control tower
    const tower = this.scene.add.graphics().setDepth(2);
    tower.fillStyle(0xe8e8e8, 1);
    tower.fillRect(385, 1700, 20, 190);
    tower.fillStyle(0xd0d8e0, 1);
    tower.fillRect(370, 1690, 50, 24);
    tower.fillStyle(0xff3300, 1);
    tower.fillCircle(395, 1692, 5);

    // Runway edge lights — yellow dots
    const lights = this.scene.add.graphics().setDepth(1);
    lights.fillStyle(0xffe566, 1);
    for (let y = 300; y < 3800; y += 80) {
      lights.fillCircle(532, y, 4);
      lights.fillCircle(1278, y, 4);
    }

    // Animated airplane
    const plane = this.scene.add.graphics().setDepth(6);
    const drawPlane = (gfx, px, py) => {
      gfx.clear();
      gfx.fillStyle(0xeeeeee, 1);
      gfx.fillRect(px - 28, py - 5, 56, 10);
      gfx.fillTriangle(px + 28, py, px - 8, py - 18, px - 8, py + 18);
      gfx.fillStyle(0xcc3333, 1);
      gfx.fillRect(px + 22, py - 2, 12, 4);
    };
    drawPlane(plane, -100, 700);
    this.scene.tweens.add({
      targets: { x: -100 },
      x: 2700,
      duration: 12000,
      repeat: -1,
      ease: "Linear",
      onUpdate: (tween) => drawPlane(plane, tween.targets[0].x, 700),
    });
  }

  decorateLowerWacker() {
    // Tunnel ceiling overlay — darker and cooler for underground feel
    const ceiling = this.scene.add.graphics().setDepth(3);
    ceiling.fillStyle(0x0a0c10, 0.62);
    ceiling.fillRect(0, 0, 2600, 4000);

    // Support pillars every ~480px
    const pillars = this.scene.add.graphics().setDepth(2);
    pillars.fillStyle(0x3a3228, 1);
    for (let y = 300; y < 3800; y += 480) {
      pillars.fillRect(878, y, 28, 80);
      pillars.fillRect(1478, y, 28, 80);
      // Grime/water-stain streak above each pillar
      pillars.fillStyle(0x1a1510, 0.7);
      pillars.fillRect(882, y - 40, 20, 40);
      pillars.fillRect(1482, y - 40, 20, 40);
      pillars.fillStyle(0x3a3228, 1);
    }

    // Yellow/amber tunnel lights with ground-cast pools
    const lamps = this.scene.add.graphics().setDepth(2);
    const pools = this.scene.add.graphics().setDepth(1);
    for (let y = 400; y < 3700; y += 300) {
      // Left wall lamp
      lamps.fillStyle(0xffcc00, 0.95);
      lamps.fillCircle(918, y, 5);
      lamps.fillStyle(0xffaa00, 0.4);
      lamps.fillCircle(918, y, 11);
      // Right wall lamp
      lamps.fillStyle(0xffcc00, 0.95);
      lamps.fillCircle(1462, y, 5);
      lamps.fillStyle(0xffaa00, 0.4);
      lamps.fillCircle(1462, y, 11);
      // Ground light pools beneath each lamp
      pools.fillStyle(0xffee88, 0.09);
      pools.fillEllipse(918, y + 60, 80, 40);
      pools.fillEllipse(1462, y + 60, 80, 40);
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
