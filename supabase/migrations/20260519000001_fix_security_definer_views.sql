-- Add public SELECT policy to track_runs so leaderboard views work with security_invoker.
-- Previously, track_runs only allowed users to select their own rows, which would have
-- made the leaderboard invisible to other players once the view stopped bypassing RLS.
CREATE POLICY "track_runs_select_all" ON public.track_runs
  FOR SELECT USING (true);

-- Switch both leaderboard views from SECURITY DEFINER to SECURITY INVOKER so they
-- respect RLS like every other table/view in the schema.
ALTER VIEW public.leaderboard SET (security_invoker = true);
ALTER VIEW public.track_leaderboard SET (security_invoker = true);
