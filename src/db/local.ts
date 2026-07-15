import Dexie, { type Table } from 'dexie'
import type {
  Checkin,
  Habit,
  MoneyItem,
  OutboxOp,
  Profile,
  Prospect,
  ShieldUse,
  TaskItem,
  WeeklyReview,
} from './types'

export class BetterMeDB extends Dexie {
  habits!: Table<Habit, string>
  checkins!: Table<Checkin, string> // key = local_id
  tasks!: Table<TaskItem, string> // key = local_id
  money!: Table<MoneyItem, string>
  prospects!: Table<Prospect, string>
  reviews!: Table<WeeklyReview, string>
  profile!: Table<Profile, string>
  shield_uses!: Table<ShieldUse, string> // key = date
  outbox!: Table<OutboxOp, number>

  constructor() {
    super('betterme')
    this.version(1).stores({
      habits: 'id, slug, sort',
      checkins: 'local_id, [habit_id+date], date',
      tasks: 'local_id, done, due_date',
      money: 'id, kind, next_due',
      prospects: 'id, stage, next_touch',
      reviews: 'id, week_start',
      profile: 'id',
      shield_uses: 'date',
      outbox: '++seq, table',
    })
  }
}

export const db = new BetterMeDB()
