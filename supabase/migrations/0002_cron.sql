-- Scheduled nudges: evening silence check (20:30 Dhaka = 14:30 UTC) and
-- daily money/prospect check (10:00 Dhaka = 04:00 UTC).
-- <CRON_SECRET> is a placeholder — substitute the real value only when
-- applying this live, never commit the literal secret to this file.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'evening-nudge',
  '30 14 * * *',
  $$
  select net.http_post(
    url := 'https://kimtotdhryrbgllzttdn.supabase.co/functions/v1/send-nudges',
    body := '{"kind":"evening"}'::jsonb,
    headers := '{"Authorization":"Bearer <CRON_SECRET>","Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 10000
  )
  $$
);

select cron.schedule(
  'daily-nudge',
  '0 4 * * *',
  $$
  select net.http_post(
    url := 'https://kimtotdhryrbgllzttdn.supabase.co/functions/v1/send-nudges',
    body := '{"kind":"daily"}'::jsonb,
    headers := '{"Authorization":"Bearer <CRON_SECRET>","Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 10000
  )
  $$
);
