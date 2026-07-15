import { addDays } from '../../lib/dates'
import type { MoneyItem } from '../../db/types'

/** Items whose reminder window has opened (today is within remind_days_before of next_due) but hasn't lapsed. */
export function dueSoon(items: MoneyItem[], today: string): MoneyItem[] {
  return items.filter((i) => {
    if (!i.active || !i.next_due) return false
    const windowStart = addDays(i.next_due, -i.remind_days_before)
    return windowStart <= today && today <= i.next_due
  })
}

/** ৳/month across all active items — yearly items are divided by 12. */
export function monthlyTotal(items: MoneyItem[]): number {
  return items
    .filter((i) => i.active && i.amount)
    .reduce((sum, i) => sum + (i.cycle === 'yearly' ? (i.amount ?? 0) / 12 : (i.amount ?? 0)), 0)
}

/** Advance next_due by one billing cycle after marking an item paid/renewed. */
export function advanceCycle(item: MoneyItem): string {
  if (!item.next_due) return addDays(new Date().toISOString().slice(0, 10), item.cycle === 'yearly' ? 365 : 30)
  return addDays(item.next_due, item.cycle === 'yearly' ? 365 : 30)
}
