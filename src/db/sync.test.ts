import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { BetterMeDB } from './local'
import { enqueue, flushOutbox, pullAll } from './sync'

/** Minimal fake matching the subset of SupabaseClient our sync engine calls. */
function fakeClient(overrides: {
  upsert?: (table: string, payload: unknown) => { error: unknown }
  del?: (table: string, match: unknown) => { error: unknown }
  select?: (table: string) => { data: unknown[]; error: unknown }
} = {}) {
  const calls: { table: string; op: string; arg: unknown }[] = []
  const client = {
    from(table: string) {
      return {
        upsert(payload: unknown) {
          calls.push({ table, op: 'upsert', arg: payload })
          const r = overrides.upsert?.(table, payload) ?? { error: null }
          return Promise.resolve(r)
        },
        delete() {
          return {
            match(m: unknown) {
              calls.push({ table, op: 'delete', arg: m })
              const r = overrides.del?.(table, m) ?? { error: null }
              return Promise.resolve(r)
            },
          }
        },
        select() {
          return {
            eq() {
              const r = overrides.select?.(table) ?? { data: [], error: null }
              return Promise.resolve(r)
            },
          }
        },
      }
    },
  }
  return { client: client as never, calls }
}

describe('sync engine', () => {
  let db: BetterMeDB
  beforeEach(async () => {
    db = new BetterMeDB()
    await db.delete()
    await db.open()
  })

  it('enqueue writes an outbox row', async () => {
    await enqueue(db, 'checkins', 'upsert', { local_id: 'l1', date: '2026-07-16' })
    const rows = await db.outbox.toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].table).toBe('checkins')
  })

  it('flushOutbox upserts each queued op and clears it on success', async () => {
    await enqueue(db, 'checkins', 'upsert', { local_id: 'l1' })
    const { client, calls } = fakeClient()
    const ok = await flushOutbox(db, client)
    expect(ok).toBe(true)
    expect(calls).toEqual([{ table: 'checkins', op: 'upsert', arg: { local_id: 'l1' } }])
    expect(await db.outbox.count()).toBe(0)
  })

  it('stops and keeps the row queued on network/server failure', async () => {
    await enqueue(db, 'tasks', 'upsert', { local_id: 't1' })
    const { client } = fakeClient({ upsert: () => ({ error: { message: 'network down' } }) })
    const ok = await flushOutbox(db, client)
    expect(ok).toBe(false)
    expect(await db.outbox.count()).toBe(1)
  })

  it('processes ops in enqueue order and stops at the first failure', async () => {
    await enqueue(db, 'checkins', 'upsert', { local_id: 'a' })
    await enqueue(db, 'checkins', 'upsert', { local_id: 'b' })
    let n = 0
    const { client } = fakeClient({
      upsert: () => {
        n += 1
        return n === 1 ? { error: null } : { error: { message: 'fail on second' } }
      },
    })
    const ok = await flushOutbox(db, client)
    expect(ok).toBe(false)
    const remaining = await db.outbox.toArray()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].payload).toEqual({ local_id: 'b' })
  })

  it('pullAll writes server rows into the matching dexie table', async () => {
    const { client } = fakeClient({
      select: (table) =>
        table === 'habits'
          ? { data: [{ id: 'h1', slug: 'reading', name: 'Reading', evidence_type: 'note', target_count: null, active: true, sort: 4 }], error: null }
          : { data: [], error: null },
    })
    await pullAll(db, client, 'user-1')
    const habit = await db.habits.get('h1')
    expect(habit?.slug).toBe('reading')
  })
})
