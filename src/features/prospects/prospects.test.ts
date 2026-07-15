import { describe, expect, it } from 'vitest'
import { overdue } from './prospects'
import type { Prospect } from '../../db/types'

function prospect(overrides: Partial<Prospect>): Prospect {
  return {
    id: 'p1',
    name: 'Test Lead',
    stage: 'contacted',
    proposal_status: 'none',
    next_touch: '2026-07-15',
    ...overrides,
  }
}

describe('overdue', () => {
  it('flags an open-stage prospect whose next_touch has passed', () => {
    expect(overdue([prospect({ next_touch: '2026-07-15' })], '2026-07-16')).toHaveLength(1)
  })

  it('does not flag a prospect whose next_touch is today or in the future', () => {
    expect(overdue([prospect({ next_touch: '2026-07-16' })], '2026-07-16')).toHaveLength(0)
    expect(overdue([prospect({ next_touch: '2026-07-17' })], '2026-07-16')).toHaveLength(0)
  })

  it('ignores won/lost prospects even if next_touch has passed', () => {
    expect(overdue([prospect({ stage: 'won', next_touch: '2026-07-01' })], '2026-07-16')).toHaveLength(0)
    expect(overdue([prospect({ stage: 'lost', next_touch: '2026-07-01' })], '2026-07-16')).toHaveLength(0)
  })

  it('ignores prospects with no next_touch set', () => {
    expect(overdue([prospect({ next_touch: undefined })], '2026-07-16')).toHaveLength(0)
  })
})
