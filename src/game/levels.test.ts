import { describe, expect, it } from 'vitest'
import { levelFor, stageFor, xpForLevel } from './levels'

describe('levelFor', () => {
  it('follows the locked curve: level = floor(sqrt(xp/100)) + 1', () => {
    expect(levelFor(0)).toBe(1)
    expect(levelFor(99)).toBe(1)
    expect(levelFor(100)).toBe(2)
    expect(levelFor(399)).toBe(2)
    expect(levelFor(400)).toBe(3)
    expect(levelFor(899)).toBe(3)
    expect(levelFor(900)).toBe(4)
  })
})

describe('xpForLevel (inverse of levelFor, for progress bars)', () => {
  it('returns the xp threshold where a level begins', () => {
    expect(xpForLevel(1)).toBe(0)
    expect(xpForLevel(2)).toBe(100)
    expect(xpForLevel(3)).toBe(400)
  })
})

describe('stageFor', () => {
  it('maps level to evolution stage 1-4 per the locked bands', () => {
    expect(stageFor(1)).toBe(1)
    expect(stageFor(4)).toBe(1)
    expect(stageFor(5)).toBe(2)
    expect(stageFor(9)).toBe(2)
    expect(stageFor(10)).toBe(3)
    expect(stageFor(19)).toBe(3)
    expect(stageFor(20)).toBe(4)
    expect(stageFor(99)).toBe(4)
  })
})
