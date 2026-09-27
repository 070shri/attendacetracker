import { useState } from 'react'
import { useAttendance } from '../hooks/useAttendance'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import TimetableEditor from '../components/TimetableEditor'
import { toISODate } from '../utils/dateHelpers'

const TYPES = ['Theory', 'Practical', 'Tutorial']

function Section({ title, description, children }) {
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-sm mb-1">{title}</h2>
      {description && <p className="text-xs text-ink-mutedlight dark:text-ink-muteddark mb-4">{description}</p>}
      {children}
    </div>
  )
}

function HolidayForm() {
  const { markHoliday } = useAttendance()
  const [date, setDate] = useState(toISODate(new Date()))
  const [reason, setReason] = useState('')
  const [saved, setSaved] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    await markHoliday(date, reason)
    setSaved(true)
    setReason('')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
      <input type="date" className="input sm:w-40" value={date} onChange={(e) => setDate(e.target.value)} />
      <input
        className="input flex-1"
        placeholder="Reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <button type="submit" className="btn-secondary shrink-0">
        {saved ? 'Marked ✓' : 'Mark as holiday'}
      </button>
    </form>
  )
}

function ExtraLectureForm() {
  const { addExtraLecture } = useAttendance()
  const [date, setDate] = useState(toISODate(new Date()))
  const [subject, setSubject] = useState('')
  const [type, setType] = useState('Theory')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [saved, setSaved] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!subject.trim()) return
    await addExtraLecture(date, { subject: subject.trim(), type, start_time: startTime, end_time: endTime })
    setSubject('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5">
      <div className="flex flex-col sm:flex-row gap-2">
        <input type="date" className="input sm:w-40" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="input flex-1" placeholder="Subject name" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <div className="flex gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              type === t
                ? 'border-accent text-accent bg-accent/10'
                : 'border-surface-border dark:border-surface-darkborder text-ink-mutedlight dark:text-ink-muteddark'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        <button type="submit" className="btn-secondary shrink-0">
          {saved ? 'Added ✓' : 'Add lecture'}
        </button>
      </div>
    </form>
  )
}

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { user, logOut } = useAuth()

  return (
    <div className="flex flex-col gap-5 pb-4">
      <h1 className="text-xl font-semibold">Settings</h1>

      <Section title="Appearance">
        <div className="flex gap-2">
          {['light', 'dark'].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex-1 rounded-xl2 border px-4 py-3 text-sm font-medium capitalize transition-colors ${
                theme === t
                  ? 'border-accent bg-accent/[0.06] text-accent'
                  : 'border-surface-border dark:border-surface-darkborder text-ink-mutedlight dark:text-ink-muteddark'
              }`}
            >
              {t} mode
            </button>
          ))}
        </div>
      </Section>

      <Section title="Weekly timetable" description="Edits apply going forward only — past attendance records stay as they were marked.">
        <TimetableEditor />
      </Section>

      <Section title="Mark a holiday" description="Excludes every subject on that date from all totals.">
        <HolidayForm />
      </Section>

      <Section title="Add a makeup lecture" description="A one-off extra lecture on a specific date, outside the regular timetable.">
        <ExtraLectureForm />
      </Section>

      <Section title="Account">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-mutedlight dark:text-ink-muteddark">{user?.email}</p>
          <button onClick={logOut} className="btn-secondary text-sm">Log out</button>
        </div>
      </Section>
    </div>
  )
}
