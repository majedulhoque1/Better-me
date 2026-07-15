import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/local'
import { enqueue } from '../../db/sync'
import { supabase } from '../../lib/supabase'
import { dhakaDate } from '../../lib/dates'
import { dueSoon, monthlyTotal, advanceCycle } from './money'
import type { MoneyItem } from '../../db/types'

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) throw new Error('not signed in')
  return userId
}

export function useMoney() {
  const items = useLiveQuery(() => db.money.toArray(), []) ?? []
  const today = dhakaDate()

  const retainer = items.find((i) => i.kind === 'retainer')
  const subscriptions = items.filter((i) => i.kind === 'subscription')
  const alerts = dueSoon(items, today)
  const total = monthlyTotal(items)

  async function upsertItem(item: Omit<MoneyItem, 'id'> & { id?: string }) {
    const userId = await currentUserId()
    const id = item.id ?? crypto.randomUUID()
    const record: MoneyItem = { ...item, id }
    await db.money.put(record)
    await enqueue(db, 'money_items', 'upsert', { user_id: userId, ...record })
  }

  async function markHandled(item: MoneyItem) {
    const nextDue = advanceCycle(item)
    await upsertItem({ ...item, next_due: nextDue })
  }

  return { items, retainer, subscriptions, alerts, total, upsertItem, markHandled }
}
