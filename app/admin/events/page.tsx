import Link from 'next/link'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { q } from '@/lib/db'
import { fmtRange } from '@/lib/dates'
import { setEventStatus } from '@/lib/actions'
import StatusBadge from '@/components/StatusBadge'

export const metadata: Metadata = { title: 'Events' }

export default async function AdminEvents() {
  await requireRole('super_admin', 'booking_manager')
  const rows = await q<any>('select e.*, v.name as venue from events e left join venues v on v.id=e.venue_id order by e.start_date desc')
  return (
    <div>
      <div className="flex items-center justify-between"><h1>Events</h1><Link href="/admin/events/new" className="btn">New event</Link></div>
      <div className="panel mt-6 overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Event</th><th>Dates</th><th>Venue</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td className="font-semibold">{e.title}</td><td>{fmtRange(e.start_date, e.end_date)}</td><td>{e.venue ?? '–'}</td><td><StatusBadge status={e.status} /></td>
                <td className="whitespace-nowrap space-x-4">
                  <Link href={`/admin/events/${e.id}`}>Edit</Link>
                  {e.status !== 'published' && <form className="inline" action={setEventStatus.bind(null, e.id, 'published')}><button className="text-brick hover:underline cursor-pointer">Publish</button></form>}
                  {e.status === 'published' && <form className="inline" action={setEventStatus.bind(null, e.id, 'archived')}><button className="text-brick hover:underline cursor-pointer">Archive</button></form>}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="text-muted py-6 text-center">No events yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
