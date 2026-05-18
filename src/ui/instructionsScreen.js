export function showInstructionsScreen(onBack) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div id="instructions-screen">
      <div class="panel instructions-panel">
        <h1>How to Play</h1>

        <div class="instr-section">
          <h2>🎮 Controls</h2>
          <div class="instr-grid">
            <span class="instr-key">↑ / ↓</span><span>Accelerate / Brake</span>
            <span class="instr-key">← / →</span><span>Steer</span>
            <span class="instr-key">Space</span><span>Start / Pause the race</span>
            <span class="instr-key">X</span><span>Use held item</span>
            <span class="instr-key">R</span><span>Restart</span>
          </div>
        </div>

        <div class="instr-section">
          <h2>🏁 Laps</h2>
          <p>Drive to the <strong>turnaround zone</strong> at the far end of the track, then return to the <strong>finish line</strong> to complete one lap. First to finish 3 laps wins.</p>
        </div>

        <div class="instr-section">
          <h2>⚡ Items</h2>
          <div class="instr-items">
            <div class="instr-item">
              <span class="instr-item-icon">🥃</span>
              <div>
                <strong>Malort Shot</strong>
                <p>Drive through a glowing pickup to grab one, then press <kbd>X</kbd> to activate. Rocket your speed +30% — but your steering goes haywire for 5 seconds. Classic.</p>
              </div>
            </div>
            <div class="instr-item">
              <span class="instr-item-icon">🍕</span>
              <div>
                <strong>Deep Dish Pizza</strong>
                <p>Scattered flat on every track. Drive over one and you'll be slowed to half speed for 2 seconds. They don't move. You've been warned.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="instr-section">
          <h2>🚧 Watch Out</h2>
          <p>Each track has unique hazards — oncoming traffic on <strong>Wacker Drive</strong>, cargo vehicles and pedestrians at <strong>O'Hare</strong> and <strong>UChicago Quad</strong>, and tree obstacles on <strong>Lake Shore Drive</strong>. Collisions stop you cold for 1.5 seconds.</p>
        </div>

        <button id="instr-back-btn" class="start-btn instr-back-btn">Got it — let's race! ▶</button>
      </div>
    </div>
  `;

  document.getElementById('instr-back-btn').addEventListener('click', onBack);
}
