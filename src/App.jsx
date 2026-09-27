import { Routes, Route, Navigate } from 'react-router-dom'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import DailyMarking from './pages/DailyMarking'
import MonthlyCalendar from './pages/MonthlyCalendar'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Activity from './pages/Activity'
import AppShell from './components/AppShell'
import { RequireAuth, RequireSetup, RedirectIfSetupComplete, RedirectIfAuthed } from './components/RouteGuards'

export default function App() {
  return (
    <Routes>
      <Route element={<RedirectIfAuthed />}>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<RedirectIfSetupComplete />}>
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>

        <Route element={<RequireSetup />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/mark" element={<DailyMarking />} />
            <Route path="/calendar" element={<MonthlyCalendar />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
