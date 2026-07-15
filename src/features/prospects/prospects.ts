import type { Prospect } from '../../db/types'

const CLOSED_STAGES: Prospect['stage'][] = ['won', 'lost']

/** Prospects whose next_touch date has passed and are still an open stage. */
export function overdue(prospects: Prospect[], today: string): Prospect[] {
  return prospects.filter((p) => !CLOSED_STAGES.includes(p.stage) && !!p.next_touch && p.next_touch < today)
}
