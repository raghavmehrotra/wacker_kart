import "./styles.css";
import { createGame } from "./game/createGame.js";
import { getTrackOptions, setSelectedTrackId } from "./game/config/createTrackCatalog.js";
import { KART_COLORS, AVATARS, customization } from "./game/config/playerCustomization.js";
import { getAvatarDataUrls } from "./game/sprites/avatarFactory.js";

const app = document.querySelector("#app");
const trackOptions = getTrackOptions();
let selectedTrackId = trackOptions[0].id;
let game;
let nameDebounce = null;

function getSelectedTrack() {
  return trackOptions.find((t) => t.id === selectedTrackId) ?? trackOptions[0];
}

function renderRouteCopy() {
  const track = getSelectedTrack();
  const routeNode = document.getElementById("route-description");
  const titleNode = document.getElementById("selected-track-name");
  if (routeNode) routeNode.textContent = track.routeDescription;
  if (titleNode) titleNode.textContent = track.name;
}

function mountGame() {
  setSelectedTrackId(selectedTrackId);
  game?.destroy(true);
  game = createGame("game-root");
}

function buildGarageHTML() {
  const avatarUrls = getAvatarDataUrls();

  const swatches = KART_COLORS.map((c) => `
    <button
      class="color-swatch${customization.kartColorKey === c.key ? " selected" : ""}"
      data-color="${c.key}"
      style="background:${c.css}"
      title="${c.label}"
      aria-label="${c.label}"
    ></button>
  `).join("");

  const avatarBtns = AVATARS.map((a) => `
    <button
      class="avatar-option${customization.avatarKey === a.key ? " selected" : ""}"
      data-avatar="${a.key}"
      title="${a.label}"
      aria-label="${a.label}"
    >
      <img src="${avatarUrls[a.key]}" alt="${a.label}">
    </button>
  `).join("");

  return `
    <div class="garage" id="garage">
      <div class="garage-group">
        <div class="garage-label">Name</div>
        <input
          class="player-name-input"
          id="player-name-input"
          type="text"
          maxlength="16"
          value="${customization.playerName}"
          spellcheck="false"
        >
      </div>
      <div class="garage-group">
        <div class="garage-label">Kart</div>
        <div class="color-swatches" id="color-swatches">${swatches}</div>
      </div>
      <div class="garage-group">
        <div class="garage-label">Avatar</div>
        <div class="avatar-options" id="avatar-options">${avatarBtns}</div>
      </div>
    </div>
  `;
}

app.innerHTML = `
  <main class="layout">
    <section class="panel">
      <h1>Wacker Kart Prototype</h1>
      <div class="track-picker">
        <label for="track-select">Track</label>
        <select id="track-select" class="track-select">
          ${trackOptions.map((t) => `<option value="${t.id}">${t.name}</option>`).join("")}
        </select>
      </div>
      <p class="track-name">Selected route: <span id="selected-track-name"></span></p>
      <p id="route-description"></p>
      ${buildGarageHTML()}
      <p>Controls: Space starts the race, arrow keys drive, X uses your held item, and R restarts.</p>
      <p id="race-status" class="hint">Press Space to begin the ${getSelectedTrack().name} run.</p>
    </section>
    <section class="game-shell">
      <div id="game-root" aria-label="Wacker Kart game canvas"></div>
    </section>
  </main>
`;

// ── Track selector ────────────────────────────────────────────────────────────
document.getElementById("track-select")?.addEventListener("change", (e) => {
  selectedTrackId = e.target.value;
  renderRouteCopy();
  const statusNode = document.getElementById("race-status");
  if (statusNode) statusNode.textContent = `Press Space to begin the ${getSelectedTrack().name} run.`;
  mountGame();
});

// ── Kart color swatches ───────────────────────────────────────────────────────
document.getElementById("color-swatches")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-color]");
  if (!btn) return;
  customization.kartColorKey = btn.dataset.color;
  document.querySelectorAll(".color-swatch").forEach((s) => {
    s.classList.toggle("selected", s.dataset.color === customization.kartColorKey);
  });
  mountGame();
});

// ── Avatar selector ───────────────────────────────────────────────────────────
document.getElementById("avatar-options")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-avatar]");
  if (!btn) return;
  customization.avatarKey = btn.dataset.avatar;
  document.querySelectorAll(".avatar-option").forEach((b) => {
    b.classList.toggle("selected", b.dataset.avatar === customization.avatarKey);
  });
  mountGame();
});

// ── Player name (debounced — no remount needed) ───────────────────────────────
document.getElementById("player-name-input")?.addEventListener("input", (e) => {
  clearTimeout(nameDebounce);
  nameDebounce = setTimeout(() => {
    customization.playerName = e.target.value.trim() || "Player 1";
  }, 500);
});

renderRouteCopy();
mountGame();
