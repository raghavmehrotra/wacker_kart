import Phaser from "phaser";
import { Car } from "../entities/Car.js";

export class PrototypeScene extends Phaser.Scene {
  constructor() {
    super("prototype-scene");
    this.worldWidth = 2200;
    this.worldHeight = 1400;
    this.totalLaps = 3;
    this.trackSegments = [
      new Phaser.Geom.Rectangle(260, 220, 1680, 180),
      new Phaser.Geom.Rectangle(1760, 220, 180, 960),
      new Phaser.Geom.Rectangle(260, 1000, 1680, 180),
      new Phaser.Geom.Rectangle(260, 220, 180, 960),
      new Phaser.Geom.Rectangle(760, 400, 680, 180),
      new Phaser.Geom.Rectangle(1260, 400, 180, 600),
      new Phaser.Geom.Rectangle(760, 820, 680, 180),
      new Phaser.Geom.Rectangle(760, 400, 180, 600),
    ];
    this.finishLine = new Phaser.Geom.Rectangle(402, 236, 32, 156);
    this.checkpoint = new Phaser.Geom.Rectangle(1748, 652, 192, 180);
  }

  create() {
    this.drawWorld();
    this.initializeRaceState();

    this.controls = this.input.keyboard.createCursorKeys();
    this.car = new Car(this, 350, 310, Math.PI / 2);
    this.cameraTarget = this.add.zone(this.car.sprite.x, this.car.sprite.y, 1, 1);
    this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.startFollow(this.cameraTarget, true, 0.12, 0.12);
    this.cameras.main.setZoom(1);

    this.add.text(20, 20, "Speed", {
      color: "#f5f1e8",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    }).setScrollFactor(0);

    this.speedText = this.add.text(20, 44, "0 px/s", {
      color: "#f5f1e8",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    }).setScrollFactor(0);

    this.lapText = this.add.text(20, 68, `Lap 1 / ${this.totalLaps}`, {
      color: "#f5f1e8",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    }).setScrollFactor(0);

    this.timerText = this.add.text(20, 92, "Time 00:00.00", {
      color: "#f5f1e8",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    }).setScrollFactor(0);

    this.helpText = this.add.text(
      20,
      120,
      "Press Space to start. Then cross START after the far checkpoint to count the lap.",
      {
        color: "#f5f1e8",
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "18px",
      },
    ).setScrollFactor(0);

    this.controlsText = this.add.text(
      20,
      148,
      "Controls: Space start, Up accelerate, Down brake/reverse, Left/Right steer, R restart",
      {
        color: "#f5f1e8",
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "18px",
      },
    ).setScrollFactor(0);

    this.statusText = this.add.text(20, 176, "Press Space to begin the race.", {
      color: "#f3c969",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    }).setScrollFactor(0);
  }

  update(_, delta) {
    const dt = Math.min(delta / 1000, 0.033);

    if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.restart();
      return;
    }

    if (!this.raceStarted && Phaser.Input.Keyboard.JustDown(this.startKey)) {
      this.raceStarted = true;
      this.statusText.setText("Race started. Hit the far checkpoint, then cross START.");
    }

    if (this.raceStarted && !this.raceFinished) {
      this.elapsedMs += delta;
      this.car.update(dt, this.controls);
      this.car.keepInBounds(this.worldWidth, this.worldHeight);

      if (!this.isOnRoad(this.car.sprite.x, this.car.sprite.y)) {
        this.car.bounceToPreviousPosition();
      } else if (this.isOnShoulder(this.car.sprite.x, this.car.sprite.y)) {
        this.car.applySurfaceDrag(90 * dt);
      }

      this.updateRaceProgress();
    } else {
      this.car.applySurfaceDrag(320 * dt);
    }

    const speedRatio = Math.min(Math.abs(this.car.speed) / this.car.maxForwardSpeed, 1);
    const lookAheadDistance = Phaser.Math.Linear(110, 220, speedRatio);
    this.cameraTarget.x = this.car.sprite.x + Math.sin(this.car.rotation) * lookAheadDistance;
    this.cameraTarget.y = this.car.sprite.y - Math.cos(this.car.rotation) * lookAheadDistance;

