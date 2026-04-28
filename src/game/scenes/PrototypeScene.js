import Phaser from "phaser";
import { Car } from "../entities/Car.js";

export class PrototypeScene extends Phaser.Scene {
  constructor() {
    super("prototype-scene");
    this.worldWidth = 2200;
    this.worldHeight = 1400;
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
  }

  create() {
    this.drawWorld();

    this.controls = this.input.keyboard.createCursorKeys();
    this.car = new Car(this, 350, 310);
    this.cameraTarget = this.add.zone(this.car.sprite.x, this.car.sprite.y, 1, 1);

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

    this.helpText = this.add.text(
      20,
      76,
      "Practice track: follow the tan road. Camera follows the car.",
      {
        color: "#f5f1e8",
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "18px",
      },
    ).setScrollFactor(0);

    this.controlsText = this.add.text(
      20,
      104,
      "Controls: Up accelerate, Down brake/reverse, Left/Right steer",
      {
        color: "#f5f1e8",
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "18px",
      },
    ).setScrollFactor(0);
  }

  update(_, delta) {
    const dt = Math.min(delta / 1000, 0.033);

    this.car.update(dt, this.controls);
    this.car.keepInBounds(this.worldWidth, this.worldHeight);

    if (!this.isOnRoad(this.car.sprite.x, this.car.sprite.y)) {
      this.car.bounceToPreviousPosition();
    } else if (this.isOnShoulder(this.car.sprite.x, this.car.sprite.y)) {
      this.car.applySurfaceDrag(90 * dt);
    }

    const speedRatio = Math.min(Math.abs(this.car.speed) / this.car.maxForwardSpeed, 1);
    const lookAheadDistance = Phaser.Math.Linear(110, 220, speedRatio);
    this.cameraTarget.x = this.car.sprite.x + Math.sin(this.car.rotation) * lookAheadDistance;
    this.cameraTarget.y = this.car.sprite.y - Math.cos(this.car.rotation) * lookAheadDistance;

    this.speedText.setText(`${Math.round(this.car.speed)} px/s`);
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

    const spawnMarker = this.add.graphics();
    spawnMarker.fillStyle(0xffffff, 1);
    spawnMarker.fillRect(314, 260, 72, 10);
    spawnMarker.fillStyle(0x111111, 1);
    spawnMarker.fillRect(314, 270, 18, 10);
    spawnMarker.fillRect(350, 270, 18, 10);

    const labelStyle = {
      color: "#f5f1e8",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    };

    this.add.text(320, 226, "START", labelStyle);
    this.add.text(1010, 650, "INFIELD", labelStyle);
    this.add.text(1600, 1210, "Practice loop", labelStyle);

    for (let i = 0; i < 14; i += 1) {
      const cone = this.add.circle(520 + i * 70, 1088, 7, 0xf08a24);
      cone.setStrokeStyle(2, 0x5d3410);
    }
  }
}
