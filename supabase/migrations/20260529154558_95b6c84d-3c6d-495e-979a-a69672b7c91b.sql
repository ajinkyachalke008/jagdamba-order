-- Enable pg_cron in its own schema
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Remove any prior keep-alive job (safe if it doesn't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('jagdamba-keepalive');
EXCEPTION WHEN OTHERS THEN
  -- ignore if it wasn't scheduled
  NULL;
END $$;

-- Ping the database every 5 minutes to prevent idle auto-pause
SELECT cron.schedule(
  'jagdamba-keepalive',
  '*/5 * * * *',
  $$ SELECT 1; $$
);