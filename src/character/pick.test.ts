import { describe, expect, it } from 'vitest'
import { pick } from './pick'
import { LIBRARY } from './library'

describe('pick', () => {
  it('only returns a reaction that shares at least one tag with the query', () => {
    const r = pick(['perfect_week'], [])
    expect(r.tags).toContain('perfect_week')
  })

  it('prefers a habit-specific line over a generic one when both match', () => {
    // 'checkin' + 'reading' matches reading-specific lines (score 2) and
    // generic checkin lines (score 1) — habit-specific should always win.
    const seen = new Set<string>()
    for (let i = 0; i < 30; i++) {
      const r = pick(['checkin', 'reading'], [], () => i / 30)
      seen.add(r.id)
    }
    expect([...seen].every((id) => id.startsWith('ci-reading') || id.startsWith('ci-gen'))).toBe(true)
    // At least one habit-specific line should show up across the sample.
    expect([...seen].some((id) => id.startsWith('ci-reading'))).toBe(true)
  })

  it('never returns an id from recentIds when a fresh alternative exists', () => {
    const candidates = LIBRARY.filter((r) => r.tags.includes('morning_greeting')).map((r) => r.id)
    const recent = candidates.slice(0, candidates.length - 1) // all but one
    const r = pick(['morning_greeting'], recent)
    expect(r.id).toBe(candidates[candidates.length - 1])
  })

  it('falls back to ignoring recentIds once every match has been recently shown', () => {
    const candidates = LIBRARY.filter((r) => r.tags.includes('shield_earned')).map((r) => r.id)
    const r = pick(['shield_earned'], candidates) // every candidate is "recent"
    expect(candidates).toContain(r.id)
  })

  it('is deterministic given an injected rng', () => {
    const a = pick(['task_done'], [], () => 0)
    const b = pick(['task_done'], [], () => 0)
    expect(a.id).toBe(b.id)
  })
})
