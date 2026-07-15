import { useState } from 'react'
import { useTasks } from './useTasks'
import type { TaskItem } from '../../db/types'

function Row({ task, onToggle, onDelete }: { task: TaskItem; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-night-edge bg-night-raise px-4 py-3">
      <button
        onClick={onToggle}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs ${
          task.done ? 'border-glow bg-glow text-night' : 'border-night-edge'
        }`}
      >
        {task.done && '✔'}
      </button>
      <div className="flex-1">
        <p className={task.done ? 'text-ink-dim line-through' : ''}>{task.title}</p>
        {task.due_date && !task.done && <p className="text-xs text-ink-dim">{task.due_date}</p>}
      </div>
      <button onClick={onDelete} className="text-ink-dim">
        ✕
      </button>
    </div>
  )
}

export default function TasksScreen() {
  const { dueToday, overdue, later, done, addTask, toggleDone, removeTask } = useTasks()
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await addTask(title.trim(), dueDate || undefined)
    setTitle('')
    setDueDate('')
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold">Tasks</h1>

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task"
          className="flex-1 rounded-xl border border-night-edge bg-night-raise px-3 py-2 text-ink outline-none focus:border-glow"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-xl border border-night-edge bg-night-raise px-2 py-2 text-sm text-ink-dim outline-none"
        />
        <button type="submit" className="rounded-xl bg-glow px-4 py-2 font-semibold text-night">
          +
        </button>
      </form>

      {overdue.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-danger">Overdue</h2>
          {overdue.map((t) => (
            <Row key={t.local_id} task={t} onToggle={() => toggleDone(t)} onDelete={() => removeTask(t)} />
          ))}
        </section>
      )}

      {dueToday.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-ink-dim">Today</h2>
          {dueToday.map((t) => (
            <Row key={t.local_id} task={t} onToggle={() => toggleDone(t)} onDelete={() => removeTask(t)} />
          ))}
        </section>
      )}

      {later.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-ink-dim">Later</h2>
          {later.map((t) => (
            <Row key={t.local_id} task={t} onToggle={() => toggleDone(t)} onDelete={() => removeTask(t)} />
          ))}
        </section>
      )}

      {done.length > 0 && (
        <details className="flex flex-col gap-2">
          <summary className="cursor-pointer text-sm font-semibold text-ink-dim">Done ({done.length})</summary>
          <div className="mt-2 flex flex-col gap-2">
            {done.map((t) => (
              <Row key={t.local_id} task={t} onToggle={() => toggleDone(t)} onDelete={() => removeTask(t)} />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
