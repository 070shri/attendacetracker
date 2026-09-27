import { useTimetable } from '../../hooks/useTimetable'
import { WEEKDAY_LABELS } from '../../utils/dateHelpers'
import TimetableEditor from '../../components/TimetableEditor'

export default function StepTimetable({ onNext, onBack }) {
  const { byWeekday } = useTimetable()
  const totalSlots = WEEKDAY_LABELS.reduce((sum, _, i) => sum + byWeekday(i).length, 0)

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-1">Weekly timetable</h2>
      <p className="text-sm text-ink-mutedlight dark:text-ink-muteddark mb-5">
        Build your repeating Mon–Fri schedule. Every month gets generated from this.
      </p>

      <TimetableEditor />

      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="btn-secondary">Back</button>
        <button onClick={onNext} disabled={totalSlots === 0} className="btn-primary">
          Review timetable
        </button>
      </div>
    </div>
  )
}
