import { useState } from 'react'
import { useMoney } from './useMoney'
import type { MoneyItem } from '../../db/types'

function copyAndOpenWhatsApp(message: string, phone: string) {
  void navigator.clipboard.writeText(message)
  const digits = phone.replace(/[^\d]/g, '')
  window.open(`https://wa.me/${digits}`, '_blank')
}

function RetainerCard({ retainer, isDue, onSave, onMarkPaid }: {
  retainer?: MoneyItem
  isDue: boolean
  onSave: (item: Omit<MoneyItem, 'id'> & { id?: string }) => void
  onMarkPaid: (item: MoneyItem) => void
}) {
  const [editing, setEditing] = useState(!retainer)
  const [name] = useState(retainer?.name ?? 'Noree Jewellery')
  const [amount, setAmount] = useState(retainer?.amount?.toString() ?? '')
  const [nextDue, setNextDue] = useState(retainer?.next_due ?? '')
  const [whatsapp, setWhatsapp] = useState(retainer?.whatsapp ?? '')
  const [message, setMessage] = useState(
    retainer?.message_template ?? 'Hi Noree! Just a friendly reminder — this month’s care fee is due. Let me know once it’s sent, thank you!',
  )

  if (editing) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-night-edge bg-night-raise p-4">
        <h2 className="font-semibold">Noree — retainer care fee</h2>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount (BDT)"
          className="rounded-xl border border-night-edge bg-night px-3 py-2 outline-none focus:border-glow"
        />
        <input
          type="date"
          value={nextDue}
          onChange={(e) => setNextDue(e.target.value)}
          className="rounded-xl border border-night-edge bg-night px-3 py-2 text-ink-dim outline-none focus:border-glow"
        />
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="WhatsApp number (e.g. +8801...)"
          className="rounded-xl border border-night-edge bg-night px-3 py-2 outline-none focus:border-glow"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="resize-none rounded-xl border border-night-edge bg-night px-3 py-2 outline-none focus:border-glow"
        />
        <button
          onClick={() => {
            onSave({
              id: retainer?.id,
              kind: 'retainer',
              name,
              amount: Number(amount) || null,
              currency: 'BDT',
              cycle: 'monthly',
              next_due: nextDue || null,
              remind_days_before: 2,
              message_template: message,
              whatsapp,
              active: true,
            })
            setEditing(false)
          }}
          className="rounded-xl bg-glow px-4 py-2 font-semibold text-night"
        >
          Save
        </button>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-2 rounded-2xl border p-4 ${isDue ? 'border-glow bg-glow/10' : 'border-night-edge bg-night-raise'}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Noree — retainer</h2>
        <button onClick={() => setEditing(true)} className="text-xs text-ink-dim underline">
          edit
        </button>
      </div>
      <p className="text-sm text-ink-dim">
        ৳{retainer!.amount} · due {retainer!.next_due}
      </p>
      {isDue && (
        <div className="mt-1 flex gap-2">
          <button
            onClick={() => copyAndOpenWhatsApp(retainer!.message_template ?? '', retainer!.whatsapp ?? '')}
            className="flex-1 rounded-xl bg-glow px-3 py-2 text-sm font-semibold text-night"
          >
            Copy & open WhatsApp
          </button>
          <button
            onClick={() => onMarkPaid(retainer!)}
            className="rounded-xl border border-night-edge px-3 py-2 text-sm text-ink-dim"
          >
            Mark paid
          </button>
        </div>
      )}
    </div>
  )
}

function SubscriptionRow({ item, isDue, onMarkRenewed }: { item: MoneyItem; isDue: boolean; onMarkRenewed: () => void }) {
  return (
    <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${isDue ? 'border-glow bg-glow/10' : 'border-night-edge bg-night-raise'}`}>
      <div>
        <p className="font-medium">{item.name}</p>
        <p className="text-xs text-ink-dim">
          ৳{item.amount}/{item.cycle === 'yearly' ? 'yr' : 'mo'} · renews {item.next_due}
        </p>
      </div>
      {isDue && (
        <button onClick={onMarkRenewed} className="rounded-lg bg-glow px-3 py-1.5 text-xs font-semibold text-night">
          Renewed
        </button>
      )}
    </div>
  )
}

export default function MoneyScreen() {
  const { retainer, subscriptions, alerts, total, upsertItem, markHandled } = useMoney()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [nextDue, setNextDue] = useState('')

  const alertIds = new Set(alerts.map((a) => a.id))

  async function addSubscription(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await upsertItem({
      kind: 'subscription',
      name: name.trim(),
      amount: Number(amount) || null,
      currency: 'BDT',
      cycle,
      next_due: nextDue || null,
      remind_days_before: 2,
      active: true,
    })
    setName('')
    setAmount('')
    setNextDue('')
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold">Money</h1>

      <div className="rounded-2xl border border-night-edge bg-night-raise p-4 text-center">
        <p className="text-2xl font-bold text-glow">৳{Math.round(total)}</p>
        <p className="text-xs text-ink-dim">your stack, per month</p>
      </div>

      <RetainerCard
        retainer={retainer}
        isDue={!!retainer && alertIds.has(retainer.id)}
        onSave={upsertItem}
        onMarkPaid={markHandled}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-ink-dim">Subscriptions</h2>
        {subscriptions.map((s) => (
          <SubscriptionRow key={s.id} item={s} isDue={alertIds.has(s.id)} onMarkRenewed={() => markHandled(s)} />
        ))}

        <form onSubmit={addSubscription} className="flex flex-wrap gap-2 rounded-xl border border-night-edge bg-night-raise p-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="min-w-[8rem] flex-1 rounded-lg border border-night-edge bg-night px-2 py-1.5 text-sm outline-none focus:border-glow"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="৳"
            className="w-20 rounded-lg border border-night-edge bg-night px-2 py-1.5 text-sm outline-none focus:border-glow"
          />
          <select
            value={cycle}
            onChange={(e) => setCycle(e.target.value as 'monthly' | 'yearly')}
            className="rounded-lg border border-night-edge bg-night px-2 py-1.5 text-sm text-ink-dim outline-none"
          >
            <option value="monthly">monthly</option>
            <option value="yearly">yearly</option>
          </select>
          <input
            type="date"
            value={nextDue}
            onChange={(e) => setNextDue(e.target.value)}
            className="rounded-lg border border-night-edge bg-night px-2 py-1.5 text-sm text-ink-dim outline-none"
          />
          <button type="submit" className="rounded-lg bg-glow px-3 py-1.5 text-sm font-semibold text-night">
            Add
          </button>
        </form>
      </section>
    </div>
  )
}
