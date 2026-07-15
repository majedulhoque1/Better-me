import AuthScreen from './features/auth/AuthScreen'
import { useSession } from './features/auth/useSession'
import Shell from './routes'

export default function App() {
  const { session, loading } = useSession()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="animate-pulse text-4xl">🐯</span>
      </div>
    )
  }
  if (!session) return <AuthScreen />
  return <Shell />
}
