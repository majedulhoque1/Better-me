import { useState } from 'react'
import Ostad from '../../character/Ostad'
import StatBar from '../../components/StatBar'
import CheckinSheet from './CheckinSheet'
import { useToday } from './useToday'
import { useTasks } from '../tasks/useTasks'
import type { Habit } from '../../db/types'

export default function TodayScreen() {
  const { habits, todaysCheckins, doneHabitIds, profile, level, stage, mood, ostadLine, checkin } = useToday()
  const { dueToday, overdue, toggleDone } = useTasks()
  const [openHabit, setOpenHabit] = useState<Habit | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  async function handleSave(evidence: { note?: string; count?: number }) {
    if (!openHabit) return
    const { xpEarned } = await checkin(openHabit, evidence)
    setFlash(`+${xpEarned} xp`)
    setTimeout(() => setFlash(null), 1800)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center py-2">
        <Ostad stage={stage} mood={mood} speaking={ostadLine ?? undefined} size={140} />
      </div>

      <StatBar level={level} xp={profile?.xp ?? 0} shields={profile?.shields ?? 0} />

      {flash && (
        <div className="pointer-events-none fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-full bg-glow px-4 py-1.5 text-sm font-bold text-night shadow-lg">
          {flash}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {habits.map((habit) => {
          const entry = todaysCheckins.find((c) => c.habit_id === habit.id)
          const done = doneHabitIds.has(habit.id)
          return (
            <button
              key={habit.id}
              onClick={() => setOpenHabit(habit)}
              className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                done ? 'border-glow/40 bg-night-raise' : 'border-night-edge bg-night-raise/60'
              }`}
            >
              <div>
                <p className="font-semibold">{habit.name}</p>
                {entry && (
                  <p className="mt-0.5 truncate text-xs text-ink-dim">
                    {habit.evidence_type === 'count' ? `${entry.count ?? 0}/${habit.target_count ?? 5}` : entry.note}
                  </p>
                )}
              </div>
              <span className={`text-xl ${done ? 'opacity-100' : 'opacity-30'}`}>{done ? '✔' : '○'}</span>
            </button>
          )
        })}
      </div>

      {(overdue.length > 0 || dueToday.length > 0) && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-ink-dim">Due today</h2>
          {overdue.map((t) => (
            <button
              key={t.local_id}
              onClick={() => toggleDone(t)}
              className="flex items-center gap-3 rounded-xl border border-danger/40 bg-night-raise px-4 py-3 text-left"
            >
              <span className="h-5 w-5 shrink-0 rounded-full border-2 border-danger" />
              <span>{t.title}</span>
            </button>
          ))}
          {dueToday.map((t) => (
            <button
              key={t.local_id}
              onClick={() => toggleDone(t)}
              className="flex items-center gap-3 rounded-xl border border-night-edge bg-night-raise px-4 py-3 text-left"
            >
              <span className="h-5 w-5 shrink-0 rounded-full border-2 border-night-edge" />
              <span>{t.title}</span>
            </button>
          ))}
        </div>
      )}

      {openHabit && (
        <CheckinSheet
          habit={openHabit}
          existing={todaysCheckins.find((c) => c.habit_id === openHabit.id)}
          onClose={() => setOpenHabit(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
