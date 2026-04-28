import Phaser from "phaser";
import { Car } from "../entities/Car.js";

export class PrototypeScene extends Phaser.Scene {
  constructor() {
    super("prototype-scene");

    this.worldWidth = 2600;
    this.worldHeight = 4000;
    this.totalLaps = 3;

    this.roadHalfWidth = 42;
    this.shoulderHalfWidth = 62;

    this.southboundLine = [
      new Phaser.Math.Vector2(1450, 620),
      new Phaser.Math.Vector2(1510, 1120),
      new Phaser.Math.Vector2(1820, 1650),
      new Phaser.Math.Vector2(1710, 1960),
      new Phaser.Math.Vector2(1460, 2280),
      new Phaser.Math.Vector2(1590, 2860),
      new Phaser.Math.Vector2(1410, 3220),
    ];

    this.bottomTurnLine = [
      new Phaser.Math.Vector2(1410, 3220),
      new Phaser.Math.Vector2(1400, 3420),
      new Phaser.Math.Vector2(1290, 3550),
      new Phaser.Math.Vector2(1110, 3560),
      new Phaser.Math.Vector2(980, 3450),
      new Phaser.Math.Vector2(960, 3220),
    ];

    this.northboundLine = [
      new Phaser.Math.Vector2(960, 3220),
      new Phaser.Math.Vector2(900, 2830),
      new Phaser.Math.Vector2(760, 2440),
      new Phaser.Math.Vector2(640, 2100),
      new Phaser.Math.Vector2(860, 1640),
      new Phaser.Math.Vector2(840, 1120),
      new Phaser.Math.Vector2(930, 620),
    ];

    this.topTurnLine = [
      new Phaser.Math.Vector2(930, 620),
      new Phaser.Math.Vector2(950, 430),
      new Phaser.Math.Vector2(1050, 320),
      new Phaser.Math.Vector2(1210, 275),
      new Phaser.Math.Vector2(1380, 320),
      new Phaser.Math.Vector2(1440, 460),
      new Phaser.Math.Vector2(1450, 620),
    ];

    this.trackPolylines = [
      this.southboundLine,
      this.bottomTurnLine,
      this.northboundLine,
      this.topTurnLine,
    ];

    this.finishLine = new Phaser.Geom.Rectangle(872, 690, 120, 28);
    this.southTurnaround = new Phaser.Geom.Rectangle(1010, 3390, 390, 170);
    this.spawnPoint = new Phaser.Math.Vector2(1450, 760);
    this.treeObstacles = [
      { x: 1490, y: 2860, radius: 38 },
    ];
  }

  create() {
    this.drawWorld();
    this.initializeRaceState();

    this.controls = this.input.keyboard.createCursorKeys();
    this.car = new Car(this, this.spawnPoint.x, this.spawnPoint.y, Math.PI);
    this.cameraTarget = this.add.zone(this.car.sprite.x, this.car.sprite.y, 1, 1);
    this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.startFollow(this.cameraTarget, true, 0.12, 0.12);
    this.cameras.main.setZoom(1);
    this.cameras.main.setRoundPixels(false);

    this.lapText = this.add.text(20, 20, `Lap 1 / ${this.totalLaps}`, {
      color: "#f5f1e8",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    }).setScrollFactor(0);

    this.timerText = this.add.text(20, 44, "Time 00:00.00", {
      color: "#f5f1e8",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    }).setScrollFactor(0);

    this.hudObjects = [
      this.lapText,
      this.timerText,
    ];

    this.configureHudCamera();
    this.setStatusMessage("Press Space to begin the Lake Shore Drive run.");
  }

  update(_, delta) {
    const dt = Math.min(delta / 1000, 0.033);

    if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.restart();
      return;
    }

    if (!this.raceStarted && Phaser.Input.Keyboard.JustDown(this.startKey)) {
      this.raceStarted = true;
      this.setStatusMessage("Race started. Reach 50th Street, then return north to Navy Pier.");
    }

