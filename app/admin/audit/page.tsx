import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { q } from '@/lib/db'
import { fmtStamp } from '@/lib/dates'

export const metadata: Metadata = { title: 'Audit trail' }

export default async function Audit() {
  await requireRole('super_admin')
  const rows = await q<any>(`select a.*, u.name as actor from audit_log a left join users u on u.id=a.actor_id order by a.id desc limit 300`)
  return (
    <div>
      <h1>Audit trail</h1>
      <p className="mt-2 text-muted">Most recent 300 actions on bookings, the calendar, content and settings.</p>
      <div className="panel mt-6 overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>When</th><th>Who</th><th>What</th><th>Detail</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}><td className="whitespace-nowrap">{fmtStamp(r.created_at)}</td><td>{r.actor ?? 'Organizer / system'}</td><td className="capitalize">{r.entity} #{r.entity_id ?? '–'} · {r.action}</td><td>{r.detail}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
