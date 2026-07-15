import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { enablePush, pushEnabled, pushSupported } from '../../lib/push'

export default function SettingsScreen() {
  const [supported, setSupported] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    pushSupported().then(setSupported)
    pushEnabled().then(setEnabled)
  }, [])

  async function toggle() {
    setBusy(true)
    if (!enabled) {
      const ok = await enablePush()
      setEnabled(ok)
    }
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Settings</h1>

      <div className="flex items-center justify-between rounded-xl border border-night-edge bg-night-raise px-4 py-3">
        <div>
          <p className="font-medium">Ostad's notifications</p>
          <p className="text-xs text-ink-dim">
            {!supported ? 'Not supported on this browser' : enabled ? 'Enabled' : 'Off'}
          </p>
        </div>
        {supported && (
          <button
            onClick={toggle}
            disabled={busy || enabled}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              enabled ? 'bg-night-edge text-ink-dim' : 'bg-glow text-night'
            }`}
          >
            {enabled ? 'On' : 'Enable'}
          </button>
        )}
      </div>

      <button
        onClick={() => supabase.auth.signOut()}
        className="rounded-xl border border-night-edge px-4 py-3 text-left text-danger"
      >
        Sign out
      </button>
    </div>
  )
}
