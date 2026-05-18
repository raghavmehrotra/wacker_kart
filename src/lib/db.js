import { supabase } from './supabase.js';

export async function upsertProfile(userId, { display_name, kart_color_key, avatar_key }) {
  const { error } = await supabase.from('profiles').upsert(
    { id: userId, display_name, kart_color_key, avatar_key, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  );
  if (error) console.error('upsertProfile:', error.message);
}

export async function loadProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, kart_color_key, avatar_key')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') console.error('loadProfile:', error.message);
  return data ?? null;
}

export async function saveTrackRecord(userId, trackId, timeMs) {
  const { error } = await supabase
    .from('track_records')
    .insert({ user_id: userId, track_id: trackId, time_ms: timeMs });
  if (error) console.error('saveTrackRecord:', error.message);
}

export async function getPersonalRecords(userId) {
  const { data, error } = await supabase
    .from('personal_bests')
    .select('track_id, time_ms')
    .eq('user_id', userId);
  if (error) console.error('getPersonalRecords:', error.message);
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
