import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AuthScreen() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  async function submit() {
    setError(null)
    setNotice(null)
    if (mode === 'up' && password !== confirmPassword) {
      setError('Passwords don’t match.')
      return
    }
    setBusy(true)
    const { error } =
      mode === 'in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else if (mode === 'up') setNotice('Account created — you’re signed in.')
    setBusy(false)
  }

  function toggleMode() {
    setMode((m) => (m === 'in' ? 'up' : 'in'))
    setError(null)
    setNotice(null)
    setConfirmPassword('')
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-night-raise text-5xl">
          🐯
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Better Me</h1>
        <p className="mt-1 text-sm text-ink-dim">Ostad is waiting. He doesn’t like waiting.</p>
      </div>

      <form
        className="flex w-full max-w-sm flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className="rounded-xl border border-night-edge bg-night-raise px-4 py-3 text-ink outline-none focus:border-glow"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
          className="rounded-xl border border-night-edge bg-night-raise px-4 py-3 text-ink outline-none focus:border-glow"
        />
        {mode === 'up' && (
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            autoComplete="new-password"
            className="rounded-xl border border-night-edge bg-night-raise px-4 py-3 text-ink outline-none focus:border-glow"
          />
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        {notice && <p className="text-sm text-success">{notice}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-glow px-4 py-3 font-semibold text-night disabled:opacity-50"
        >
          {mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={toggleMode}
          className="rounded-xl border border-night-edge px-4 py-3 text-ink-dim disabled:opacity-50"
        >
          {mode === 'in' ? 'Create account' : 'Back to sign in'}
        </button>
      </form>
    </div>
  )
}
