export function levelFor(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

/** XP threshold at which `level` begins — inverse of levelFor, for progress bars. */
export function xpForLevel(level: number): number {
  return (level - 1) ** 2 * 100
}

export function stageFor(level: number): 1 | 2 | 3 | 4 {
  if (level >= 20) return 4
  if (level >= 10) return 3
  if (level >= 5) return 2
  return 1
}
