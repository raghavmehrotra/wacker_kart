// Web Audio API procedural music + SFX — no external files

let ctx = null;
let musicStopFn = null;
let masterGain = null;

function _getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

// ── Note frequency table ────────────────────────────────────────────────────

const N = {
  A2: 110.00, E2: 82.41, F2: 87.31,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  'F#4': 369.99, 'C#4': 277.18,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  'F#5': 739.99, 'C#5': 554.37,
  R: 0,
};

// ── Per-track song definitions ──────────────────────────────────────────────
// Each step: { mel, bass, dur } — mel/bass are Hz, dur is ms, 0 = rest

const s8 = (bpm) => Math.round(60000 / bpm / 2); // 8th-note duration at bpm

function makeSong(bpm, melWave, steps) {
  const d = s8(bpm);
  return { melWave, steps: steps(d) };
}

const SONGS = {
  // Lake Shore Drive — Koopa Troopa Beach: C major, 130bpm, triangle, bouncy
  'lake-shore-drive': makeSong(130, 'triangle', (d) => [
    { mel: N.E5, bass: N.C3, dur: d }, { mel: N.G5, bass: 0,    dur: d },
    { mel: N.A5, bass: 0,    dur: d }, { mel: N.G5, bass: 0,    dur: d },
    { mel: N.E5, bass: N.G3, dur: d }, { mel: N.C5, bass: 0,    dur: d },
    { mel: N.D5, bass: 0,    dur: d }, { mel: N.E5, bass: 0,    dur: d },
    { mel: N.G5, bass: N.F3, dur: d }, { mel: N.A5, bass: 0,    dur: d },
    { mel: N.B5, bass: 0,    dur: d }, { mel: N.A5, bass: 0,    dur: d },
    { mel: N.G5, bass: N.G3, dur: d }, { mel: N.E5, bass: 0,    dur: d },
    { mel: N.D5, bass: 0,    dur: d }, { mel: N.C5, bass: 0,    dur: d },
  ]),

  // Hyde Park — Peach's Castle: G major, 100bpm, sine, regal
  'hyde-park': makeSong(100, 'sine', (d) => [
    { mel: N.G4, bass: N.G3, dur: d }, { mel: N.B4, bass: 0,    dur: d },
    { mel: N.D5, bass: 0,    dur: d }, { mel: N.G5, bass: 0,    dur: d },
    { mel: N.D5, bass: N.D3, dur: d }, { mel: N.B4, bass: 0,    dur: d },
    { mel: N.A4, bass: 0,    dur: d }, { mel: N.G4, bass: 0,    dur: d },
    { mel: N.B4, bass: N.C3, dur: d }, { mel: N.D5, bass: 0,    dur: d },
    { mel: N.E5, bass: 0,    dur: d }, { mel: N.D5, bass: 0,    dur: d },
    { mel: N.B4, bass: N.D3, dur: d }, { mel: N.A4, bass: 0,    dur: d },
    { mel: N.G4, bass: 0,    dur: d }, { mel: N.R,  bass: 0,    dur: d },
  ]),

  // O'Hare — Toad's Turnpike: D major, 140bpm, square, staccato urban
  'ohare': makeSong(140, 'square', (d) => [
    { mel: N.D5,   bass: N.D3, dur: d }, { mel: N.D5,   bass: 0,    dur: d },
    { mel: N.A5,   bass: 0,    dur: d }, { mel: N.R,    bass: 0,    dur: d },
    { mel: N.D5,   bass: N.A3, dur: d }, { mel: N['F#5'], bass: 0,  dur: d },
    { mel: N.A5,   bass: 0,    dur: d }, { mel: N.D5,   bass: 0,    dur: d },
    { mel: N.A4,   bass: N.G3, dur: d }, { mel: N.A4,   bass: 0,    dur: d },
    { mel: N.E5,   bass: 0,    dur: d }, { mel: N.R,    bass: 0,    dur: d },
    { mel: N.A4,   bass: N.A3, dur: d }, { mel: N['C#5'], bass: 0,  dur: d },
    { mel: N.E5,   bass: 0,    dur: d }, { mel: N.A4,   bass: 0,    dur: d },
  ]),

  // Lower Wacker — Bowser's Castle: A minor, 85bpm, sawtooth, haunting
  'lower-wacker': makeSong(85, 'sawtooth', (d) => [
    { mel: N.A4, bass: N.A2, dur: d }, { mel: N.R,  bass: 0,    dur: d },
    { mel: N.E4, bass: 0,    dur: d }, { mel: N.F4, bass: 0,    dur: d },
    { mel: N.G4, bass: N.E2, dur: d }, { mel: N.R,  bass: 0,    dur: d },
    { mel: N.A4, bass: 0,    dur: d }, { mel: N.G4, bass: 0,    dur: d },
    { mel: N.F4, bass: N.F2, dur: d }, { mel: N.E4, bass: 0,    dur: d },
    { mel: N.D4, bass: 0,    dur: d }, { mel: N.R,  bass: 0,    dur: d },
    { mel: N.E4, bass: N.E2, dur: d }, { mel: N.R,  bass: 0,    dur: d },
    { mel: N.A3, bass: 0,    dur: d }, { mel: N.R,  bass: 0,    dur: d },
  ]),
};

