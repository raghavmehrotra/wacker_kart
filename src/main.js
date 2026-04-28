import "./styles.css";
import { createGame } from "./game/createGame.js";

const app = document.querySelector("#app");

app.innerHTML = `
  <main class="layout">
    <section class="panel">
      <h1>Wacker Kart Prototype</h1>
      <p>Arrow keys drive the car. Up accelerates, down brakes and reverses, left and right steer.</p>
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
