import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { q, one } from '@/lib/db'
import { instStatus } from '@/lib/queries'
import { fmtDate, fmtRange, inr } from '@/lib/dates'
import { withdrawBooking } from '@/lib/actions'
import StatusBadge from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'

export const metadata: Metadata = { title: 'Booking details' }

export default async function MyBooking({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('organizer')
  const id = Number((await params).id)
  const b = await one<any>(
    `select b.*, v.name as venue, v.tariff_per_day from bookings b join venues v on v.id=b.venue_id where b.id=$1 and b.organizer_id=$2`,
    [Number.isInteger(id) ? id : 0, user.id])
  if (!b) notFound()
  const [inst, docs] = await Promise.all([
    q<any>('select * from installments where booking_id=$1 order by due_date,id', [id]),
    q<any>('select id,filename,size from booking_documents where booking_id=$1 order by id', [id]),
  ])
  const paid = inst.reduce((s: number, i: any) => s + i.paid_amount, 0)
  return (
    <div className="wrap py-12">
      <p className="text-sm"><Link href="/account">← My bookings</Link></p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1>{b.event_name}</h1><StatusBadge status={b.status} />
      </div>
      <p className="text-muted mt-1">Reference {b.ref}</p>

      {b.status === 'rejected' && <p className="alert alert-err mt-6 max-w-2xl">This application was not approved. Reason given: {b.rejection_reason}</p>}
      {b.status === 'cancelled' && b.rejection_reason && <p className="alert alert-err mt-6 max-w-2xl">Cancelled: {b.rejection_reason}</p>}
      {b.status === 'approved' && <p className="alert alert-ok mt-6 max-w-2xl">Your application is approved. The dates stay on hold until the advance instalment is received.</p>}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-3">Application</h2>
            <dl className="panel p-5 grid sm:grid-cols-[11rem_1fr] gap-x-6 gap-y-2">
              <dt className="text-muted">Venue</dt><dd>{b.venue}</dd>
              <dt className="text-muted">Dates</dt><dd>{fmtRange(b.start_date, b.end_date)}</dd>
              <dt className="text-muted">Type of event</dt><dd>{b.event_type}</dd>
              <dt className="text-muted">Expected attendance</dt><dd>{b.attendance.toLocaleString('en-IN')}</dd>
              {b.remarks && (<><dt className="text-muted">Remarks</dt><dd className="whitespace-pre-line">{b.remarks}</dd></>)}
              <dt className="text-muted">Submitted</dt><dd>{fmtDate(b.created_at.toISOString().slice(0, 10))}</dd>
            </dl>
          </section>

          <section>
            <h2 className="mb-3">Payments</h2>
            {b.total_amount ? (
              <>
                <p className="mb-3">Approved amount <strong>{inr(b.total_amount)}</strong>. Received {inr(paid)}. Outstanding {inr(b.total_amount - paid)}.</p>
                {inst.length ? (
                  <div className="panel overflow-x-auto">
                    <table className="tbl">
                      <thead><tr><th>Instalment</th><th>Due</th><th className="num">Amount</th><th className="num">Paid</th><th>Status</th></tr></thead>
                      <tbody>
                        {inst.map((i: any) => (
                          <tr key={i.id}>
                            <td>{i.label}</td><td>{fmtDate(i.due_date)}</td>
                            <td className="num">{inr(i.amount)}</td><td className="num">{inr(i.paid_amount)}</td>
                            <td><StatusBadge status={instStatus(i)} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-muted">The payment schedule has not been set yet.</p>}
                <p className="text-sm text-muted mt-3 max-w-[62ch]">Online payment is not available yet. Pay as advised by the WBTPO accounts section and keep the transaction reference; the office records it here once received.</p>
              </>
            ) : <p className="text-muted">The payable amount is shown here once the application is approved.</p>}
          </section>

          <section>
            <h2 className="mb-3">Documents</h2>
            {docs.length ? (
              <ul className="list-disc pl-5 marker:text-brick">
                {docs.map((d: any) => <li key={d.id}><a href={`/api/documents/${d.id}`}>{d.filename}</a> <span className="text-muted text-sm">({Math.ceil(d.size / 1024)} KB)</span></li>)}
              </ul>
            ) : <p className="text-muted">No documents were uploaded.</p>}
          </section>
        </div>

        <aside>
          <h2 className="mb-4">Progress</h2>
          <Timeline bookingId={id} />
          {['submitted', 'under_scrutiny'].includes(b.status) && (
            <form action={withdrawBooking.bind(null, id)} className="mt-8">
              <button className="btn btn-danger btn-sm">Withdraw application</button>
            </form>
          )}
        </aside>
      </div>
    </div>
  )
}
