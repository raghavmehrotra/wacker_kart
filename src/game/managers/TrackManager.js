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
  "ohare":            [0x4a4838, 0x4a4838, 0x727068, 0x585654, 0x3c3a38],
  "hyde-park":        [0x4a7c3a, 0x4a7c3a, 0x9a8c72, 0x686462, 0x504846],
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
    // ── Central Quad greens ──────────────────────────────────────────────────
    const bg = this.scene.add.graphics().setDepth(-1);

    // Main infield background (everything between the two lanes)
    bg.fillStyle(0x4e8c44, 1);
    bg.fillRect(802, 310, 896, 3140);

    // The main Quad — iconic grass square in the north infield
    bg.fillStyle(0x5faa50, 1);
    bg.fillRect(840, 540, 820, 840);
    // Diagonal corner walks
    bg.fillStyle(0xd0c898, 0.7);
    bg.fillRect(840, 540, 820, 6);
    bg.fillRect(840, 1374, 820, 6);
    bg.fillRect(840, 540, 6, 840);
    bg.fillRect(1654, 540, 6, 840);

    // Quad crosswalk paths
    const paths = this.scene.add.graphics().setDepth(0);
    paths.fillStyle(0xd0c898, 0.85);
    paths.fillRect(1247, 540, 10, 840);   // vertical center
    paths.fillRect(840, 955, 820, 10);    // horizontal center
    // Diagonal paths to corners
    for (let i = 0; i < 820; i += 2) {
      const a = i / 820;
      paths.fillRect(840 + i, 540 + i, 2, 2);       // NW → SE diagonal
      paths.fillRect(1654 - i, 540 + i, 2, 2);      // NE → SW diagonal
    }

    // South section greens (Jackson Park)
    bg.fillStyle(0x4a8440, 1);
    bg.fillRect(840, 2000, 820, 1200);

    // Midway Plaisance — wide green band
    const midway = this.scene.add.graphics().setDepth(-1);
    midway.fillStyle(0x5a9c50, 1);
    midway.fillRect(0, 3260, 2600, 200);
    midway.lineStyle(3, 0x3a7c38, 0.8);
    midway.strokeRect(0, 3260, 2600, 200);

    // ── Gothic limestone buildings ────────────────────────────────────────────
    const bldg = this.scene.add.graphics().setDepth(2);
    bldg.fillStyle(0xc8b890, 1);

    // East-side buildings (inside of east lane)
    const eastB = [
      [1640, 580, 110, 78], [1642, 720, 106, 66], [1638, 850, 114, 72],
      [1644, 990, 104, 68], [1640, 1130, 108, 76], [1638, 1280, 112, 70],
      [1642, 1440, 106, 66], [1638, 1600, 114, 72], [1644, 1760, 104, 68],
      [1640, 1920, 108, 76], [1638, 2080, 112, 70], [1642, 2280, 106, 80],
      [1638, 2480, 114, 72], [1644, 2680, 104, 68], [1640, 2880, 108, 76],
    ];
    // West-side buildings (inside of west lane)
    const westB = [
      [750, 580, 108, 78], [752, 720, 104, 66], [748, 850, 112, 72],
      [754, 990, 102, 68], [750, 1130, 106, 76], [748, 1280, 110, 70],
      [752, 1440, 104, 66], [748, 1600, 112, 72], [754, 1760, 102, 68],
      [750, 1920, 106, 76], [748, 2080, 110, 70], [752, 2280, 104, 80],
      [748, 2480, 112, 72], [754, 2680, 102, 68], [750, 2880, 106, 76],
    ];

    for (const [x, y, w, h] of [...eastB, ...westB]) {
      bldg.fillRect(x, y, w, h);
      bldg.lineStyle(2, 0x9a8a68, 1);
      bldg.strokeRect(x, y, w, h);
      // Pointed Gothic windows (two per building)
      bldg.lineStyle(1, 0x7a6a50, 0.9);
      bldg.strokeEllipse(x + w * 0.28, y + 10, w * 0.26, 20);
      bldg.strokeEllipse(x + w * 0.72, y + 10, w * 0.26, 20);
      // Crenellated roofline dots
      bldg.fillStyle(0x9a8a68, 1);
      for (let cx = x + 8; cx < x + w - 4; cx += 14) bldg.fillRect(cx, y - 4, 8, 6);
      bldg.fillStyle(0xc8b890, 1);
    }

    // Regenstein Library — brutalist block
    const reg = this.scene.add.graphics().setDepth(2);
    reg.fillStyle(0x8a7a5f, 1);
    reg.fillRect(1230, 1440, 230, 260);
    reg.lineStyle(3, 0x6a5a48, 1);
    reg.strokeRect(1230, 1440, 230, 260);
    reg.lineStyle(2, 0x5a4a38, 0.8);
    for (let wy = 1464; wy < 1690; wy += 32) reg.strokeRect(1238, wy, 214, 22);

    // Rockefeller Memorial Chapel — tall tower
    const chapel = this.scene.add.graphics().setDepth(2);
    chapel.fillStyle(0xd0c8b0, 1);
    chapel.fillRect(960, 1470, 100, 180);
    chapel.fillStyle(0xb8a888, 1);
    chapel.fillRect(988, 1380, 44, 100);
    chapel.fillStyle(0xa09078, 1);
    chapel.fillTriangle(984, 1380, 1010, 1330, 1036, 1380);
    chapel.lineStyle(2, 0x906858, 1);
    chapel.strokeRect(960, 1470, 100, 180);

    // Bond Chapel (smaller)
    chapel.fillStyle(0xd0c8b0, 1);
    chapel.fillRect(960, 1680, 74, 90);
    chapel.fillStyle(0xa09078, 1);
    chapel.fillTriangle(960, 1680, 997, 1650, 1034, 1680);

    // ── Gates and arches ─────────────────────────────────────────────────────
    const gate = this.scene.add.graphics().setDepth(2);
    gate.fillStyle(0xa09070, 1);
    // North gate (top connector entrance)
    for (const gx of [920, 1552]) {
      gate.fillRect(gx, 290, 16, 90);
      gate.fillRect(gx + 92, 290, 16, 90);
      gate.lineStyle(5, 0xa09070, 1);
      gate.strokeEllipse(gx + 54, 302, 124, 48);
      gate.lineStyle(2, 0x806850, 1);
      gate.strokeEllipse(gx + 54, 302, 100, 36);
    }
    // South Midway gateway pillars
    gate.fillStyle(0xa09070, 1);
    for (const gx of [860, 1100, 1360, 1600]) {
      gate.fillRect(gx, 3250, 18, 80);
      gate.fillStyle(0x806850, 0.6);
      gate.fillRect(gx + 2, 3252, 14, 76);
      gate.fillStyle(0xa09070, 1);
    }

    // ── Museum of Science and Industry ───────────────────────────────────────
    const msi = this.scene.add.graphics().setDepth(2);
    msi.fillStyle(0xd0c8b0, 1);
    msi.fillRect(1080, 3700, 240, 100);
    msi.fillEllipse(1200, 3702, 200, 60);
    msi.fillStyle(0xe0d8c0, 1);
    msi.fillEllipse(1200, 3690, 140, 44);
    msi.lineStyle(2, 0xa89880, 1);
    msi.strokeRect(1080, 3700, 240, 100);
    for (let cx = 1100; cx < 1310; cx += 34) {
      msi.lineStyle(1, 0x908070, 0.7);
      msi.strokeRect(cx, 3708, 22, 84);
    }

    // ── Infield trees ─────────────────────────────────────────────────────────
    const treePts = [
      [870,580],[980,600],[1100,580],[1360,580],[1480,600],[1590,580],
      [870,1350],[980,1330],[1100,1350],[1360,1330],[1480,1350],[1590,1330],
      [900,2050],[1050,2070],[1200,2040],[1350,2070],[1500,2050],[1620,2060],
      [920,2400],[1080,2420],[1250,2400],[1420,2420],[1580,2400],
    ];
    for (const [tx, ty] of treePts) this.drawTreeCluster(tx, ty, 13);
  }

  decorateOHare() {
    // ── Infield background ────────────────────────────────────────────────────
    const bg = this.scene.add.graphics().setDepth(-1);
    // Tarmac infield
    bg.fillStyle(0x3e3c34, 1);
    bg.fillRect(756, 100, 888, 3500);
    // Taxiway yellow centerline in infield
    const taxi = this.scene.add.graphics().setDepth(1);
    taxi.lineStyle(3, 0xe8c820, 0.7);
    taxi.strokeRect(820, 300, 760, 3340);

    // ── Runway centerline dashes (both runways) ───────────────────────────────
    const dashes = this.scene.add.graphics().setDepth(1);
    dashes.fillStyle(0xffffff, 0.75);
    for (let y = 300; y < 3620; y += 100) {
      dashes.fillRect(1697, y, 6, 52);   // east runway centerline
      dashes.fillRect(697, y, 6, 52);    // west runway centerline
    }

    // Runway threshold bars (white stripes at each end)
    for (const ry of [264, 3640]) {
      for (let i = 0; i < 5; i++) {
        dashes.fillRect(1660 + i * 14, ry, 8, 60);
        dashes.fillRect(660 + i * 14, ry, 8, 60);
      }
    }

    // Runway edge lights — blue dots (taxiway) and white (runway)
    const lights = this.scene.add.graphics().setDepth(1);
    for (let y = 280; y < 3680; y += 60) {
      lights.fillStyle(0xffffff, 0.9);
      lights.fillCircle(1756, y, 3);
      lights.fillCircle(644, y, 3);
      lights.fillStyle(0x4488ff, 0.8);
      lights.fillCircle(820, y, 3);
      lights.fillCircle(1580, y, 3);
    }

    // ── Terminal complex (north connector infield) ────────────────────────────
    const term = this.scene.add.graphics().setDepth(2);
    // Terminal 1 — long concourse east
    term.fillStyle(0xa8b8c8, 1);
    term.fillRect(780, 130, 480, 120);
    term.lineStyle(2, 0x708898, 1);
    term.strokeRect(780, 130, 480, 120);
    // Terminal 2 — concourse west
    term.fillStyle(0x98a8b8, 1);
    term.fillRect(780, 280, 380, 90);
    term.lineStyle(2, 0x607888, 1);
    term.strokeRect(780, 280, 380, 90);
    // Jet bridges
    term.lineStyle(6, 0x889aaa, 1);
    for (let gx = 800; gx < 1250; gx += 75) {
      term.strokeRect(gx, 250, 10, 60);
      term.strokeRect(gx - 10, 370, 10, 50);
    }

    // Control tower
    const tower = this.scene.add.graphics().setDepth(3);
    tower.fillStyle(0xe8e8f0, 1);
    tower.fillRect(1242, 50, 24, 260);
    tower.fillStyle(0xd0d8e8, 1);
    tower.fillRect(1224, 40, 60, 28);
    tower.fillStyle(0xff2200, 1);
    tower.fillCircle(1254, 40, 6);
    tower.fillStyle(0xff2200, 0.5);
    tower.fillCircle(1254, 40, 10);

    // ── Cargo / maintenance (south connector infield) ─────────────────────────
    const cargo = this.scene.add.graphics().setDepth(2);
    // Cargo hangars
    cargo.fillStyle(0x606858, 1);
    cargo.fillRect(790, 3680, 320, 150);
    cargo.fillRect(1100, 3700, 220, 120);
    cargo.lineStyle(3, 0x484e46, 1);
    cargo.strokeRect(790, 3680, 320, 150);
    cargo.strokeRect(1100, 3700, 220, 120);
    // Hangar door seams
    cargo.lineStyle(2, 0x383e36, 0.9);
    for (let hx = 810; hx < 1100; hx += 55) cargo.strokeRect(hx, 3685, 44, 140);

    // ── Parked aircraft at obstacle positions ──────────────────────────────────
    const aircraft = this.scene.add.graphics().setDepth(3);
    const drawAircraft = (ax, ay, scale = 1) => {
      // fuselage
      aircraft.fillStyle(0xdde8f0, 1);
      aircraft.fillRect(ax - 34 * scale, ay - 6 * scale, 68 * scale, 12 * scale);
      // nose cone
      aircraft.fillTriangle(
        ax + 34 * scale, ay,
        ax + 8 * scale, ay - 10 * scale,
        ax + 8 * scale, ay + 10 * scale,
      );
      // wings
      aircraft.fillStyle(0xbbc8d8, 1);
      aircraft.fillTriangle(
        ax - 8 * scale, ay,
        ax - 28 * scale, ay - 30 * scale,
        ax - 28 * scale, ay + 30 * scale,
      );
      // tail fin
      aircraft.fillTriangle(
        ax - 28 * scale, ay - 4 * scale,
        ax - 42 * scale, ay - 22 * scale,
        ax - 34 * scale, ay - 4 * scale,
      );
      // airline stripe
      aircraft.fillStyle(0x3060b0, 1);
      aircraft.fillRect(ax - 30 * scale, ay - 3 * scale, 54 * scale, 6 * scale);
    };
    drawAircraft(1764, 1100, 0.9);
    drawAircraft(636, 1900, 0.9);
    drawAircraft(1764, 2700, 0.85);
    drawAircraft(636, 3100, 0.8);

    // ── Animated overhead plane ───────────────────────────────────────────────
    const flyover = this.scene.add.graphics().setDepth(6);
    const drawFlyover = (gfx, px, py) => {
      gfx.clear();
      gfx.fillStyle(0xeeeeff, 1);
      gfx.fillRect(px - 36, py - 6, 72, 12);
      gfx.fillTriangle(px + 36, py, px, py - 22, px, py + 22);
      gfx.fillStyle(0xcc2222, 1);
      gfx.fillRect(px + 28, py - 3, 14, 6);
    };
    drawFlyover(flyover, -120, 800);
    this.scene.tweens.add({
      targets: { x: -120 },
      x: 2720,
      duration: 10000,
      repeat: -1,
      ease: "Linear",
      onUpdate: (tween) => drawFlyover(flyover, tween.targets[0].x, 800),
    });
  }

  decorateLowerWacker() {
    // Elevation zones:
    //   y  0  – 1380 : Lower Wacker tunnel (underground, tight)
    //   y 1380 – 2620 : Upper Wacker / street level (open air)
    //   y 2620 – 4000 : Lower Wacker tunnel (back underground)
    const TUNNEL_TOP_END    = 1380;
    const SURFACE_END       = 2620;

    // ── Street-level open-air section (middle) ────────────────────────────────
    // Bright sky behind the surface section
    const sky = this.scene.add.graphics().setDepth(-2);
    sky.fillStyle(0x7ab8d8, 1);
    sky.fillRect(0, TUNNEL_TOP_END, 2600, SURFACE_END - TUNNEL_TOP_END);

    // Road-level tarmac colour for the surface strip
    sky.fillStyle(0x606464, 1);
    sky.fillRect(720, TUNNEL_TOP_END, 1160, SURFACE_END - TUNNEL_TOP_END);

    // City building silhouettes visible from Upper Wacker
    const cityBlocks = [
      [60, 1390, 80, 360], [160, 1440, 60, 310], [240, 1390, 90, 360],
      [350, 1410, 70, 340], [440, 1380, 55, 370], [510, 1440, 80, 310],
      [60, 2200, 90, 380], [170, 2170, 65, 410], [260, 2210, 80, 370],
      [360, 2190, 70, 390], [450, 2160, 60, 420],
      [1860, 1390, 80, 360], [1960, 1440, 60, 310], [2040, 1390, 90, 360],
      [2150, 1410, 70, 340], [2250, 1380, 55, 370], [2330, 1440, 80, 310],
    ];
    const city = this.scene.add.graphics().setDepth(-1);
    city.fillStyle(0x2a3540, 1);
    for (const [x, y, w, h] of cityBlocks) city.fillRect(x, y, w, h);
    // Windows
    city.fillStyle(0xffe8a0, 0.6);
    for (const [x, y, w, h] of cityBlocks) {
      for (let wy = y + 18; wy < y + h - 10; wy += 28) {
        for (let wx = x + 8; wx < x + w - 4; wx += 16) {
          if (Math.sin(wx * 7 + wy * 13) > 0.1) city.fillRect(wx, wy, 8, 14);
        }
      }
    }

    // Chicago River glimpse (blue band at surface level mid-track)
    const river = this.scene.add.graphics().setDepth(-1);
    river.fillStyle(0x5a8fb8, 1);
    river.fillRect(0, 1960, 2600, 80);
    river.fillStyle(0x4a7fa8, 0.6);
    river.fillRect(0, 1975, 2600, 50);

    // Street furniture (lamp posts, traffic lights on Upper Wacker)
    const street = this.scene.add.graphics().setDepth(2);
    for (let sy = TUNNEL_TOP_END + 120; sy < SURFACE_END - 80; sy += 240) {
      // Left side lamp post
      street.fillStyle(0x888888, 1);
      street.fillRect(714, sy, 8, 60);
      street.fillStyle(0xffee88, 0.9);
      street.fillCircle(718, sy, 8);
      street.fillStyle(0xffee88, 0.25);
      street.fillCircle(718, sy, 20);
      // Right side lamp post
      street.fillStyle(0x888888, 1);
      street.fillRect(1878, sy, 8, 60);
      street.fillStyle(0xffee88, 0.9);
      street.fillCircle(1882, sy, 8);
      street.fillStyle(0xffee88, 0.25);
      street.fillCircle(1882, sy, 20);
    }

    // Ramp transition markers — chevrons at tunnel entries
    const ramp = this.scene.add.graphics().setDepth(4);
    ramp.fillStyle(0xffcc00, 0.85);
    for (let rx = 750; rx < 1900; rx += 120) {
      // Top ramp (entering surface from north tunnel)
      ramp.fillRect(rx, TUNNEL_TOP_END - 8, 80, 8);
      // Bottom ramp (entering surface from south tunnel)
      ramp.fillRect(rx, SURFACE_END, 80, 8);
    }

    // ── North tunnel section (y 0 – TUNNEL_TOP_END) ───────────────────────────
    const ceilN = this.scene.add.graphics().setDepth(3);
    ceilN.fillStyle(0x080a0e, 0.70);
    ceilN.fillRect(0, 0, 2600, TUNNEL_TOP_END);

    // ── South tunnel section (y SURFACE_END – 4000) ───────────────────────────
    const ceilS = this.scene.add.graphics().setDepth(3);
    ceilS.fillStyle(0x080a0e, 0.70);
    ceilS.fillRect(0, SURFACE_END, 2600, 4000 - SURFACE_END);

    // ── Tunnel support pillars ─────────────────────────────────────────────────
    const pillars = this.scene.add.graphics().setDepth(2);
    // North tunnel pillars
    for (let py = 300; py < TUNNEL_TOP_END; py += 380) {
      pillars.fillStyle(0x3a3228, 1);
      pillars.fillRect(882, py, 26, 70);
      pillars.fillRect(1482, py, 26, 70);
      pillars.fillStyle(0x1a1510, 0.7);
      pillars.fillRect(886, py - 34, 18, 34);
      pillars.fillRect(1486, py - 34, 18, 34);
    }
    // South tunnel pillars
    for (let py = SURFACE_END + 120; py < 3780; py += 380) {
      pillars.fillStyle(0x3a3228, 1);
      pillars.fillRect(842, py, 26, 70);
      pillars.fillRect(1462, py, 26, 70);
      pillars.fillStyle(0x1a1510, 0.7);
      pillars.fillRect(846, py - 34, 18, 34);
      pillars.fillRect(1466, py - 34, 18, 34);
    }

    // ── Tunnel amber lights ───────────────────────────────────────────────────
    const lamps = this.scene.add.graphics().setDepth(2);
    const pools = this.scene.add.graphics().setDepth(1);
    const lampRanges = [[300, TUNNEL_TOP_END], [SURFACE_END, 3780]];
    for (const [yStart, yEnd] of lampRanges) {
      for (let ly = yStart + 50; ly < yEnd; ly += 280) {
        for (const lx of [920, 1470]) {
          lamps.fillStyle(0xffcc00, 0.95);
          lamps.fillCircle(lx, ly, 5);
          lamps.fillStyle(0xffaa00, 0.35);
          lamps.fillCircle(lx, ly, 12);
          pools.fillStyle(0xffee88, 0.08);
          pools.fillEllipse(lx, ly + 55, 90, 44);
        }
      }
    }

    // ── Pothole overlays (Lower Wacker detail) ────────────────────────────────
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
