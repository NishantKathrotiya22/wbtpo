import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { q } from '@/lib/db'
import { fmtRange, inr } from '@/lib/dates'
import StatusBadge from '@/components/StatusBadge'

export const metadata: Metadata = { title: 'Bookings' }
const STATUSES = ['submitted', 'under_scrutiny', 'provisional', 'approved', 'confirmed', 'completed', 'rejected', 'cancelled']

export default async function Bookings({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdmin()
  const sp = await searchParams
  const status = STATUSES.includes(sp.status ?? '') ? sp.status! : null
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
      <h1>Bookings</h1>
      <form className="mt-5 flex flex-wrap gap-3 items-end">
        <label className="field"><span>Status</span>
          <select name="status" defaultValue={status ?? ''} className="input">
            <option value="">All</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select></label>
        <label className="field"><span>Search</span><input name="q" defaultValue={term} placeholder="Reference, event or organizer" className="input" /></label>
        <button className="btn btn-quiet">Filter</button>
      </form>
      <div className="panel mt-5 overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Reference</th><th>Organizer</th><th>Event</th><th>Status</th><th className="num">Amount</th><th className="num">Balance</th></tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td><Link href={`/admin/bookings/${b.id}`} className="font-semibold whitespace-nowrap">{b.ref}</Link></td>
                <td>{b.organizer}{b.organisation && <><br /><span className="text-muted">{b.organisation}</span></>}</td>
                <td>{b.event_name}<br /><span className="text-muted">{b.venue}, {fmtRange(b.start_date, b.end_date)}</span></td>
                <td><StatusBadge status={b.status} /></td>
                <td className="num">{b.total_amount ? inr(b.total_amount) : '–'}</td>
                <td className="num">{b.total_amount ? inr(b.due) : '–'}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="text-muted py-8 text-center">No bookings match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
