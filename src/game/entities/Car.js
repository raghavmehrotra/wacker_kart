import Phaser from "phaser";

export class Car {
  constructor(scene, x, y) {
    this.scene = scene;
    const body = scene.add.rectangle(0, 0, 28, 44, 0xc24b3f);
    body.setStrokeStyle(2, 0x7d2a24);
    const windshield = scene.add.rectangle(0, -12, 20, 10, 0xf2d16b);
    const frontMarker = scene.add.circle(0, -18, 4, 0xffffff);

    this.sprite = scene.add.container(x, y, [body, windshield, frontMarker]);
    this.width = 28;
    this.height = 44;

    this.velocity = new Phaser.Math.Vector2(0, 0);
    this.rotation = 0;
    this.speed = 0;
    this.maxForwardSpeed = 380;
    this.maxReverseSpeed = -140;
    this.acceleration = 280;
    this.braking = 380;
    this.drag = 180;
    this.steeringRate = 2.6;
  }

  update(dt, controls) {
    if (controls.up.isDown) {
      this.speed += this.acceleration * dt;
    } else if (controls.down.isDown) {
      if (this.speed > 0) {
        this.speed -= this.braking * dt;
      } else {
        this.speed -= this.acceleration * 0.75 * dt;
      }
    } else {
      this.speed = this.applyDrag(this.speed, this.drag * dt);
    }

    this.speed = Phaser.Math.Clamp(this.speed, this.maxReverseSpeed, this.maxForwardSpeed);

    if (Math.abs(this.speed) > 4) {
      const direction = this.speed >= 0 ? 1 : -1;
      let steeringInput = 0;

      if (controls.left.isDown) {
        steeringInput -= 1;
      }

      if (controls.right.isDown) {
        steeringInput += 1;
      }

      const steeringScale = Math.min(Math.abs(this.speed) / this.maxForwardSpeed, 1);
      this.rotation += steeringInput * this.steeringRate * steeringScale * direction * dt;
    }

    this.velocity.setTo(Math.sin(this.rotation), -Math.cos(this.rotation)).scale(this.speed * dt);
    this.sprite.x += this.velocity.x;
    this.sprite.y += this.velocity.y;
    this.sprite.rotation = this.rotation;
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
