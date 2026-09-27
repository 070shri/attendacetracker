import { useRef, useState } from 'react'
import { useTimetable } from '../hooks/useTimetable'
import { WEEKDAY_LABELS, formatTime } from '../utils/dateHelpers'

const TYPES = ['Theory', 'Practical', 'Tutorial']
const TYPE_DOT = { Theory: 'bg-accent', Practical: 'bg-ok', Tutorial: 'bg-warn' }

/** Upload a timetable photo/screenshot and auto-fill the weekly grid from it. */
function ImageImport({ hasExistingSlots, importFromImage }) {
  const inputRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | reading | done | error
  const [message, setMessage] = useState('')

  const pick = () => inputRef.current?.click()

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file later
    if (!file) return

    if (
      hasExistingSlots &&
      !window.confirm('This replaces your current weekly timetable below with what’s read from the photo. Continue?')
    ) {
      return
    }

    setStatus('reading')
    setMessage('Reading your timetable…')
    try {
      const count = await importFromImage(file)
      setStatus('done')
      setMessage(`Imported ${count} lecture slot${count === 1 ? '' : 's'} ✓`)
    } catch (err) {
      setStatus('error')
      setMessage(err.message || 'Could not read that image. Try a clearer, well-lit photo.')
    }
  }

  return (
    <div className="rounded-xl2 border border-dashed border-accent/50 bg-accent/[0.04] p-3 mb-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-medium">Import from a photo</p>
          <p className="text-xs text-ink-mutedlight dark:text-ink-muteddark">
            Upload a picture of your timetable and it'll fill in the grid below automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={pick}
          disabled={status === 'reading'}
          className="btn-secondary px-3 py-1.5 text-xs shrink-0 disabled:opacity-60"
        >
          {status === 'reading' ? 'Reading…' : 'Upload image'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onFile}
        />
      </div>
      {message && (
        <p className={`text-xs font-medium ${status === 'error' ? 'text-bad' : 'text-ok'}`}>{message}</p>
      )}
    </div>
  )
}

function SlotForm({ onSave, onCancel, initial }) {
  const [subject, setSubject] = useState(initial?.subject || '')
  const [type, setType] = useState(initial?.type || 'Theory')
  const [startTime, setStartTime] = useState(initial?.start_time?.slice(0, 5) || '09:00')
  const [endTime, setEndTime] = useState(initial?.end_time?.slice(0, 5) || '10:00')

  const submit = (e) => {
    e.preventDefault()
    if (!subject.trim()) return
    onSave({ subject: subject.trim(), type, start_time: startTime, end_time: endTime })
  }

  return (
    <form onSubmit={submit} className="rounded-xl2 border border-accent/40 bg-accent/[0.04] p-3 flex flex-col gap-2.5">
      <input
        autoFocus
        className="input"
        placeholder="Subject name"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
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
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary px-3 py-1.5 text-xs">Cancel</button>
        <button type="submit" className="btn-primary px-3 py-1.5 text-xs">Save slot</button>
      </div>
    </form>
  )
}

/**
 * Weekly timetable builder shared by onboarding step 3 and Settings.
 * Edits here change the template going forward only — already-generated
 * attendance_records keep the subject/time snapshot they were created with.
 */
export default function TimetableEditor() {
  const { slots, byWeekday, addSlot, updateSlot, deleteSlot, reorderDay, copyFromDay, importFromImage, loading } =
    useTimetable()
  const [activeDay, setActiveDay] = useState(0)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [dragId, setDragId] = useState(null)

  const daySlots = byWeekday(activeDay)

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) return
    const ids = daySlots.map((s) => s.id)
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(targetId)
    ids.splice(to, 0, ids.splice(from, 1)[0])
    reorderDay(activeDay, ids)
    setDragId(null)
  }

  return (
    <div>
      <ImageImport hasExistingSlots={slots.length > 0} importFromImage={importFromImage} />

      <div className="flex gap-1.5 mb-4 overflow-x-auto">
        {WEEKDAY_LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => {
              setActiveDay(i)
              setAdding(false)
              setEditingId(null)
            }}
            className={`px-3.5 py-2 rounded-xl2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeDay === i
                ? 'bg-accent text-white'
                : 'bg-black/[0.03] dark:bg-white/[0.05] text-ink-mutedlight dark:text-ink-muteddark'
            }`}
          >
            {label}
            <span className="ml-1.5 opacity-70">{byWeekday(i).length}</span>
          </button>
        ))}
      </div>

      {activeDay > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="text-xs text-ink-mutedlight dark:text-ink-muteddark self-center mr-1">Copy from:</span>
          {WEEKDAY_LABELS.slice(0, activeDay).map((label, i) => (
            <button
              key={label}
              onClick={() => copyFromDay(i, activeDay)}
              className="text-xs font-medium px-2.5 py-1 rounded-full border border-surface-border dark:border-surface-darkborder hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 min-h-[60px]">
        {!loading &&
          daySlots.map((slot) =>
            editingId === slot.id ? (
              <SlotForm
                key={slot.id}
                initial={slot}
                onCancel={() => setEditingId(null)}
                onSave={async (fields) => {
                  await updateSlot(slot.id, fields)
                  setEditingId(null)
                }}
              />
            ) : (
              <div
                key={slot.id}
                draggable
                onDragStart={() => setDragId(slot.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(slot.id)}
                className="flex items-center gap-3 rounded-xl2 border border-surface-border dark:border-surface-darkborder px-3 py-2.5 cursor-grab active:cursor-grabbing bg-surface-card dark:bg-surface-darkcard"
              >
                <span className="text-ink-mutedlight dark:text-ink-muteddark text-sm select-none">⠿</span>
                <span className={`w-1.5 h-1.5 rounded-full ${TYPE_DOT[slot.type]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{slot.subject}</p>
                  <p className="text-xs text-ink-mutedlight dark:text-ink-muteddark">
                    {slot.type} · {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
                  </p>
                </div>
                <button
                  onClick={() => setEditingId(slot.id)}
                  className="text-xs font-medium text-accent px-2 py-1 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteSlot(slot.id)}
                  className="text-xs font-medium text-bad px-2 py-1 hover:underline"
                >
                  Delete
                </button>
              </div>
            )
          )}

        {adding ? (
          <SlotForm
            onCancel={() => setAdding(false)}
            onSave={async (fields) => {
              await addSlot(activeDay, fields)
              setAdding(false)
            }}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="rounded-xl2 border border-dashed border-surface-border dark:border-surface-darkborder py-3 text-sm font-medium text-ink-mutedlight dark:text-ink-muteddark hover:border-accent hover:text-accent transition-colors"
          >
            + Add lecture slot
          </button>
        )}
      </div>
    </div>
  )
}
