import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts'
import { useAttendance } from '../hooks/useAttendance'
import { useTheme } from '../context/ThemeContext'
import { EmptyState } from '../components/ui'
import { groupBySubject, groupByMonth, bunkSummary } from '../utils/attendanceMath'

export default function Analytics() {
  const { records, loading } = useAttendance()
  const { theme } = useTheme()
  const [params, setParams] = useSearchParams()

  const bySubject = useMemo(() => groupBySubject(records), [records])
  const subjects = Array.from(bySubject.keys()).sort()
  const [selected, setSelected] = useState(params.get('subject') || subjects[0] || '')

  useEffect(() => {
    const fromUrl = params.get('subject')
    if (fromUrl && fromUrl !== selected) setSelected(fromUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get('subject')])

  const activeSubject = subjects.includes(selected) ? selected : subjects[0]
  const subjectRecords = activeSubject ? bySubject.get(activeSubject) || [] : []
  const summary = bunkSummary(subjectRecords)

  const monthly = useMemo(() => {
    const groups = groupByMonth(subjectRecords)
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, recs]) => {
        const s = bunkSummary(recs)
        const label = new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' })
        return { month: label, pct: s.pct === null ? null : Math.round(s.pct * 10) / 10 }
      })
  }, [subjectRecords])

  if (loading) return <div className="text-sm text-ink-mutedlight">Loading…</div>

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col gap-5 pb-4">
        <h1 className="text-xl font-semibold">Analytics</h1>
        <EmptyState title="No data yet" body="Mark a few lectures and subject trends will show up here." />
      </div>
    )
  }

  const axisColor = theme === 'dark' ? '#8A8F9C' : '#63666E'
  const gridColor = theme === 'dark' ? '#232833' : '#E7E5E2'

  return (
    <div className="flex flex-col gap-5 pb-4">
      <h1 className="text-xl font-semibold">Analytics</h1>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => {
              setSelected(s)
              setParams({ subject: s }, { replace: true })
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeSubject === s
                ? 'bg-accent text-white'
                : 'bg-black/[0.04] dark:bg-white/[0.06] text-ink-mutedlight dark:text-ink-muteddark'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total" value={summary.total} />
        <Stat label="Attended" value={summary.attended} />
        <Stat label="Absent" value={summary.total - summary.attended} />
        <Stat label="Current %" value={summary.pct === null ? '—' : `${summary.pct.toFixed(1)}%`} accent />
      </div>

      <div className="card p-4">
        <p className="label-sm mb-4">Month-by-month trend</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                domain={[0, 100]}
                stroke={axisColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: theme === 'dark' ? '#12151C' : '#FFFFFF',
                  border: `1px solid ${gridColor}`,
                  borderRadius: 10,
                  fontSize: 12
                }}
                formatter={(v) => (v === null ? ['—', 'Attendance'] : [`${v}%`, 'Attendance'])}
              />
              <ReferenceLine y={75} stroke="#C98A17" strokeDasharray="4 4" label={{ value: '75%', fontSize: 11, fill: '#C98A17', position: 'right' }} />
              <Line type="monotone" dataKey="pct" stroke="#3457D5" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="card p-3.5">
      <p className="text-xs text-ink-mutedlight dark:text-ink-muteddark mb-1">{label}</p>
      <p className={`stat-number text-xl font-semibold ${accent ? 'text-accent' : ''}`}>{value}</p>
    </div>
  )
}
