import Phaser from "phaser";

const DEFAULT_MULTIPLIERS = { speedMultiplier: 1, accelerationMultiplier: 1, steeringMultiplier: 1 };

const ITEM_REGISTRY = {
  "malort-shot": {
    label: "Malort",
    pickupMsg: "Picked up a Malort shot. Press X to use it.",
    useMsg: "Malort active: speed +30%, steering -75% for 5s.",
    duration: 5000,
    multipliers: { speedMultiplier: 1.3, accelerationMultiplier: 1.3, steeringMultiplier: 0.25 },
    speedKick: true,
  },
};

const ITEM_KEYS = Object.keys(ITEM_REGISTRY);

export class ItemManager {
  constructor(scene, { pickups, onStatusChange }) {
    this.scene = scene;
    this.pickups = pickups.map((p) => ({ ...p, collected: false, sprite: null }));
    this.onStatusChange = onStatusChange;

    this.heldItem = null;
    this.effectRemainingMs = 0;
    this.activeEffect = null;

    this.pizzaSlowRemainingMs = 0;
    this.staticPizzas = [];
  }

  drawPickups() {
    for (const pickup of this.pickups) {
      const r = pickup.radius;
      const glow  = this.scene.add.circle(0, 0, r + 14, 0xf7d24b, 0.28);
      const ring  = this.scene.add.circle(0, 0, r + 6, 0x9b1c1c);
      ring.setStrokeStyle(4, 0xfff3a1);
      const glass = this.scene.add.circle(0, 0, r, 0xb36a1f);
      glass.setStrokeStyle(4, 0xfff3a1);
      const inner = this.scene.add.circle(0, 0, r - 8, 0xf3cf73);
      const label = this.scene.add.text(0, -1, "🥃", {
        fontFamily: "sans-serif",
        fontSize: "18px",
      });
      label.setOrigin(0.5);
      pickup.sprite = this.scene.add.container(pickup.x, pickup.y, [glow, ring, glass, inner, label]);
      pickup.sprite.setDepth(8);
    }
  }

  initStaticPizzas(positions) {
    this.staticPizzas = positions.map(({ x, y, radius }) => ({
      x, y, radius,
      sprite: this._makePizzaSprite(x, y),
    }));
  }

  reset(car) {
    this.heldItem = null;
    this.effectRemainingMs = 0;
    this.activeEffect = null;
    this.pizzaSlowRemainingMs = 0;
    car.setEffectMultipliers(DEFAULT_MULTIPLIERS);

    for (const pickup of this.pickups) {
      pickup.collected = false;
      pickup.sprite?.setVisible(true);
    }
  }

  update(delta, car) {
    this._tickEffect(delta, car);
    this._tickPizzaSlow(delta, car);
    this._checkPickupCollisions(car);
    this._checkStaticPizzaCollisions(car);
  }

  tryUseHeldItem(car) {
    if (!this.heldItem) {
      this.onStatusChange("No item held. Drive through a pickup first.");
      return false;
    }
    const def = ITEM_REGISTRY[this.heldItem];
    if (!def) return false;
    this._activateEffect(car, def);
    this.heldItem = null;
    return true;
  }

  getHeldItemLabel() {
    if (!this.heldItem) return "Empty";
    return ITEM_REGISTRY[this.heldItem]?.label ?? this.heldItem;
  }

  getEffectTimerLabel() {
    if (this.pizzaSlowRemainingMs > 0) {
      return `Effect: Slowed ${(this.pizzaSlowRemainingMs / 1000).toFixed(1)}s`;
    }
    if (this.effectRemainingMs > 0) {
      return `Effect: ${(this.effectRemainingMs / 1000).toFixed(1)}s`;
    }
    return "Effect: Ready";
  }

  // ── Private ────────────────────────────────────────────────────────────────

