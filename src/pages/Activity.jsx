import { useMemo } from 'react'
import { useActivityLog } from '../hooks/useActivityLog'
import { EmptyState } from '../components/ui'

const TYPE_STYLE = {
  attendance: { dot: 'bg-accent', label: 'Marking' },
  timetable: { dot: 'bg-warn', label: 'Timetable' },
  holiday: { dot: 'bg-ok', label: 'Holiday' },
  extra_lecture: { dot: 'bg-ok', label: 'Makeup lecture' },
  setup: { dot: 'bg-bad', label: 'Setup' },
  default: { dot: 'bg-ink-mutedlight dark:bg-ink-muteddark', label: 'System' }
}

function dayHeading(iso) {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a, b) => a.toDateString() === b.toDateString()
  if (sameDay(date, today)) return 'Today'
  if (sameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function timeLabel(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function Activity() {
  const { entries, loading } = useActivityLog()

  const groups = useMemo(() => {
    const map = new Map()
    for (const e of entries) {
      const key = new Date(e.created_at).toDateString()
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(e)
    }
    return Array.from(map.entries())
  }, [entries])

  if (loading) return <div className="text-sm text-ink-mutedlight">Loading…</div>

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div>
        <h1 className="text-xl font-semibold">Activity log</h1>
        <p className="text-sm text-ink-mutedlight dark:text-ink-muteddark mt-1">
          A plain record of what changed and when — timetable edits, attendance marks, holidays, and setup. Not AI-generated,
          just the app noting its own history.
        </p>
      </div>

      {groups.length === 0 ? (
        <EmptyState title="Nothing logged yet" body="Once you mark attendance or edit your timetable, it'll show up here." />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(([dayKey, dayEntries]) => (
            <div key={dayKey}>
              <p className="label-sm mb-2">{dayHeading(dayEntries[0].created_at)}</p>
              <div className="card divide-y divide-surface-border dark:divide-surface-darkborder overflow-hidden">
                {dayEntries.map((e) => {
                  const style = TYPE_STYLE[e.type] || TYPE_STYLE.default
                  return (
                    <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{e.description}</p>
                        <p className="text-xs text-ink-mutedlight dark:text-ink-muteddark mt-0.5">
                          {style.label} · {timeLabel(e.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
