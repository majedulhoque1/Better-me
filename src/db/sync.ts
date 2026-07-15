import type { SupabaseClient } from '@supabase/supabase-js'
import type { BetterMeDB } from './local'
import type { OutboxOp } from './types'

/** Which columns identify "the same row" for each table's upsert conflict target. */
const CONFLICT_KEY: Record<OutboxOp['table'], string> = {
  checkins: 'user_id,habit_id,date',
  tasks: 'user_id,local_id',
  money_items: 'id',
  prospects: 'id',
  profiles: 'id',
}

/** Tables pulled wholesale from the server and mirrored into Dexie. */
const PULL_TABLES = ['habits', 'checkins', 'tasks', 'money_items', 'prospects', 'weekly_reviews', 'profiles'] as const

const DEXIE_TABLE: Record<(typeof PULL_TABLES)[number], keyof BetterMeDB> = {
  habits: 'habits',
  checkins: 'checkins',
  tasks: 'tasks',
  money_items: 'money',
  prospects: 'prospects',
  weekly_reviews: 'reviews',
  profiles: 'profile',
}

/** Local-only primary key each Dexie table is keyed by (Dexie put() needs it present). */
const LOCAL_KEY: Record<(typeof PULL_TABLES)[number], 'id' | 'local_id'> = {
  habits: 'id',
  checkins: 'local_id',
  tasks: 'local_id',
  money_items: 'id',
  prospects: 'id',
  weekly_reviews: 'id',
  profiles: 'id',
}

export async function enqueue(
  db: BetterMeDB,
  table: OutboxOp['table'],
  op: OutboxOp['op'],
  payload: Record<string, unknown>,
): Promise<void> {
  await db.outbox.add({ table, op, payload })
}

/**
 * Push queued writes to Supabase in enqueue order, stopping at the first
 * failure so later ops don't skip ahead of an op still waiting to retry.
 * Returns true only if every queued op was flushed.
 */
export async function flushOutbox(db: BetterMeDB, client: SupabaseClient): Promise<boolean> {
  const ops = await db.outbox.orderBy('seq').toArray()
  for (const o of ops) {
    const { error } =
      o.op === 'delete'
        ? await client.from(o.table).delete().match(o.payload)
        : await client.from(o.table).upsert(o.payload, { onConflict: CONFLICT_KEY[o.table] })
    if (error) return false
    await db.outbox.delete(o.seq!)
  }
  return true
}

/** Pull the user's rows from every server table into Dexie (server wins for rows not in the outbox). */
export async function pullAll(db: BetterMeDB, client: SupabaseClient, userId: string): Promise<void> {
  for (const table of PULL_TABLES) {
    const idColumn = table === 'profiles' ? 'id' : 'user_id'
    const { data, error } = await client.from(table).select('*').eq(idColumn, userId)
    if (error || !data) continue
    const dexieTable = db[DEXIE_TABLE[table]] as unknown as { bulkPut: (rows: unknown[]) => Promise<unknown> }
    if (data.length) await dexieTable.bulkPut(data)
  }
  void LOCAL_KEY // referenced for documentation of key alignment; Dexie infers keys from stored objects
}

/** Kick a flush+pull whenever we come online and on a slow background interval. */
export function startSyncLoop(db: BetterMeDB, client: SupabaseClient, userId: string): () => void {
  const kick = () => {
    if (!navigator.onLine) return
    flushOutbox(db, client).then((ok) => {
      if (ok) void pullAll(db, client, userId)
    })
  }
  window.addEventListener('online', kick)
  const interval = setInterval(kick, 60_000)
  kick()
  return () => {
    window.removeEventListener('online', kick)
    clearInterval(interval)
  }
}
