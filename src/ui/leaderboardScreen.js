import { getLeaderboard } from '../lib/db.js';
import { getTrackOptions } from '../game/config/createTrackCatalog.js';

function formatTime(ms) {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export async function showLeaderboardScreen(session, onBack) {
  const tracks = getTrackOptions();
  const currentUserId = session.user.id;
  let activeTrackId = tracks[0].id;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div id="leaderboard-screen">
      <div class="panel leaderboard-panel">
        <div class="leaderboard-header">
          <button id="lb-back" class="back-btn">← Back</button>
          <h2 style="margin:0;font-size:20px;letter-spacing:1px">Leaderboard</h2>
          <div></div>
        </div>
        <div id="lb-tabs" class="lb-tabs">
          ${tracks.map(t => `
            <button class="lb-tab${t.id === activeTrackId ? ' active' : ''}" data-track="${t.id}">
              ${t.name}
            </button>
          `).join('')}
        </div>
        <div id="lb-table-wrap">
          <table id="lb-table" class="lb-table">
            <thead>
              <tr><th>#</th><th>Player</th><th>Time</th></tr>
            </thead>
            <tbody id="lb-body">
              <tr><td colspan="3" style="text-align:center;opacity:0.5">Loading…</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('lb-back').addEventListener('click', onBack);

  document.getElementById('lb-tabs').addEventListener('click', async (e) => {
    const btn = e.target.closest('.lb-tab');
    if (!btn) return;
    document.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTrackId = btn.dataset.track;
    await renderTable(activeTrackId, currentUserId);
  });

  await renderTable(activeTrackId, currentUserId);
}

async function renderTable(trackId, currentUserId) {
  const tbody = document.getElementById('lb-body');
  tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;opacity:0.5">Loading…</td></tr>`;

  const rows = await getLeaderboard(trackId, 10);

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;opacity:0.5">No times yet. Be the first!</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(r => {
    const isMe = r.user_id === currentUserId;
    const name = isMe ? `${r.display_name} ★` : r.display_name;
    return `
      <tr class="${isMe ? 'lb-me' : ''}">
        <td>${r.rank}</td>
        <td>${name}</td>
        <td>${formatTime(r.time_ms)}</td>
      </tr>
    `;
  }).join('');
}
