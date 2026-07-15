const DHAKA = 'Asia/Dhaka'

/** YYYY-MM-DD in Asia/Dhaka for a given instant (default now). */
export function dhakaDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: DHAKA }).format(d)
}

/** Add n days to a YYYY-MM-DD string (n may be negative). */
export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Start (Saturday) of the Dhaka week containing iso date. BD week = Sat–Fri. */
export function weekStart(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  const dow = d.getUTCDay() // Sun=0 … Sat=6
  return addDays(iso, -((dow + 1) % 7))
}
