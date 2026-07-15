import { addDays, weekStart } from '../lib/dates'
import type { BetterMeDB } from '../db/local'
import { evaluateDay, isPerfectWeek } from './streaks'
import { PERFECT_WEEK_XP } from './xp'

const MAX_SHIELDS = 3

/**
 * Evaluates every fully-completed past day since the profile's
 * last_evaluated_date, consuming shields for missed days and granting a
 * shield + bonus xp for a perfect Sat-Fri week. Safe to call every app open —
 * re-running for the same `todayIso` after it has already caught up is a
 * no-op.
 */
export async function applyRollover(
  db: BetterMeDB,
  todayIso: string,
): Promise<{ shieldConsumedDates: string[]; perfectWeeksGranted: number }> {
  const profile = await db.profile.toCollection().first()
  if (!profile) return { shieldConsumedDates: [], perfectWeeksGranted: 0 }

  const activeHabitCount = await db.habits.filter((h) => h.active).count()
  const shieldConsumedDates: string[] = []
  let perfectWeeksGranted = 0
  let shields = profile.shields
  let xp = profile.xp

  let cursor = addDays(profile.last_evaluated_date ?? addDays(todayIso, -1), 1)
  while (cursor < todayIso) {
    const dayCheckins = await db.checkins.where('date').equals(cursor).toArray()
    const distinctHabits = new Set(dayCheckins.map((c) => c.habit_id)).size
    const allChecked = activeHabitCount > 0 && distinctHabits >= activeHabitCount

    const { useShield, shieldsLeft } = evaluateDay(allChecked, shields)
    if (useShield) {
      await db.shield_uses.put({ date: cursor })
      shieldConsumedDates.push(cursor)
    }
    shields = shieldsLeft

    // A Sat-Fri week closes on its Friday — the 7th day from its Saturday start.
    if (weekStart(cursor) === addDays(cursor, -6)) {
      const start = weekStart(cursor)
      const checkinsByDate: Record<string, number> = {}
      for (let i = 0; i < 7; i++) {
        const d = addDays(start, i)
        const rows = await db.checkins.where('date').equals(d).toArray()
        checkinsByDate[d] = new Set(rows.map((c) => c.habit_id)).size
      }
      if (isPerfectWeek(checkinsByDate, activeHabitCount, start)) {
        xp += PERFECT_WEEK_XP
        shields = Math.min(MAX_SHIELDS, shields + 1)
        perfectWeeksGranted++
      }
    }

    cursor = addDays(cursor, 1)
  }

  await db.profile.update(profile.id, { shields, xp, last_evaluated_date: addDays(todayIso, -1) })
  return { shieldConsumedDates, perfectWeeksGranted }
}
