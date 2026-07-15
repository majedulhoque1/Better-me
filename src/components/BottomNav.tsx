import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Today', icon: '🔥' },
  { to: '/tasks', label: 'Tasks', icon: '☑️' },
  { to: '/money', label: 'Money', icon: '৳' },
  { to: '/prospects', label: 'Leads', icon: '🤝' },
  { to: '/review', label: 'Ostad', icon: '🐯' },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-night-edge bg-night-raise/95 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md justify-around">
        {ITEMS.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 text-[11px] ${
                isActive ? 'text-glow' : 'text-ink-dim'
              }`
            }
          >
            <span className="text-lg leading-none">{it.icon}</span>
            {it.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
