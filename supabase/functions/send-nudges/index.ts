// Scheduled by pg_cron: 'evening' checks for silent days, 'daily' checks money
// and prospect follow-ups. Notification text is a small inline set of Ostad
// lines — the full 117-line personality library stays client-only.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const DHAKA = 'Asia/Dhaka'

function dhakaDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: DHAKA }).format(d)
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const NUDGE_LINES = {
  evening_silence: [
    "It's past 8. The board is empty. I'm still here.",
    "Evening, and nothing logged. There's still time — use it.",
    'The day is almost gone. So is your excuse for waiting.',
    "One entry before you sleep. That's all I'm asking tonight.",
  ],
  money_due: [
    'care fee is due soon. Message is ready in Money — send it.',
    "renewal is coming up. Don't let it lapse quietly.",
  ],
  prospect_overdue: [
    'You promised a follow-up. The date passed. Deals die of silence.',
    'is waiting on you, not the other way around.',
  ],
} as const

function pickLine(key: keyof typeof NUDGE_LINES): string {
  const lines = NUDGE_LINES[key]
  return lines[Math.floor(Math.random() * lines.length)]
}

interface PushSub {
  id: string
  user_id: string
  endpoint: string
  keys: { p256dh: string; auth: string }
}

Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('unauthorized', { status: 401 })
  }

  const { kind } = (await req.json()) as { kind: 'evening' | 'daily' }
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  webpush.setVapidDetails(
    'mailto:majedulhoqueofficial@gmail.com',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  )

  const work = (async () => {
    const today = dhakaDate()
    const { data: subs } = await supabase.from('push_subscriptions').select('*')

    for (const sub of (subs ?? []) as PushSub[]) {
      const messages: string[] = []

      if (kind === 'evening') {
        const { count: activeCount } = await supabase
          .from('habits')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', sub.user_id)
          .eq('active', true)
        const { data: doneRows } = await supabase
          .from('checkins')
          .select('habit_id')
          .eq('user_id', sub.user_id)
          .eq('date', today)
        const doneCount = new Set((doneRows ?? []).map((r) => r.habit_id)).size
        if (doneCount < (activeCount ?? 0)) messages.push(pickLine('evening_silence'))
      }

      if (kind === 'daily') {
        const { data: money } = await supabase
          .from('money_items')
          .select('*')
          .eq('user_id', sub.user_id)
          .eq('active', true)
        for (const m of money ?? []) {
          if (!m.next_due) continue
          const windowStart = addDays(m.next_due, -m.remind_days_before)
          if (windowStart <= today && today <= m.next_due) messages.push(`${m.name} ${pickLine('money_due')}`)
        }

        const { data: prospects } = await supabase.from('prospects').select('*').eq('user_id', sub.user_id)
        for (const p of prospects ?? []) {
          if (p.next_touch && p.next_touch < today && p.stage !== 'won' && p.stage !== 'lost') {
            messages.push(`${p.name} ${pickLine('prospect_overdue')}`)
          }
        }
      }

      for (const body of messages) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            JSON.stringify({ title: 'Ostad', body }),
          )
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode
          if (statusCode === 404 || statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          }
        }
      }
    }
  })()

  // deno-lint-ignore no-explicit-any
  ;(globalThis as any).EdgeRuntime?.waitUntil(work)

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
})
