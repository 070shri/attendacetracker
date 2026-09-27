import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

/** Manages the single active `terms` row for the current user. */
export function useTerm() {
  const { user } = useAuth()
  const [term, setTerm] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('terms')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) console.error(error)
    setTerm(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createTerm = async ({ termMonths, syllabusMonths, examMonths }) => {
    const { data, error } = await supabase
      .from('terms')
      .insert({
        user_id: user.id,
        term_months: termMonths,
        syllabus_months: syllabusMonths,
        exam_months: examMonths,
        start_date: new Date().toISOString().slice(0, 10)
      })
      .select()
      .single()
    if (error) throw error
    setTerm(data)
    return data
  }

  return { term, loading, createTerm, refresh }
}
