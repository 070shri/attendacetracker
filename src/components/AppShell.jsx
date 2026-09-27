import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/mark', label: 'Mark', icon: CheckIcon },
  { to: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { to: '/analytics', label: 'Analytics', icon: ChartIcon },
  { to: '/activity', label: 'Activity', icon: HistoryIcon },
  { to: '/settings', label: 'Settings', icon: GearIcon }
]

export default function AppShell() {
  const { logOut, user } = useAuth()

  return (
    <div className="min-h-screen flex bg-surface-light dark:bg-surface-darkbg">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-surface-border dark:border-surface-darkborder px-4 py-6">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white text-sm font-mono font-semibold">
            75
          </div>
          <span className="font-semibold text-[15px]">Attendance</span>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-ink-mutedlight dark:text-ink-muteddark hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="pt-4 border-t border-surface-border dark:border-surface-darkborder flex items-center justify-between px-1">
          <div className="min-w-0">
            <p className="text-xs text-ink-mutedlight dark:text-ink-muteddark truncate">{user?.email}</p>
            <button onClick={logOut} className="text-xs font-medium text-accent hover:underline mt-0.5">
              Log out
            </button>
          </div>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 h-14 bg-surface-light/90 dark:bg-surface-darkbg/90 backdrop-blur border-b border-surface-border dark:border-surface-darkborder"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', height: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-white text-[11px] font-mono font-semibold">
            75
          </div>
          <span className="font-semibold text-sm">Attendance</span>
        </div>
        <ThemeToggle />
      </div>

      <main className="flex-1 min-w-0 pt-14 pb-16 md:pt-0 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar — thumb-friendly, used constantly between classes */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch bg-surface-card/95 dark:bg-surface-darkcard/95 backdrop-blur border-t border-surface-border dark:border-surface-darkborder"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium ${
                isActive ? 'text-accent' : 'text-ink-mutedlight dark:text-ink-muteddark'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function CalendarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" strokeLinecap="round" />
    </svg>
  )
}
function ChartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 20V10M12 20V4M20 20v-7" strokeLinecap="round" />
    </svg>
  )
}
function GearIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V19a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H4a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H10a1.65 1.65 0 0 0 1-1.51V4a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V10a1.65 1.65 0 0 0 1.51 1H20a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}
function HistoryIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 4.5v4h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v4.5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
