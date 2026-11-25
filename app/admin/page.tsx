import Link from 'next/link'
import type { Metadata } from 'next'
import { q, one } from '@/lib/db'
import { fmtDate, fmtRange, inr, todayIST } from '@/lib/dates'
import StatusBadge from '@/components/StatusBadge'

export const metadata: Metadata = { title: 'Dashboard' }

const Stat = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="panel p-4">
    <p className="eyebrow">{label}</p>
    <p className="font-serif text-3xl mt-1 tabular-nums">{value}</p>
    {sub && <p className="text-sm text-muted">{sub}</p>}
  </div>
)

export default async function Dashboard() {
  const t = todayIST()
  const [c, money, queue, overdue, upcoming] = await Promise.all([
    one<{ pending: number; awaiting: number; soon: number }>(
      `select count(*) filter (where status in ('submitted','under_scrutiny')) as pending,
              count(*) filter (where status in ('provisional','approved')) as awaiting,
              count(*) filter (where status='confirmed' and start_date between $1::date and $1::date + 30) as soon from bookings`, [t]),
    one<{ collected: number; outstanding: number; overdue: number }>(
      `select coalesce(sum(i.paid_amount),0) as collected,
              coalesce(sum(i.amount-i.paid_amount),0) as outstanding,
              coalesce(sum(i.amount-i.paid_amount) filter (where i.due_date < $1::date),0) as overdue
         from installments i join bookings b on b.id=i.booking_id where b.status in ('approved','confirmed','completed')`, [t]),
    q<any>(`select b.id,b.ref,b.event_name,b.status,b.start_date,b.end_date,v.name as venue,u.name as organizer from bookings b
              join venues v on v.id=b.venue_id join users u on u.id=b.organizer_id
             where b.status in ('submitted','under_scrutiny') order by b.created_at limit 8`),
    q<any>(`select i.id,i.label,i.amount-i.paid_amount as due,i.due_date,b.id as booking_id,b.ref,u.name as organizer from installments i
              join bookings b on b.id=i.booking_id join users u on u.id=b.organizer_id
             where i.paid_amount < i.amount and i.due_date < $1::date and b.status in ('approved','confirmed') order by i.due_date limit 8`, [t]),
    q<any>(`select b.id,b.ref,b.event_name,b.start_date,b.end_date,v.name as venue from bookings b join venues v on v.id=b.venue_id
             where b.status='confirmed' and b.end_date >= $1::date order by b.start_date limit 6`, [t]),
  ])
  return (
    <div>
      <h1>Dashboard</h1>
      <div className="mt-6 grid gap-4 grid-cols-2 xl:grid-cols-4">
        <Stat label="Awaiting scrutiny" value={c!.pending} sub="submitted applications" />
        <Stat label="Dates on hold" value={c!.awaiting} sub="approval or payment pending" />
        <Stat label="Events in 30 days" value={c!.soon} sub="confirmed bookings" />
        <Stat label="Outstanding" value={inr(money!.outstanding)} sub={`${inr(money!.overdue)} overdue · ${inr(money!.collected)} collected`} />
      </div>

      <div className="mt-10 grid gap-10 xl:grid-cols-2">
        <section>
          <h2 className="mb-3">Applications to review</h2>
          <div className="panel overflow-x-auto">
            <table className="tbl">
              <tbody>
                {queue.map((b: any) => (
                  <tr key={b.id}>
                    <td><Link href={`/admin/bookings/${b.id}`} className="font-semibold">{b.ref}</Link><br /><span className="text-muted">{b.organizer}</span></td>
                    <td>{b.event_name}<br /><span className="text-muted">{b.venue}, {fmtRange(b.start_date, b.end_date)}</span></td>
                    <td><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
                {!queue.length && <tr><td className="text-muted py-6">Nothing is waiting for review.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <h2 className="mb-3">Overdue instalments</h2>
          <div className="panel overflow-x-auto">
            <table className="tbl">
              <tbody>
                {overdue.map((i: any) => (
                  <tr key={i.id}>
                    <td><Link href={`/admin/bookings/${i.booking_id}`} className="font-semibold">{i.ref}</Link><br /><span className="text-muted">{i.organizer}</span></td>
                    <td>{i.label}<br /><span className="text-muted">due {fmtDate(i.due_date)}</span></td>
                    <td className="num text-bad font-semibold">{inr(i.due)}</td>
                  </tr>
                ))}
                {!overdue.length && <tr><td className="text-muted py-6">No payments are overdue.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="mb-3">Upcoming confirmed bookings</h2>
        <div className="panel overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Dates</th><th>Event</th><th>Venue</th><th>Reference</th></tr></thead>
            <tbody>
              {upcoming.map((b: any) => (
                <tr key={b.id}><td>{fmtRange(b.start_date, b.end_date)}</td><td>{b.event_name}</td><td>{b.venue}</td><td><Link href={`/admin/bookings/${b.id}`}>{b.ref}</Link></td></tr>
              ))}
              {!upcoming.length && <tr><td colSpan={4} className="text-muted py-6">No confirmed bookings ahead.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
