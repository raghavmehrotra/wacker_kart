import { getAvatarDataUrls } from '../game/sprites/avatarFactory.js';
import { KART_COLORS, AVATARS } from '../game/config/playerCustomization.js';
import { getPersonalRecords } from '../lib/db.js';
import { getTrackOptions } from '../game/config/createTrackCatalog.js';

function formatTime(ms) {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export async function showProfileScreen(session, profile, onBack) {
  const app = document.getElementById('app');
  const tracks = getTrackOptions();
  const avatarUrls = getAvatarDataUrls();

  const avatarUrl = avatarUrls[profile.avatar_key] ?? '';
  const avatarLabel = AVATARS.find(a => a.key === profile.avatar_key)?.label ?? profile.avatar_key;
  const kartColor = KART_COLORS.find(c => c.key === profile.kart_color_key);
  const provider = session.user.app_metadata?.provider ?? 'oauth';

  const records = await getPersonalRecords(session.user.id);
  const recordsMap = Object.fromEntries(records.map(r => [r.track_id, r.time_ms]));

  const recordRows = tracks.map(t => {
    const best = recordsMap[t.id];
    return `
      <div class="pr-row">
        <span class="pr-track">${t.name}</span>
        <span class="pr-time${best ? '' : ' pr-empty'}">${best ? formatTime(best) : '--:--.--'}</span>
      </div>
    `;
  }).join('');

  app.innerHTML = `
    <div id="profile-screen">
      <div class="panel profile-panel">
        <div class="profile-header">
          <button id="profile-back" class="back-btn">← Back</button>
          <h2 class="profile-title">My Profile</h2>
          <div></div>
        </div>

        <div class="profile-avatar-wrap">
          <img src="${avatarUrl}" alt="${avatarLabel}" class="profile-avatar-img">
        </div>

        <div class="profile-name">${profile.display_name}</div>
        <div class="profile-email">${session.user.email}</div>

        <div class="profile-meta-row">
          <div class="profile-meta-item">
            <div class="profile-meta-label">Kart</div>
            <div class="profile-meta-value">
              <span class="profile-color-dot" style="background:${kartColor?.css ?? '#888'}"></span>
              ${kartColor?.label ?? profile.kart_color_key}
            </div>
          </div>
          <div class="profile-meta-item">
            <div class="profile-meta-label">Avatar</div>
            <div class="profile-meta-value">${avatarLabel}</div>
          </div>
          <div class="profile-meta-item">
            <div class="profile-meta-label">Signed in via</div>
            <div class="profile-meta-value profile-provider">${provider}</div>
          </div>
        </div>

        <div class="pr-panel" style="margin-top:0.5rem">
          <div class="pr-title">Personal Records</div>
          ${recordRows}
        </div>
      </div>
    </div>
  `;

  document.getElementById('profile-back').addEventListener('click', onBack);
}
