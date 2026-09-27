import { Link } from 'react-router-dom'
import { StatusPill, ProgressBar } from './ui'

export default function SubjectCard({ subject, summary }) {
  const { pct, attended, total, canMiss, needToAttend } = summary
  const tone = pct === null ? 'gray' : pct >= 75 ? 'green' : pct >= 65 ? 'amber' : 'red'

  let bunkLine
  if (pct === null) {
    bunkLine = 'No lectures marked yet'
  } else if (pct >= 75) {
    bunkLine = canMiss > 0 ? `Can miss ${canMiss} more and stay ≥75%` : 'At the edge — attend the next one'
  } else {
    bunkLine = `Need to attend next ${needToAttend} to reach 75%`
  }

  return (
    <Link
      to={`/analytics?subject=${encodeURIComponent(subject)}`}
      className="card p-4 flex flex-col gap-3 hover:border-accent/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{subject}</p>
          <p className="text-xs text-ink-mutedlight dark:text-ink-muteddark mt-0.5">
            {attended}/{total} attended
          </p>
        </div>
        <StatusPill tone={tone}>{pct === null ? '—' : `${pct.toFixed(0)}%`}</StatusPill>
      </div>
      <ProgressBar pct={pct} tone={tone} />
      <p className="text-xs text-ink-mutedlight dark:text-ink-muteddark">{bunkLine}</p>
    </Link>
  )
}
