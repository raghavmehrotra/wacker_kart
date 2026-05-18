import { supabase } from '../lib/supabase.js';

export function showAuthScreen(onLogin) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div id="auth-screen">
      <div class="panel auth-panel">
        <h1>Wacker Kart</h1>
        <p class="auth-subtitle">Sign in to save your records and compete on the leaderboard.</p>
        <div id="auth-form">
          <div class="garage-group" style="width:100%">
            <div class="garage-label">Email</div>
            <input id="auth-email" type="email" placeholder="you@example.com"
              style="width:100%;padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);
                     background:rgba(255,255,255,0.07);color:#fff;font-size:15px;box-sizing:border-box;" />
          </div>
          <button id="auth-submit" class="start-btn" style="margin-top:16px">Send Magic Link</button>
          <p id="auth-error" style="color:#e05a4e;margin-top:8px;display:none;font-size:13px"></p>
        </div>
        <div id="auth-sent" style="display:none;text-align:center">
          <p style="font-size:22px;margin-bottom:8px">✉️ Check your email</p>
          <p style="opacity:0.7;font-size:14px">Click the magic link we sent you to sign in.</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('auth-submit').addEventListener('click', async () => {
    const email = document.getElementById('auth-email').value.trim();
    const errEl = document.getElementById('auth-error');
    errEl.style.display = 'none';

    if (!email) {
      errEl.textContent = 'Please enter your email.';
      errEl.style.display = 'block';
      return;
    }

    const btn = document.getElementById('auth-submit');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      errEl.textContent = error.message;
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Send Magic Link';
      return;
    }

    document.getElementById('auth-form').style.display = 'none';
    document.getElementById('auth-sent').style.display = 'block';
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
      onLogin(session);
    }
  });
}
