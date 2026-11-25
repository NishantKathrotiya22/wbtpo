import type { Metadata } from 'next'
import { Plus } from 'lucide-react'
import { requireRole } from '@/lib/auth'
import { q } from '@/lib/db'
import { fmtRange } from '@/lib/dates'
import { setEventStatus } from '@/lib/actions'
import StatusBadge from '@/components/StatusBadge'
import { Button, DataTable, EmptyState, PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Events' }

export default async function AdminEvents() {
  await requireRole('super_admin', 'booking_manager')
  const rows = await q<any>('select e.*, v.name as venue from events e left join venues v on v.id=e.venue_id order by e.start_date desc')
  return (
    <div>
      <PageHeader eyebrow="Website" title="Events" description="Only events marked Published appear on the public site." actions={<Button href="/admin/events/new"><Plus size={18} aria-hidden />New event</Button>} />
      <DataTable empty={!rows.length && <EmptyState title="No events yet" />}>
        {rows.length > 0 && (<><thead><tr><th>Event</th><th>Dates</th><th>Venue</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{rows.map((e) => (
            <tr key={e.id}>
              <td className="font-semibold">{e.title}</td><td>{fmtRange(e.start_date, e.end_date)}</td><td>{e.venue ?? '–'}</td><td><StatusBadge status={e.status} /></td>
              <td className="whitespace-nowrap"><div className="flex items-center gap-2">
                <Button href={`/admin/events/${e.id}`} variant="secondary" size="sm">Edit</Button>
                {e.status !== 'published' && <form action={setEventStatus.bind(null, e.id, 'published')}><Button size="sm">Publish</Button></form>}
                {e.status === 'published' && <form action={setEventStatus.bind(null, e.id, 'archived')}><Button variant="secondary" size="sm">Archive</Button></form>}
              </div></td>
            </tr>))}</tbody></>)}
      </DataTable>
    </div>
  )
}
