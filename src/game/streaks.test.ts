import { describe, expect, it } from 'vitest'
import { computeStreak, evaluateDay, isPerfectWeek } from './streaks'
import { addDays } from '../lib/dates'

describe('computeStreak', () => {
  it('counts an unbroken run back from today', () => {
    expect(computeStreak(['2026-07-14', '2026-07-15', '2026-07-16'], '2026-07-16', new Set())).toBe(3)
  })

  it('a gap without a shield breaks the streak', () => {
    expect(computeStreak(['2026-07-13', '2026-07-14', '2026-07-16'], '2026-07-16', new Set())).toBe(1)
  })

  it('a gap covered by a shield keeps the streak alive', () => {
    expect(
      computeStreak(['2026-07-13', '2026-07-14', '2026-07-16'], '2026-07-16', new Set(['2026-07-15'])),
    ).toBe(4)
  })

  it('returns 0 when today itself has no checkin and no shield', () => {
    expect(computeStreak(['2026-07-15'], '2026-07-16', new Set())).toBe(0)
  })
})

describe('evaluateDay', () => {
  it('needs no shield when every active habit was checked in', () => {
    expect(evaluateDay(true, 2)).toEqual({ useShield: false, shieldsLeft: 2 })
  })

  it('consumes one shield when a habit was missed and a shield is available', () => {
    expect(evaluateDay(false, 2)).toEqual({ useShield: true, shieldsLeft: 1 })
  })

  it('cannot consume a shield it does not have', () => {
    expect(evaluateDay(false, 0)).toEqual({ useShield: false, shieldsLeft: 0 })
  })
})

describe('isPerfectWeek', () => {
  it('is true when all 7 Sat-Fri days have every active habit checked in', () => {
    const map: Record<string, number> = {}
    for (let i = 0; i < 7; i++) map[addDays('2026-07-11', i)] = 5
    expect(isPerfectWeek(map, 5, '2026-07-11')).toBe(true)
  })

  it('is false when any single day falls short', () => {
    const map: Record<string, number> = {}
    for (let i = 0; i < 7; i++) map[addDays('2026-07-11', i)] = 5
    map['2026-07-14'] = 4
    expect(isPerfectWeek(map, 5, '2026-07-11')).toBe(false)
  })

  it('is false when there are zero active habits', () => {
    expect(isPerfectWeek({}, 0, '2026-07-11')).toBe(false)
  })
})
