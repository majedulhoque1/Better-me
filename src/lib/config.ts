// These three values are public by design — the Supabase anon/publishable
// key ships in every client bundle and is protected by RLS, and a VAPID
// public key is meant to be public. Committing safe fallbacks here means
// the app builds correctly even on a host with no env vars configured.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://kimtotdhryrbgllzttdn.supabase.co'
export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_07wznprNoKT435tqCETQEw_mROvNzOW'
export const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ?? 'BJOsGRRqzpW30J_OY02kAXrrUfVfJcitTEu_FGcB1tBOm7whi6KzIpTVUqYHd6cijj49DsLw7ym-ODROYQIAOSE'
