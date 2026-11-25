import Link from 'next/link'
import type { Metadata } from 'next'
import { Search } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { q } from '@/lib/db'
import { fmtRange, inr } from '@/lib/dates'
import StatusBadge from '@/components/StatusBadge'
import { Button, Card, DataTable, EmptyState, PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Bookings' }
const STATUSES: [string, string][] = [['submitted', 'Applied'], ['under_scrutiny', 'Under review'], ['provisional', 'Dates held'], ['approved', 'Approved, advance due'], ['confirmed', 'Confirmed'], ['completed', 'Completed'], ['rejected', 'Not approved'], ['cancelled', 'Cancelled']]

export default async function Bookings({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdmin()
  const sp = await searchParams
  const status = STATUSES.some(([s]) => s === sp.status) ? sp.status! : null
  const term = (sp.q ?? '').trim()
  const rows = await q<any>(
    `select b.id,b.ref,b.event_name,b.status,b.start_date,b.end_date,b.total_amount,v.name as venue,u.name as organizer,u.organisation,
            coalesce((select sum(amount-paid_amount) from installments where booking_id=b.id),0) as due
       from bookings b join venues v on v.id=b.venue_id join users u on u.id=b.organizer_id
      where ($1::text is null or b.status=$1)
        and ($2='' or b.ref ilike '%'||$2||'%' or b.event_name ilike '%'||$2||'%' or u.name ilike '%'||$2||'%' or u.organisation ilike '%'||$2||'%')
      order by b.created_at desc limit 200`, [status, term])
  return (
    <div>
      <PageHeader eyebrow="Bookings" title="All bookings" description="Open a booking to see its next step." />
      <Card className="mb-6">
        <form className="flex flex-wrap gap-4 items-end">
          <label className="field"><span>Show</span>
            <select name="status" defaultValue={status ?? ''} className="input"><option value="">Every status</option>{STATUSES.map(([s, l]) => <option key={s} value={s}>{l}</option>)}</select></label>
          <label className="field flex-1 min-w-[14rem]"><span>Search</span><input name="q" defaultValue={term} placeholder="Reference, event or organizer name" className="input" /></label>
          <Button><Search size={18} aria-hidden />Search</Button>
          {(status || term) && <Button href="/admin/bookings" variant="secondary">Clear</Button>}
        </form>
      </Card>
      <DataTable empty={!rows.length && <EmptyState title="No bookings match">Try a different status or clear the search.</EmptyState>}>
        {rows.length > 0 && (<><thead><tr><th>Reference</th><th>Organizer</th><th>Event</th><th>Status</th><th className="num">Amount</th><th className="num">Balance</th></tr></thead>
          <tbody>{rows.map((b) => (
            <tr key={b.id}>
              <td><Link href={`/admin/bookings/${b.id}`} className="font-bold whitespace-nowrap">{b.ref}</Link></td>
              <td>{b.organizer}{b.organisation && <><br /><span className="text-muted">{b.organisation}</span></>}</td>
              <td>{b.event_name}<br /><span className="text-muted">{b.venue}, {fmtRange(b.start_date, b.end_date)}</span></td>
              <td><StatusBadge status={b.status} /></td>
              <td className="num">{b.total_amount ? inr(b.total_amount) : '–'}</td>
              <td className="num">{b.total_amount ? inr(b.due) : '–'}</td>
            </tr>))}</tbody></>)}
      </DataTable>
    </div>
  )
}
