import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { q, one } from '@/lib/db'
import { instStatus } from '@/lib/queries'
import { diffDays, fmtDate, fmtRange, inr, todayIST } from '@/lib/dates'
import { addInstallment, bookingAction, recordPayment, removeInstallment } from '@/lib/actions'
import ActionForm from '@/components/ActionForm'
import Field from '@/components/Field'
import StatusBadge from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'

export const metadata: Metadata = { title: 'Booking' }

export default async function AdminBooking({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  const id = Number((await params).id)
  const b = await one<any>(
    `select b.*, v.name as venue, v.tariff_per_day, u.name as organizer, u.email, u.phone, u.organisation
       from bookings b join venues v on v.id=b.venue_id join users u on u.id=b.organizer_id where b.id=$1`, [Number.isInteger(id) ? id : 0])
  if (!b) notFound()
  const [inst, docs] = await Promise.all([
    q<any>('select * from installments where booking_id=$1 order by due_date,id', [id]),
    q<any>('select id,filename,size from booking_documents where booking_id=$1 order by id', [id]),
  ])
  const canFlow = ['super_admin', 'booking_manager'].includes(user.role)
  const canMoney = ['super_admin', 'accounts'].includes(user.role)
  const canSchedule = canFlow || canMoney
  const indicative = b.tariff_per_day * (diffDays(b.start_date, b.end_date) + 1)
  const paid = inst.reduce((s: number, i: any) => s + i.paid_amount, 0)
  const scheduled = inst.reduce((s: number, i: any) => s + i.amount, 0)
  const act = (a: string) => bookingAction.bind(null, id, a)
  const ended = b.end_date <= todayIST()

  const Reason = ({ action, label }: { action: string; label: string }) => (
    <ActionForm action={act(action)} className="space-y-2">
      <Field label={`Reason for ${label.toLowerCase()}`}><textarea name="note" required className="input" style={{ minHeight: '4rem' }} /></Field>
      <button className="btn btn-danger btn-sm">{label}</button>
    </ActionForm>
  )

  return (
    <div>
      <p className="text-sm"><Link href="/admin/bookings">← Bookings</Link></p>
      <div className="mt-3 flex flex-wrap items-center gap-3"><h1>{b.event_name}</h1><StatusBadge status={b.status} /></div>
      <p className="text-muted mt-1">{b.ref}</p>

      <div className="mt-8 grid gap-10 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-10 min-w-0">
          <section>
            <h2 className="mb-3">Application</h2>
            <dl className="panel p-5 grid sm:grid-cols-[11rem_1fr] gap-x-6 gap-y-2">
              <dt className="text-muted">Organizer</dt><dd>{b.organizer}{b.organisation ? `, ${b.organisation}` : ''}</dd>
              <dt className="text-muted">Contact</dt><dd>{b.email}{b.phone ? ` · ${b.phone}` : ''}</dd>
              <dt className="text-muted">Venue</dt><dd>{b.venue}</dd>
              <dt className="text-muted">Dates</dt><dd>{fmtRange(b.start_date, b.end_date)} ({diffDays(b.start_date, b.end_date) + 1} day{b.start_date !== b.end_date ? 's' : ''})</dd>
              <dt className="text-muted">Type · attendance</dt><dd>{b.event_type} · {b.attendance.toLocaleString('en-IN')}</dd>
              {b.remarks && (<><dt className="text-muted">Remarks</dt><dd className="whitespace-pre-line">{b.remarks}</dd></>)}
              {b.rejection_reason && (<><dt className="text-muted">Reason recorded</dt><dd>{b.rejection_reason}</dd></>)}
              <dt className="text-muted">Documents</dt>
              <dd>{docs.length ? docs.map((d: any) => <span key={d.id} className="block"><a href={`/api/documents/${d.id}`}>{d.filename}</a></span>) : <span className="text-muted">None uploaded</span>}</dd>
            </dl>
          </section>

          {canFlow && !['completed', 'rejected', 'cancelled'].includes(b.status) && (
            <section>
              <h2 className="mb-3">Next step</h2>
              <div className="panel p-5 space-y-6">
                {b.status === 'submitted' && (
                  <ActionForm action={act('scrutiny')}><button className="btn">Start scrutiny</button></ActionForm>
                )}
                {['submitted', 'under_scrutiny'].includes(b.status) && (
                  <ActionForm action={act('provisional')} className="space-y-2">
                    <p className="text-sm text-muted">Holds {fmtRange(b.start_date, b.end_date)} at {b.venue} so nobody else can book it while you decide.</p>
                    <button className="btn">Block dates provisionally</button>
                  </ActionForm>
                )}
                {b.status === 'provisional' && (
                  <ActionForm action={act('approve')} className="space-y-3 max-w-xs">
                    <Field label="Approved amount (₹)" hint={`Tariff × days = ${inr(indicative)}. Change it if a discount or extra charge applies.`}>
                      <input name="total" type="number" min={1} step="0.01" defaultValue={indicative} className="input" />
                    </Field>
                    <button className="btn">Approve application</button>
                  </ActionForm>
                )}
                {b.status === 'approved' && (
                  <ActionForm action={act('confirm')} className="space-y-2">
                    <p className="text-sm text-muted">Needs a payment schedule and the first instalment received in full.</p>
                    <button className="btn">Confirm booking</button>
                  </ActionForm>
                )}
                {b.status === 'confirmed' && ended && <ActionForm action={act('complete')}><button className="btn">Mark event completed</button></ActionForm>}
                {['submitted', 'under_scrutiny', 'provisional'].includes(b.status) && <Reason action="reject" label="Reject application" />}
                {['approved', 'confirmed'].includes(b.status) && <Reason action="cancel" label="Cancel booking" />}
              </div>
            </section>
          )}

          {b.total_amount != null && (
            <section>
              <h2 className="mb-3">Payment schedule</h2>
              <p className="mb-3">Approved {inr(b.total_amount)} · scheduled {inr(scheduled)} · received {inr(paid)} · outstanding {inr(b.total_amount - paid)}</p>
              <div className="panel overflow-x-auto">
                <table className="tbl">
                  <thead><tr><th>Instalment</th><th>Due</th><th className="num">Amount</th><th className="num">Received</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {inst.map((i: any) => (
                      <tr key={i.id}>
                        <td>{i.label}{i.reference && <><br /><span className="text-muted text-xs">{i.mode} · {i.reference} · {fmtDate(i.paid_on)}</span></>}</td>
                        <td>{fmtDate(i.due_date)}</td>
                        <td className="num">{inr(i.amount)}</td><td className="num">{inr(i.paid_amount)}</td>
                        <td><StatusBadge status={instStatus(i)} /></td>
                        <td className="min-w-[13rem]">
                          {canMoney && i.paid_amount < i.amount && (
                            <details>
                              <summary className="cursor-pointer text-brick">Record payment</summary>
                              <ActionForm action={recordPayment.bind(null, i.id)} className="mt-2 space-y-2">
                                <Field label="Amount (₹)"><input name="amount" type="number" step="0.01" min={1} max={i.amount - i.paid_amount} defaultValue={i.amount - i.paid_amount} required className="input" /></Field>
                                <Field label="Received on"><input name="paid_on" type="date" max={todayIST()} defaultValue={todayIST()} required className="input" /></Field>
                                <Field label="Mode"><select name="mode" className="input"><option>NEFT</option><option>RTGS</option><option>Cheque</option><option>Demand draft</option><option>Cash</option><option>UPI</option></select></Field>
                                <Field label="Reference no."><input name="reference" required className="input" /></Field>
                                <button className="btn btn-sm">Save payment</button>
                              </ActionForm>
                            </details>
                          )}
                          {canSchedule && i.paid_amount === 0 && (
                            <form action={removeInstallment.bind(null, i.id)}><button className="text-sm text-bad hover:underline cursor-pointer">Remove</button></form>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!inst.length && <tr><td colSpan={6} className="text-muted py-6 text-center">No instalments yet.</td></tr>}
                  </tbody>
                </table>
              </div>
              {canSchedule && ['approved', 'confirmed'].includes(b.status) && scheduled < b.total_amount && (
                <ActionForm action={addInstallment.bind(null, id)} className="panel p-5 mt-4 grid gap-3 sm:grid-cols-[1fr_9rem_10rem_auto] items-end">
                  <Field label="Label"><input name="label" required placeholder="Advance, Balance…" className="input" /></Field>
                  <Field label="Amount (₹)"><input name="amount" type="number" min={1} step="0.01" defaultValue={b.total_amount - scheduled} required className="input" /></Field>
                  <Field label="Due date"><input name="due" type="date" required className="input" /></Field>
                  <button className="btn">Add instalment</button>
                </ActionForm>
              )}
            </section>
          )}
        </div>

        <aside>
          <h2 className="mb-4">History</h2>
          <Timeline bookingId={id} />
        </aside>
      </div>
    </div>
  )
}