    if (this.raceStarted && !this.raceFinished) {
      this.elapsedMs += delta;
      this.car.update(dt, this.controls);
      this.car.keepInBounds(this.worldWidth, this.worldHeight);

      const trackDistance = this.getTrackDistance(this.car.sprite.x, this.car.sprite.y);
      if (trackDistance > this.shoulderHalfWidth) {
        this.car.bounceToPreviousPosition();
      } else if (trackDistance > this.roadHalfWidth) {
        this.car.applySurfaceDrag(85 * dt);
      }

      if (this.hitTreeObstacle()) {
        this.car.bounceToPreviousPosition();
        this.car.speed = 0;
      }

      this.updateRaceProgress();
    } else {
      this.car.applySurfaceDrag(320 * dt);
    }

    const speedRatio = Math.min(Math.abs(this.car.speed) / this.car.maxForwardSpeed, 1);
    const lookAheadDistance = Phaser.Math.Linear(110, 220, speedRatio);
    this.cameraTarget.x = this.car.sprite.x + Math.sin(this.car.rotation) * lookAheadDistance;
    this.cameraTarget.y = this.car.sprite.y - Math.cos(this.car.rotation) * lookAheadDistance;

    const targetRotation = -this.car.rotation;
    this.cameras.main.rotation = Phaser.Math.Angle.RotateTo(
      this.cameras.main.rotation,
      targetRotation,
      1.75 * dt,
    );

