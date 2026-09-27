const OPTIONS = ['Diploma', 'Degree']

export default function StepEducationType({ wizard, patch, onNext }) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-1">What are you studying?</h2>
      <p className="text-sm text-ink-mutedlight dark:text-ink-muteddark mb-6">
        This just labels your term — the attendance rules stay the same either way.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => patch({ educationType: opt })}
            className={`rounded-xl2 border px-4 py-6 text-sm font-medium transition-colors ${
              wizard.educationType === opt
                ? 'border-accent bg-accent/[0.06] text-accent'
                : 'border-surface-border dark:border-surface-darkborder hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="flex justify-end mt-6">
        <button onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  )
}