  _checkPickupCollisions(car) {
    const carBounds = car.getBounds();
    for (const pickup of this.pickups) {
      if (pickup.collected) continue;
      const pb = new Phaser.Geom.Rectangle(
        pickup.x - pickup.radius, pickup.y - pickup.radius,
        pickup.radius * 2, pickup.radius * 2,
      );
      if (!Phaser.Geom.Intersects.RectangleToRectangle(carBounds, pb)) continue;
      if (this.heldItem) {
        this.onStatusChange("Item slot full. Use your held item first.");
        break;
      }
      const key = ITEM_KEYS[Math.floor(Math.random() * ITEM_KEYS.length)];
      this.heldItem = key;
      pickup.collected = true;
      pickup.sprite?.setVisible(false);
      this.onStatusChange(ITEM_REGISTRY[key].pickupMsg);
      break;
    }
  }

  _checkStaticPizzaCollisions(car) {
    const b = car.getBounds();
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;
    for (const pizza of this.staticPizzas) {
      if (Math.hypot(pizza.x - cx, pizza.y - cy) < pizza.radius + 20) {
        this._applyPizzaSlow(car);
      }
    }
  }

  _activateEffect(car, def) {
    this.effectRemainingMs = def.duration;
    this.activeEffect = def;
    car.setEffectMultipliers(def.multipliers);
    if (def.speedKick) {
      car.speed = Phaser.Math.Clamp(
        Math.max(car.speed * 1.3, car.speed >= 0 ? 140 : car.speed),
        car.maxReverseSpeed,
        car.getMaxForwardSpeed(),
      );
    }
    this.onStatusChange(def.useMsg);
  }

  _tickEffect(delta, car) {
    if (this.effectRemainingMs <= 0) return;
    this.effectRemainingMs = Math.max(0, this.effectRemainingMs - delta);
    if (this.effectRemainingMs === 0) {
      car.setEffectMultipliers(DEFAULT_MULTIPLIERS);
      this.activeEffect = null;
      this.onStatusChange("Effect wore off.");
    }
  }

  _tickPizzaSlow(delta, car) {
    if (this.pizzaSlowRemainingMs <= 0) return;
    this.pizzaSlowRemainingMs = Math.max(0, this.pizzaSlowRemainingMs - delta);
    if (this.pizzaSlowRemainingMs === 0 && this.effectRemainingMs <= 0) {
      car.setEffectMultipliers(DEFAULT_MULTIPLIERS);
      this.onStatusChange("Pizza slow wore off.");
    }
  }

  _makePizzaSprite(x, y) {
    const key = "pizza-hazard";
    if (!this.scene.textures.exists(key)) {
      const gfx = this.scene.make.graphics({ add: false });
      gfx.fillStyle(0xc4813a, 1); gfx.fillCircle(32, 32, 32);
      gfx.fillStyle(0xc0281a, 1); gfx.fillCircle(32, 32, 26);
      gfx.fillStyle(0xf0d060, 1);
      gfx.fillEllipse(24, 24, 16, 12); gfx.fillEllipse(38, 26, 14, 10);
      gfx.fillEllipse(26, 38, 14, 10); gfx.fillEllipse(40, 40, 12, 9);
      gfx.fillStyle(0x8b1a0a, 1);
      gfx.fillCircle(26, 24, 5); gfx.fillCircle(38, 30, 4);
      gfx.fillCircle(28, 38, 4); gfx.fillCircle(38, 42, 4);
      gfx.generateTexture(key, 64, 64);
      gfx.destroy();
    }
    const sprite = this.scene.add.image(x, y, key);
    sprite.setDisplaySize(56, 56);
    sprite.setDepth(3);
    sprite.setAlpha(0.88);
    return sprite;
  }

  _applyPizzaSlow(car) {
    if (this.pizzaSlowRemainingMs > 0) return;
    this.pizzaSlowRemainingMs = 2000;
    if (this.effectRemainingMs <= 0) {
      car.setEffectMultipliers({ speedMultiplier: 0.5, accelerationMultiplier: 1, steeringMultiplier: 0.8 });
    }
    this.onStatusChange("Hit a pizza! Slowed for 2 seconds.");
  }
}
