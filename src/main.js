import "./styles.css";
import { createGame } from "./game/createGame.js";
import { getTrackOptions, setSelectedTrackId } from "./game/config/createTrackCatalog.js";
import { KART_COLORS, AVATARS, customization } from "./game/config/playerCustomization.js";
import { getAvatarDataUrls } from "./game/sprites/avatarFactory.js";

const app = document.querySelector("#app");
const trackOptions = getTrackOptions();
let selectedTrackId = trackOptions[0].id;
let game = null;
let nameDebounce = null;

function getSelectedTrack() {
  return trackOptions.find((t) => t.id === selectedTrackId) ?? trackOptions[0];
}

// ── Lobby screen ──────────────────────────────────────────────────────────────

function buildLobbyHTML() {
  const avatarUrls = getAvatarDataUrls();

  const trackOpts = trackOptions.map((t) =>
    `<option value="${t.id}"${t.id === selectedTrackId ? " selected" : ""}>${t.name}</option>`,
  ).join("");

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
    <div id="lobby">
      <section class="panel lobby-panel">
        <h1>Wacker Kart</h1>

        <div class="lobby-row">
          <div class="garage-group">
            <div class="garage-label">Track</div>
            <select id="track-select" class="track-select">
              ${trackOpts}
            </select>
          </div>
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
        </div>

        <div class="lobby-row">
          <div class="garage-group">
            <div class="garage-label">Kart Colour</div>
            <div class="color-swatches" id="color-swatches">${swatches}</div>
          </div>
          <div class="garage-group">
            <div class="garage-label">Avatar</div>
            <div class="avatar-options" id="avatar-options">${avatarBtns}</div>
          </div>
        </div>

        <p id="track-description" class="track-description">${getSelectedTrack().routeDescription}</p>

        <button id="start-btn" class="start-btn">Start Racing ▶</button>
      </section>
    </div>
  `;
}

function buildGameHTML() {
  return `
    <div id="game-view">
      <div class="game-topbar">
        <button id="back-btn" class="back-btn">← Garage</button>
        <span id="race-status" class="race-status-bar"></span>
      </div>
      <div class="game-shell">
        <div id="game-root" aria-label="Wacker Kart game canvas"></div>
      </div>
    </div>
  `;
}

// ── Render lobby ──────────────────────────────────────────────────────────────

function showLobby() {
  if (game) {
    game.destroy(true);
    game = null;
  }
  app.innerHTML = buildLobbyHTML();
  bindLobbyEvents();
}

function showGame() {
  app.innerHTML = buildGameHTML();
  setSelectedTrackId(selectedTrackId);
  game = createGame("game-root");

  document.getElementById("back-btn")?.addEventListener("click", showLobby);
}

// ── Lobby event bindings ──────────────────────────────────────────────────────

function bindLobbyEvents() {
  document.getElementById("track-select")?.addEventListener("change", (e) => {
    selectedTrackId = e.target.value;
    const desc = document.getElementById("track-description");
    if (desc) desc.textContent = getSelectedTrack().routeDescription;
  });

  document.getElementById("color-swatches")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-color]");
    if (!btn) return;
    customization.kartColorKey = btn.dataset.color;
    document.querySelectorAll(".color-swatch").forEach((s) => {
      s.classList.toggle("selected", s.dataset.color === customization.kartColorKey);
    });
  });

  document.getElementById("avatar-options")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-avatar]");
    if (!btn) return;
    customization.avatarKey = btn.dataset.avatar;
    document.querySelectorAll(".avatar-option").forEach((b) => {
      b.classList.toggle("selected", b.dataset.avatar === customization.avatarKey);
    });
  });

  document.getElementById("player-name-input")?.addEventListener("input", (e) => {
    clearTimeout(nameDebounce);
    nameDebounce = setTimeout(() => {
      customization.playerName = e.target.value.trim() || "Player 1";
    }, 400);
  });

  document.getElementById("start-btn")?.addEventListener("click", showGame);
}

// ── Boot ──────────────────────────────────────────────────────────────────────

showLobby();
