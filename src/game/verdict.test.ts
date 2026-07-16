import { describe, expect, it } from 'vitest'
import { trendFor, monthlyVerdict } from './verdict'

describe('trendFor', () => {
  it('is up at exactly +10 points', () => {
    expect(trendFor(80, 70)).toBe('up')
  })
  it('is down at exactly -10 points', () => {
    expect(trendFor(60, 70)).toBe('down')
  })
  it('is flat just inside the +/-10 band', () => {
    expect(trendFor(79, 70)).toBe('flat')
    expect(trendFor(61, 70)).toBe('flat')
  })
  it('is flat with no change', () => {
    expect(trendFor(50, 50)).toBe('flat')
  })
})

describe('monthlyVerdict', () => {
  it('attaches a trend to each habit based on its completion delta', () => {
    const result = monthlyVerdict([
      { name: 'Reading', thisMonthPct: 90, prevMonthPct: 60 },
      { name: 'Guitar', thisMonthPct: 40, prevMonthPct: 65 },
      { name: 'Prayer', thisMonthPct: 95, prevMonthPct: 92 },
    ])
    expect(result).toEqual([
      { name: 'Reading', thisMonthPct: 90, prevMonthPct: 60, trend: 'up' },
      { name: 'Guitar', thisMonthPct: 40, prevMonthPct: 65, trend: 'down' },
      { name: 'Prayer', thisMonthPct: 95, prevMonthPct: 92, trend: 'flat' },
    ])
  })
})
