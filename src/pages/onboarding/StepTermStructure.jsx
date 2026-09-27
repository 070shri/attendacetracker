function NumberStepper({ value, min, max, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 rounded-xl2 border border-surface-border dark:border-surface-darkborder flex items-center justify-center text-lg font-medium hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
      >
        −
      </button>
      <span className="stat-number w-8 text-center text-lg font-semibold">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 rounded-xl2 border border-surface-border dark:border-surface-darkborder flex items-center justify-center text-lg font-medium hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
      >
        +
      </button>
    </div>
  )
}

export default function StepTermStructure({ wizard, patch, onNext, onBack }) {
  const { termMonths, syllabusMonths, examMonths } = wizard

  const setTermMonths = (v) => {
    // Keep syllabus+exam in sync with the new total, biasing toward syllabus months.
    const exam = Math.min(examMonths, v - 1) || 1
    patch({ termMonths: v, examMonths: exam, syllabusMonths: v - exam })
  }

  const setExamMonths = (v) => {
    const exam = Math.max(1, Math.min(v, termMonths - 1))
    patch({ examMonths: exam, syllabusMonths: termMonths - exam })
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-1">Term structure</h2>
      <p className="text-sm text-ink-mutedlight dark:text-ink-muteddark mb-6">
        How long is your term, and how many months are exam months (no regular lecture marking)?
      </p>

      <div className="flex items-center justify-between py-4 border-b border-surface-border dark:border-surface-darkborder">
        <div>
          <p className="text-sm font-medium">Term length</p>
          <p className="text-xs text-ink-mutedlight dark:text-ink-muteddark">4–6 months</p>
        </div>
        <NumberStepper value={termMonths} min={4} max={6} onChange={setTermMonths} />
      </div>

      <div className="flex items-center justify-between py-4 border-b border-surface-border dark:border-surface-darkborder">
        <div>
          <p className="text-sm font-medium">Exam months</p>
          <p className="text-xs text-ink-mutedlight dark:text-ink-muteddark">No regular lecture marking during these</p>
        </div>
        <NumberStepper value={examMonths} min={1} max={termMonths - 1} onChange={setExamMonths} />
      </div>

      <div className="flex items-center justify-between py-4">
        <p className="text-sm font-medium">Syllabus months</p>
        <span className="stat-number text-lg font-semibold text-accent">{syllabusMonths}</span>
      </div>

      <div className="flex justify-between mt-4">
        <button onClick={onBack} className="btn-secondary">Back</button>
        <button onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  )
}
