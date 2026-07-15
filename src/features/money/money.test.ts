import { describe, expect, it } from 'vitest'
import { dueSoon, monthlyTotal, advanceCycle } from './money'
import type { MoneyItem } from '../../db/types'

function item(overrides: Partial<MoneyItem>): MoneyItem {
  return {
    id: 'm1',
    kind: 'subscription',
    name: 'Test',
    amount: 1000,
    currency: 'BDT',
    cycle: 'monthly',
    next_due: '2026-07-20',
    remind_days_before: 2,
    active: true,
    ...overrides,
  }
}

describe('dueSoon', () => {
  it('includes an item once today enters its reminder window', () => {
    const i = item({ next_due: '2026-07-20', remind_days_before: 2 })
    expect(dueSoon([i], '2026-07-18')).toHaveLength(1)
    expect(dueSoon([i], '2026-07-19')).toHaveLength(1)
    expect(dueSoon([i], '2026-07-20')).toHaveLength(1)
  })

  it('excludes an item before the window opens or after it lapses', () => {
    const i = item({ next_due: '2026-07-20', remind_days_before: 2 })
    expect(dueSoon([i], '2026-07-17')).toHaveLength(0)
    expect(dueSoon([i], '2026-07-21')).toHaveLength(0)
  })

  it('ignores inactive items and items with no next_due', () => {
    expect(dueSoon([item({ active: false })], '2026-07-20')).toHaveLength(0)
    expect(dueSoon([item({ next_due: undefined })], '2026-07-20')).toHaveLength(0)
  })
})

describe('monthlyTotal', () => {
  it('sums monthly amounts directly', () => {
    expect(monthlyTotal([item({ amount: 1000, cycle: 'monthly' }), item({ amount: 500, cycle: 'monthly' })])).toBe(1500)
  })

  it('divides yearly amounts by 12', () => {
    expect(monthlyTotal([item({ amount: 1200, cycle: 'yearly' })])).toBe(100)
  })

  it('skips inactive items', () => {
    expect(monthlyTotal([item({ amount: 1000, active: false })])).toBe(0)
  })
})

describe('advanceCycle', () => {
  it('adds 30 days for a monthly item', () => {
    expect(advanceCycle(item({ next_due: '2026-07-20', cycle: 'monthly' }))).toBe('2026-08-19')
  })

  it('adds 365 days for a yearly item', () => {
    expect(advanceCycle(item({ next_due: '2026-07-20', cycle: 'yearly' }))).toBe('2027-07-20')
  })
})
