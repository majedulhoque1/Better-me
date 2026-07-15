export interface Profile {
  id: string
  display_name: string
  xp: number
  shields: number
  /** Local-only bookkeeping: last date processed by the rollover routine. */
  last_evaluated_date?: string
}

export interface Habit {
  id: string
  user_id?: string
  name: string
  slug: string
  evidence_type: 'note' | 'count'
  target_count: number | null
  active: boolean
  sort: number
}

export interface Checkin {
  local_id: string
  id?: string
  user_id?: string
  habit_id: string
  date: string
  note?: string | null
  count?: number | null
  base_xp: number
  bonus_xp?: number
  created_at?: string
}

export interface TaskItem {
  local_id: string
  id?: string
  user_id?: string
  title: string
  due_date?: string | null
  done: boolean
  done_at?: string | null
  created_at?: string
}

export interface MoneyItem {
  id: string
  user_id?: string
  kind: 'retainer' | 'subscription'
  name: string
  amount?: number | null
  currency: string
  cycle: 'monthly' | 'yearly'
  next_due?: string | null
  remind_days_before: number
  message_template?: string | null
  whatsapp?: string | null
  active: boolean
}

export interface Prospect {
  id: string
  user_id?: string
  name: string
  source?: string | null
  note?: string | null
  stage: 'lead' | 'contacted' | 'in_talks' | 'won' | 'lost'
  deal_value?: number | null
  proposal_status: 'none' | 'draft' | 'sent' | 'won' | 'lost'
  next_touch?: string | null
  created_at?: string
  updated_at?: string
}

export interface WeeklyReview {
  id: string
  user_id?: string
  week_start: string
  review_md: string
  bonus_xp: number
  stats: Record<string, unknown>
}

/** Local-only: dates on which a shield was consumed (streak math input). */
export interface ShieldUse {
  date: string
}

export interface OutboxOp {
  seq?: number
  table: 'checkins' | 'tasks' | 'money_items' | 'prospects' | 'profiles'
  op: 'upsert' | 'delete'
  payload: Record<string, unknown>
}
