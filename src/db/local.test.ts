import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { BetterMeDB } from './local'

describe('BetterMeDB', () => {
  let db: BetterMeDB
  beforeEach(async () => {
    db = new BetterMeDB()
    await db.delete()
    await db.open()
  })

  it('stores and retrieves a checkin by [habit_id+date]', async () => {
    await db.checkins.add({
      local_id: 'l1',
      habit_id: 'h1',
      date: '2026-07-16',
      note: 'read 20 pages of Deep Work',
      base_xp: 10,
    })
    const hit = await db.checkins.where('[habit_id+date]').equals(['h1', '2026-07-16']).first()
    expect(hit?.local_id).toBe('l1')
    const miss = await db.checkins.where('[habit_id+date]').equals(['h1', '2026-07-15']).first()
    expect(miss).toBeUndefined()
  })

  it('outbox preserves insertion order via auto-increment seq', async () => {
    await db.outbox.add({ table: 'checkins', op: 'upsert', payload: { a: 1 } })
    await db.outbox.add({ table: 'tasks', op: 'upsert', payload: { b: 2 } })
    const ops = await db.outbox.orderBy('seq').toArray()
    expect(ops.map((o) => o.table)).toEqual(['checkins', 'tasks'])
  })
})
