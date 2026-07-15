import { xpForLevel } from '../game/levels'

export interface StatBarProps {
  level: number
  xp: number
  shields: number
}

export default function StatBar({ level, xp, shields }: StatBarProps) {
  const floor = xpForLevel(level)
  const ceil = xpForLevel(level + 1)
  const progress = ceil > floor ? Math.round(((xp - floor) / (ceil - floor)) * 100) : 0

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-night-edge bg-night-raise px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-glow text-sm font-bold text-night">
        {level}
      </div>
      <div className="flex-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-night-edge">
          <div className="h-full rounded-full bg-glow transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1 text-xs text-ink-dim">{xp} xp</p>
      </div>
      <div className="flex gap-0.5 text-lg" aria-label={`${shields} shields`}>
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i} className={i < shields ? 'opacity-100' : 'opacity-20'}>
            ⛨
          </span>
        ))}
      </div>
    </div>
  )
}
