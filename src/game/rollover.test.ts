import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { BetterMeDB } from '../db/local'
import { applyRollover } from './rollover'

const HABITS = ['exercise', 'guitar', 'prayer', 'reading', 'writing']

async function seedHabits(db: BetterMeDB) {
  for (let i = 0; i < HABITS.length; i++) {
    await db.habits.add({
      id: `h-${HABITS[i]}`,
      name: HABITS[i],
      slug: HABITS[i],
      evidence_type: 'note',
      target_count: null,
      active: true,
      sort: i,
    })
  }
}

async function checkinAll(db: BetterMeDB, date: string) {
  for (const slug of HABITS) {
    await db.checkins.add({ local_id: `${slug}-${date}`, habit_id: `h-${slug}`, date, base_xp: 10 })
  }
}

describe('applyRollover', () => {
  let db: BetterMeDB
  beforeEach(async () => {
    db = new BetterMeDB()
    await db.delete()
    await db.open()
    await db.profile.add({ id: 'u1', display_name: 'Majedul', xp: 0, shields: 1 })
    await seedHabits(db)
  })

  it('consumes a shield and records the shield use for a fully missed day', async () => {
    await db.profile.update('u1', { last_evaluated_date: '2026-07-14' })
    // 2026-07-15 has zero checkins for any habit.
    await applyRollover(db, '2026-07-16')
    const profile = await db.profile.get('u1')
    expect(profile?.shields).toBe(0)
    const use = await db.shield_uses.get('2026-07-15')
    expect(use).toBeDefined()
  })

  it('does nothing to shields when there are none left to spend', async () => {
    await db.profile.update('u1', { shields: 0, last_evaluated_date: '2026-07-14' })
    await applyRollover(db, '2026-07-16')
    const profile = await db.profile.get('u1')
    expect(profile?.shields).toBe(0)
    expect(await db.shield_uses.get('2026-07-15')).toBeUndefined()
  })

  it('is idempotent — a second call for the same today re-processes nothing', async () => {
    await db.profile.update('u1', { last_evaluated_date: '2026-07-14' })
    await applyRollover(db, '2026-07-16')
    const after1 = await db.profile.get('u1')
    await applyRollover(db, '2026-07-16')
    const after2 = await db.profile.get('u1')
    expect(after2?.shields).toBe(after1?.shields)
    expect(await db.shield_uses.count()).toBe(1)
  })

  it('grants +50 xp and one capped shield when a full Sat-Fri week is perfect', async () => {
    // Sat 2026-07-11 .. Fri 2026-07-17 — check in all 5 habits every day.
    const days = ['2026-07-11', '2026-07-12', '2026-07-13', '2026-07-14', '2026-07-15', '2026-07-16', '2026-07-17']
    for (const d of days) await checkinAll(db, d)
    await db.profile.update('u1', { shields: 2, last_evaluated_date: '2026-07-10' })
    await applyRollover(db, '2026-07-18') // today = the day after the week closes
    const profile = await db.profile.get('u1')
    expect(profile?.xp).toBe(50)
    expect(profile?.shields).toBe(3) // 2 + 1, capped at 3
  })
})
