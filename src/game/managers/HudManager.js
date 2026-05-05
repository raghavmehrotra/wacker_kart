export class HudManager {
  constructor(scene, totalLaps) {
    this.scene = scene;
    this.totalLaps = totalLaps;

    this.lapText = scene.add.text(20, 20, `Lap 1 / ${this.totalLaps}`, {
      color: "#f5f1e8",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    }).setScrollFactor(0);

    this.timerText = scene.add.text(20, 44, "Time 00:00.00", {
      color: "#f5f1e8",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    }).setScrollFactor(0);

    this.speedText = scene.add.text(20, 68, "Speed 0", {
      color: "#f5f1e8",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    }).setScrollFactor(0);

    this.itemText = scene.add.text(20, 92, "Item Empty", {
      color: "#f5f1e8",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    }).setScrollFactor(0);

    this.effectText = scene.add.text(20, 116, "Boost Ready", {
      color: "#f3c969",
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
    }).setScrollFactor(0);

    this.hudObjects = [
      this.lapText,
      this.timerText,
      this.speedText,
      this.itemText,
      this.effectText,
    ];
  }

  configureCamera() {
    this.scene.cameras.main.ignore(this.hudObjects);

    const uiCamera = this.scene.cameras.add(0, 0, this.scene.scale.width, this.scene.scale.height, false, "ui-camera");
    uiCamera.setScroll(0, 0);
    uiCamera.setZoom(1);
    uiCamera.setRotation(0);
    uiCamera.ignore(this.scene.children.list.filter((child) => !this.hudObjects.includes(child)));
  }

  render({ displayedLap, elapsedMs, speed, heldItemLabel, effectTimerLabel, formatTime }) {
    this.lapText.setText(`Lap ${displayedLap} / ${this.totalLaps}`);
    this.timerText.setText(`Time ${formatTime(elapsedMs)}`);
    this.speedText.setText(`Speed ${Math.round(Math.abs(speed))}`);
    this.itemText.setText(`Item ${heldItemLabel}`);
    this.effectText.setText(`Boost ${effectTimerLabel}`);
  }
}
