// Core attendance math. Kept pure/testable and free of any React/Supabase
// imports so it can be unit tested or reused in the analytics page.

export const THRESHOLD = 0.75

/**
 * Records counted toward attendance are anything not cancelled/holiday.
 * `present` counts as attended; `absent` counts as not attended;
 * `unmarked` still counts toward the denominator (an unmarked lecture is
 * effectively an absence until marked, so percentages don't lag reality).
 */
export function countable(records) {
  return records.filter((r) => r.status !== 'cancelled' && !r.is_holiday)
}

export function attendedCount(records) {
  return records.filter((r) => r.status === 'present').length
}

export function percentage(records) {
  const total = countable(records).length
  if (total === 0) return null // no data yet — render as "—" rather than 0%
  return (attendedCount(records) / total) * 100
}

export function statusColor(pct) {
  if (pct === null) return 'gray'
  if (pct >= 75) return 'green'
  if (pct >= 65) return 'amber'
  return 'red'
}

/**
 * How many more lectures can be missed (marked absent) while staying at
 * or above `threshold`, given current attended/total counts.
 * Solve: attended / (total + n) >= threshold  =>  n <= attended/threshold - total
 */
export function canMiss(attended, total, threshold = THRESHOLD) {
  const n = Math.floor(attended / threshold - total)
  return Math.max(0, n)
}

/**
 * How many of the next lectures must be attended to reach `threshold`.
 * Solve: (attended + m) / (total + m) >= threshold
 *     => m >= (threshold*total - attended) / (1 - threshold)
 */
export function needToAttend(attended, total, threshold = THRESHOLD) {
  const m = Math.ceil((threshold * total - attended) / (1 - threshold))
  return Math.max(0, m)
}

/**
 * Full bunk-calculator summary for a subject or the overall total.
 */
export function bunkSummary(records, threshold = THRESHOLD) {
  const counted = countable(records)
  const total = counted.length
  const attended = attendedCount(records)
  const pct = percentage(records)
  return {
    total,
    attended,
    pct,
    canMiss: pct !== null && pct >= threshold * 100 ? canMiss(attended, total, threshold) : 0,
    needToAttend: pct !== null && pct < threshold * 100 ? needToAttend(attended, total, threshold) : 0
  }
}

/** Group flat attendance_records rows by subject. */
export function groupBySubject(records) {
  const map = new Map()
  for (const r of records) {
    if (!map.has(r.subject)) map.set(r.subject, [])
    map.get(r.subject).push(r)
  }
  return map
}

/** Group flat attendance_records rows by YYYY-MM month key. */
export function groupByMonth(records) {
  const map = new Map()
  for (const r of records) {
    const key = r.date.slice(0, 7)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(r)
  }
  return map
}

export function dayStatus(dayRecords) {
  const counted = countable(dayRecords)
  if (dayRecords.length === 0) return 'gray'
  if (counted.length === 0) return 'gray' // fully holiday/cancelled
  const unmarked = counted.filter((r) => r.status === 'unmarked')
  if (unmarked.length === counted.length) return 'gray'
  const present = counted.filter((r) => r.status === 'present').length
  if (present === counted.length) return 'green'
  if (present === 0) return 'red'
  return 'amber'
}
