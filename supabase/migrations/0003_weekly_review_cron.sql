-- Weekly Ostad review, every Friday 08:00 Dhaka = 02:00 UTC.
-- <CRON_SECRET> is a placeholder — substitute the real value only when
-- applying this live, never commit the literal secret to this file.
select cron.schedule(
  'weekly-review',
  '0 2 * * 5',
  $$
  select net.http_post(
    url := 'https://kimtotdhryrbgllzttdn.supabase.co/functions/v1/weekly-review',
    body := '{}'::jsonb,
    headers := '{"Authorization":"Bearer <CRON_SECRET>","Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 30000
  )
  $$
);
