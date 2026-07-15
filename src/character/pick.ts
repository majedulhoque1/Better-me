import { LIBRARY, type Reaction } from './library'

/**
 * Picks the best-matching reaction for a set of situation tags. Score is the
 * size of the tag intersection, so a line tagged ['checkin','reading'] beats
 * a generic ['checkin'] line when both match a reading check-in. Recently
 * shown ids are avoided unless every scoring match has already been shown.
 */
export function pick(tags: string[], recentIds: string[], rng: () => number = Math.random): Reaction {
  const tagSet = new Set(tags)
  const scored = LIBRARY.map((r) => ({
    r,
    score: r.tags.reduce((n, t) => n + (tagSet.has(t) ? 1 : 0), 0),
  })).filter((s) => s.score > 0)

  const topScore = Math.max(...scored.map((s) => s.score))
  const top = scored.filter((s) => s.score === topScore)

  const fresh = top.filter((s) => !recentIds.includes(s.r.id))
  const pool = fresh.length > 0 ? fresh : top

  const index = Math.floor(rng() * pool.length)
  return pool[Math.min(index, pool.length - 1)].r
}

const RECENT_KEY = 'ostad_recent'
const RECENT_LIMIT = 20

export function rememberShown(id: string): void {
  const recent = getRecent()
  const next = [id, ...recent.filter((r) => r !== id)].slice(0, RECENT_LIMIT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
}

export function getRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}
