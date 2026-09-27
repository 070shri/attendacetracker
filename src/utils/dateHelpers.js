// Date helpers used to turn a weekly timetable template into concrete
// 4-week x 5-day (Mon–Fri) month calendars.

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** JS getDay(): 0=Sun..6=Sat. Convert to our 0=Mon..4=Fri, or null for weekends. */
export function toWeekdayIndex(date) {
  const d = date.getDay()
  if (d === 0 || d === 6) return null
  return d - 1
}

/**
 * Build the list of college weekdays (Mon–Fri) for a given month,
 * capped at 4 weeks (20 days) to match the app's "4 weeks x 5 days" model.
 */
export function buildMonthDays(year, monthIndex /* 0-based */) {
  const days = []
  const date = new Date(year, monthIndex, 1)
  while (date.getMonth() === monthIndex && days.length < 20) {
    const wd = toWeekdayIndex(date)
    if (wd !== null) {
      days.push({ date: toISODate(date), weekday: wd })
    }
    date.setDate(date.getDate() + 1)
  }
  return days
}

export function monthLabel(year, monthIndex) {
  return new Date(year, monthIndex, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
}

export function addMonths(year, monthIndex, delta) {
  const d = new Date(year, monthIndex + delta, 1)
  return { year: d.getFullYear(), monthIndex: d.getMonth() }
}

export function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = Number(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:${m} ${ampm}`
}