// ── Oscillator helper ───────────────────────────────────────────────────────

function _playNote(freq, type, gainPeak, startTime, duration) {
  if (!freq || freq === 0) return;
  const ac = _getCtx();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(gainPeak, startTime + 0.008);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + duration / 1000);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(startTime);
  osc.stop(startTime + duration / 1000 + 0.01);
}

// ── Music sequencer ─────────────────────────────────────────────────────────

export function startMusic(trackId) {
  stopMusic();
  const song = SONGS[trackId];
  if (!song) return;

  const ac = _getCtx();
  if (ac.state === 'suspended') ac.resume();

  // Fade master back in
  masterGain.gain.cancelScheduledValues(ac.currentTime);
  masterGain.gain.setValueAtTime(masterGain.gain.value, ac.currentTime);
  masterGain.gain.linearRampToValueAtTime(1, ac.currentTime + 0.3);

  let stepIdx = 0;
  let stopped = false;
  let timer = null;

  function scheduleNext() {
    if (stopped) return;
    const step = song.steps[stepIdx];
    const now = ac.currentTime;
    _playNote(step.mel,  song.melWave, 0.07, now, step.dur * 0.85);
    _playNote(step.bass, 'sine',       0.05, now, step.dur * 0.9);
    stepIdx = (stepIdx + 1) % song.steps.length;
    timer = setTimeout(scheduleNext, step.dur);
  }

  scheduleNext();

  musicStopFn = () => {
    stopped = true;
    clearTimeout(timer);
  };
}

export function stopMusic() {
  if (musicStopFn) {
    musicStopFn();
    musicStopFn = null;
  }
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(masterGain.gain.value, now);
  masterGain.gain.linearRampToValueAtTime(0, now + 0.3);
  // Reset gain after fade so SFX still work
  setTimeout(() => {
    if (masterGain) masterGain.gain.value = 1;
  }, 350);
}

// ── SFX ────────────────────────────────────────────────────────────────────

export function playPickupSound() {
  const ac = _getCtx();
  if (ac.state === 'suspended') ac.resume();
  const now = ac.currentTime;
  _playNote(N.E5, 'triangle', 0.3, now,        80);
  _playNote(N.G5, 'triangle', 0.3, now + 0.09, 80);
}

export function playUseItemSound() {
  const ac = _getCtx();
  if (ac.state === 'suspended') ac.resume();
  const now = ac.currentTime;
  _playNote(N.C5, 'sine', 0.25, now,        60);
  _playNote(N.A4, 'sine', 0.20, now + 0.07, 60);
  _playNote(N.E4, 'sine', 0.15, now + 0.13, 80);
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
  g.connect(masterGain);
  src.start(now);
  src.stop(now + 0.21);
}
