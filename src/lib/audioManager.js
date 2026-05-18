// Music via HTML5 Audio (real files), SFX via Web Audio API

const TRACK_PATHS = {
  'lobby':           '/audio/Shell Sprint.mp3',
  'lake-shore-drive':'/audio/Shell Sprint.mp3',
  'hyde-park':       '/audio/UChicago_Quad.m4a',
  'ohare':           '/audio/OHare.m4a',
  'lower-wacker':    '/audio/Wacker.m4a',
};

let currentTrack = null;
let fadeInterval = null;

export function startMusic(trackId) {
  stopMusic();
  const path = TRACK_PATHS[trackId];
  if (!path) return;
  const audio = new Audio(path);
  audio.loop = true;
  audio.volume = 0;
  currentTrack = audio;
  audio.play().catch(() => {});
  // fade in over 400ms
  const target = 0.45;
  let step = 0;
  const steps = 14;
  fadeInterval = setInterval(() => {
    step++;
    if (!currentTrack || currentTrack !== audio) { clearInterval(fadeInterval); return; }
    audio.volume = Math.min(target, target * (step / steps));
    if (step >= steps) clearInterval(fadeInterval);
  }, 30);
}

export function stopMusic() {
  clearInterval(fadeInterval);
  if (!currentTrack) return;
  const track = currentTrack;
  currentTrack = null;
  // fade out over 300ms then stop
  let step = 0;
  const steps = 10;
  const startVol = track.volume;
  const id = setInterval(() => {
    step++;
    track.volume = Math.max(0, startVol * (1 - step / steps));
    if (step >= steps) { clearInterval(id); track.pause(); }
  }, 30);
}

// ── SFX — Web Audio API ────────────────────────────────────────────────────

let ctx = null;

function _getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function _playNote(freq, type, gainPeak, startTime, duration) {
  if (!freq) return;
  const ac = _getCtx();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(gainPeak, startTime + 0.008);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + duration / 1000);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(startTime);
  osc.stop(startTime + duration / 1000 + 0.01);
}

export function playPickupSound() {
  const ac = _getCtx();
  if (ac.state === 'suspended') ac.resume();
  const now = ac.currentTime;
  _playNote(659.25, 'triangle', 0.3, now,        80);
  _playNote(783.99, 'triangle', 0.3, now + 0.09, 80);
}

export function playUseItemSound() {
  const ac = _getCtx();
  if (ac.state === 'suspended') ac.resume();
  const now = ac.currentTime;
  _playNote(523.25, 'sine', 0.25, now,        60);
  _playNote(440.00, 'sine', 0.20, now + 0.07, 60);
  _playNote(329.63, 'sine', 0.15, now + 0.13, 80);
}

export function playCrashSound() {
  const ac = _getCtx();
  if (ac.state === 'suspended') ac.resume();
  const bufSize = Math.floor(ac.sampleRate * 0.2);
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  const now = ac.currentTime;
  g.gain.setValueAtTime(0.35, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  src.connect(g);
  g.connect(ac.destination);
  src.start(now);
  src.stop(now + 0.21);
}
