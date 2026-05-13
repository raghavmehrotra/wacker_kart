const SIZE = 64;

function makeCanvas() {
  const c = document.createElement("canvas");
  c.width = SIZE;
  c.height = SIZE;
  return c;
}

function circleBg(ctx, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2);
  ctx.fill();
}

// ── Individual avatar renderers ───────────────────────────────────────────────

function drawBear(ctx) {
  circleBg(ctx, "#1c3f6e"); // Bears navy

  // Ears
  ctx.fillStyle = "#7a4e2d";
  ctx.beginPath(); ctx.arc(18, 18, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(46, 18, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#c07840";
  ctx.beginPath(); ctx.arc(18, 18, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(46, 18, 5, 0, Math.PI * 2); ctx.fill();

  // Head
  ctx.fillStyle = "#7a4e2d";
  ctx.beginPath(); ctx.arc(32, 36, 20, 0, Math.PI * 2); ctx.fill();

  // Muzzle
  ctx.fillStyle = "#c07840";
  ctx.beginPath(); ctx.ellipse(32, 43, 11, 8, 0, 0, Math.PI * 2); ctx.fill();

  // Eyes
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath(); ctx.arc(25, 32, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(39, 32, 3, 0, Math.PI * 2); ctx.fill();

  // Eye shine
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(26, 31, 1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(40, 31, 1, 0, Math.PI * 2); ctx.fill();

  // Nose
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath(); ctx.ellipse(32, 40, 4, 3, 0, 0, Math.PI * 2); ctx.fill();

  // "C" logo on forehead
  ctx.fillStyle = "#f26522";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("C", 32, 22);
}

function drawDeepDish(ctx) {
  circleBg(ctx, "#8b1a0a"); // deep red crust

  // Outer crust ring
  ctx.fillStyle = "#c4813a";
  ctx.beginPath(); ctx.arc(32, 32, 27, 0, Math.PI * 2); ctx.fill();

  // Sauce
  ctx.fillStyle = "#c0281a";
  ctx.beginPath(); ctx.arc(32, 32, 21, 0, Math.PI * 2); ctx.fill();

  // Cheese blobs
  ctx.fillStyle = "#f0d060";
  for (const [cx, cy, r] of [[26, 26, 8], [38, 28, 7], [28, 38, 7], [40, 40, 6]]) {
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.7, Math.PI * 0.15, 0, Math.PI * 2); ctx.fill();
  }

  // Toppings (pepperoni)
  ctx.fillStyle = "#8b1a0a";
  for (const [tx, ty] of [[28, 26], [38, 32], [26, 38], [36, 42]]) {
    ctx.beginPath(); ctx.arc(tx, ty, 4, 0, Math.PI * 2); ctx.fill();
  }

  // Crust highlight
  ctx.strokeStyle = "#e0a060";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(32, 32, 25, 0, Math.PI * 2); ctx.stroke();
}

function drawLRider(ctx) {
  circleBg(ctx, "#005a9c"); // CTA blue

  // Train car body
  ctx.fillStyle = "#e8e8e8";
  ctx.fillRoundedRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath(); ctx.fill();
  };
  ctx.fillRoundedRect(10, 14, 44, 36, 6);

  // Blue stripe
  ctx.fillStyle = "#005a9c";
  ctx.fillRect(10, 22, 44, 8);

  // Windows
  ctx.fillStyle = "#a8d4f0";
  ctx.fillRect(14, 16, 10, 7);
  ctx.fillRect(27, 16, 10, 7);
  ctx.fillRect(40, 16, 8, 7);

  // Door
  ctx.fillStyle = "#c8c8c8";
  ctx.fillRect(27, 33, 10, 15);
  ctx.fillStyle = "#aaaaaa";
  ctx.fillRect(31, 42, 2, 4);

  // Roof / antenna
  ctx.fillStyle = "#cccccc";
  ctx.fillRect(14, 10, 36, 5);
  ctx.fillStyle = "#888888";
  ctx.fillRect(30, 6, 4, 5);

  // Wheels
  ctx.fillStyle = "#1a1a1a";
  for (const wx of [17, 29, 41]) {
    ctx.beginPath(); ctx.arc(wx, 51, 5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawBluesman(ctx) {
  circleBg(ctx, "#1a1a2e"); // dark night

  // Fedora brim
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath(); ctx.ellipse(32, 22, 22, 6, 0, 0, Math.PI * 2); ctx.fill();

  // Hat crown
  ctx.fillStyle = "#111111";
  ctx.beginPath();
  ctx.moveTo(16, 22); ctx.lineTo(14, 6); ctx.lineTo(50, 6); ctx.lineTo(48, 22);
  ctx.closePath(); ctx.fill();

  // Hat band
  ctx.fillStyle = "#8b1a0a";
  ctx.fillRect(15, 18, 34, 3);

  // Face
  ctx.fillStyle = "#5c3317";
  ctx.beginPath(); ctx.ellipse(32, 36, 13, 15, 0, 0, Math.PI * 2); ctx.fill();

  // Shades
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(20, 32, 10, 6);
  ctx.fillRect(34, 32, 10, 6);
  ctx.fillStyle = "#333333";
  ctx.fillRect(30, 33, 4, 4);

  // Smile
  ctx.strokeStyle = "#c07840";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(32, 42, 6, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  // Saxophone hint
  ctx.strokeStyle = "#d4a017";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(38, 48); ctx.lineTo(44, 42); ctx.lineTo(48, 50); ctx.lineTo(44, 58);
  ctx.stroke();
}

function drawArchitect(ctx) {
  circleBg(ctx, "#2a3540"); // Chicago night sky

  // Willis/Sears Tower — step pyramid silhouette
  ctx.fillStyle = "#c8d0d8";

  // Widest base section
  ctx.fillRect(18, 44, 28, 14);
  // Middle section
  ctx.fillRect(21, 32, 22, 13);
  // Upper section
  ctx.fillRect(24, 22, 16, 11);
  // Narrow top section
  ctx.fillRect(27, 13, 10, 10);
  // Twin antennas
  ctx.fillRect(28, 6, 2, 8);
  ctx.fillRect(34, 6, 2, 8);

  // Windows (lit)
  ctx.fillStyle = "#ffe566";
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      if (Math.random() > 0.4) {
        ctx.fillRect(20 + col * 5, 46 + row * 4, 3, 2);
      }
    }
  }
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      if (Math.random() > 0.4) {
        ctx.fillRect(22 + col * 5, 34 + row * 5, 3, 2);
      }
    }
  }

  // Antenna red lights
  ctx.fillStyle = "#ff3300";
  ctx.beginPath(); ctx.arc(29, 6, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(35, 6, 2, 0, Math.PI * 2); ctx.fill();

  // Stars
  ctx.fillStyle = "#ffffff";
  for (const [sx, sy] of [[8, 10], [52, 14], [10, 42], [55, 38], [6, 26]]) {
    ctx.fillRect(sx, sy, 2, 2);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

const RENDERERS = {
  bear:      drawBear,
  deepdish:  drawDeepDish,
  lrider:    drawLRider,
  bluesman:  drawBluesman,
  architect: drawArchitect,
};

let _cache = null;

export function getAvatarDataUrls() {
  if (_cache) return _cache;
  _cache = {};
  for (const [key, fn] of Object.entries(RENDERERS)) {
    const canvas = makeCanvas();
    fn(canvas.getContext("2d"));
    _cache[key] = canvas.toDataURL();
  }
  return _cache;
}

export function loadAvatarTextures(scene) {
  const urls = getAvatarDataUrls();
  for (const [key, dataUrl] of Object.entries(urls)) {
    const textureKey = `avatar-${key}`;
    if (!scene.textures.exists(textureKey)) {
      scene.textures.addBase64(textureKey, dataUrl);
    }
  }
}
