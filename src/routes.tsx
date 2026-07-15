import { BrowserRouter, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import TodayScreen from './features/today/TodayScreen'
import TasksScreen from './features/tasks/TasksScreen'
import MoneyScreen from './features/money/MoneyScreen'
import ProspectsScreen from './features/prospects/ProspectsScreen'
import ReviewScreen from './features/review/ReviewScreen'
import SettingsScreen from './features/settings/SettingsScreen'
import OstadGallery from './character/OstadGallery'

export default function Shell() {
  return (
    <BrowserRouter>
      <main className="mx-auto max-w-md px-4 pb-24 pt-4">
        <Routes>
          <Route path="/" element={<TodayScreen />} />
          <Route path="/tasks" element={<TasksScreen />} />
          <Route path="/money" element={<MoneyScreen />} />
          <Route path="/prospects" element={<ProspectsScreen />} />
          <Route path="/review" element={<ReviewScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          {import.meta.env.DEV && <Route path="/ostad-gallery" element={<OstadGallery />} />}
        </Routes>
      </main>
      <BottomNav />
    </BrowserRouter>
  )
}
