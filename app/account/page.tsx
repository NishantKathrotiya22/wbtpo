import Link from 'next/link'
import type { Metadata } from 'next'
import { Plus } from 'lucide-react'
import { requireRole } from '@/lib/auth'
import { q } from '@/lib/db'
import { fmtRange, inr } from '@/lib/dates'
import StatusBadge from '@/components/StatusBadge'
import { Alert, Button, DataTable, EmptyState, Page, PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'My bookings' }

export default async function Account() {
  const user = await requireRole('organizer')
  const rows = await q<any>(
    `select b.id,b.ref,b.event_name,v.name as venue,b.start_date,b.end_date,b.status,b.total_amount,
            coalesce((select sum(amount-paid_amount) from installments where booking_id=b.id),0) as due
       from bookings b join venues v on v.id=b.venue_id where b.organizer_id=$1 order by b.created_at desc`, [user.id])
  const payNow = rows.filter((b) => b.status === 'approved' || (b.status === 'confirmed' && b.due > 0))
  return (
    <Page>
      <PageHeader eyebrow={user.organisation ?? 'Organizer'} title={`Welcome, ${user.name.split(' ')[0]}`} description="Your venue applications and their progress are listed here."
        actions={<Button href="/account/bookings/new"><Plus size={18} aria-hidden />New application</Button>} />
      {payNow.length > 0 && (
        <Alert tone="warn" title="Payment needed" className="mb-6">
          {payNow.length === 1 ? 'One booking has' : `${payNow.length} bookings have`} a payment due. Open the booking to see the amount and due date.
        </Alert>
      )}
      <DataTable empty={!rows.length && <EmptyState title="You have not applied for a venue yet" action={<Button href="/account/bookings/new">Start your first application</Button>}>It takes about ten minutes. You can check dates first.</EmptyState>}>
        {rows.length > 0 && (
          <>
            <thead><tr><th>Reference</th><th>Event</th><th>Venue and dates</th><th>Status</th><th className="num">Balance</th></tr></thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td><Link href={`/account/bookings/${b.id}`} className="font-bold whitespace-nowrap">{b.ref}</Link></td>
                  <td className="font-semibold">{b.event_name}</td>
                  <td>{b.venue}<br /><span className="text-muted">{fmtRange(b.start_date, b.end_date)}</span></td>
                  <td><StatusBadge status={b.status} /></td>
                  <td className="num">{b.total_amount ? inr(b.due) : '–'}</td>
                </tr>
              ))}
            </tbody>
          </>
        )}
      </DataTable>
    </Page>
  )
}
