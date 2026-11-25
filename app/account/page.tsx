import Link from 'next/link'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { q } from '@/lib/db'
import { fmtRange, inr } from '@/lib/dates'
import StatusBadge from '@/components/StatusBadge'

export const metadata: Metadata = { title: 'My bookings' }

export default async function Account() {
  const user = await requireRole('organizer')
  const rows = await q<{ id: number; ref: string; event_name: string; venue: string; start_date: string; end_date: string; status: string; total_amount: number | null; paid: number; due: number }>(
    `select b.id,b.ref,b.event_name,v.name as venue,b.start_date,b.end_date,b.status,b.total_amount,
            coalesce((select sum(paid_amount) from installments where booking_id=b.id),0) as paid,
            coalesce((select sum(amount-paid_amount) from installments where booking_id=b.id),0) as due
       from bookings b join venues v on v.id=b.venue_id where b.organizer_id=$1 order by b.created_at desc`, [user.id])
  return (
    <div className="wrap py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>My bookings</h1>
          <p className="text-muted mt-1">{user.name}{user.organisation ? `, ${user.organisation}` : ''}</p>
        </div>
        <Link href="/account/bookings/new" className="btn">New application</Link>
      </div>
      <div className="panel mt-8 overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Reference</th><th>Event</th><th>Venue and dates</th><th>Status</th><th className="num">Amount</th><th className="num">Balance</th></tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td><Link href={`/account/bookings/${b.id}`} className="font-semibold whitespace-nowrap">{b.ref}</Link></td>
                <td>{b.event_name}</td>
                <td>{b.venue}<br /><span className="text-muted">{fmtRange(b.start_date, b.end_date)}</span></td>
                <td><StatusBadge status={b.status} /></td>
                <td className="num">{b.total_amount ? inr(b.total_amount) : '–'}</td>
                <td className="num">{b.total_amount ? inr(b.due) : '–'}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="text-muted py-8 text-center">You have not applied for any venue yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
