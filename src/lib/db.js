import { supabase } from './supabase.js';

export async function upsertProfile(userId, { display_name, kart_color_key, avatar_key }) {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      display_name,
      selected_color: kart_color_key,
      selected_icon: avatar_key,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (error) console.error('upsertProfile:', error.message);
}

export async function loadProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, selected_color, selected_icon')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') console.error('loadProfile:', error.message);
  if (!data) return null;
  return {
    display_name: data.display_name,
    kart_color_key: data.selected_color,
    avatar_key: data.selected_icon,
  };
}

export async function saveTrackRecord(userId, trackId, timeMs) {
  const rounded = Math.round(timeMs);
  const now = new Date().toISOString();

  // Always record the individual run
  const { error: runErr } = await supabase
    .from('track_runs')
    .insert({ player_id: userId, track_id: trackId, time_ms: rounded, recorded_at: now });
  if (runErr) console.error('saveTrackRun:', runErr.message);

  // Update personal best only if improved
  const { data: existing } = await supabase
    .from('track_records')
    .select('best_time_ms')
    .eq('player_id', userId)
    .eq('track_id', trackId)
    .single();
  if (existing && existing.best_time_ms <= rounded) return;

  const { error } = await supabase.from('track_records').upsert(
    { player_id: userId, track_id: trackId, best_time_ms: rounded, recorded_at: now },
    { onConflict: 'track_id,player_id' }
  );
  if (error) console.error('saveTrackRecord:', error.message);
}

export async function getPersonalRecords(userId) {
  const { data, error } = await supabase
    .from('track_records')
    .select('track_id, best_time_ms')
    .eq('player_id', userId);
  if (error) console.error('getPersonalRecords:', error.message);
  return (data ?? []).map((r) => ({ track_id: r.track_id, time_ms: r.best_time_ms }));
}

export async function getRecentRuns(userId, trackId, limit = 20) {
  const { data, error } = await supabase
    .from('track_runs')
    .select('time_ms, recorded_at')
    .eq('player_id', userId)
    .eq('track_id', trackId)
    .order('recorded_at', { ascending: false })
    .limit(limit);
  if (error) console.error('getRecentRuns:', error.message);
  return data ?? [];
}

export async function getLeaderboard(trackId, limit = 10) {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('rank, display_name, time_ms, user_id')
    .eq('track_id', trackId)
    .order('rank', { ascending: true })
    .limit(limit);
  if (error) console.error('getLeaderboard:', error.message);
  return data ?? [];
}
