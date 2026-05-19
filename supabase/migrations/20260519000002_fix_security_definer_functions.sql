-- Revoke direct REST API access from trigger-only functions.
-- These are called by internal triggers/event triggers, not by clients.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;

-- Fix mutable search_path on the updated_at trigger to prevent schema injection.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;
