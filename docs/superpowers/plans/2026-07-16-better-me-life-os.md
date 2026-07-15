# Better Me Life-OS PWA Implementation Plan

> **For agentic workers:** Execute INLINE via superpowers:executing-plans (user chose this 2026-07-16 — token budget; subagents only when genuinely needed). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Majedul's private, offline-first, gamified life-OS PWA — habit check-ins judged by a strict animated character ("Ostad"), with to-dos, Noree retainer-fee reminders, subscription tracking, and MIV prospect cards.

**Architecture:** Local-first React PWA: Dexie (IndexedDB) is the source of truth on-device with an outbox that syncs to Supabase when online. The daily character personality is a pre-written tagged reaction library (zero AI, works offline). Server side: Supabase (Postgres + RLS + Auth), pg_cron → Edge Functions for push nudges and the once-weekly OpenRouter-powered coach review. Hosted on Vercel.

**Tech Stack:** Vite + React 18 + TypeScript, Tailwind CSS v4, vite-plugin-pwa (Workbox), Dexie, Supabase JS v2, Supabase Edge Functions (Deno), web-push (VAPID), OpenRouter API, Vitest.

**Spec:** Decision log in `D:\Garp Vault\Clauding\better-me-life-os.md` (locked 2026-07-16).

**Non-negotiable constraints from the spec:**
- Daily loop makes ZERO network/AI calls. Check-ins must work fully offline.
- AI = one OpenRouter call per week (weekly review) + monthly verdict derived from stored weeklies.
- Character tone: strict, blunt, loss-aversion. Never auto-messages Noree — only prepares copy-text.
- Real Supabase auth from day one. All dates computed in Asia/Dhaka.
- Env vars: client uses `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` (mirror them in `.env` from the existing unprefixed values; Vite only exposes `VITE_*`). `OPENROUTER_API_KEY` lives ONLY in Edge Function secrets, never in the client bundle.

---

## Locked game rules (referenced by many tasks — single source of truth)

- **Base XP:** check-in with evidence = 10. Note ≥ 80 chars → +5 effort bonus. Prayer habit = 2 XP per prayer logged (max 10, `count` 0–5, no note required).
- **Task XP:** completed to-do = 5.
- **Perfect day** (all active habits checked in) = +10.
- **Perfect week** (perfect day × 7, Sat–Fri Dhaka week) = +50 XP and +1 shield (max 3 shields).
- **Shield:** a missed day auto-consumes 1 shield and preserves ALL habit streaks for that day.
- **Weekly AI bonus:** 0–50 XP granted by the weekly review.
- **Level:** `level = floor(sqrt(xp / 100)) + 1`. **Evolution stage:** 1 (lvl 1–4), 2 (5–9), 3 (10–19), 4 (20+).
- **Ostad moods:** `proud | neutral | disappointed | angry | celebrating | asleep`.
- **Seed habits (5):** exercise (note), guitar (note), prayer (count/5), reading (note), writing (note).

## File structure

```
Better Me/
├── .env                          # exists — keys already dropped
├── index.html
├── vite.config.ts                # react + tailwind v4 + vite-plugin-pwa
├── package.json / tsconfig.json
├── public/ (icons, favicon)
├── docs/superpowers/plans/       # this plan
├── supabase/
│   ├── migrations/
│   │   ├── 0001_init.sql         # tables + RLS
│   │   └── 0002_cron.sql         # pg_cron → edge fn schedules
│   └── functions/
│       ├── send-nudges/index.ts  # daily push: silence, money due, prospects overdue
│       └── weekly-review/index.ts# Friday OpenRouter coach review + bonus XP
└── src/
    ├── main.tsx / App.tsx / routes.tsx
    ├── lib/supabase.ts, lib/dates.ts
    ├── db/types.ts, db/local.ts (Dexie), db/sync.ts (outbox+pull)
    ├── game/xp.ts, game/streaks.ts, game/levels.ts
    ├── character/library.ts, character/pick.ts, character/Ostad.tsx
    ├── features/auth/AuthScreen.tsx, useSession.ts
    ├── features/today/TodayScreen.tsx, CheckinSheet.tsx
    ├── features/tasks/TasksScreen.tsx
    ├── features/money/MoneyScreen.tsx
    ├── features/prospects/ProspectsScreen.tsx
    ├── features/review/ReviewScreen.tsx
    ├── features/settings/SettingsScreen.tsx  # push opt-in, profile
    └── components/ (BottomNav, StatBar, shared UI)
```

Each `game/*` and `character/pick.ts` and `db/sync.ts` module is pure logic → unit-tested with Vitest. UI components are thin over that logic.

---

## Phase 0 — Scaffold & backend foundation

### Task 0.1: Git + Vite scaffold

