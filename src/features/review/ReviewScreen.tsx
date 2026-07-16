import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/local'
import Ostad from '../../character/Ostad'
import { levelFor, stageFor } from '../../game/levels'
import { useReviews } from './useReviews'
import type { Mood } from '../../character/library'

function moodForBonus(bonusXp: number): Mood {
  if (bonusXp >= 35) return 'proud'
  if (bonusXp >= 15) return 'neutral'
  return 'disappointed'
}

const TREND_ICON = { up: '↑', down: '↓', flat: '→' } as const
const TREND_COLOR = { up: 'text-success', down: 'text-danger', flat: 'text-ink-dim' } as const

export default function ReviewScreen() {
  const profile = useLiveQuery(() => db.profile.toCollection().first(), [])
  const { reviews, latest, verdict, totalXpThisMonth, avgBonusXp, hasEnoughDataForVerdict } = useReviews()
  const level = profile ? levelFor(profile.xp) : 1
  const stage = stageFor(level)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Ostad</h1>
        <Link to="/settings" className="text-sm text-ink-dim underline">
          Settings
        </Link>
      </div>

      {latest ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-night-edge bg-night-raise p-5">
          <Ostad stage={stage} mood={moodForBonus(latest.bonus_xp)} size={100} />
          <p className="text-xs text-ink-dim">week of {latest.week_start}</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{latest.review_md}</p>
          <span className="rounded-full bg-glow px-3 py-1 text-xs font-bold text-night">+{latest.bonus_xp} bonus xp</span>
        </div>
      ) : (
        <div className="rounded-2xl border border-night-edge bg-night-raise p-5 text-center text-sm text-ink-dim">
          <Ostad stage={stage} mood="asleep" size={100} />
          <p className="mt-3">No review yet. Ostad writes one every Friday morning, once there's a week of evidence behind you.</p>
        </div>
      )}

      {hasEnoughDataForVerdict && (
        <div className="flex flex-col gap-3 rounded-2xl border border-night-edge bg-night-raise p-4">
          <h2 className="font-semibold">Ostad's monthly verdict</h2>
          <div className="flex flex-col gap-1.5">
            {verdict.map((v) => (
              <div key={v.name} className="flex items-center justify-between text-sm">
                <span>{v.name}</span>
                <span className="flex items-center gap-1.5 text-ink-dim">
                  {v.prevMonthPct}% → {v.thisMonthPct}%
                  <span className={`font-bold ${TREND_COLOR[v.trend]}`}>{TREND_ICON[v.trend]}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between border-t border-night-edge pt-2 text-sm text-ink-dim">
            <span>XP this month</span>
            <span className="font-semibold text-ink">{totalXpThisMonth}</span>
          </div>
          <div className="flex justify-between text-sm text-ink-dim">
            <span>Avg. weekly bonus</span>
            <span className="font-semibold text-ink">+{avgBonusXp}</span>
          </div>
        </div>
      )}

      {reviews.length > 1 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-ink-dim">Past weeks</h2>
          {reviews.slice(1).map((r) => (
            <details key={r.id} className="rounded-xl border border-night-edge bg-night-raise p-3">
              <summary className="cursor-pointer text-sm">
                {r.week_start} <span className="text-ink-dim">· +{r.bonus_xp} xp</span>
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-dim">{r.review_md}</p>
            </details>
          ))}
        </section>
      )}
    </div>
  )
}
