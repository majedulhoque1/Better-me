import { Link } from 'react-router-dom'

export default function ReviewScreen() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold">Ostad</h1>
      <Link to="/settings" className="text-sm text-ink-dim underline">
        Settings
      </Link>
    </div>
  )
}