    this.speedText.setText(`${Math.round(this.car.speed)} px/s`);
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
    this.hasCheckpoint = false;
    this.wasInsideCheckpoint = false;
    this.wasInsideFinishLine = true;
  }

  updateRaceProgress() {
    const carBounds = this.car.getBounds();
    const insideCheckpoint = Phaser.Geom.Intersects.RectangleToRectangle(carBounds, this.checkpoint);
    const insideFinishLine = Phaser.Geom.Intersects.RectangleToRectangle(carBounds, this.finishLine);

    if (insideCheckpoint && !this.wasInsideCheckpoint) {
      this.hasCheckpoint = true;
      this.statusText.setText("Checkpoint hit. Return to START to complete the lap.");
    }

    if (insideFinishLine && !this.wasInsideFinishLine && this.hasCheckpoint) {
      this.completeLap();
    } else if (insideFinishLine && !this.wasInsideFinishLine && !this.hasCheckpoint) {
      this.statusText.setText("Lap will count only after the far checkpoint.");
    }

    this.wasInsideCheckpoint = insideCheckpoint;
    this.wasInsideFinishLine = insideFinishLine;
  }

  completeLap() {
    this.completedLaps += 1;

    if (this.completedLaps >= this.totalLaps) {
      this.raceFinished = true;
      this.hasCheckpoint = false;
      this.statusText.setText(`Finished in ${this.formatTime(this.elapsedMs)}. Press R to restart.`);
      return;
    }

    this.hasCheckpoint = false;
    this.statusText.setText(`Lap ${this.completedLaps + 1}. Hit the far checkpoint, then cross START.`);
  }

  formatTime(elapsedMs) {
    const totalCentiseconds = Math.floor(elapsedMs / 10);
    const minutes = Math.floor(totalCentiseconds / 6000);
    const seconds = Math.floor((totalCentiseconds % 6000) / 100);
    const centiseconds = totalCentiseconds % 100;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
  }

  isOnRoad(x, y) {
    return this.trackSegments.some((segment) => Phaser.Geom.Rectangle.Contains(segment, x, y));
  }

  isOnShoulder(x, y) {
    return this.trackSegments.some((segment) => {
      const padded = Phaser.Geom.Rectangle.Clone(segment);
      padded.x += 24;
      padded.y += 24;
      padded.width -= 48;
      padded.height -= 48;
      return Phaser.Geom.Rectangle.Contains(segment, x, y) && !Phaser.Geom.Rectangle.Contains(padded, x, y);
    });
  }

  drawWorld() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x18321f, 1);
    graphics.fillRect(0, 0, this.worldWidth, this.worldHeight);

    graphics.lineStyle(1, 0xffffff, 0.06);
    for (let x = 0; x <= this.worldWidth; x += 64) {
      graphics.lineBetween(x, 0, x, this.worldHeight);
    }

    for (let y = 0; y <= this.worldHeight; y += 64) {
      graphics.lineBetween(0, y, this.worldWidth, y);
    }

    graphics.fillStyle(0x5e5a53, 1);
    for (const segment of this.trackSegments) {
      graphics.fillRectShape(segment);
    }

    graphics.fillStyle(0xc7b188, 1);
    for (const segment of this.trackSegments) {
      graphics.fillRect(segment.x + 24, segment.y + 24, segment.width - 48, segment.height - 48);
    }

    graphics.fillStyle(0x3a9d5d, 0.9);
    graphics.fillRect(780, 420, 640, 560);

    graphics.lineStyle(6, 0xf7e6a6, 0.9);
    graphics.strokeRect(300, 260, 1600, 880);

    const startLine = this.add.graphics();
    const tileSize = 8;
    const cols = 4;
    const rows = 11;
    const startX = 402;
    const startY = 236;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const isLight = (row + col) % 2 === 0;
        startLine.fillStyle(isLight ? 0xffffff : 0x111111, 1);
        startLine.fillRect(startX + col * tileSize, startY + row * tileSize, tileSize, tileSize);
      }
    }

    const labelStyle = {
      color: "#f5f1e8",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    };

    this.add.text(320, 226, "START", labelStyle);
    this.add.text(1010, 650, "INFIELD", labelStyle);
    this.add.text(1600, 1210, "Practice loop", labelStyle);
    this.add.text(1774, 642, "CHECK", labelStyle);

    for (let i = 0; i < 14; i += 1) {
      const cone = this.add.circle(520 + i * 70, 1088, 7, 0xf08a24);
      cone.setStrokeStyle(2, 0x5d3410);
    }

    const checkpointMarker = this.add.graphics();
    checkpointMarker.lineStyle(4, 0x8ed1ff, 0.9);
    checkpointMarker.strokeRectShape(this.checkpoint);
  }
}
