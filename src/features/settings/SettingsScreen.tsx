import { supabase } from '../../lib/supabase'

export default function SettingsScreen() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <button
        onClick={() => supabase.auth.signOut()}
        className="rounded-xl border border-night-edge px-4 py-3 text-left text-danger"
      >
        Sign out
      </button>
    </div>
  )
}
