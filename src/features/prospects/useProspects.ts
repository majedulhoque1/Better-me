import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/local'
import { enqueue } from '../../db/sync'
import { supabase } from '../../lib/supabase'
import { dhakaDate } from '../../lib/dates'
import { overdue } from './prospects'
import type { Prospect } from '../../db/types'

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) throw new Error('not signed in')
  return userId
}

const STAGES: Prospect['stage'][] = ['lead', 'contacted', 'in_talks', 'won', 'lost']

export function useProspects() {
  const prospects = useLiveQuery(() => db.prospects.toArray(), []) ?? []
  const today = dhakaDate()
  const overdueProspects = overdue(prospects, today)

  const byStage = STAGES.map((stage) => ({
    stage,
    items: prospects.filter((p) => p.stage === stage),
  }))

  async function upsertProspect(p: Omit<Prospect, 'id' | 'updated_at'> & { id?: string }) {
    const userId = await currentUserId()
    const id = p.id ?? crypto.randomUUID()
    const updated_at = new Date().toISOString()
    const record: Prospect = { ...p, id, updated_at }
    await db.prospects.put(record)
    await enqueue(db, 'prospects', 'upsert', { user_id: userId, ...record })
  }

  return { prospects, byStage, overdueProspects, upsertProspect }
}