**Files:** Create project scaffold in `d:\MIV ALL\Better Me` (folder already exists, contains `.env` + `docs/`).

- [ ] **Step 1:** `git init`, create `.gitignore` (node_modules, dist, .env, dev-dist).
- [ ] **Step 2:** Scaffold Vite in-place: `npm create vite@latest . -- --template react-ts` (keep existing `.env`/`docs`). Then:
  `npm i @supabase/supabase-js dexie react-router-dom`
  `npm i -D tailwindcss @tailwindcss/vite vite-plugin-pwa vitest fake-indexeddb @types/node`
- [ ] **Step 3:** `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Better Me', short_name: 'BetterMe',
        display: 'standalone', theme_color: '#0c0a09', background_color: '#0c0a09',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: { navigateFallback: '/index.html' },
    }),
  ],
  test: { environment: 'node' },
})
```

- [ ] **Step 4:** Append to `.env` (values copied from existing lines):

```
VITE_SUPABASE_URL="https://kimtotdhryrbgllzttdn.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_07wznprNoKT435tqCETQEw_mROvNzOW"
```

- [ ] **Step 5:** `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)
```

- [ ] **Step 6:** `src/lib/dates.ts` — every date in the app goes through this (Dhaka-local):

```ts
const DHAKA = 'Asia/Dhaka'
/** YYYY-MM-DD in Asia/Dhaka for a given instant (default now). */
export function dhakaDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: DHAKA }).format(d)
}
/** Add n days to a YYYY-MM-DD string. */
export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
/** Start (Saturday) of the Dhaka week containing iso date. BD week = Sat–Fri. */
export function weekStart(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  const dow = d.getUTCDay() // Sun=0 … Sat=6
  return addDays(iso, -((dow + 1) % 7))
}
```

- [ ] **Step 7:** `npm run build` → passes. Commit: `chore: scaffold vite pwa + supabase client + dhaka date utils`.

### Task 0.2: Database schema + RLS (migration 0001)

**Files:** Create `supabase/migrations/0001_init.sql`. Apply via Supabase MCP `apply_migration` against project `kimtotdhryrbgllzttdn` (fall back to Management API with `SUPABASE_ACCESS_TOKEN` + curl UA if MCP is denied — see memory `aaap-supabase-admin-access`).

- [ ] **Step 1:** Write migration:

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Majedul',
  xp int not null default 0,
  shields int not null default 0,
  created_at timestamptz not null default now()
);
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  evidence_type text not null check (evidence_type in ('note','count')),
  target_count int,             -- prayer = 5
  active boolean not null default true,
  sort int not null default 0,
  unique (user_id, slug)
);
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  local_id text not null,       -- client-generated, idempotency key for sync
  date date not null,
  note text,
  count int,
  base_xp int not null default 0,
  bonus_xp int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, habit_id, date),
  unique (user_id, local_id)
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  title text not null,
  due_date date,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, local_id)
);
create table public.money_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('retainer','subscription')),
  name text not null,
  amount numeric,
  currency text not null default 'BDT',
  cycle text not null default 'monthly' check (cycle in ('monthly','yearly')),
  next_due date,
  remind_days_before int not null default 2,
  message_template text,        -- Noree: prewritten WhatsApp text
  whatsapp text,                -- phone for wa.me link
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  source text,
  note text,
  stage text not null default 'lead' check (stage in ('lead','contacted','in_talks','won','lost')),
  deal_value numeric,
  proposal_status text not null default 'none' check (proposal_status in ('none','draft','sent','won','lost')),
  next_touch date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  review_md text not null,
  bonus_xp int not null default 0,
  stats jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.checkins enable row level security;
alter table public.tasks enable row level security;
alter table public.money_items enable row level security;
alter table public.prospects enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.push_subscriptions enable row level security;

-- one policy pattern for all: owner-only
create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own habits" on public.habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own checkins" on public.checkins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tasks" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own money" on public.money_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own prospects" on public.prospects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own reviews" on public.weekly_reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own push" on public.push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- auto profile + seed 5 habits on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id);
  insert into habits (user_id, name, slug, evidence_type, target_count, sort) values
    (new.id, 'Exercise', 'exercise', 'note', null, 1),
    (new.id, 'Guitar',   'guitar',   'note', null, 2),
    (new.id, 'Prayer',   'prayer',   'count', 5,  3),
    (new.id, 'Reading',  'reading',  'note', null, 4),
    (new.id, 'Writing',  'writing',  'note', null, 5);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2:** Apply migration; verify with `list_tables` that all 8 tables exist with RLS enabled.
- [ ] **Step 3:** Run `get_advisors` (security) — fix anything it flags on these tables.
- [ ] **Step 4:** Commit migration file: `feat: schema + RLS + signup seed trigger`.

