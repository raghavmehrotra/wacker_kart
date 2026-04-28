import Phaser from "phaser";
import { Car } from "../entities/Car.js";

export class PrototypeScene extends Phaser.Scene {
  constructor() {
    super("prototype-scene");
  }

  create() {
    this.drawGrid();

    this.controls = this.input.keyboard.createCursorKeys();
    this.car = new Car(this, this.scale.width / 2, this.scale.height / 2);

    this.add.text(20, 20, "Speed", {
      color: "#f5f1e8",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    });

    this.speedText = this.add.text(20, 44, "0 px/s", {
      color: "#f5f1e8",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    });

    this.helpText = this.add.text(
      20,
      76,
      "Controls: Up accelerate, Down brake/reverse, Left/Right steer",
      {
        color: "#f5f1e8",
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "18px",
      },
    );

  }

  update(_, delta) {
    const dt = Math.min(delta / 1000, 0.033);

    this.car.update(dt, this.controls);
    this.car.keepInBounds(this.scale.width, this.scale.height);

    this.speedText.setText(`${Math.round(this.car.speed)} px/s`);
  }

  drawGrid() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x0b0f14, 1);
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);
    graphics.lineStyle(1, 0xffffff, 0.08);

    for (let x = 0; x <= this.scale.width; x += 48) {
      graphics.lineBetween(x, 0, x, this.scale.height);
    }

    for (let y = 0; y <= this.scale.height; y += 48) {
      graphics.lineBetween(0, y, this.scale.width, y);
    }
  }
}