    const displayedLap = this.raceFinished
      ? this.totalLaps
      : Math.min(this.completedLaps + 1, this.totalLaps);
    this.lapText.setText(`Lap ${displayedLap} / ${this.totalLaps}`);
    this.timerText.setText(`Time ${this.formatTime(this.elapsedMs)}`);
  }

  initializeRaceState() {
    this.completedLaps = 0;
    this.elapsedMs = 0;
    this.raceStarted = false;
    this.raceFinished = false;
    this.reachedSouthTurnaround = false;
    this.wasInsideSouthTurnaround = false;
    this.wasInsideFinishLine = false;
  }

  updateRaceProgress() {
    const carBounds = this.car.getBounds();
    const insideSouthTurnaround = Phaser.Geom.Intersects.RectangleToRectangle(
      carBounds,
      this.southTurnaround,
    );
    const insideFinishLine = Phaser.Geom.Intersects.RectangleToRectangle(carBounds, this.finishLine);

    if (insideSouthTurnaround && !this.wasInsideSouthTurnaround) {
      this.reachedSouthTurnaround = true;
      this.setStatusMessage("50th Street reached. Now return north and cross the Navy Pier line.");
    }

    if (insideFinishLine && !this.wasInsideFinishLine && this.reachedSouthTurnaround) {
      this.completeLap();
    } else if (insideFinishLine && !this.wasInsideFinishLine && !this.reachedSouthTurnaround) {
      this.setStatusMessage("Go south to 50th Street before the Navy Pier line can count.");
    }

    this.wasInsideSouthTurnaround = insideSouthTurnaround;
    this.wasInsideFinishLine = insideFinishLine;
  }

  completeLap() {
    this.completedLaps += 1;

    if (this.completedLaps >= this.totalLaps) {
      this.raceFinished = true;
      this.reachedSouthTurnaround = false;
      this.setStatusMessage(`Finished in ${this.formatTime(this.elapsedMs)}. Press R to restart.`);
      return;
    }

    this.reachedSouthTurnaround = false;
    this.setStatusMessage(`Lap ${this.completedLaps + 1}. Head south again and loop back north.`);
  }

  setStatusMessage(message) {
    const statusNode = document.getElementById("race-status");
    if (statusNode) {
      statusNode.textContent = message;
    }
  }

  formatTime(elapsedMs) {
    const totalCentiseconds = Math.floor(elapsedMs / 10);
    const minutes = Math.floor(totalCentiseconds / 6000);
    const seconds = Math.floor((totalCentiseconds % 6000) / 100);
    const centiseconds = totalCentiseconds % 100;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
  }

  pointToSegmentDistance(point, start, end) {
    const segmentX = end.x - start.x;
    const segmentY = end.y - start.y;
    const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

    if (segmentLengthSquared === 0) {
      return Phaser.Math.Distance.Between(point.x, point.y, start.x, start.y);
    }

    const projection = Phaser.Math.Clamp(
      ((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) / segmentLengthSquared,
      0,
      1,
    );

    const closestX = start.x + projection * segmentX;
    const closestY = start.y + projection * segmentY;

    return Phaser.Math.Distance.Between(point.x, point.y, closestX, closestY);
  }

  getTrackDistance(x, y) {
    let minDistance = Number.POSITIVE_INFINITY;
    const point = new Phaser.Math.Vector2(x, y);

    for (const polyline of this.trackPolylines) {
      for (let i = 0; i < polyline.length - 1; i += 1) {
        const distance = this.pointToSegmentDistance(point, polyline[i], polyline[i + 1]);
        minDistance = Math.min(minDistance, distance);
      }
    }

    return minDistance;
  }

  hitTreeObstacle() {
    return this.treeObstacles.some((tree) => {
      const obstacleBounds = new Phaser.Geom.Rectangle(
        tree.x - tree.radius,
        tree.y - tree.radius,
        tree.radius * 2,
        tree.radius * 2,
      );

      return Phaser.Geom.Intersects.RectangleToRectangle(this.car.getBounds(), obstacleBounds);
    });
  }

  configureHudCamera() {
    this.cameras.main.ignore(this.hudObjects);

    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height, false, "ui-camera");
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.setZoom(1);
    this.uiCamera.setRotation(0);
    this.uiCamera.ignore(this.children.list.filter((child) => !this.hudObjects.includes(child)));
  }

  drawPolylineStroke(graphics, points, width, color, alpha = 1) {
    graphics.lineStyle(width, color, alpha);
    graphics.strokePoints(points, false, false);
  }

  drawTreeCluster(x, y, radius = 18) {
    const crownA = this.add.circle(x, y, radius, 0x4f9555);
    const crownB = this.add.circle(x + radius * 0.55, y - radius * 0.2, radius * 0.78, 0x5aa35c);
    const crownC = this.add.circle(x - radius * 0.45, y - radius * 0.15, radius * 0.7, 0x3f7f47);
    const trunk = this.add.rectangle(x, y + radius * 1.1, radius * 0.28, radius * 0.9, 0x5c4024);

    crownA.setDepth(1);
    crownB.setDepth(1);
    crownC.setDepth(1);
    trunk.setDepth(0);
  }

  drawCheckerboardLine(x, y, cols, rows, tileSize) {
    const graphics = this.add.graphics();
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const isLight = (row + col) % 2 === 0;
        graphics.fillStyle(isLight ? 0xffffff : 0x111111, 1);
        graphics.fillRect(x + col * tileSize, y + row * tileSize, tileSize, tileSize);
      }
    }
  }

  drawWorld() {
    const land = this.add.graphics();
    land.fillStyle(0x5f9151, 1);
    land.fillRect(0, 0, this.worldWidth, this.worldHeight);

    const skyWater = this.add.graphics();
    skyWater.fillStyle(0x7ed1f5, 1);
    skyWater.fillRect(1560, 0, this.worldWidth - 1560, this.worldHeight);

    const shoreline = this.add.graphics();
    shoreline.fillStyle(0xa4dcb0, 1);
    shoreline.fillPoints(
      [
        new Phaser.Math.Vector2(1560, 0),
        new Phaser.Math.Vector2(1700, 0),
        new Phaser.Math.Vector2(1710, 550),
        new Phaser.Math.Vector2(1800, 1200),
        new Phaser.Math.Vector2(1700, 1950),
        new Phaser.Math.Vector2(1810, 2720),
        new Phaser.Math.Vector2(1630, 3380),
        new Phaser.Math.Vector2(1700, this.worldHeight),
        new Phaser.Math.Vector2(1560, this.worldHeight),
      ],
      true,
      true,
    );

    const parks = this.add.graphics();
    parks.fillStyle(0x7dbb63, 1);
    parks.fillRoundedRect(1110, 480, 280, 380, 70);
    parks.fillRoundedRect(720, 980, 460, 620, 100);
    parks.fillRoundedRect(1310, 1180, 250, 460, 80);
    parks.fillRoundedRect(760, 1940, 430, 650, 140);
    parks.fillRoundedRect(1260, 2540, 250, 340, 80);
    parks.fillRoundedRect(700, 3020, 720, 480, 140);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0xffffff, 0.05);
    for (let x = 0; x <= this.worldWidth; x += 96) {
      grid.lineBetween(x, 0, x, this.worldHeight);
    }
    for (let y = 0; y <= this.worldHeight; y += 96) {
      grid.lineBetween(0, y, this.worldWidth, y);
    }

    const road = this.add.graphics();
    for (const polyline of this.trackPolylines) {
      this.drawPolylineStroke(road, polyline, this.shoulderHalfWidth * 2, 0x6f685d);
    }
    for (const polyline of this.trackPolylines) {
      this.drawPolylineStroke(road, polyline, this.roadHalfWidth * 2, 0xd5ccbe);
    }
    for (const polyline of this.trackPolylines) {
      this.drawPolylineStroke(road, polyline, 4, 0xf4e3a2, 0.65);
    }

    const laneMarks = this.add.graphics();
    laneMarks.lineStyle(3, 0xffffff, 0.7);
    laneMarks.strokePoints(
      [
        new Phaser.Math.Vector2(1195, 630),
        new Phaser.Math.Vector2(1230, 1110),
        new Phaser.Math.Vector2(1230, 1500),
        new Phaser.Math.Vector2(1390, 1770),
        new Phaser.Math.Vector2(1170, 2280),
        new Phaser.Math.Vector2(1245, 2860),
        new Phaser.Math.Vector2(1180, 3220),
      ],
      false,
      false,
    );

    this.drawCheckerboardLine(872, 690, 15, 4, 8);

    const labelStyle = {
      color: "#f5f1e8",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    };

    this.add.text(820, 648, "NAVY PIER", labelStyle);
    this.add.text(1515, 700, "Southbound", labelStyle);
    this.add.text(700, 700, "Northbound", labelStyle);
    this.add.text(1110, 3338, "50TH ST TURN", labelStyle);

    const skyline = this.add.graphics();
    skyline.fillStyle(0x4a5a6d, 0.95);
    skyline.fillRect(170, 210, 110, 170);
    skyline.fillRect(320, 170, 80, 210);
    skyline.fillRect(430, 130, 95, 250);
    skyline.fillRect(555, 90, 120, 290);
    skyline.fillRect(708, 150, 85, 230);
    skyline.fillRect(825, 190, 100, 190);
    skyline.fillRect(960, 130, 75, 250);

    for (const [x, y, r] of [
      [1140, 580, 26],
      [1240, 650, 22],
      [860, 1090, 20],
      [980, 1210, 24],
      [770, 1470, 22],
      [1180, 1460, 18],
      [1520, 1460, 20],
      [890, 2140, 24],
      [1040, 2330, 22],
      [760, 3180, 20],
      [920, 3350, 22],
      [1370, 3140, 24],
      [1490, 2860, 18],
    ]) {
      this.drawTreeCluster(x, y, r);
    }

    const beach = this.add.graphics();
    beach.fillStyle(0xe6d1a0, 0.85);
    beach.fillPoints(
      [
        new Phaser.Math.Vector2(1610, 740),
        new Phaser.Math.Vector2(1730, 740),
        new Phaser.Math.Vector2(1755, 1240),
        new Phaser.Math.Vector2(1650, 1220),
      ],
      true,
      true,
    );

    const startTurnMarker = this.add.graphics();
    startTurnMarker.lineStyle(4, 0x9fe8ff, 0.9);
    startTurnMarker.strokeRectShape(this.southTurnaround);
  }
}
