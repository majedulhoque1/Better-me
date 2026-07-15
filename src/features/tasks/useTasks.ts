import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/local'
import { enqueue } from '../../db/sync'
import { supabase } from '../../lib/supabase'
import { dhakaDate } from '../../lib/dates'
import { TASK_XP } from '../../game/xp'
import type { TaskItem } from '../../db/types'

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) throw new Error('not signed in')
  return userId
}

async function bumpProfileXp(delta: number) {
  const profile = await db.profile.toCollection().first()
  if (!profile) return
  const nextXp = profile.xp + delta
  await db.profile.update(profile.id, { xp: nextXp })
  await enqueue(db, 'profiles', 'upsert', { id: profile.id, xp: nextXp, shields: profile.shields })
}

export function useTasks() {
  const tasks = useLiveQuery(() => db.tasks.orderBy('due_date').toArray(), []) ?? []

  const today = dhakaDate()
  const dueToday = tasks.filter((t) => !t.done && t.due_date === today)
  const overdue = tasks.filter((t) => !t.done && t.due_date && t.due_date < today)
  const later = tasks.filter((t) => !t.done && (!t.due_date || t.due_date > today))
  const done = tasks.filter((t) => t.done)

  async function addTask(title: string, dueDate?: string) {
    const userId = await currentUserId()
    const localId = crypto.randomUUID()
    const record: TaskItem = { local_id: localId, title, due_date: dueDate ?? null, done: false }
    await db.tasks.put(record)
    await enqueue(db, 'tasks', 'upsert', { user_id: userId, ...record })
  }

  async function toggleDone(task: TaskItem) {
    const userId = await currentUserId()
    const done = !task.done
    const doneAt = done ? new Date().toISOString() : null
    await db.tasks.update(task.local_id, { done, done_at: doneAt })
    await enqueue(db, 'tasks', 'upsert', { user_id: userId, ...task, done, done_at: doneAt })
    await bumpProfileXp(done ? TASK_XP : -TASK_XP)
  }

  async function removeTask(task: TaskItem) {
    const userId = await currentUserId()
    await db.tasks.delete(task.local_id)
    await enqueue(db, 'tasks', 'delete', { user_id: userId, local_id: task.local_id })
  }

  return { dueToday, overdue, later, done, addTask, toggleDone, removeTask }
}
