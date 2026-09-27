import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'

export default function Login() {
  const { logIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await logIn(email, password)
      const dest = location.state?.from?.pathname || '/'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message || 'Could not log you in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-darkbg px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white text-sm font-mono font-semibold">
            75
          </div>
          <span className="font-semibold">Attendance</span>
        </div>
        <div className="card p-6">
          <h1 className="text-lg font-semibold mb-1">Welcome back</h1>
          <p className="text-sm text-ink-mutedlight dark:text-ink-muteddark mb-6">Log in to your dashboard.</p>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
              <label className="label-sm block mb-1.5" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
              />
            </div>
            <div>
              <label className="label-sm block mb-1.5" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </div>
            {error && <p className="text-sm text-bad">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary mt-1">
              {busy ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-ink-mutedlight dark:text-ink-muteddark mt-5">
          New here?{' '}
          <Link to="/signup" className="text-accent font-medium hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  )
}
