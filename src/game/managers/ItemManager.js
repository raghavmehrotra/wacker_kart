import Phaser from "phaser";

const DEFAULT_EFFECT_MULTIPLIERS = {
  speedMultiplier: 1,
  accelerationMultiplier: 1,
  steeringMultiplier: 1,
};

export class ItemManager {
  constructor(scene, { pickups, malortPickupDurationMs, onStatusChange }) {
    this.scene = scene;
    this.pickups = pickups.map((pickup) => ({
      ...pickup,
      collected: false,
      sprite: null,
    }));
    this.malortPickupDurationMs = malortPickupDurationMs;
    this.onStatusChange = onStatusChange;
    this.malortEffectRemainingMs = 0;
  }

  drawPickups() {
    for (const pickup of this.pickups) {
      const glow = this.scene.add.circle(0, 0, pickup.radius + 14, 0xf7d24b, 0.32);
      const ring = this.scene.add.circle(0, 0, pickup.radius + 6, 0x9b1c1c);
      ring.setStrokeStyle(4, 0xfff3a1);
      const glass = this.scene.add.circle(0, 0, pickup.radius, 0xb36a1f);
      glass.setStrokeStyle(4, 0xfff3a1);
      const inner = this.scene.add.circle(0, 0, pickup.radius - 8, 0xf3cf73);

      const label = this.scene.add.text(0, -1, "M", {
        color: "#4f1600",
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "22px",
        fontStyle: "bold",
      });
      label.setOrigin(0.5);

      pickup.sprite = this.scene.add.container(pickup.x, pickup.y, [
        glow,
        ring,
        glass,
        inner,
        label,
      ]);
      pickup.sprite.setDepth(8);
    }
  }

  reset(car) {
    this.malortEffectRemainingMs = 0;
    car.setEffectMultipliers(DEFAULT_EFFECT_MULTIPLIERS);

    for (const pickup of this.pickups) {
      pickup.collected = false;
      pickup.sprite?.setVisible(true);
    }
  }

  update(delta, car) {
    this.updateMalortEffect(delta, car);
    this.checkMalortPickupCollisions(car);
  }

  updateMalortEffect(delta, car) {
    if (this.malortEffectRemainingMs <= 0) {
      return;
    }

    this.malortEffectRemainingMs = Math.max(0, this.malortEffectRemainingMs - delta);
    if (this.malortEffectRemainingMs === 0) {
      car.setEffectMultipliers(DEFAULT_EFFECT_MULTIPLIERS);
      this.onStatusChange("Malort wore off. Steering restored.");
    }
  }

  checkMalortPickupCollisions(car) {
    const carBounds = car.getBounds();

    for (const pickup of this.pickups) {
      if (pickup.collected) {
        continue;
      }

      const pickupBounds = new Phaser.Geom.Rectangle(
        pickup.x - pickup.radius,
        pickup.y - pickup.radius,
        pickup.radius * 2,
        pickup.radius * 2,
      );

      if (!Phaser.Geom.Intersects.RectangleToRectangle(carBounds, pickupBounds)) {
        continue;
      }

      pickup.collected = true;
      pickup.sprite?.setVisible(false);
      this.activateMalortShot(car);
      break;
    }
  }

  activateMalortShot(car) {
    this.malortEffectRemainingMs = this.malortPickupDurationMs;
    car.setEffectMultipliers({
      speedMultiplier: 1.3,
      accelerationMultiplier: 1.3,
      steeringMultiplier: 0.25,
    });

    const boostedSpeed = car.speed >= 0
      ? Math.max(car.speed * 1.3, 140)
      : car.speed;

    car.speed = Phaser.Math.Clamp(
      boostedSpeed,
      car.maxReverseSpeed,
      car.getMaxForwardSpeed(),
    );

    this.onStatusChange("Malort shot active: speed up 30%, steering down 75% for 5 seconds.");
  }
}
