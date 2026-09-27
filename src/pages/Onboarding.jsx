import { useState } from 'react'
import ThemeToggle from '../components/ThemeToggle'
import StepEducationType from './onboarding/StepEducationType'
import StepTermStructure from './onboarding/StepTermStructure'
import StepTimetable from './onboarding/StepTimetable'
import StepReview from './onboarding/StepReview'

const STEPS = ['Education', 'Term', 'Timetable', 'Review']

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [wizard, setWizard] = useState({
    educationType: 'Degree',
    termMonths: 6,
    syllabusMonths: 5,
    examMonths: 1
  })

  const patch = (fields) => setWizard((w) => ({ ...w, ...fields }))
  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-darkbg">
      <header className="border-b border-surface-border dark:border-surface-darkborder">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white text-sm font-mono font-semibold">
              75
            </div>
            <span className="font-semibold text-[15px]">Set up your term</span>
          </div>
          <ThemeToggle />
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-4">
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex-1">
                <div className={`h-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-black/[0.08] dark:bg-white/[0.1]'}`} />
                <p className={`mt-1.5 text-xs font-medium hidden sm:block ${i <= step ? 'text-accent' : 'text-ink-mutedlight dark:text-ink-muteddark'}`}>
                  {i + 1}. {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {step === 0 && <StepEducationType wizard={wizard} patch={patch} onNext={next} />}
        {step === 1 && <StepTermStructure wizard={wizard} patch={patch} onNext={next} onBack={back} />}
        {step === 2 && <StepTimetable onNext={next} onBack={back} />}
        {step === 3 && <StepReview wizard={wizard} onBack={back} />}
      </main>
    </div>
  )
}