### Task 0.3: Auth (email+password) and session

**Files:** Create `src/features/auth/AuthScreen.tsx`, `src/features/auth/useSession.ts`, wire into `src/App.tsx` + `src/routes.tsx` (BottomNav shell: Today / Tasks / Money / Prospects / Review).

- [ ] **Step 1:** `useSession.ts` — subscribe to `supabase.auth.onAuthStateChange`, expose `{ session, loading }`.
- [ ] **Step 2:** `AuthScreen.tsx` — single card: email + password, buttons Sign in / Create account (`signInWithPassword` / `signUp`). Errors shown inline. Ostad silhouette on top (placeholder div until Task 2.3).
- [ ] **Step 3:** `App.tsx`: loading → splash; no session → AuthScreen; session → router shell. Verify sign-up in browser creates profile + 5 habits rows (check via Supabase MCP `execute_sql`).
- [ ] **Step 4:** Commit: `feat: auth + app shell with bottom nav`.

---

## Phase 1 — Local-first data layer (the offline spine)

### Task 1.1: Dexie schema + types

**Files:** Create `src/db/types.ts`, `src/db/local.ts`. Test: `src/db/local.test.ts`.

- [ ] **Step 1:** `types.ts` — mirror server rows (Habit, Checkin, Task, MoneyItem, Prospect, WeeklyReview, Profile) with `local_id: string` on checkins/tasks and `synced: 0 | 1` flags where relevant.
- [ ] **Step 2:** `local.ts`:

```ts
import Dexie, { type Table } from 'dexie'
import type { Habit, Checkin, TaskItem, MoneyItem, Prospect, WeeklyReview, Profile, OutboxOp } from './types'

export class BetterMeDB extends Dexie {
  habits!: Table<Habit, string>
  checkins!: Table<Checkin, string>       // key = local_id
  tasks!: Table<TaskItem, string>         // key = local_id
  money!: Table<MoneyItem, string>
  prospects!: Table<Prospect, string>
  reviews!: Table<WeeklyReview, string>
  profile!: Table<Profile, string>
  outbox!: Table<OutboxOp, number>
  constructor() {
    super('betterme')
    this.version(1).stores({
      habits: 'id, slug, sort',
      checkins: 'local_id, [habit_id+date], date',
      tasks: 'local_id, done, due_date',
      money: 'id, kind, next_due',
      prospects: 'id, stage, next_touch',
      reviews: 'id, week_start',
      profile: 'id',
      outbox: '++seq, table',
    })
  }
}
export const db = new BetterMeDB()
```

- [ ] **Step 3:** `OutboxOp` type: `{ seq?: number; table: 'checkins'|'tasks'|'money_items'|'prospects'|'profiles'; op: 'upsert'|'delete'; payload: Record<string, unknown> }`.
- [ ] **Step 4:** Test with `fake-indexeddb` (import `fake-indexeddb/auto` at top): insert a checkin, query by `[habit_id+date]`, assert found. Run `npx vitest run` → PASS. Commit: `feat: dexie local db`.

### Task 1.2: Sync engine (outbox push + pull)

**Files:** Create `src/db/sync.ts`. Test: `src/db/sync.test.ts` (mock supabase client injected).

- [ ] **Step 1: Failing tests first** — `sync.test.ts` covers: (a) `enqueue` writes an outbox row; (b) `flushOutbox` upserts each op via the injected client and clears the row on success; (c) on network failure the row stays; (d) `pullAll` writes server rows into Dexie tables.
- [ ] **Step 2:** Implement:

```ts
import { db } from './local'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function enqueue(table: OutboxOp['table'], op: 'upsert'|'delete', payload: Record<string, unknown>) {
  await db.outbox.add({ table, op, payload })
}

/** Push queued writes. Conflict keys: checkins (user_id,habit_id,date), tasks (user_id,local_id). Safe to re-run. */
export async function flushOutbox(client: SupabaseClient): Promise<boolean> {
  const ops = await db.outbox.orderBy('seq').toArray()
  for (const o of ops) {
    const q = o.op === 'delete'
      ? client.from(o.table).delete().match({ local_id: o.payload.local_id as string })
      : client.from(o.table).upsert(o.payload, { onConflict: o.table === 'checkins' ? 'user_id,habit_id,date' : 'user_id,local_id' })
    const { error } = await q
    if (error) return false          // stop; retry next flush
    await db.outbox.delete(o.seq!)
  }
  return true
}

/** Pull server state into Dexie (server wins for non-queued rows). */
export async function pullAll(client: SupabaseClient, userId: string) { /* select * from each table, bulkPut into dexie */ }

export function startSyncLoop(client: SupabaseClient, userId: string) {
  const kick = () => { if (navigator.onLine) flushOutbox(client).then(ok => ok && pullAll(client, userId)) }
  window.addEventListener('online', kick)
  setInterval(kick, 60_000)
  kick()
}
```

