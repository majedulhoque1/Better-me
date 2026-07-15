import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/local'
import { enqueue, startSyncLoop } from '../../db/sync'
import { supabase } from '../../lib/supabase'
import { dhakaDate, addDays } from '../../lib/dates'
import { checkinXp, perfectDayBonus } from '../../game/xp'
import { levelFor, stageFor } from '../../game/levels'
import { applyRollover } from '../../game/rollover'
import { pick, rememberShown, getRecent } from '../../character/pick'
import type { Mood } from '../../character/library'
import type { Habit } from '../../db/types'

export interface CheckinEvidence {
  note?: string
  count?: number
}

function moodForToday(doneCount: number, activeCount: number, hour: number): Mood {
  if (activeCount > 0 && doneCount >= activeCount) return 'celebrating'
  if (doneCount === 0 && hour >= 20) return 'disappointed'
  if (doneCount < activeCount && hour >= 20) return 'disappointed'
  if (hour < 6) return 'asleep'
  return 'neutral'
}

export function useToday() {
  const today = dhakaDate()
  const [ostadLine, setOstadLine] = useState<string | null>(null)
  const [ostadOverrideMood, setOstadOverrideMood] = useState<Mood | null>(null)

  const habits = useLiveQuery(() => db.habits.filter((h) => h.active).sortBy('sort'), []) ?? []
  const todaysCheckins = useLiveQuery(() => db.checkins.where('date').equals(today).toArray(), [today]) ?? []
  const profile = useLiveQuery(() => db.profile.toCollection().first(), [])

  const doneHabitIds = useMemo(() => new Set(todaysCheckins.map((c) => c.habit_id)), [todaysCheckins])

  // One-time-per-session rollover + opening greeting.
  useEffect(() => {
    let cancelled = false
    async function run() {
      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user.id
      if (!userId) return

      const { shieldConsumedDates, perfectWeeksGranted } = await applyRollover(db, today)

      const stopSync = startSyncLoop(db, supabase, userId)

      if (cancelled) {
        stopSync()
        return
      }

      let tags: string[]
      if (shieldConsumedDates.length > 0) tags = ['shield_used']
      else if (perfectWeeksGranted > 0) tags = ['perfect_week']
      else {
        const y1 = addDays(today, -1)
        const y2 = addDays(today, -2)
        const recentActivity = await db.checkins.where('date').anyOf([y1, y2]).count()
        tags = recentActivity === 0 ? ['comeback_after_break'] : ['morning_greeting']
      }
      const reaction = pick(tags, getRecent())
      rememberShown(reaction.id)
      if (!cancelled) setOstadLine(reaction.text)

      return () => stopSync()
    }
    const cleanup = run()
    return () => {
      cancelled = true
      void cleanup.then((fn) => fn?.())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkin(habit: Habit, evidence: CheckinEvidence): Promise<{ xpEarned: number; tags: string[] }> {
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user.id
    if (!userId) throw new Error('not signed in')

    const beforeToday = await db.checkins.where('date').equals(today).toArray()
    const beforeHabitIds = new Set(beforeToday.map((c) => c.habit_id))
    const prevDistinct = beforeHabitIds.size
    const existing = await db.checkins.where('[habit_id+date]').equals([habit.id, today]).first()
    const prevXpForThisHabit = existing ? existing.base_xp : 0

    const newBaseXp = checkinXp(habit, evidence)
    const localId = existing?.local_id ?? crypto.randomUUID()
    const record = {
      local_id: localId,
      habit_id: habit.id,
      date: today,
      note: evidence.note ?? null,
      count: evidence.count ?? null,
      base_xp: newBaseXp,
      bonus_xp: 0,
    }
    await db.checkins.put(record)

    const newDistinct = beforeHabitIds.has(habit.id) ? prevDistinct : prevDistinct + 1
    const activeCount = habits.length
    const perfectDayDelta = perfectDayBonus(newDistinct, activeCount) - perfectDayBonus(prevDistinct, activeCount)
    const xpDelta = newBaseXp - prevXpForThisHabit + perfectDayDelta

    const current = (await db.profile.toCollection().first()) ?? profile
    if (current) {
      const nextXp = current.xp + xpDelta
      await db.profile.update(current.id, { xp: nextXp })
      await enqueue(db, 'profiles', 'upsert', { id: current.id, xp: nextXp, shields: current.shields })
    }

    await enqueue(db, 'checkins', 'upsert', { user_id: userId, ...record })

    const tags = ['checkin', habit.slug]
    if (habit.evidence_type === 'note' && (evidence.note ?? '').length < 25) tags.push('lazy_note')

    const reaction = pick(tags, getRecent())
    rememberShown(reaction.id)
    setOstadLine(reaction.text)
    setOstadOverrideMood(reaction.mood)

    return { xpEarned: xpDelta, tags }
  }

  const level = profile ? levelFor(profile.xp) : 1
  const stage = stageFor(level)
  const mood = ostadOverrideMood ?? moodForToday(doneHabitIds.size, habits.length, new Date().getHours())

  return {
    habits,
    todaysCheckins,
    doneHabitIds,
    profile,
    level,
    stage,
    mood,
    ostadLine,
    checkin,
  }
}
