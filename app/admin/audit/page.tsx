import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { q } from '@/lib/db'
import { fmtStamp } from '@/lib/dates'
import { DataTable, PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Audit trail' }

export default async function Audit() {
  await requireRole('super_admin')
  const rows = await q<any>(`select a.*, u.name as actor from audit_log a left join users u on u.id=a.actor_id order by a.id desc limit 300`)
  return (
    <div>
      <PageHeader eyebrow="Control" title="Audit trail" description="The latest 300 actions on bookings, the calendar, website content and settings." />
      <DataTable>
        <thead><tr><th>When</th><th>Who</th><th>What</th><th>Detail</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id}><td className="whitespace-nowrap">{fmtStamp(r.created_at)}</td><td>{r.actor ?? 'Organizer or system'}</td><td className="capitalize">{r.entity} #{r.entity_id ?? '–'} · {r.action}</td><td>{r.detail}</td></tr>))}</tbody>
      </DataTable>
    </div>
  )
}
