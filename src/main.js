import "./styles.css";
import { createGame } from "./game/createGame.js";
import { getTrackOptions, setSelectedTrackId } from "./game/config/createTrackCatalog.js";

const app = document.querySelector("#app");
const trackOptions = getTrackOptions();
let selectedTrackId = trackOptions[0].id;
let game;

function getSelectedTrack() {
  return trackOptions.find((track) => track.id === selectedTrackId) ?? trackOptions[0];
}

function renderRouteCopy() {
  const track = getSelectedTrack();
  const routeNode = document.getElementById("route-description");
  const titleNode = document.getElementById("selected-track-name");

  if (routeNode) {
    routeNode.textContent = track.routeDescription;
  }

  if (titleNode) {
    titleNode.textContent = track.name;
  }
}

function mountGame() {
  setSelectedTrackId(selectedTrackId);
  game?.destroy(true);
  game = createGame("game-root");
}

app.innerHTML = `
  <main class="layout">
    <section class="panel">
      <h1>Wacker Kart Prototype</h1>
      <div class="track-picker">
        <label for="track-select">Track</label>
        <select id="track-select" class="track-select">
          ${trackOptions.map((track) => `<option value="${track.id}">${track.name}</option>`).join("")}
        </select>
      </div>
      <p class="track-name">Selected route: <span id="selected-track-name"></span></p>
      <p id="route-description"></p>
      <p>Controls: Space starts the race, arrow keys drive, X uses your held item, and R restarts.</p>
      <p>Malort shots are scattered on the track. Pick one up, then trigger a 5-second speed boost with much weaker steering.</p>
      <p id="race-status" class="hint">Press Space to begin the Lake Shore Drive run.</p>
      <p class="hint">
        This is the Phaser-based foundation that can later be mounted inside a Next.js shell for login,
        lobbies, and multiplayer flows.
      </p>
    </section>
    <section class="game-shell">
      <div id="game-root" aria-label="Wacker Kart game canvas"></div>
    </section>
  </main>
`;

const trackSelect = document.getElementById("track-select");
trackSelect?.addEventListener("change", (event) => {
  selectedTrackId = event.target.value;
  renderRouteCopy();

  const statusNode = document.getElementById("race-status");
  if (statusNode) {
    statusNode.textContent = `Press Space to begin the ${getSelectedTrack().name} run.`;
  }

  mountGame();
});

renderRouteCopy();
mountGame();
