import { useTheme } from '../context/ThemeContext'

export function ThemeToggleImpl() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="w-9 h-9 rounded-xl2 flex items-center justify-center border border-surface-border dark:border-surface-darkborder text-ink-mutedlight dark:text-ink-muteddark hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7.2 7.2 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  )
}

const STATUS_STYLES = {
  green: 'bg-ok/10 text-ok',
  amber: 'bg-warn/10 text-warn',
  red: 'bg-bad/10 text-bad',
  gray: 'bg-black/[0.04] dark:bg-white/[0.06] text-ink-mutedlight dark:text-ink-muteddark'
}

export function StatusPill({ tone = 'gray', children }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[tone]}`}>
      {children}
    </span>
  )
}

const BAR_STYLES = {
  green: 'bg-ok',
  amber: 'bg-warn',
  red: 'bg-bad',
  gray: 'bg-ink-mutedlight/40 dark:bg-ink-muteddark/40'
}

export function ProgressBar({ pct, tone = 'gray' }) {
  const width = pct === null ? 0 : Math.min(100, Math.max(0, pct))
  return (
    <div className="h-1.5 w-full rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${BAR_STYLES[tone]}`}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

export function BigStat({ label, pct, sub }) {
  const tone = pct === null ? 'gray' : pct >= 75 ? 'green' : pct >= 65 ? 'amber' : 'red'
  const textTone = { green: 'text-ok', amber: 'text-warn', red: 'text-bad', gray: 'text-ink-mutedlight dark:text-ink-muteddark' }[tone]
  return (
    <div className="card p-5">
      <p className="label-sm mb-1">{label}</p>
      <p className={`stat-number text-4xl font-semibold ${textTone}`}>
        {pct === null ? '—' : `${pct.toFixed(1)}%`}
      </p>
      {sub && <p className="text-sm text-ink-mutedlight dark:text-ink-muteddark mt-1">{sub}</p>}
    </div>
  )
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="card p-8 text-center">
      <p className="font-medium">{title}</p>
      {body && <p className="text-sm text-ink-mutedlight dark:text-ink-muteddark mt-1">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
