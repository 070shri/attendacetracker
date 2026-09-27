import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTimetable } from '../../hooks/useTimetable'
import { useTerm } from '../../hooks/useTerm'
import { useAttendance } from '../../hooks/useAttendance'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { logActivity } from '../../lib/activityLog'
import { WEEKDAY_LABELS, formatTime } from '../../utils/dateHelpers'

export default function StepReview({ wizard, onBack }) {
  const { slots, byWeekday } = useTimetable()
  const { createTerm } = useTerm()
  const { generateMonth } = useAttendance()
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const confirm = async () => {
    setBusy(true)
    setError('')
    try {
      await createTerm(wizard)
      await supabase
        .from('profiles')
        .update({ education_type: wizard.educationType, setup_complete: true })
        .eq('id', user.id)

      const now = new Date()
      await generateMonth(now.getFullYear(), now.getMonth(), slots)

      logActivity(
        user.id,
        'setup',
        `Completed setup: ${wizard.educationType}, ${wizard.termMonths}-month term, ${slots.length} weekly lecture slot${slots.length !== 1 ? 's' : ''}`,
        { ...wizard, slotCount: slots.length }
      )

      await refreshProfile()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong finishing setup.')
      setBusy(false)
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-1">Review your timetable</h2>
      <p className="text-sm text-ink-mutedlight dark:text-ink-muteddark mb-6">
        Confirm to lock this in — this month's calendar will be generated automatically.
      </p>

      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm border-collapse min-w-[520px]">
          <thead>
            <tr>
              {WEEKDAY_LABELS.map((label) => (
                <th key={label} className="text-left font-medium text-ink-mutedlight dark:text-ink-muteddark pb-2 pr-4">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="align-top">
              {WEEKDAY_LABELS.map((label, i) => (
                <td key={label} className="pr-4 pb-2 align-top">
                  <div className="flex flex-col gap-2">
                    {byWeekday(i).length === 0 && (
                      <span className="text-xs text-ink-mutedlight dark:text-ink-muteddark">No lectures</span>
                    )}
                    {byWeekday(i).map((slot) => (
                      <div key={slot.id} className="rounded-lg border border-surface-border dark:border-surface-darkborder px-2 py-1.5">
                        <p className="text-xs font-medium">{slot.subject}</p>
                        <p className="text-[11px] text-ink-mutedlight dark:text-ink-muteddark">
                          {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
                        </p>
                      </div>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-5 rounded-xl2 bg-black/[0.02] dark:bg-white/[0.03] p-3 text-xs text-ink-mutedlight dark:text-ink-muteddark">
        {wizard.educationType} · {wizard.termMonths}-month term · {wizard.syllabusMonths} syllabus month
        {wizard.syllabusMonths !== 1 ? 's' : ''} · {wizard.examMonths} exam month{wizard.examMonths !== 1 ? 's' : ''} ·{' '}
        {slots.length} weekly lecture slot{slots.length !== 1 ? 's' : ''}
      </div>

      {error && <p className="text-sm text-bad mt-4">{error}</p>}

      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="btn-secondary">Back</button>
        <button onClick={confirm} disabled={busy} className="btn-primary">
          {busy ? 'Setting up…' : 'Confirm & finish setup'}
        </button>
      </div>
    </div>
  )
}
