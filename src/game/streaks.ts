import { addDays } from '../lib/dates'

/**
 * Counts the unbroken run of days ending at `today` for one habit. A date in
 * `shieldedDates` (a whole-day shield use) counts as kept even with no
 * checkin recorded, since a shield preserves ALL habit streaks for that day.
 */
export function computeStreak(dates: string[], today: string, shieldedDates: Set<string>): number {
  const set = new Set(dates)
  let count = 0
  let cursor = today
  while (set.has(cursor) || shieldedDates.has(cursor)) {
    count++
    cursor = addDays(cursor, -1)
  }
  return count
}

/** Whether a missed day should consume a shield, and what's left after. */
export function evaluateDay(
  allActiveHabitsCheckedIn: boolean,
  shields: number,
): { useShield: boolean; shieldsLeft: number } {
  if (allActiveHabitsCheckedIn || shields <= 0) {
    return { useShield: false, shieldsLeft: shields }
  }
  return { useShield: true, shieldsLeft: shields - 1 }
}

/**
 * True when every day of the Sat-Fri week starting at `weekStartIso` has
 * every active habit checked in. `checkinsByDate` maps date -> distinct
 * habits checked in that day.
 */
export function isPerfectWeek(
  checkinsByDate: Record<string, number>,
  activeHabitCount: number,
  weekStartIso: string,
): boolean {
  if (activeHabitCount <= 0) return false
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStartIso, i)
    if ((checkinsByDate[day] ?? 0) < activeHabitCount) return false
  }
  return true
}
