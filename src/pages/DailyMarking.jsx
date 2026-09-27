import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAttendance } from '../hooks/useAttendance'
import { useTimetable } from '../hooks/useTimetable'
import { EmptyState } from '../components/ui'
import { formatTime, toISODate, toWeekdayIndex } from '../utils/dateHelpers'

const STATES = [
  { key: 'present', label: 'Present', tone: 'ok' },
  { key: 'absent', label: 'Absent', tone: 'bad' },
  { key: 'cancelled', label: 'Holiday / Cancelled', tone: 'muted' }
]

function shiftDate(iso, days) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export default function DailyMarking() {
  const [params, setParams] = useSearchParams()
  const initialDate = params.get('date') || toISODate(new Date())
  const [date, setDate] = useState(initialDate)
  const { forDate, setStatus, generateMonth } = useAttendance()
  const { slots } = useTimetable()

  useEffect(() => {
    setParams({ date }, { replace: true })
  }, [date, setParams])

  // Make sure the visited month has records generated from the template.
  useEffect(() => {
    if (!slots.length) return
    const d = new Date(date + 'T00:00:00')
    generateMonth(d.getFullYear(), d.getMonth(), slots)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, slots.length])

  const records = forDate(date).sort((a, b) => a.slot_position - b.slot_position)
  const weekday = toWeekdayIndex(new Date(date + 'T00:00:00'))
  const isWeekend = weekday === null
  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mark attendance</h1>
      </div>

      <div className="card p-3 flex items-center justify-between gap-2">
        <button
          onClick={() => setDate((d) => shiftDate(d, -1))}
          aria-label="Previous day"
          className="w-9 h-9 shrink-0 rounded-xl2 flex items-center justify-center hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
        >
          ←
        </button>
        <div className="flex flex-col items-center flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{dateLabel}</p>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs text-accent bg-transparent mt-0.5"
          />
        </div>
        <button
          onClick={() => setDate((d) => shiftDate(d, 1))}
          aria-label="Next day"
          className="w-9 h-9 shrink-0 rounded-xl2 flex items-center justify-center hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
        >
          →
        </button>
      </div>

      {isWeekend ? (
        <EmptyState title="No college on weekends" body="Nothing scheduled — enjoy the day off." />
      ) : records.length === 0 ? (
        <EmptyState title="Nothing scheduled" body="No lectures found for this day yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {records.map((rec) => (
            <LectureRow key={rec.id} record={rec} onSetStatus={(status) => setStatus(rec.id, status)} />
          ))}
        </div>
      )}
    </div>
  )
}

function LectureRow({ record, onSetStatus }) {
  return (
    <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{record.subject}</p>
        <p className="text-xs text-ink-mutedlight dark:text-ink-muteddark mt-0.5">
          {record.type} · {formatTime(record.start_time)}–{formatTime(record.end_time)}
          {record.is_extra && ' · Extra'}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:w-auto">
        {STATES.map((s) => {
          const active = record.status === s.key
          return (
            <button
              key={s.key}
              onClick={() => onSetStatus(s.key)}
              className={`px-3 py-2.5 rounded-xl2 text-xs font-medium border transition-colors ${
                active
                  ? s.key === 'present'
                    ? 'bg-ok text-white border-ok'
                    : s.key === 'absent'
                    ? 'bg-bad text-white border-bad'
                    : 'bg-ink-mutedlight dark:bg-ink-muteddark text-white border-transparent'
                  : 'border-surface-border dark:border-surface-darkborder text-ink-mutedlight dark:text-ink-muteddark hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              }`}
            >
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
