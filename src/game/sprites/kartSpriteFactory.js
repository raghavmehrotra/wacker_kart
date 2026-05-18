const W = 40;
const H = 60;

export function generateBicycleTexture(scene, colorKey, hexColor) {
  const key = `bike-${colorKey}`;
  if (scene.textures.exists(key)) return key;

  const gfx = scene.make.graphics({ add: false });

  // ── Wheels ─────────────────────────────────────────────────────────────────
  gfx.fillStyle(0x1a1a1a, 1);
  gfx.fillEllipse(W / 2, 10, 13, 18);   // front wheel
  gfx.fillEllipse(W / 2, H - 10, 13, 18); // rear wheel
  gfx.fillStyle(0x888888, 1);
  gfx.fillEllipse(W / 2, 10, 6, 9);     // front rim
  gfx.fillEllipse(W / 2, H - 10, 6, 9); // rear rim

  // ── Frame ──────────────────────────────────────────────────────────────────
  gfx.fillStyle(0x333333, 1);
  // Down tube
  gfx.fillRect(W / 2 - 1, 18, 3, H - 36);
  // Seat tube diagonal (chainstay left)
  gfx.lineStyle(2, 0x444444, 1);
  gfx.beginPath();
  gfx.moveTo(W / 2 - 4, H - 18); gfx.lineTo(W / 2 - 10, H / 2);
  gfx.moveTo(W / 2 + 4, H - 18); gfx.lineTo(W / 2 + 10, H / 2);
  gfx.strokePath();

  // ── Handlebars ─────────────────────────────────────────────────────────────
  gfx.fillStyle(0x333333, 1);
  gfx.fillRect(W / 2 - 11, 16, 22, 3);  // handlebar bar
  gfx.fillRect(W / 2 - 11, 16, 3, 6);   // left grip
  gfx.fillRect(W / 2 + 8, 16, 3, 6);    // right grip

  // ── Seat ───────────────────────────────────────────────────────────────────
  gfx.fillStyle(0x1a1a1a, 1);
  gfx.fillRect(W / 2 - 7, H - 24, 14, 4);

  // ── Rider body (jersey in kart color) ──────────────────────────────────────
  gfx.fillStyle(hexColor, 1);
  gfx.fillEllipse(W / 2, H / 2 + 2, 16, 20); // torso

  // ── Helmet ─────────────────────────────────────────────────────────────────
  gfx.fillStyle(0x1a1a1a, 1);
  gfx.fillCircle(W / 2, H / 2 - 11, 7);
  gfx.fillStyle(darken(hexColor, 0.2), 1);
  gfx.fillCircle(W / 2, H / 2 - 11, 5);
  gfx.fillStyle(0x1a1a1a, 0.8);
  gfx.fillRect(W / 2 - 4, H / 2 - 10, 8, 3); // visor

  gfx.generateTexture(key, W, H);
  gfx.destroy();
  return key;
}

export function generateKartTexture(scene, colorKey, hexColor) {
  const key = `kart-${colorKey}`;
  if (scene.textures.exists(key)) return key;

  const gfx = scene.make.graphics({ add: false });

  const dark = darken(hexColor, 0.35);
  const light = lighten(hexColor, 0.35);

  // ── Rear wheels ────────────────────────────────────────────────────────────
  gfx.fillStyle(0x1a1a1a, 1);
  gfx.fillEllipse(5, H - 10, 10, 14);   // rear-left
  gfx.fillEllipse(W - 5, H - 10, 10, 14); // rear-right

  // ── Front wheels ───────────────────────────────────────────────────────────
  gfx.fillEllipse(5, 10, 10, 14);       // front-left
  gfx.fillEllipse(W - 5, 10, 10, 14);  // front-right

  // Wheel rims
  gfx.fillStyle(0x5a5a5a, 1);
  for (const [wx, wy] of [[5, H - 10], [W - 5, H - 10], [5, 10], [W - 5, 10]]) {
    gfx.fillEllipse(wx, wy, 5, 7);
  }

  // ── Kart body ──────────────────────────────────────────────────────────────
  gfx.fillStyle(hexColor, 1);
  gfx.fillRoundedRect(9, 4, W - 18, H - 8, 5);

  // Body side panels (slightly darker)
  gfx.fillStyle(dark, 1);
  gfx.fillRect(9, 14, 4, H - 28);       // left side stripe
  gfx.fillRect(W - 13, 14, 4, H - 28);  // right side stripe

  // ── Front bumper ───────────────────────────────────────────────────────────
  gfx.fillStyle(dark, 1);
  gfx.fillRoundedRect(10, 3, W - 20, 6, 2);

  // ── Rear exhaust pipes ─────────────────────────────────────────────────────
  gfx.fillStyle(0x3a3a3a, 1);
  gfx.fillRect(12, H - 7, 5, 4);
  gfx.fillRect(W - 17, H - 7, 5, 4);

  // ── Windshield ─────────────────────────────────────────────────────────────
  gfx.fillStyle(0x8ec5d6, 0.7);
  gfx.fillRoundedRect(13, 10, W - 26, 12, 3);

  // Windshield glare
  gfx.fillStyle(0xffffff, 0.3);
  gfx.fillRect(14, 11, 5, 4);

  // ── Cockpit / driver helmet ────────────────────────────────────────────────
  gfx.fillStyle(0x1a1a1a, 1);
  gfx.fillEllipse(W / 2, 31, 14, 14);

  gfx.fillStyle(light, 1);
  gfx.fillEllipse(W / 2, 31, 10, 10);

  // Visor
  gfx.fillStyle(0x1a1a1a, 0.8);
  gfx.fillRect(W / 2 - 5, 29, 10, 4);

  // ── Engine/intake detail ────────────────────────────────────────────────────
  gfx.fillStyle(dark, 1);
  gfx.fillRect(W / 2 - 3, 42, 6, 8);
  gfx.fillStyle(0x2a2a2a, 1);
  gfx.fillRect(W / 2 - 2, 43, 4, 6);

  gfx.generateTexture(key, W, H);
  gfx.destroy();
  return key;
}

function darken(hex, amount) {
  const r = Math.max(0, ((hex >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((hex >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (hex & 0xff) * (1 - amount));
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}

function lighten(hex, amount) {
  const r = Math.min(255, ((hex >> 16) & 0xff) + 255 * amount);
  const g = Math.min(255, ((hex >> 8) & 0xff) + 255 * amount);
  const b = Math.min(255, (hex & 0xff) + 255 * amount);
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}
