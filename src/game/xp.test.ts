import { describe, expect, it } from 'vitest'
import { checkinXp, perfectDayBonus, TASK_XP, PERFECT_WEEK_XP } from './xp'

describe('checkinXp', () => {
  it('note habit: 10 base, +5 when note is >= 80 chars', () => {
    expect(checkinXp({ evidence_type: 'note' }, { note: 'short' })).toBe(10)
    expect(checkinXp({ evidence_type: 'note' }, { note: 'x'.repeat(79) })).toBe(10)
    expect(checkinXp({ evidence_type: 'note' }, { note: 'x'.repeat(80) })).toBe(15)
  })

  it('note habit with no note at all still earns base xp', () => {
    expect(checkinXp({ evidence_type: 'note' }, {})).toBe(10)
  })

  it('count habit (prayer): 2 xp per count, capped at target_count', () => {
    expect(checkinXp({ evidence_type: 'count', target_count: 5 }, { count: 3 })).toBe(6)
    expect(checkinXp({ evidence_type: 'count', target_count: 5 }, { count: 7 })).toBe(10)
    expect(checkinXp({ evidence_type: 'count', target_count: 5 }, { count: 0 })).toBe(0)
  })

  it('count habit falls back to a cap of 5 when target_count is missing', () => {
    expect(checkinXp({ evidence_type: 'count' }, { count: 9 })).toBe(10)
  })
})

describe('perfectDayBonus', () => {
  it('awards 10 when every active habit was checked in', () => {
    expect(perfectDayBonus(5, 5)).toBe(10)
  })
  it('awards 0 when any habit was missed', () => {
    expect(perfectDayBonus(4, 5)).toBe(0)
  })
  it('awards 0 when there are no active habits', () => {
    expect(perfectDayBonus(0, 0)).toBe(0)
  })
})

describe('constants', () => {
  it('task and perfect-week xp match the locked game rules', () => {
    expect(TASK_XP).toBe(5)
    expect(PERFECT_WEEK_XP).toBe(50)
  })
})
