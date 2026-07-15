import { useState } from 'react'
import type { Habit, Checkin } from '../../db/types'

export interface CheckinSheetProps {
  habit: Habit
  existing?: Checkin
  onClose: () => void
  onSave: (evidence: { note?: string; count?: number }) => void
}

export default function CheckinSheet({ habit, existing, onClose, onSave }: CheckinSheetProps) {
  const [note, setNote] = useState(existing?.note ?? '')
  const [count, setCount] = useState(existing?.count ?? 0)

  const isCount = habit.evidence_type === 'count'
  const target = habit.target_count ?? 5
  const effort = Math.min(100, Math.round((note.length / 80) * 100))

  function save() {
    onSave(isCount ? { count } : { note })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={onClose}>
      <div
        className="w-full rounded-t-3xl border-t border-night-edge bg-night-raise p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold">{habit.name}</h2>

        {isCount ? (
          <div className="flex justify-center gap-3">
            {Array.from({ length: target }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setCount(n === count ? n - 1 : n)}
                className={`h-11 w-11 rounded-full border-2 text-sm font-semibold transition ${
                  n <= count ? 'border-glow bg-glow text-night' : 'border-night-edge text-ink-dim'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you actually do? Ostad reads this."
              rows={4}
              className="w-full resize-none rounded-xl border border-night-edge bg-night px-4 py-3 text-ink outline-none focus:border-glow"
            />
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-night-edge">
              <div className="h-full rounded-full bg-glow transition-all" style={{ width: `${effort}%` }} />
            </div>
          </div>
        )}

        <button onClick={save} className="mt-5 w-full rounded-xl bg-glow px-4 py-3 font-semibold text-night">
          Save
        </button>
      </div>
    </div>
  )
}
