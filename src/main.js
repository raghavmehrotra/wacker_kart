import "./styles.css";
import { createGame } from "./game/createGame.js";
import { getTrackOptions, setSelectedTrackId } from "./game/config/createTrackCatalog.js";
import { KART_COLORS, AVATARS, customization } from "./game/config/playerCustomization.js";
import { getAvatarDataUrls } from "./game/sprites/avatarFactory.js";
import { supabase } from "./lib/supabase.js";
import { upsertProfile, loadProfile, getPersonalRecords } from "./lib/db.js";
import { showAuthScreen } from "./ui/authScreen.js";
import { showLeaderboardScreen } from "./ui/leaderboardScreen.js";
import { showProfileScreen } from "./ui/profileScreen.js";
import { showInstructionsScreen } from "./ui/instructionsScreen.js";
import { guest } from "./lib/guestState.js";
import { startMusic, stopMusic } from "./lib/audioManager.js";
import { esc } from "./lib/html.js";

const app = document.querySelector("#app");
const trackOptions = getTrackOptions();
let selectedTrackId = trackOptions[0].id;
let game = null;
let nameDebounce = null;
let profileDebounce = null;
let currentSession = null;

function getSelectedTrack() {
  return trackOptions.find((t) => t.id === selectedTrackId) ?? trackOptions[0];
}

function formatTime(ms) {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function scheduleProfileSave() {
  if (!currentSession) return;
  clearTimeout(profileDebounce);
  profileDebounce = setTimeout(() => {
    upsertProfile(currentSession.user.id, {
      display_name: customization.playerName,
      kart_color_key: customization.kartColorKey,
      avatar_key: customization.avatarKey,
    });
  }, 600);
}

// ── Lobby screen ──────────────────────────────────────────────────────────────

function buildLobbyHTML(personalRecords = []) {
  const avatarUrls = getAvatarDataUrls();

  const trackOpts = guest.active
    ? `<option value="lake-shore-drive" selected>Lake Shore Drive</option>`
    : trackOptions.map((t) =>
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

  const recordsMap = Object.fromEntries(personalRecords.map((r) => [r.track_id, r.time_ms]));
  const recordRows = trackOptions.map((t) => {
    const best = recordsMap[t.id];
    return `
      <div class="pr-row">
        <span class="pr-track">${t.name}</span>
        <span class="pr-time${best ? "" : " pr-empty"}">${best ? formatTime(best) : "--:--.--"}</span>
      </div>
    `;
  }).join("");

  const userChip = currentSession
    ? `<div class="user-chip">
        <span class="user-email">${esc(currentSession.user.email)}</span>
        <button id="profile-btn" class="logout-btn">Profile</button>
        <button id="logout-btn" class="logout-btn">Log out</button>
      </div>`
    : "";

  return `
    <div id="lobby">
      <section class="panel lobby-panel">
        ${userChip}
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

        <div class="pr-panel">
          <div class="pr-title">Personal Records</div>
          <div id="pr-rows">${recordRows}</div>
        </div>

        ${guest.active
          ? `<p class="guest-banner">Playing as guest — <button id="signin-from-lobby" class="inline-link-btn">sign in</button> to save times &amp; unlock all tracks.</p>`
          : `<button id="leaderboard-btn" class="leaderboard-btn">🏆 Leaderboard</button>`
        }
        <button id="how-to-play-btn" class="how-to-play-btn">? How to Play</button>
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

async function showLobby() {
  stopMusic();
  if (game) {
    game.destroy(true);
    game = null;
  }

  let personalRecords = [];
  if (currentSession) {
    personalRecords = await getPersonalRecords(currentSession.user.id);
  }

  app.innerHTML = buildLobbyHTML(personalRecords);
  bindLobbyEvents();
  startMusic('lobby');
}

function showGame() {
  stopMusic();
  app.innerHTML = buildGameHTML();
  setSelectedTrackId(selectedTrackId);
  game = createGame("game-root");

  document.getElementById("back-btn")?.addEventListener("click", showLobby);
}

// ── Lobby event bindings ──────────────────────────────────────────────────────

function bindLobbyEvents() {
  document.getElementById("signin-from-lobby")?.addEventListener("click", () => {
    guest.active = false;
    showAuthScreen((session) => loadAndShowLobby(session), showGuestLobby);
  });

  document.getElementById("track-select")?.addEventListener("change", (e) => {
    if (guest.active) return;
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
    scheduleProfileSave();
  });

  document.getElementById("avatar-options")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-avatar]");
    if (!btn) return;
    customization.avatarKey = btn.dataset.avatar;
    document.querySelectorAll(".avatar-option").forEach((b) => {
      b.classList.toggle("selected", b.dataset.avatar === customization.avatarKey);
    });
    scheduleProfileSave();
  });

  document.getElementById("player-name-input")?.addEventListener("input", (e) => {
    clearTimeout(nameDebounce);
    nameDebounce = setTimeout(() => {
      customization.playerName = e.target.value.trim() || "Player 1";
      scheduleProfileSave();
    }, 400);
  });

  document.getElementById("profile-btn")?.addEventListener("click", () => {
    if (!currentSession) return;
    const profile = {
      display_name: customization.playerName,
      kart_color_key: customization.kartColorKey,
      avatar_key: customization.avatarKey,
    };
    showProfileScreen(currentSession, profile, showLobby);
  });

  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    currentSession = null;
    guest.active = false;
    showAuthScreen((session) => loadAndShowLobby(session), showGuestLobby);
  });

  document.getElementById("leaderboard-btn")?.addEventListener("click", () => {
    if (!currentSession) return;
    showLeaderboardScreen(currentSession, showLobby);
  });

  document.getElementById("how-to-play-btn")?.addEventListener("click", () => {
    showInstructionsScreen(() => showLobby());
  });

  document.getElementById("start-btn")?.addEventListener("click", showGame);
}

function showGuestLobby() {
  guest.active = true;
  selectedTrackId = 'lake-shore-drive';
  showLobby();
}

// ── Auth + profile boot ───────────────────────────────────────────────────────

async function loadAndShowLobby(session) {
  currentSession = session;

  const profile = await loadProfile(session.user.id);
  if (profile) {
    customization.playerName = profile.display_name;
    customization.kartColorKey = profile.kart_color_key;
    customization.avatarKey = profile.avatar_key;
  } else {
    await upsertProfile(session.user.id, {
      display_name: customization.playerName,
      kart_color_key: customization.kartColorKey,
      avatar_key: customization.avatarKey,
    });
  }

  showLobby();
}

// ── Boot ──────────────────────────────────────────────────────────────────────

(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await loadAndShowLobby(session);
  } else {
    showAuthScreen((session) => loadAndShowLobby(session), showGuestLobby);
  }
})();
