import type { Mood } from './library'

export interface OstadProps {
  stage: 1 | 2 | 3 | 4
  mood: Mood
  size?: number
  speaking?: string
  className?: string
}

const FUR = '#d97706'
const FUR_DARK = '#b45309'
const STRIPE = '#1c1917'
const MUZZLE = '#fef3c7'
const INK = '#0c0a09'

/** Eyes, brows, and mouth are the only parts that change with mood. */
function Face({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'proud':
      return (
        <g>
          <path d="M72 84 Q80 76 90 82" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M110 82 Q120 76 128 84" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="80" cy="94" rx="6" ry="7" fill={INK} />
          <ellipse cx="120" cy="94" rx="6" ry="7" fill={INK} />
          <path d="M88 118 Q100 128 112 118" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </g>
      )
    case 'neutral':
      return (
        <g>
          <path d="M72 82 Q80 79 90 82" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M110 82 Q120 79 128 82" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="80" cy="95" rx="5.5" ry="6.5" fill={INK} />
          <ellipse cx="120" cy="95" rx="5.5" ry="6.5" fill={INK} />
          <line x1="90" y1="120" x2="110" y2="120" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )
    case 'disappointed':
      return (
        <g>
          <path d="M72 80 Q82 88 92 84" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M108 84 Q118 88 128 80" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="80" cy="98" rx="5" ry="5.5" fill={INK} />
          <ellipse cx="120" cy="98" rx="5" ry="5.5" fill={INK} />
          <path d="M88 124 Q100 116 112 124" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </g>
      )
    case 'angry':
      return (
        <g>
          <path d="M70 78 L92 88" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <path d="M130 78 L108 88" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="80" cy="98" rx="5" ry="4" fill={INK} />
          <ellipse cx="120" cy="98" rx="5" ry="4" fill={INK} />
          <path d="M86 122 Q100 114 114 122" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M92 124 L96 118 M100 125 L100 118 M108 124 L104 118" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        </g>
      )
    case 'celebrating':
      return (
        <g>
          <path d="M72 90 Q80 78 90 90" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M110 90 Q120 78 128 90" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M84 116 Q100 132 116 116" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M60 70 L64 76 M140 70 L136 76 M100 62 L100 70" stroke={STRIPE} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </g>
      )
    case 'asleep':
      return (
        <g>
          <path d="M72 94 Q80 97 90 94" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M110 94 Q120 97 128 94" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M96 122 Q100 125 104 122" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
          <text x="128" y="70" fontSize="14" fill={STRIPE} opacity="0.7" fontFamily="serif">Z</text>
        </g>
      )
  }
}

/** Ears, extra stripes, and accessories layer on as the tiger evolves. */
function StageDetails({ stage }: { stage: 1 | 2 | 3 | 4 }) {
  return (
    <g>
      {/* ears: rounder + smaller at stage 1, sharper + larger from stage 3 */}
      {stage === 1 ? (
        <>
          <circle cx="60" cy="48" r="16" fill={FUR} />
          <circle cx="140" cy="48" r="16" fill={FUR} />
        </>
      ) : (
        <>
          <path d={stage >= 3 ? 'M46 52 L60 22 L74 50 Z' : 'M48 50 L60 26 L74 50 Z'} fill={FUR} />
          <path d={stage >= 3 ? 'M154 52 L140 22 L126 50 Z' : 'M152 50 L140 26 L126 50 Z'} fill={FUR} />
        </>
      )}
      <circle cx="60" cy="50" r="7" fill={MUZZLE} />
      <circle cx="140" cy="50" r="7" fill={MUZZLE} />

      {/* stripes: sparse at stage 1, bold by stage 3-4 */}
      {stage >= 2 && (
        <g stroke={STRIPE} strokeWidth="4" strokeLinecap="round" opacity={stage >= 3 ? 0.9 : 0.6}>
          <path d="M50 62 L62 70" />
          <path d="M150 62 L138 70" />
          <path d="M46 100 L60 104" />
          <path d="M154 100 L140 104" />
        </g>
      )}
      {stage >= 3 && (
        <g stroke={STRIPE} strokeWidth="4" strokeLinecap="round" opacity="0.9">
          <path d="M56 130 L70 134" />
          <path d="M144 130 L130 134" />
        </g>
      )}

      {/* whiskers from stage 2 */}
      {stage >= 2 && (
        <g stroke={INK} strokeWidth="1.5" opacity="0.5" strokeLinecap="round">
          <path d="M78 106 L54 104" />
          <path d="M78 112 L54 116" />
          <path d="M122 106 L146 104" />
          <path d="M122 112 L146 116" />
        </g>
      )}

      {/* scar from stage 3 */}
      {stage >= 3 && <path d="M104 74 L112 92" stroke={FUR_DARK} strokeWidth="2" strokeLinecap="round" opacity="0.7" />}

      {/* elder accessories: round glasses + medal */}
      {stage === 4 && (
        <g>
          <circle cx="80" cy="95" r="12" fill="none" stroke="#292524" strokeWidth="2.5" />
          <circle cx="120" cy="95" r="12" fill="none" stroke="#292524" strokeWidth="2.5" />
          <line x1="92" y1="95" x2="108" y2="95" stroke="#292524" strokeWidth="2.5" />
          <circle cx="100" cy="158" r="10" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
          <path d="M100 148 L96 130 M100 148 L104 130" stroke="#78350f" strokeWidth="2" />
        </g>
      )}
    </g>
  )
}

/** Ostad — the accountability character. Pure SVG so he renders fully offline. */
export default function Ostad({ stage, mood, size = 160, speaking, className }: OstadProps) {
  return (
    <div className={`relative inline-flex flex-col items-center ${className ?? ''}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        role="img"
        aria-label={`Ostad, stage ${stage}, feeling ${mood}`}
        className="animate-[ostad-breathe_4s_ease-in-out_infinite]"
      >
        <ellipse cx="100" cy="112" rx="62" ry="58" fill={FUR} />
        <ellipse cx="100" cy="128" rx="34" ry="26" fill={MUZZLE} />
        <StageDetails stage={stage} />
        <Face mood={mood} />
      </svg>
      {speaking && (
        <div className="mt-2 max-w-xs rounded-2xl border border-night-edge bg-night-raise px-4 py-3 text-sm leading-snug text-ink shadow-lg">
          {speaking}
        </div>
      )}
    </div>
  )
}
