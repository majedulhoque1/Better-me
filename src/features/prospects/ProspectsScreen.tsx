import { useState } from 'react'
import { useProspects } from './useProspects'
import type { Prospect } from '../../db/types'

const STAGE_LABEL: Record<Prospect['stage'], string> = {
  lead: 'Lead',
  contacted: 'Contacted',
  in_talks: 'In Talks',
  won: 'Won',
  lost: 'Lost',
}

const PROPOSAL_LABEL: Record<Prospect['proposal_status'], string> = {
  none: '—',
  draft: 'Draft',
  sent: 'Sent',
  won: 'Won',
  lost: 'Lost',
}

function ProspectCard({ p, onEdit }: { p: Prospect; onEdit: () => void }) {
  const isOverdue = !!p.next_touch && p.next_touch < new Date().toISOString().slice(0, 10) && p.stage !== 'won' && p.stage !== 'lost'
  return (
    <button
      onClick={onEdit}
      className={`flex flex-col gap-1 rounded-xl border px-4 py-3 text-left ${isOverdue ? 'border-danger/50 bg-danger/5' : 'border-night-edge bg-night-raise'}`}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold">{p.name}</p>
        {p.deal_value != null && <p className="text-sm text-glow">৳{p.deal_value}</p>}
      </div>
      {p.note && <p className="truncate text-xs text-ink-dim">{p.note}</p>}
      <div className="flex items-center gap-2 text-xs text-ink-dim">
        <span className="rounded-full border border-night-edge px-2 py-0.5">{PROPOSAL_LABEL[p.proposal_status]}</span>
        {p.next_touch && <span className={isOverdue ? 'text-danger' : ''}>next: {p.next_touch}</span>}
      </div>
    </button>
  )
}

function EditSheet({ prospect, onClose, onSave }: {
  prospect: Partial<Prospect> | null
  onClose: () => void
  onSave: (p: Omit<Prospect, 'id' | 'updated_at'> & { id?: string }) => void
}) {
  const [name, setName] = useState(prospect?.name ?? '')
  const [source, setSource] = useState(prospect?.source ?? '')
  const [note, setNote] = useState(prospect?.note ?? '')
  const [stage, setStage] = useState<Prospect['stage']>(prospect?.stage ?? 'lead')
  const [dealValue, setDealValue] = useState(prospect?.deal_value?.toString() ?? '')
  const [proposalStatus, setProposalStatus] = useState<Prospect['proposal_status']>(prospect?.proposal_status ?? 'none')
  const [nextTouch, setNextTouch] = useState(prospect?.next_touch ?? '')

  if (!prospect) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={onClose}>
      <div
        className="flex w-full flex-col gap-3 rounded-t-3xl border-t border-night-edge bg-night-raise p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">{prospect.id ? 'Edit prospect' : 'New prospect'}</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="rounded-xl border border-night-edge bg-night px-3 py-2 outline-none focus:border-glow"
        />
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Where found (referral, cold outreach, ...)"
          className="rounded-xl border border-night-edge bg-night px-3 py-2 outline-none focus:border-glow"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="One-line note"
          rows={2}
          className="resize-none rounded-xl border border-night-edge bg-night px-3 py-2 outline-none focus:border-glow"
        />
        <div className="flex gap-2">
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as Prospect['stage'])}
            className="flex-1 rounded-xl border border-night-edge bg-night px-3 py-2 text-ink-dim outline-none"
          >
            {Object.entries(STAGE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={proposalStatus}
            onChange={(e) => setProposalStatus(e.target.value as Prospect['proposal_status'])}
            className="flex-1 rounded-xl border border-night-edge bg-night px-3 py-2 text-ink-dim outline-none"
          >
            {Object.entries(PROPOSAL_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={dealValue}
            onChange={(e) => setDealValue(e.target.value)}
            placeholder="Deal value (৳)"
            className="flex-1 rounded-xl border border-night-edge bg-night px-3 py-2 outline-none focus:border-glow"
          />
          <input
            type="date"
            value={nextTouch}
            onChange={(e) => setNextTouch(e.target.value)}
            className="flex-1 rounded-xl border border-night-edge bg-night px-3 py-2 text-ink-dim outline-none"
          />
        </div>
        <button
          onClick={() => {
            onSave({
              id: prospect.id,
              name: name.trim(),
              source: source || null,
              note: note || null,
              stage,
              deal_value: Number(dealValue) || null,
              proposal_status: proposalStatus,
              next_touch: nextTouch || null,
            })
            onClose()
          }}
          className="mt-1 rounded-xl bg-glow px-4 py-3 font-semibold text-night"
        >
          Save
        </button>
      </div>
    </div>
  )
}

export default function ProspectsScreen() {
  const { byStage, upsertProspect } = useProspects()
  const [editing, setEditing] = useState<Partial<Prospect> | null>(null)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">MIV Prospects</h1>
        <button onClick={() => setEditing({})} className="rounded-xl bg-glow px-3 py-1.5 text-sm font-semibold text-night">
          + New
        </button>
      </div>

      {byStage.map(
        ({ stage, items }) =>
          items.length > 0 && (
            <section key={stage} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-ink-dim">
                {STAGE_LABEL[stage]} ({items.length})
              </h2>
              {items.map((p) => (
                <ProspectCard key={p.id} p={p} onEdit={() => setEditing(p)} />
              ))}
            </section>
          ),
      )}

      <EditSheet prospect={editing} onClose={() => setEditing(null)} onSave={upsertProspect} />
    </div>
  )
}
