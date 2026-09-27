import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { logActivity } from '../lib/activityLog'
import { WEEKDAY_LABELS } from '../utils/dateHelpers'

/**
 * CRUD over `timetable_slots` (the repeating weekly template).
 * Returns slots grouped by weekday (0=Mon..4=Fri) plus flat list + helpers.
 */
export function useTimetable() {
  const { user } = useAuth()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('timetable_slots')
      .select('*')
      .eq('user_id', user.id)
      .order('weekday', { ascending: true })
      .order('position', { ascending: true })
    if (error) console.error(error)
    setSlots(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const byWeekday = (weekday) => slots.filter((s) => s.weekday === weekday)

  const addSlot = async (weekday, slot) => {
    const position = byWeekday(weekday).length
    const { data, error } = await supabase
      .from('timetable_slots')
      .insert({ user_id: user.id, weekday, position, ...slot })
      .select()
      .single()
    if (error) throw error
    setSlots((prev) => [...prev, data])
    logActivity(user.id, 'timetable', `Added ${slot.subject} to ${WEEKDAY_LABELS[weekday]}'s timetable`, { weekday, subject: slot.subject })
    return data
  }

  const updateSlot = async (id, patch) => {
    const before = slots.find((s) => s.id === id)
    const { data, error } = await supabase
      .from('timetable_slots')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setSlots((prev) => prev.map((s) => (s.id === id ? data : s)))
    if (before) {
      logActivity(user.id, 'timetable', `Updated ${data.subject} on ${WEEKDAY_LABELS[data.weekday]}`, { weekday: data.weekday, subject: data.subject })
    }
    return data
  }

  const deleteSlot = async (id) => {
    const slot = slots.find((s) => s.id === id)
    const { error } = await supabase.from('timetable_slots').delete().eq('id', id)
    if (error) throw error
    setSlots((prev) => prev.filter((s) => s.id !== id))
    if (slot) {
      logActivity(user.id, 'timetable', `Removed ${slot.subject} from ${WEEKDAY_LABELS[slot.weekday]}'s timetable`, { weekday: slot.weekday, subject: slot.subject })
    }
  }

  /** Persist a new order for one weekday's slots (drag-and-drop). */
  const reorderDay = async (weekday, orderedIds) => {
    const updates = orderedIds.map((id, position) => ({ id, position }))
    setSlots((prev) =>
      prev.map((s) => {
        const hit = updates.find((u) => u.id === s.id)
        return hit ? { ...s, position: hit.position } : s
      })
    )
    await Promise.all(
      updates.map((u) => supabase.from('timetable_slots').update({ position: u.position }).eq('id', u.id))
    )
    logActivity(user.id, 'timetable', `Reordered ${WEEKDAY_LABELS[weekday]}'s timetable`, { weekday })
  }

  /** Copy Monday..Friday's slots from another day into `toWeekday`. */
  const copyFromDay = async (fromWeekday, toWeekday) => {
    const source = byWeekday(fromWeekday)
    // wipe existing slots on target day first
    const existing = byWeekday(toWeekday)
    await Promise.all(existing.map((s) => supabase.from('timetable_slots').delete().eq('id', s.id)))
    const inserts = source.map((s, i) => ({
      user_id: user.id,
      weekday: toWeekday,
      position: i,
      subject: s.subject,
      type: s.type,
      start_time: s.start_time,
      end_time: s.end_time
    }))
    if (inserts.length) {
      const { error } = await supabase.from('timetable_slots').insert(inserts)
      if (error) throw error
    }
    await refresh()
    logActivity(user.id, 'timetable', `Copied ${WEEKDAY_LABELS[fromWeekday]}'s timetable to ${WEEKDAY_LABELS[toWeekday]}`, { fromWeekday, toWeekday })
  }

  return { slots, byWeekday, loading, addSlot, updateSlot, deleteSlot, reorderDay, copyFromDay, refresh }
}
