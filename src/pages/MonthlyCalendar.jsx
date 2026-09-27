import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAttendance } from '../hooks/useAttendance'
import { useTerm } from '../hooks/useTerm'
import { buildMonthDays, monthLabel, addMonths, WEEKDAY_LABELS } from '../utils/dateHelpers'
import { dayStatus } from '../utils/attendanceMath'

const DOT = { green: 'bg-ok', amber: 'bg-warn', red: 'bg-bad', gray: 'bg-ink-mutedlight/40 dark:bg-ink-muteddark/40' }
const BG = {
  green: 'bg-ok/10 hover:bg-ok/20',
  amber: 'bg-warn/10 hover:bg-warn/20',
  red: 'bg-bad/10 hover:bg-bad/20',
  gray: 'bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
}

export default function MonthlyCalendar() {
  const { forMonth } = useAttendance()
  const { term } = useTerm()
  const navigate = useNavigate()
  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), monthIndex: now.getMonth() })

  const days = buildMonthDays(cursor.year, cursor.monthIndex)
  const records = forMonth(cursor.year, cursor.monthIndex)

  // Limit navigation to months within the current term.
  const start = term ? new Date(term.start_date) : null
  const minMonths = start ? start.getFullYear() * 12 + start.getMonth() : null
  const maxMonths = start && term ? minMonths + term.term_months - 1 : null
  const curMonths = cursor.year * 12 + cursor.monthIndex
  const canGoBack = minMonths === null || curMonths > minMonths
  const canGoForward = maxMonths === null || curMonths < maxMonths

  const recordsByDate = new Map()
  for (const r of records) {
    if (!recordsByDate.has(r.date)) recordsByDate.set(r.date, [])
    recordsByDate.get(r.date).push(r)
  }

  // Pad the grid so weeks align Mon..Fri, 4 rows.
  const rows = []
  for (let i = 0; i < days.length; i += 5) rows.push(days.slice(i, i + 5))

  return (
    <div className="flex flex-col gap-5 pb-4">
      <h1 className="text-xl font-semibold">Calendar</h1>

      <div className="card p-3 flex items-center justify-between">
        <button
          disabled={!canGoBack}
          onClick={() => setCursor(addMonths(cursor.year, cursor.monthIndex, -1))}
          className="w-9 h-9 rounded-xl2 flex items-center justify-center hover:bg-black/[0.04] dark:hover:bg-white/[0.05] disabled:opacity-30 disabled:pointer-events-none"
        >
          ←
        </button>
        <p className="font-medium text-sm">{monthLabel(cursor.year, cursor.monthIndex)}</p>
        <button
          disabled={!canGoForward}
          onClick={() => setCursor(addMonths(cursor.year, cursor.monthIndex, 1))}
          className="w-9 h-9 rounded-xl2 flex items-center justify-center hover:bg-black/[0.04] dark:hover:bg-white/[0.05] disabled:opacity-30 disabled:pointer-events-none"
        >
          →
        </button>
      </div>

      <div className="card p-3">
        <div className="grid grid-cols-5 gap-1.5 mb-2">
          {WEEKDAY_LABELS.map((l) => (
            <p key={l} className="text-center text-xs font-medium text-ink-mutedlight dark:text-ink-muteddark">
              {l}
            </p>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-5 gap-1.5">
              {row.map((day) => {
                const dayRecords = recordsByDate.get(day.date) || []
                const status = dayStatus(dayRecords)
                return (
                  <button
                    key={day.date}
                    onClick={() => navigate(`/mark?date=${day.date}`)}
                    className={`aspect-square rounded-xl2 flex flex-col items-center justify-center gap-1 transition-colors ${BG[status]}`}
                  >
                    <span className="text-sm font-medium">{Number(day.date.slice(-2))}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${DOT[status]}`} />
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap text-xs text-ink-mutedlight dark:text-ink-muteddark">
        <Legend tone="green" label="All present" />
        <Legend tone="amber" label="Partial" />
        <Legend tone="red" label="All absent" />
        <Legend tone="gray" label="Unmarked" />
      </div>
    </div>
  )
}

function Legend({ tone, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${DOT[tone]}`} />
      {label}
    </span>
  )
}
