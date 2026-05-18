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
  // Only write if it's a new personal best
  const { data: existing } = await supabase
    .from('track_records')
    .select('best_time_ms')
    .eq('player_id', userId)
    .eq('track_id', trackId)
    .single();

  if (existing && existing.best_time_ms <= timeMs) return;

  const { error } = await supabase.from('track_records').upsert(
    { player_id: userId, track_id: trackId, best_time_ms: Math.round(timeMs), recorded_at: new Date().toISOString() },
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