- [ ] **Step 3:** `profiles` sync: XP/shields are updated locally and enqueued as `{ id, xp, shields }` upserts (single-user math is authoritative on-device).
- [ ] **Step 4:** `npx vitest run` → all sync tests PASS. Commit: `feat: offline outbox sync engine`.

---

## Phase 2 — Game engine + character brain (pure logic, fully tested)

### Task 2.1: XP + levels

**Files:** Create `src/game/xp.ts`, `src/game/levels.ts`. Tests: `src/game/xp.test.ts`, `src/game/levels.test.ts`.

- [ ] **Step 1: Failing tests** — encode the locked rules exactly:

```ts
import { describe, it, expect } from 'vitest'
import { checkinXp, perfectDayBonus } from './xp'
import { levelFor, stageFor } from './levels'

describe('xp', () => {
  it('note habit: 10 base, +5 when note ≥ 80 chars', () => {
    expect(checkinXp({ evidence_type: 'note' }, { note: 'short' })).toBe(10)
    expect(checkinXp({ evidence_type: 'note' }, { note: 'x'.repeat(80) })).toBe(15)
  })
  it('prayer: 2 xp per count, capped at 5', () => {
    expect(checkinXp({ evidence_type: 'count', target_count: 5 }, { count: 3 })).toBe(6)
    expect(checkinXp({ evidence_type: 'count', target_count: 5 }, { count: 7 })).toBe(10)
  })
  it('perfect day = +10', () => expect(perfectDayBonus(5, 5)).toBe(10))
})
describe('levels', () => {
  it('level curve', () => {
    expect(levelFor(0)).toBe(1); expect(levelFor(100)).toBe(2)
    expect(levelFor(400)).toBe(3); expect(levelFor(899)).toBe(3)
  })
  it('stages', () => {
    expect(stageFor(1)).toBe(1); expect(stageFor(5)).toBe(2)
    expect(stageFor(10)).toBe(3); expect(stageFor(20)).toBe(4)
  })
})
```

- [ ] **Step 2:** Implement minimal code to pass:

```ts
// xp.ts
export function checkinXp(h: { evidence_type: string; target_count?: number|null }, c: { note?: string|null; count?: number|null }): number {
  if (h.evidence_type === 'count') return Math.min(c.count ?? 0, h.target_count ?? 5) * 2
  return 10 + ((c.note ?? '').length >= 80 ? 5 : 0)
}
export function perfectDayBonus(done: number, active: number): number { return done >= active && active > 0 ? 10 : 0 }
export const TASK_XP = 5
export const PERFECT_WEEK_XP = 50

// levels.ts
export function levelFor(xp: number): number { return Math.floor(Math.sqrt(xp / 100)) + 1 }
export function stageFor(level: number): 1|2|3|4 { return level >= 20 ? 4 : level >= 10 ? 3 : level >= 5 ? 2 : 1 }
```

- [ ] **Step 3:** `npx vitest run` → PASS. Commit: `feat: xp + level engine (tested)`.

### Task 2.2: Streaks + shields

**Files:** Create `src/game/streaks.ts`. Test: `src/game/streaks.test.ts`.

- [ ] **Step 1: Failing tests** — given a habit's set of check-in dates, `computeStreak(dates, today, shieldedDates)` returns current streak counting back from today (today itself optional); a date covered by a shield counts as kept. `evaluateDay(yesterdayHadAllCheckins, shields)` returns `{ useShield: boolean, shieldsLeft }`. Perfect Sat–Fri week detection: `isPerfectWeek(checkinsByDate, activeHabitCount, weekStartIso)`.

```ts
it('unbroken run counts back from today', () => {
  expect(computeStreak(['2026-07-14','2026-07-15','2026-07-16'], '2026-07-16', new Set())).toBe(3)
})
it('gap without shield breaks the streak', () => {
  expect(computeStreak(['2026-07-13','2026-07-14','2026-07-16'], '2026-07-16', new Set())).toBe(1)
})
it('gap covered by shield keeps it', () => {
  expect(computeStreak(['2026-07-13','2026-07-14','2026-07-16'], '2026-07-16', new Set(['2026-07-15']))).toBe(4)
})
```

- [ ] **Step 2:** Implement with `addDays` from `lib/dates.ts`; shields consumed at most once per calendar day and recorded in a `shield_uses` Dexie-only table (`date` primary key) so streak math is reproducible.
- [ ] **Step 3:** Daily rollover routine `applyRollover(todayIso)` (runs on app open): for each un-evaluated past day, if any active habit missed and `shields > 0` → consume shield + record use; if a completed Sat–Fri week was perfect → `+PERFECT_WEEK_XP`, `shields = min(3, shields+1)`. Store `last_evaluated_date` in profile row locally, enqueue profile upsert. Tests cover: shield consumed once, perfect week grants capped shield.
- [ ] **Step 4:** `npx vitest run` → PASS. Commit: `feat: streaks, shields, rollover (tested)`.

