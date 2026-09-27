import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-darkbg">
      <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
    </div>
  )
}

/** Requires a logged-in session; otherwise bounces to /login. */
export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenSpinner />
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}

/**
 * Hard gate: no matter what URL is requested, an account with
 * setupComplete === false is always routed to /onboarding.
 */
export function RequireSetup() {
  const { setupComplete, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (!setupComplete) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

/** Once setup is done, /onboarding itself redirects to the dashboard. */
export function RedirectIfSetupComplete() {
  const { setupComplete, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (setupComplete) return <Navigate to="/" replace />
  return <Outlet />
}

export function RedirectIfAuthed() {
  const { session, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (session) return <Navigate to="/" replace />
  return <Outlet />
}
