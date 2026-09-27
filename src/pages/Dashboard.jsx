import { Link } from 'react-router-dom'
import { useAttendance } from '../hooks/useAttendance'
import { BigStat, EmptyState } from '../components/ui'
import SubjectCard from '../components/SubjectCard'
import { bunkSummary, groupBySubject, countable } from '../utils/attendanceMath'
import { toISODate } from '../utils/dateHelpers'

export default function Dashboard() {
  const { records, loading, forDate, forMonth } = useAttendance()
  const today = toISODate(new Date())
  const now = new Date()

  const overall = bunkSummary(records)
  const monthRecords = forMonth(now.getFullYear(), now.getMonth())
  const monthSummary = bunkSummary(monthRecords)

  const bySubject = groupBySubject(records)
  const subjectSummaries = Array.from(bySubject.entries())
    .map(([subject, recs]) => [subject, bunkSummary(recs)])
    .sort((a, b) => (a[1].pct ?? 100) - (b[1].pct ?? 100))

  const todayRecords = forDate(today)
  const todayCountable = countable(todayRecords)
  const todayUnmarked = todayCountable.filter((r) => r.status === 'unmarked')
  const belowSubjects = subjectSummaries.filter(([, s]) => s.pct !== null && s.pct < 75)

  if (loading) return <div className="text-sm text-ink-mutedlight">Loading…</div>

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link to="/mark" className="btn-primary text-sm">
          Mark today's attendance
        </Link>
      </div>

      {/* Alerts */}
      <div className="flex flex-col gap-2">
        {todayCountable.length > 0 && todayUnmarked.length > 0 && (
          <Banner tone="amber">
            {todayUnmarked.length} of today's lectures {todayUnmarked.length === 1 ? "isn't" : "aren't"} marked yet.{' '}
            <Link to="/mark" className="underline font-medium">Mark now</Link>
          </Banner>
        )}
        {overall.pct !== null && overall.pct < 75 && (
          <Banner tone="red">Your overall attendance is {overall.pct.toFixed(1)}%, below the 75% requirement.</Banner>
        )}
        {belowSubjects.length > 0 && (
          <Banner tone="red">
            {belowSubjects.length} subject{belowSubjects.length !== 1 ? 's are' : ' is'} below 75%:{' '}
            {belowSubjects.map(([s]) => s).join(', ')}
          </Banner>
        )}
        {overall.pct !== null && overall.pct >= 85 && belowSubjects.length === 0 && (
          <Banner tone="green">Comfortably above 75% overall — nice and steady.</Banner>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BigStat label="Overall attendance" pct={overall.pct} sub={`${overall.attended}/${overall.total} lectures attended`} />
        <BigStat label="This month" pct={monthSummary.pct} sub={`${monthSummary.attended}/${monthSummary.total} lectures attended`} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ink-mutedlight dark:text-ink-muteddark mb-3">Subjects</h2>
        {subjectSummaries.length === 0 ? (
          <EmptyState
            title="No lectures marked yet"
            body="Once you start marking attendance, subject breakdowns will show up here."
            action={<Link to="/mark" className="btn-primary text-sm">Mark today's attendance</Link>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjectSummaries.map(([subject, summary]) => (
              <SubjectCard key={subject} subject={subject} summary={summary} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Banner({ tone, children }) {
  const styles = {
    amber: 'bg-warn/10 text-warn border-warn/20',
    red: 'bg-bad/10 text-bad border-bad/20',
    green: 'bg-ok/10 text-ok border-ok/20'
  }
  return <div className={`rounded-xl2 border px-4 py-3 text-sm font-medium ${styles[tone]}`}>{children}</div>
}
