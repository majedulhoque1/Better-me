import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/local'
import { dhakaDate } from '../../lib/dates'
import { monthlyVerdict, type HabitVerdict } from '../../game/verdict'

function monthBounds(yearMonth: string): { start: string; end: string } {
  const [y, m] = yearMonth.split('-').map(Number)
  const start = `${yearMonth}-01`
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const end = `${yearMonth}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

function prevMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 2, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function useReviews() {
  const reviews = useLiveQuery(() => db.reviews.orderBy('week_start').reverse().toArray(), []) ?? []
  const habits = useLiveQuery(() => db.habits.filter((h) => h.active).sortBy('sort'), []) ?? []
  const checkins = useLiveQuery(() => db.checkins.toArray(), []) ?? []

  const latest = reviews[0]

  const thisYearMonth = dhakaDate().slice(0, 7)
  const lastYearMonth = prevMonth(thisYearMonth)
  const { start: thisStart, end: thisEnd } = monthBounds(thisYearMonth)
  const { start: prevStart, end: prevEnd } = monthBounds(lastYearMonth)

  const completionPct = (habitId: string, start: string, end: string) => {
    const inRange = checkins.filter((c) => c.habit_id === habitId && c.date >= start && c.date <= end)
    const days = new Set(inRange.map((c) => c.date)).size
    const totalDays = new Date(end + 'T00:00:00Z').getUTCDate()
    return totalDays > 0 ? Math.round((days / totalDays) * 100) : 0
  }

  const verdict: HabitVerdict[] = monthlyVerdict(
    habits.map((h) => ({
      name: h.name,
      thisMonthPct: completionPct(h.id, thisStart, thisEnd),
      prevMonthPct: completionPct(h.id, prevStart, prevEnd),
    })),
  )

  const totalXpThisMonth = checkins
    .filter((c) => c.date >= thisStart && c.date <= thisEnd)
    .reduce((sum, c) => sum + c.base_xp, 0)

  const reviewsThisMonth = reviews.filter((r) => r.week_start >= thisStart && r.week_start <= thisEnd)
  const avgBonusXp = reviewsThisMonth.length
    ? Math.round(reviewsThisMonth.reduce((s, r) => s + r.bonus_xp, 0) / reviewsThisMonth.length)
    : 0

  return { reviews, latest, verdict, totalXpThisMonth, avgBonusXp, hasEnoughDataForVerdict: reviewsThisMonth.length >= 1 }
}
