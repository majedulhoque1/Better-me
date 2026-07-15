import Ostad from './Ostad'
import type { Mood } from './library'

const STAGES = [1, 2, 3, 4] as const
const MOODS: Mood[] = ['proud', 'neutral', 'disappointed', 'angry', 'celebrating', 'asleep']

/** Dev-only visual check for all stage x mood combinations. Not linked from the app nav. */
export default function OstadGallery() {
  return (
    <div className="grid grid-cols-4 gap-4 p-4">
      {STAGES.map((stage) =>
        MOODS.map((mood) => (
          <div key={`${stage}-${mood}`} className="flex flex-col items-center gap-1 rounded-xl border border-night-edge p-2">
            <Ostad stage={stage} mood={mood} size={100} />
            <span className="text-xs text-ink-dim">
              s{stage} · {mood}
            </span>
          </div>
        )),
      )}
    </div>
  )
}
