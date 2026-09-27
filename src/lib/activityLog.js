import { supabase } from './supabaseClient'

/**
 * Writes one row to `activity_log`. This is a plain factual record of
 * what happened and when — no AI involved, just the app noting its own
 * state changes as they happen. Failures are logged to the console and
 * swallowed so a logging hiccup never blocks the actual user action.
 */
export async function logActivity(userId, type, description, metadata = null) {
  if (!userId) return
  try {
    const { error } = await supabase
      .from('activity_log')
      .insert({ user_id: userId, type, description, metadata })
    if (error) console.error('activity log failed', error)
  } catch (err) {
    console.error('activity log failed', err)
  }
}
