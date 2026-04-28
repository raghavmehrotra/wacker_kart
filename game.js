const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const input = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

const car = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: 0,
  speed: 0,
  width: 28,
  height: 44,
  maxForwardSpeed: 380,
  maxReverseSpeed: -140,
  acceleration: 280,
  braking: 380,
  drag: 180,
  steeringRate: 2.6,
};

let previousTime = performance.now();

window.addEventListener("keydown", (event) => {
  if (event.key in input) {
    input[event.key] = true;
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key in input) {
    input[event.key] = false;
    event.preventDefault();
  }
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function applyDrag(speed, amount) {
  if (speed > 0) {
    return Math.max(0, speed - amount);
  }

  if (speed < 0) {
    return Math.min(0, speed + amount);
  }

  return 0;
}

function updateCar(dt) {
  if (input.ArrowUp) {
    car.speed += car.acceleration * dt;
  } else if (input.ArrowDown) {
    if (car.speed > 0) {
      car.speed -= car.braking * dt;
    } else {
      car.speed -= car.acceleration * 0.75 * dt;
    }
  } else {
    car.speed = applyDrag(car.speed, car.drag * dt);
  }

  car.speed = clamp(car.speed, car.maxReverseSpeed, car.maxForwardSpeed);

  if (Math.abs(car.speed) > 4) {
    const direction = car.speed >= 0 ? 1 : -1;
    let steeringInput = 0;

    if (input.ArrowLeft) {
      steeringInput -= 1;
    }

    if (input.ArrowRight) {
      steeringInput += 1;
    }

    const steeringScale = Math.min(Math.abs(car.speed) / car.maxForwardSpeed, 1);
    car.angle += steeringInput * car.steeringRate * steeringScale * direction * dt;
  }

  // Treat angle 0 as facing upward on screen instead of to the right.
  car.x += Math.sin(car.angle) * car.speed * dt;
  car.y -= Math.cos(car.angle) * car.speed * dt;

  const halfWidth = car.width / 2;
  const halfHeight = car.height / 2;

  if (car.x < halfWidth) {
    car.x = halfWidth;
    car.speed *= 0.4;
  } else if (car.x > canvas.width - halfWidth) {
    car.x = canvas.width - halfWidth;
    car.speed *= 0.4;
  }

  if (car.y < halfHeight) {
    car.y = halfHeight;
    car.speed *= 0.4;
  } else if (car.y > canvas.height - halfHeight) {
    car.y = canvas.height - halfHeight;
    car.speed *= 0.4;
  }
}

function drawBackground() {
  ctx.fillStyle = "#0b0f14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= canvas.height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawCar() {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);

  ctx.fillStyle = "#c24b3f";
  ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);

  ctx.fillStyle = "#f2d16b";
  ctx.fillRect(-car.width / 2 + 4, -car.height / 2 + 4, car.width - 8, 10);

  ctx.fillStyle = "#202733";
  ctx.fillRect(-car.width / 2 - 3, -car.height / 2 + 4, 6, 12);
  ctx.fillRect(car.width / 2 - 3, -car.height / 2 + 4, 6, 12);
  ctx.fillRect(-car.width / 2 - 3, car.height / 2 - 16, 6, 12);
  ctx.fillRect(car.width / 2 - 3, car.height / 2 - 16, 6, 12);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-3, -car.height / 2 + 3, 6, 6);

  ctx.restore();
}

function drawHud() {
  ctx.fillStyle = "#f5f1e8";
  ctx.font = '18px "Trebuchet MS", sans-serif';
  ctx.fillText(`Speed: ${Math.round(car.speed)} px/s`, 20, 34);
  ctx.fillText("Controls: Up accelerate, Down brake/reverse, Left/Right steer", 20, 62);
}

function frame(now) {
  const dt = Math.min((now - previousTime) / 1000, 0.033);
  previousTime = now;

  updateCar(dt);
  drawBackground();
  drawCar();
  drawHud();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
