// Scheduled by pg_cron every Friday 08:00 Dhaka (the week just closed).
// One OpenRouter call per user, quoting their own check-in notes as evidence.
// This is the ONLY place in the whole app that calls an LLM — everything
// daily runs off the offline reaction library instead.
import { createClient } from 'npm:@supabase/supabase-js@2'

const DHAKA = 'Asia/Dhaka'

function dhakaDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: DHAKA }).format(d)
}
function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
function weekStart(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  const dow = d.getUTCDay()
  return addDays(iso, -((dow + 1) % 7))
}

const SYSTEM_PROMPT = `You are Ostad, a strict but fair Bengali accountability coach (a Royal Bengal tiger).
You are reviewing one week of your student's habit evidence.
Rules:
- Quote the student's own check-in notes as evidence. Never invent events.
- Be blunt about misses and lazy entries. Praise only what is earned.
- Compare against last week's review when provided: better, worse, or flat — say which and why.
- End with exactly ONE focus instruction for next week.
- 180-250 words, markdown, second person.
- Finally, on the last line output: BONUS_XP: <integer 0-50> based on honest effort quality (not just completion).`

interface Habit {
  id: string
  name: string
  slug: string
}
interface Checkin {
  habit_id: string
  date: string
  note: string | null
  count: number | null
  base_xp?: number
}

function buildContext(
  habits: Habit[],
  checkins: Checkin[],
  weekStartIso: string,
  xpEarned: number,
  previousReview: { review_md: string; bonus_xp: number } | null,
): string {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStartIso, i))
  const byDay = days.map((date) => {
    const entries = habits.map((h) => {
      const c = checkins.find((ci) => ci.habit_id === h.id && ci.date === date)
      if (!c) return `${h.name}: missed`
      return `${h.name}: done${c.note ? ` — "${c.note}"` : ''}${c.count != null ? ` (${c.count})` : ''}`
    })
    return `${date}:\n  ${entries.join('\n  ')}`
  })

  const missCounts = habits
    .map((h) => ({ name: h.name, misses: days.filter((d) => !checkins.some((c) => c.habit_id === h.id && c.date === d)).length }))
    .filter((m) => m.misses > 0)

  const parts = [
    `Active habits: ${habits.map((h) => h.name).join(', ')}`,
    `Week of ${weekStartIso}:`,
    byDay.join('\n'),
    missCounts.length ? `Misses this week: ${missCounts.map((m) => `${m.name} x${m.misses}`).join(', ')}` : 'No misses this week.',
    `XP earned this week: ${xpEarned}`,
  ]
  if (previousReview) {
    parts.push(`Last week's review (bonus_xp was ${previousReview.bonus_xp}):\n${previousReview.review_md}`)
  }
  return parts.join('\n\n')
}

function parseReview(raw: string): { review_md: string; bonus_xp: number } {
  const match = raw.match(/BONUS_XP:\s*(\d+)\s*$/i)
  const bonus_xp = match ? Math.max(0, Math.min(50, parseInt(match[1], 10))) : 0
  const review_md = match ? raw.slice(0, match.index).trim() : raw.trim()
  return { review_md, bonus_xp }
}

Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('unauthorized', { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as { force_week_start?: string }
  const today = dhakaDate()
  const targetWeekStart = body.force_week_start ?? weekStart(today)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const openrouterKey = Deno.env.get('OPENROUTER_API_KEY')!
  const baseUrl = Deno.env.get('OPENROUTER_BASE_URL') ?? 'https://openrouter.ai/api/v1'
  const model = Deno.env.get('JUDGE_MODEL') ?? 'anthropic/claude-haiku-4.5'

  const work = (async () => {
    const { data: profiles } = await supabase.from('profiles').select('id')

    for (const profile of profiles ?? []) {
      const userId = profile.id as string
      const weekEnd = addDays(targetWeekStart, 6)

      const { data: habits } = await supabase
        .from('habits')
        .select('id, name, slug')
        .eq('user_id', userId)
        .eq('active', true)
      if (!habits || habits.length === 0) continue

      const { data: checkins } = await supabase
        .from('checkins')
        .select('habit_id, date, note, count, base_xp')
        .eq('user_id', userId)
        .gte('date', targetWeekStart)
        .lte('date', weekEnd)

      // Shields live only in client-side Dexie (never synced to Postgres), so
      // the weekly review can't reference them server-side — the review
      // works entirely off checkins, which are the full source of truth here.
      const xpEarned = (checkins ?? []).reduce((sum, c: { base_xp?: number }) => sum + (c.base_xp ?? 0), 0)

      const { data: prevReviews } = await supabase
        .from('weekly_reviews')
        .select('review_md, bonus_xp, week_start')
        .eq('user_id', userId)
        .lt('week_start', targetWeekStart)
        .order('week_start', { ascending: false })
        .limit(1)
      const previousReview = prevReviews?.[0] ?? null

      const context = buildContext(habits, checkins ?? [], targetWeekStart, xpEarned, previousReview)

      const completion = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${openrouterKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: context },
          ],
          temperature: 0.7,
        }),
      })
      if (!completion.ok) continue
      const json = await completion.json()
      const raw = json.choices?.[0]?.message?.content
      if (!raw) continue

      const { review_md, bonus_xp } = parseReview(raw)

      const { data: inserted } = await supabase
        .from('weekly_reviews')
        .upsert(
          { user_id: userId, week_start: targetWeekStart, review_md, bonus_xp, stats: { xp_earned: xpEarned } },
          { onConflict: 'user_id,week_start', ignoreDuplicates: true },
        )
        .select()

      if (inserted && inserted.length > 0) {
        const { data: current } = await supabase.from('profiles').select('xp').eq('id', userId).single()
        if (current) await supabase.from('profiles').update({ xp: current.xp + bonus_xp }).eq('id', userId)
      }
    }
  })()

  // deno-lint-ignore no-explicit-any
  ;(globalThis as any).EdgeRuntime?.waitUntil(work)

  return new Response(JSON.stringify({ ok: true, week_start: targetWeekStart }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