### Task 2.3: Ostad's reaction library + picker

**Files:** Create `src/character/library.ts`, `src/character/pick.ts`. Test: `src/character/pick.test.ts`.

Ostad = a Royal Bengal tiger mentor. Strict old-school ostad energy — talks like a coach who respects you too much to flatter you. Mixed English with light Banglish seasoning ("Bah!", "Cholbe na", "Shabash!") — never full Bangla script (keeps font/render simple).

- [ ] **Step 1:** `library.ts` — the content is a typed array; **minimum 140 lines at launch**, ≥8 variants per common tag. Structure:

```ts
export type Mood = 'proud'|'neutral'|'disappointed'|'angry'|'celebrating'|'asleep'
export interface Reaction { id: string; tags: string[]; mood: Mood; text: string }

export const LIBRARY: Reaction[] = [
  { id: 'ci-read-1', tags: ['checkin','reading'], mood: 'proud', text: 'Good. A page read is a rep done. Same time tomorrow.' },
  { id: 'lazy-1', tags: ['checkin','lazy_note'], mood: 'disappointed', text: '“Read a bit”? Cholbe na. What did the book actually say?' },
  { id: 'miss2-ex-1', tags: ['missed_2_days','exercise'], mood: 'angry', text: 'Two days. Your body keeps the score even when you don’t.' },
  { id: 'streak7-1', tags: ['streak_7'], mood: 'celebrating', text: 'Shabash! Seven days. This is what I signed up for.' },
  { id: 'comeback-1', tags: ['comeback_after_break'], mood: 'neutral', text: 'You came back. That matters more than the miss. Now prove it wasn’t a visit.' },
  { id: 'silent-1', tags: ['evening_silence'], mood: 'disappointed', text: 'It’s past 8. The board is empty. I’m still here.' },
  { id: 'perfect-1', tags: ['perfect_day'], mood: 'celebrating', text: 'All five. Bah! Sleep well — you earned tonight.' },
  { id: 'shield-1', tags: ['shield_used'], mood: 'neutral', text: 'I covered for you yesterday. Shields are for storms, not habits.' },
  { id: 'fee-1', tags: ['money_due'], mood: 'neutral', text: 'Noree’s care fee is due in 2 days. Message is ready — send it.' },
  { id: 'touch-1', tags: ['prospect_overdue'], mood: 'disappointed', text: 'You promised a follow-up. The date passed. Deals die of silence.' },
  // …130+ more at build time, covering every tag × habit combination
]
```

Full tag vocabulary (picker + nudge fn both use it): `checkin` + habit slug, `lazy_note`, `missed_1_day`/`missed_2_days`/`missed_3_plus` + habit slug, `streak_3`/`streak_7`/`streak_30`, `perfect_day`, `perfect_week`, `comeback_after_break`, `evening_silence`, `shield_used`, `shield_earned`, `level_up`, `money_due`, `prospect_overdue`, `task_done`, `morning_greeting`.

- [ ] **Step 2: Failing tests for `pick.ts`:** `pick(tags, recentIds)` returns a reaction matching the MOST tags (habit-specific beats generic), never returns an id in `recentIds`, and falls back to generic when habit-specific lines are exhausted. Deterministic under injected RNG.
- [ ] **Step 3:** Implement `pick(tags: string[], recentIds: string[], rng = Math.random)`: score = |tags ∩ reaction.tags|, filter score ≥ 1 and not recent, sort by score desc, random among top scorers. Store last 20 shown ids in localStorage key `ostad_recent`.
- [ ] **Step 4:** `npx vitest run` → PASS. Commit: `feat: ostad reaction library + picker (tested)`.

### Task 2.4: Ostad visual component

**Files:** Create `src/character/Ostad.tsx` (inline SVG tiger, 4 evolution stages × 6 moods via CSS classes — ears/eyes/mouth/posture variants, breathing idle animation, mood transitions with keyframes). No external assets — SVG only, so it renders offline and evolves by prop.

