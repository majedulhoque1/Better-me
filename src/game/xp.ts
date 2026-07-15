export const TASK_XP = 5
export const PERFECT_WEEK_XP = 50

interface HabitShape {
  evidence_type: string
  target_count?: number | null
}
interface CheckinShape {
  note?: string | null
  count?: number | null
}

export function checkinXp(h: HabitShape, c: CheckinShape): number {
  if (h.evidence_type === 'count') {
    const cap = h.target_count ?? 5
    return Math.min(c.count ?? 0, cap) * 2
  }
  return 10 + ((c.note ?? '').length >= 80 ? 5 : 0)
}

export function perfectDayBonus(done: number, active: number): number {
  return active > 0 && done >= active ? 10 : 0
}
