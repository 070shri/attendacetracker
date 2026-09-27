import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { buildMonthDays } from '../utils/dateHelpers'
import { logActivity } from '../lib/activityLog'

/**
 * Loads + mutates `attendance_records`. Also owns "generate a month from
 * the timetable template" and holiday/extra-lecture side effects, since
 * those all write into the same table.
 */
export function useAttendance() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
    if (error) console.error(error)
    setRecords(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const forDate = (isoDate) => records.filter((r) => r.date === isoDate)
  const forMonth = (year, monthIndex) => {
    const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
    return records.filter((r) => r.date.startsWith(prefix))
  }
  const forSubject = (subject) => records.filter((r) => r.subject === subject)

  /**
   * Generate attendance_record rows for every college day in a month from
   * the current timetable template. Skips days that already have records
   * (idempotent — safe to call when switching into a new month).
   */
  const generateMonth = async (year, monthIndex, timetableSlots) => {
    const days = buildMonthDays(year, monthIndex)
    const existingDates = new Set(forMonth(year, monthIndex).map((r) => r.date))
    const toInsert = []
    for (const day of days) {
      if (existingDates.has(day.date)) continue
      const daySlots = timetableSlots
        .filter((s) => s.weekday === day.weekday)
        .sort((a, b) => a.position - b.position)
      daySlots.forEach((slot, i) => {
        toInsert.push({
          user_id: user.id,
          date: day.date,
          slot_position: i,
          subject: slot.subject,
          type: slot.type,
          start_time: slot.start_time,
          end_time: slot.end_time,
          status: 'unmarked'
        })
      })
    }
    if (toInsert.length) {
      const { error } = await supabase.from('attendance_records').insert(toInsert)
      if (error) throw error
      await refresh()
    }
  }

  const setStatus = async (recordId, status) => {
    const record = records.find((r) => r.id === recordId)
    setRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, status } : r)))
    const { error } = await supabase.from('attendance_records').update({ status }).eq('id', recordId)
    if (error) {
      console.error(error)
      await refresh()
      return
    }
    if (record) {
      const STATUS_LABEL = { present: 'Present', absent: 'Absent', cancelled: 'Holiday/Cancelled', unmarked: 'Unmarked' }
      logActivity(
        user.id,
        'attendance',
        `Marked ${record.subject} (${record.date}) as ${STATUS_LABEL[status] || status}`,
        { recordId, date: record.date, subject: record.subject, status }
      )
    }
  }

  /** Mark every lecture on a date as a holiday (excluded from totals). */
  const markHoliday = async (isoDate, reason) => {
    await supabase.from('holidays').upsert({ user_id: user.id, date: isoDate, reason }, { onConflict: 'user_id,date' })
    const { error } = await supabase
      .from('attendance_records')
      .update({ is_holiday: true, status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('date', isoDate)
    if (error) throw error
    await refresh()
    logActivity(user.id, 'holiday', `Marked ${isoDate} as a holiday${reason ? ` (${reason})` : ''}`, { date: isoDate, reason })
  }

  const clearHoliday = async (isoDate) => {
    await supabase.from('holidays').delete().eq('user_id', user.id).eq('date', isoDate)
    const { error } = await supabase
      .from('attendance_records')
      .update({ is_holiday: false, status: 'unmarked' })
      .eq('user_id', user.id)
      .eq('date', isoDate)
    if (error) throw error
    await refresh()
    logActivity(user.id, 'holiday', `Removed holiday on ${isoDate}`, { date: isoDate })
  }

  /** One-off extra/makeup lecture on a specific date. */
  const addExtraLecture = async (isoDate, lecture) => {
    const existingCount = forDate(isoDate).length
    const { data, error } = await supabase
      .from('attendance_records')
      .insert({
        user_id: user.id,
        date: isoDate,
        slot_position: existingCount,
        subject: lecture.subject,
        type: lecture.type,
        start_time: lecture.start_time,
        end_time: lecture.end_time,
        status: 'unmarked',
        is_extra: true
      })
      .select()
      .single()
    if (error) throw error
    setRecords((prev) => [...prev, data])
    logActivity(user.id, 'extra_lecture', `Added makeup lecture: ${lecture.subject} on ${isoDate}`, { date: isoDate, subject: lecture.subject })
    return data
  }

  const deleteRecord = async (recordId) => {
    const record = records.find((r) => r.id === recordId)
    const { error } = await supabase.from('attendance_records').delete().eq('id', recordId)
    if (error) throw error
    setRecords((prev) => prev.filter((r) => r.id !== recordId))
    if (record) {
      logActivity(user.id, 'extra_lecture', `Removed lecture: ${record.subject} on ${record.date}`, { date: record.date, subject: record.subject })
    }
  }

  return {
    records,
    loading,
    forDate,
    forMonth,
    forSubject,
    generateMonth,
    setStatus,
    markHoliday,
    clearHoliday,
    addExtraLecture,
    deleteRecord,
    refresh
  }
}
