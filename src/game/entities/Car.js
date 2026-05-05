import Phaser from "phaser";

export class Car {
  constructor(scene, x, y, initialRotation = 0) {
    this.scene = scene;
    const body = scene.add.rectangle(0, 0, 28, 44, 0xc24b3f);
    body.setStrokeStyle(2, 0x7d2a24);
    const windshield = scene.add.rectangle(0, -12, 20, 10, 0xf2d16b);
    const frontMarker = scene.add.circle(0, -18, 4, 0xffffff);

    this.sprite = scene.add.container(x, y, [body, windshield, frontMarker]);
    this.sprite.setDepth(4);
    this.width = 28;
    this.height = 44;

    this.velocity = new Phaser.Math.Vector2(0, 0);
    this.rotation = initialRotation;
    this.speed = 0;
    this.baseMaxForwardSpeed = 380;
    this.maxReverseSpeed = -140;
    this.baseAcceleration = 280;
    this.braking = 380;
    this.drag = 180;
    this.baseSteeringRate = 2.6;
    this.speedMultiplier = 1;
    this.accelerationMultiplier = 1;
    this.steeringMultiplier = 1;
    this.previousPosition = new Phaser.Math.Vector2(x, y);
    this.sprite.rotation = this.rotation;
  }

  update(dt, controls) {
    this.previousPosition.set(this.sprite.x, this.sprite.y);
    const acceleration = this.getAcceleration();

    if (controls.up.isDown) {
      this.speed += acceleration * dt;
    } else if (controls.down.isDown) {
      if (this.speed > 0) {
        this.speed -= this.braking * dt;
      } else {
        this.speed -= acceleration * 0.75 * dt;
      }
    } else {
      this.speed = this.applyDrag(this.speed, this.drag * dt);
    }

    const maxForwardSpeed = this.getMaxForwardSpeed();
    this.speed = Phaser.Math.Clamp(this.speed, this.maxReverseSpeed, maxForwardSpeed);

    if (Math.abs(this.speed) > 4) {
      const direction = this.speed >= 0 ? 1 : -1;
      let steeringInput = 0;

      if (controls.left.isDown) {
        steeringInput -= 1;
      }

      if (controls.right.isDown) {
        steeringInput += 1;
      }

      const steeringScale = Math.min(Math.abs(this.speed) / maxForwardSpeed, 1);
      this.rotation += steeringInput * this.getSteeringRate() * steeringScale * direction * dt;
    }

    this.velocity.setTo(Math.sin(this.rotation), -Math.cos(this.rotation)).scale(this.speed * dt);
    this.sprite.x += this.velocity.x;
    this.sprite.y += this.velocity.y;
    this.sprite.rotation = this.rotation;
  }

  bounceToPreviousPosition() {
    this.sprite.x = this.previousPosition.x;
    this.sprite.y = this.previousPosition.y;
    this.speed *= -0.2;
  }

  applySurfaceDrag(amount) {
    this.speed = this.applyDrag(this.speed, amount);
  }

  getMaxForwardSpeed() {
    return this.baseMaxForwardSpeed * this.speedMultiplier;
  }

  getAcceleration() {
    return this.baseAcceleration * this.accelerationMultiplier;
  }

  getSteeringRate() {
    return this.baseSteeringRate * this.steeringMultiplier;
  }

  setEffectMultipliers({ speedMultiplier = 1, accelerationMultiplier = 1, steeringMultiplier = 1 }) {
    this.speedMultiplier = speedMultiplier;
    this.accelerationMultiplier = accelerationMultiplier;
    this.steeringMultiplier = steeringMultiplier;
    this.speed = Phaser.Math.Clamp(this.speed, this.maxReverseSpeed, this.getMaxForwardSpeed());
  }

  getBounds() {
    return new Phaser.Geom.Rectangle(
      this.sprite.x - this.width / 2,
      this.sprite.y - this.height / 2,
      this.width,
      this.height,
    );
  }

  keepInBounds(width, height) {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    if (this.sprite.x < halfWidth) {
      this.sprite.x = halfWidth;
      this.speed *= 0.4;
    } else if (this.sprite.x > width - halfWidth) {
      this.sprite.x = width - halfWidth;
      this.speed *= 0.4;
    }

    if (this.sprite.y < halfHeight) {
      this.sprite.y = halfHeight;
      this.speed *= 0.4;
    } else if (this.sprite.y > height - halfHeight) {
      this.sprite.y = height - halfHeight;
      this.speed *= 0.4;
    }
  }

  applyDrag(speed, amount) {
    if (speed > 0) {
      return Math.max(0, speed - amount);
    }

    if (speed < 0) {
      return Math.min(0, speed + amount);
    }

    return 0;
  }
}
