export type Trend = 'up' | 'down' | 'flat'

export interface HabitCompletion {
  name: string
  thisMonthPct: number
  prevMonthPct: number
}

export interface HabitVerdict extends HabitCompletion {
  trend: Trend
}

/** +10pts or more is a real improvement, -10pts or worse is a real decline, otherwise flat. */
export function trendFor(thisMonthPct: number, prevMonthPct: number): Trend {
  const delta = thisMonthPct - prevMonthPct
  if (delta >= 10) return 'up'
  if (delta <= -10) return 'down'
  return 'flat'
}

export function monthlyVerdict(habits: HabitCompletion[]): HabitVerdict[] {
  return habits.map((h) => ({ ...h, trend: trendFor(h.thisMonthPct, h.prevMonthPct) }))
}
