import "./styles.css";
import { createGame } from "./game/createGame.js";

const app = document.querySelector("#app");

app.innerHTML = `
  <main class="layout">
    <section class="panel">
      <h1>Wacker Kart Prototype</h1>
      <p>Race the Lake Shore Drive-inspired route from Navy Pier down to 50th Street and back.</p>
      <p>Controls: Space starts the race, arrow keys drive, and R restarts.</p>
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

createGame("game-root");