- [ ] **Step 1:** Build `<Ostad stage={1..4} mood="neutral" size={160} speaking={text?} />` — renders tiger + a speech bubble when `speaking` set. Stage differences: 1 = cub (round, big eyes); 2 = young (stripes sharpen); 3 = adult (whiskers, scar); 4 = elder (glasses, medal). Mood drives eyes/brows/mouth/tail.
- [ ] **Step 2:** Design pass: follow `frontend-design` + `ui-ux-pro-max` skills; theme is "night training ground" — near-black stone bg (#0c0a09), amber/gold accent, Inter font. This is my design call per `user-not-a-designer-own-the-design` — present finished.
- [ ] **Step 3:** Visual check in browser at all 4 stages × 6 moods (dev-only `/ostad-gallery` route). Commit: `feat: Ostad SVG character, 4 stages × 6 moods`.

---

## Phase 3 — Today screen (the daily loop)

### Task 3.1: Check-in flow

**Files:** Create `src/features/today/TodayScreen.tsx`, `src/features/today/CheckinSheet.tsx`, `src/features/today/useToday.ts` (hook wiring db + game engines).

- [ ] **Step 1:** `useToday.ts`: loads habits + today's checkins + profile from Dexie (liveQuery); exposes `checkin(habitId, { note?, count? })` which — in one Dexie transaction — writes the checkin (local_id = `crypto.randomUUID()`), computes `checkinXp`, applies perfect-day bonus if this completes the day, updates profile xp, enqueues outbox ops, and returns `{ xpEarned, tags }` for Ostad.
- [ ] **Step 2:** `TodayScreen.tsx` layout: Ostad (mood computed from state: all done → proud/celebrating; nothing by evening → disappointed; misses pending → neutral) + StatBar (level, xp progress to next level, shields as ⛨ icons) + habit cards (done = stamped with xp earned; pending = tap to open sheet) + today's due to-dos (from Task 4.1) + any money/prospect alerts inline.
- [ ] **Step 3:** `CheckinSheet.tsx`: bottom sheet; note habits → textarea with live "effort meter" (fills at 80 chars); prayer → 5 tap-dots. On save → sheet closes, Ostad speaks `pick(['checkin', slug, lazy?…])`, XP counter animates. `lazy_note` tag added when note < 25 chars.
- [ ] **Step 4:** On app open: run `applyRollover(dhakaDate())`; if a shield was consumed → Ostad speaks `shield_used`; if returning after ≥2 missed days → `comeback_after_break`; morning first-open → `morning_greeting`.
- [ ] **Step 5:** Manual verify offline: DevTools → offline → check in → reload → data persists → online → row appears in Supabase. Commit: `feat: today screen + offline check-in loop`.

---

## Phase 4 — Side modules

### Task 4.1: To-do list

**Files:** Create `src/features/tasks/TasksScreen.tsx` (+ logic inside `useToday`-style hook `useTasks.ts`).

- [ ] **Step 1:** `useTasks.ts`: add (title + optional due_date), toggle done (done → +`TASK_XP` to profile, set `done_at`; toggling back → subtract the same amount), delete. All through Dexie + outbox.
- [ ] **Step 2:** UI: "Today" section (due today/overdue) then "Later", then collapsed "Done". Single input at top, `+` adds. Tasks due today also surface on TodayScreen. Ostad reacts to completions with `task_done` (only every 3rd completion — don't cheapen him).
- [ ] **Step 3:** Commit: `feat: personal to-do list with xp`.

### Task 4.2: Money — Noree retainer + subscriptions

**Files:** Create `src/features/money/MoneyScreen.tsx`, `src/features/money/useMoney.ts`.

- [ ] **Step 1:** `useMoney.ts`: CRUD money_items (Dexie + outbox). `dueSoon(items, today)` returns items where `addDays(next_due, -remind_days_before) <= today <= next_due`. `monthlyTotal(items)` = Σ active (yearly ÷ 12), formatted ৳.
- [ ] **Step 2:** UI: header card "Your stack costs ৳X/month". Retainer section: Noree card with amount/day-of-month/message template/WhatsApp number fields (empty state prompts him to fill — spec says he fills post-launch); when due-soon → amber alert with **"Copy & open WhatsApp"** button: `navigator.clipboard.writeText(template)` then `window.open('https://wa.me/'+phone)`. Never auto-sends. Subscriptions section: name, amount, cycle, next_due; renewal alerts same pattern minus WhatsApp.
- [ ] **Step 3:** After a due item is handled, "Mark paid/renewed" advances `next_due` by one cycle. Due alerts also render on TodayScreen with Ostad `money_due` line.
- [ ] **Step 4:** Commit: `feat: money module — retainer + subscriptions + stack total`.

### Task 4.3: MIV prospects

**Files:** Create `src/features/prospects/ProspectsScreen.tsx`, `useProspects.ts`.

- [ ] **Step 1:** `useProspects.ts`: CRUD; `overdue(prospects, today)` = next_touch < today and stage not won/lost.
- [ ] **Step 2:** UI: stage-grouped list (Lead / Contacted / In Talks / Won / Lost), card = name, source, one-line note, ৳ deal value, proposal chip (none/draft/sent/won/lost), next-touch date (red when overdue). Add/edit via bottom sheet. Overdue prospects surface on TodayScreen with Ostad `prospect_overdue` line naming the prospect.
- [ ] **Step 3:** Commit: `feat: MIV prospect cards`.

---

## Phase 5 — Push notifications

### Task 5.1: Web push subscription (client)

**Files:** Create `src/features/settings/SettingsScreen.tsx`, `src/lib/push.ts`. Generate VAPID keys: `npx web-push generate-vapid-keys` → public key into `.env` as `VITE_VAPID_PUBLIC_KEY`, both keys into Supabase secrets (`supabase secrets set VAPID_PUBLIC_KEY=… VAPID_PRIVATE_KEY=…`).

- [ ] **Step 1:** `push.ts`: `enablePush()` → `Notification.requestPermission()` → `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` → upsert endpoint+keys to `push_subscriptions`.
- [ ] **Step 2:** Settings screen: toggle for notifications, display name, sign out. vite-plugin-pwa: add `src/sw.ts` custom SW (`strategies: 'injectManifest'`) with `push` + `notificationclick` handlers (open app).
- [ ] **Step 3:** Manual test: send one push via a local `node scripts/test-push.mjs` using `web-push` + the stored subscription → notification shows on Android Chrome. Commit: `feat: web push opt-in + service worker handlers`.

### Task 5.2: send-nudges Edge Function + cron

**Files:** Create `supabase/functions/send-nudges/index.ts`, `supabase/migrations/0002_cron.sql`. Deploy via MCP `deploy_edge_function`; secrets: VAPID pair + `CRON_SECRET`.

- [ ] **Step 1:** Function logic (service-role client, guarded by `Authorization: Bearer CRON_SECRET`): accepts `{ kind: 'evening' | 'daily' }`.
  - `evening` (20:30 Dhaka): for each user with a push subscription, count today's (Dhaka) checkins; if below active habit count → send push. **Notification text: inline a small `NUDGE_LINES` const in the function** (~12 lines in Ostad's voice covering `evening_silence`, `money_due`, `prospect_overdue`, picked at random). The full in-app library stays client-only; no build-time export/copy pipeline.
  - `daily` (10:00 Dhaka): money_items entering their remind window today, prospects whose next_touch just passed → one push each, library `money_due` / `prospect_overdue` lines with the item name appended.
- [ ] **Step 2:** Web push from Deno: use `jsr:@negrel/webpush` (Deno-native VAPID). Delete subscription rows on 404/410 responses.
- [ ] **Step 3:** `0002_cron.sql`: enable `pg_cron` + `pg_net`;
  `select cron.schedule('evening-nudge','30 14 * * *', $$select net.http_post('https://kimtotdhryrbgllzttdn.supabase.co/functions/v1/send-nudges', body:='{"kind":"evening"}'::jsonb, headers:='{"Authorization":"Bearer <CRON_SECRET>","Content-Type":"application/json"}'::jsonb, timeout_milliseconds:=10000)$$);`
  and `daily` at `0 4 * * *` (= 10:00 Dhaka). **pg_net gotcha** (memory `noree-email-invoice-pipeline`): function must ack fast — respond immediately, do work via `EdgeRuntime.waitUntil`.
- [ ] **Step 4:** Test: temporarily schedule a one-minute-ahead cron, receive push on phone, remove test schedule. Commit: `feat: scheduled nudges via pg_cron + edge function`.

---

## Phase 6 — The weekly AI judge

### Task 6.1: weekly-review Edge Function

**Files:** Create `supabase/functions/weekly-review/index.ts`; secret `OPENROUTER_API_KEY` (value from `.env`); cron in `0002_cron.sql`: `0 2 * * 5` (= Friday 08:00 Dhaka).

- [ ] **Step 1:** Gather per user: last 7 days (Sat–Fri) of checkins with notes, misses per habit, shields used, xp earned, streaks, plus the previous `weekly_reviews` row for comparison.
- [ ] **Step 2:** OpenRouter call (provider-agnostic: `OPENROUTER_BASE_URL` env defaulting to `https://openrouter.ai/api/v1`, model env `JUDGE_MODEL` default `anthropic/claude-haiku-4.5`). System prompt (verbatim, in code):

```
You are Ostad, a strict but fair Bengali accountability coach (a Royal Bengal tiger).
You are reviewing one week of your student's habit evidence.
Rules:
- Quote the student's own check-in notes as evidence. Never invent events.
- Be blunt about misses and lazy entries. Praise only what is earned.
- Compare against last week's review when provided: better, worse, or flat — say which and why.
- End with exactly ONE focus instruction for next week.
- 180-250 words, markdown, second person.
- Finally, on the last line output: BONUS_XP: <integer 0-50> based on honest effort quality (not just completion).
```

- [ ] **Step 3:** Parse `BONUS_XP: n` from the tail; insert `weekly_reviews` row (`review_md` without the tail line, `bonus_xp`, `stats` jsonb of the week's numbers); `update profiles set xp = xp + n`. Idempotent via `unique (user_id, week_start)` — on conflict do nothing.
- [ ] **Step 4:** Respond-fast/waitUntil pattern; CRON_SECRET guard, same as nudges.
- [ ] **Step 5:** Test by invoking manually with `{ "force_week_start": "2026-07-11" }` after seeding a few days of real check-ins; verify a review row lands and reads correctly. Commit: `feat: weekly ostad review via openrouter`.

### Task 6.2: Review screen + monthly verdict

**Files:** Create `src/features/review/ReviewScreen.tsx`, `useReviews.ts`.

- [ ] **Step 1:** `useReviews.ts`: pull weekly_reviews into Dexie on sync; expose list + latest.
- [ ] **Step 2:** UI: latest review as a letter from Ostad (his stage-correct portrait, mood from bonus_xp: ≥35 proud, ≥15 neutral, else disappointed), bonus XP stamp, history below. Stats strip per week from `stats` jsonb (per-habit completion %, sparkline of last 8 weeks — follow `dataviz` skill).
- [ ] **Step 3:** Monthly verdict = client-side rollup of the month's 4+ stored weeklies (no extra AI call): per-habit trend arrows (completion % month vs previous month), total XP, shields earned/burned, and the month's bonus-XP trajectory, rendered as "Ostad's monthly verdict" card. Pure function `monthlyVerdict(reviews, checkins)` in `src/game/verdict.ts` with unit tests (trend arrow logic: ≥+10pts up-arrow, ≤-10pts down-arrow, else flat).
- [ ] **Step 4:** `npx vitest run` → PASS. Commit: `feat: review screen + monthly verdict rollup`.

---

## Phase 7 — Ship

### Task 7.1: PWA polish + icons

- [ ] **Step 1:** Generate icon set (192/512 + maskable) from an Ostad stage-1 face render; apple-touch-icon for the future iPhone.
- [ ] **Step 2:** Lighthouse PWA pass: installable, offline navigation works (airplane-mode test: open app → check in → works).
- [ ] **Step 3:** Empty states for every screen (first-run: Ostad introduces himself and points at the first habit card).
- [ ] **Step 4:** Commit: `feat: pwa polish + icons + empty states`.

### Task 7.2: Deploy + dogfood checklist

- [ ] **Step 1:** Push repo to GitHub (`majedulhoque1/better-me`, private), import to Vercel; env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_VAPID_PUBLIC_KEY` set for Production (memory `aaap-vercel-preview-env`: set for Preview too, or accept preview-broken). Add `vercel.json` SPA rewrite.
- [ ] **Step 2:** Verify build from the real checkout, not a worktree (memory `worktree-eslint-masks-lint`).
- [ ] **Step 3:** On the Android phone: install to home screen, sign up (trigger seeds), enable push, check in for one habit, airplane-mode check-in, reconnect + verify sync, receive evening nudge.
- [ ] **Step 4:** Majedul fills in: Noree card (amount, due day, WhatsApp number, message), 5 subscriptions, first prospects.
- [ ] **Step 5:** Run `/verify` flow end-to-end; update memory `better-me-life-os.md` with live URL + status. Commit: `chore: launch`.

---

## Self-review notes (done at write time)

- **Spec coverage:** all 14 decision-log items map to tasks — habits/evidence (0.2 seed + 3.1), library-not-AI daily (2.3), weekly AI only (6.1), strict tone (2.3 + 6.1 prompt), gamification 3-layer + shields (2.1/2.2), character evolution (2.4), to-dos (4.1), Noree copy-to-WhatsApp never-auto-send (4.2), subscriptions + stack total (4.2), prospects w/ deal value + proposal status + overdue callout (4.3), PWA offline-first (0.1/1.x/7.1), auth day one (0.3), push via cron (5.x), provider-agnostic judge (6.1).
- **Known deviation from TDD-everything:** UI components (screens, Ostad SVG) are spec-driven + browser-verified rather than unit-tested; all game/sync/picker/verdict logic is TDD'd. This is deliberate — testing SVG moods in jsdom is theater.
- **Library duplication (client + edge fn):** deliberately NOT shared — the edge function inlines ~12 nudge lines of its own; the 140-line library stays client-only (Task 5.2 Step 1). Simpler than any export pipeline.
- **Type consistency:** `local_id` idempotency keys used consistently (0.2 schema ↔ 1.2 sync ↔ 3.1 checkin flow); XP constants named identically across 2.1/3.1/4.1.
