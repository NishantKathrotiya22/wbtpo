import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Check, Circle, FileText } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { q, one } from '@/lib/db'
import { instStatus } from '@/lib/queries'
import { diffDays, fmtDate, fmtRange, inr, todayIST } from '@/lib/dates'
import { addInstallment, bookingAction, recordPayment, removeInstallment } from '@/lib/actions'
import ActionForm from '@/components/ActionForm'
import Field from '@/components/Field'
import StatusBadge from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'
import BookingProgress from '@/components/BookingProgress'
import { Alert, Button, Card, DataTable, Facts, PageHeader, Section } from '@/components/ui'

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
  const advancePaid = inst.length > 0 && inst[0].paid_amount >= inst[0].amount
  const open = !['completed', 'rejected', 'cancelled'].includes(b.status)

  const Reason = ({ action, label, hint }: { action: string; label: string; hint: string }) => (
    <details className="mt-6 border-t border-line pt-4">
      <summary className="cursor-pointer font-bold text-bad">{hint}</summary>
      <ActionForm action={act(action)} className="mt-4 space-y-3 max-w-lg">
        <Field label="Reason" required hint="The organizer will see this reason."><textarea name="note" required className="input" /></Field>
        <Button variant="danger">{label}</Button>
      </ActionForm>
    </details>
  )
  const Task = ({ done, children }: { done: boolean; children: React.ReactNode }) => (
    <li className="flex items-center gap-3">
      <span className={`grid place-items-center size-6 rounded-full ${done ? 'bg-ok text-white' : 'border-2 border-line text-transparent'}`}>{done ? <Check size={14} strokeWidth={3} /> : <Circle size={0} />}</span>
      <span className={done ? 'text-muted line-through' : 'font-semibold'}>{children}</span>
    </li>
  )

  return (
    <div>
      <PageHeader back={{ href: '/admin/bookings', label: 'All bookings' }} eyebrow={b.ref} title={<>{b.event_name} <StatusBadge status={b.status} /></>} />
      <BookingProgress status={b.status} audience="staff" />

      {open && (
        <Section title="What to do now">
          <Card>
            {!canFlow && !canMoney && <p>This booking is open for viewing only. Your role cannot change it.</p>}

            {canFlow && b.status === 'submitted' && (
              <div className="space-y-5">
                <p className="text-lg"><strong>Step 1.</strong> Read the application and documents below. When you are ready, start the review.</p>
                <ActionForm action={act('scrutiny')}><Button>Start review</Button></ActionForm>
                <ActionForm action={act('provisional')} className="space-y-2"><p className="text-muted">Or, if the dates are clearly fine, hold them straight away:</p><Button variant="secondary">Hold {fmtRange(b.start_date, b.end_date)} for this organizer</Button></ActionForm>
              </div>
            )}
            {canFlow && b.status === 'under_scrutiny' && (
              <ActionForm action={act('provisional')} className="space-y-4">
                <p className="text-lg"><strong>Step 2.</strong> If the application looks fine, hold the dates. No one else can book {b.venue} on {fmtRange(b.start_date, b.end_date)} while you decide.</p>
                <Button>Hold the dates</Button>
              </ActionForm>
            )}
            {canFlow && b.status === 'provisional' && (
              <ActionForm action={act('approve')} className="space-y-4 max-w-sm">
                <p className="text-lg"><strong>Step 3.</strong> Approve the application and confirm the amount payable.</p>
                <Field label="Approved amount (₹)" hint={`Tariff × days = ${inr(indicative)}. Change it only if a discount or extra charge applies.`}>
                  <input name="total" type="number" min={1} step="0.01" defaultValue={indicative} className="input" />
                </Field>
                <Button>Approve application</Button>
              </ActionForm>
            )}
            {b.status === 'approved' && (
              <div className="space-y-5">
                <p className="text-lg"><strong>Step 4.</strong> Set the payment instalments, then record the advance when it arrives. After that you can confirm the booking.</p>
                <ul className="space-y-2">
                  <Task done={inst.length > 0}>Set the payment schedule (below)</Task>
                  <Task done={advancePaid}>Record the first instalment as paid (below)</Task>
                  <Task done={false}>Confirm the booking</Task>
                </ul>
                {canFlow && <ActionForm action={act('confirm')}><Button disabled={!advancePaid}>Confirm booking</Button>{!advancePaid && <p className="text-sm text-muted mt-2">Available once the first instalment is paid in full.</p>}</ActionForm>}
                {!canFlow && <p className="text-muted">Booking Management will confirm once the advance is recorded.</p>}
              </div>
            )}
            {b.status === 'confirmed' && (
              <div className="space-y-4">
                <p className="text-lg">This booking is confirmed. Record further payments below as they arrive.</p>
                {canFlow && (ended
                  ? <ActionForm action={act('complete')}><p className="mb-3">The event dates have passed.</p><Button>Mark event as completed</Button></ActionForm>
                  : <p className="text-muted">You can mark it completed after {fmtDate(b.end_date)}.</p>)}
              </div>
            )}
            {canFlow && ['submitted', 'under_scrutiny', 'provisional'].includes(b.status) && <Reason action="reject" label="Reject application" hint="Cannot go ahead? Reject this application" />}
            {canFlow && ['approved', 'confirmed'].includes(b.status) && <Reason action="cancel" label="Cancel booking" hint="Need to cancel? Cancel this booking" />}
          </Card>
        </Section>
      )}
      {b.status === 'rejected' && <Alert tone="error" title="Rejected" className="mb-8">{b.rejection_reason}</Alert>}
      {b.status === 'cancelled' && <Alert tone="error" title="Cancelled" className="mb-8">{b.rejection_reason}</Alert>}

      <div className="grid gap-8 xl:grid-cols-[1fr_19rem] items-start">
        <div className="min-w-0">
          <Section title="Application">
            <Card><Facts items={[
              ['Organizer', `${b.organizer}${b.organisation ? `, ${b.organisation}` : ''}`], ['Contact', `${b.email}${b.phone ? ` · ${b.phone}` : ''}`],
              ['Venue', b.venue], ['Dates', `${fmtRange(b.start_date, b.end_date)} (${diffDays(b.start_date, b.end_date) + 1} day${b.start_date !== b.end_date ? 's' : ''})`],
              ['Event type', b.event_type], ['Expected people', b.attendance.toLocaleString('en-IN')], ['Remarks', b.remarks],
              ['Documents', docs.length ? docs.map((d: any) => <a key={d.id} href={`/api/documents/${d.id}`} className="flex items-center gap-2 font-semibold"><FileText size={16} aria-hidden />{d.filename}</a>) : <span className="text-muted">None uploaded</span>],
            ]} /></Card>
          </Section>

          {b.total_amount != null && (
            <Section title="Payments">
              <Card className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {[['Approved', inr(b.total_amount), ''], ['Scheduled', inr(scheduled), ''], ['Received', inr(paid), 'text-ok'], ['Outstanding', inr(b.total_amount - paid), '']].map(([l, v, c]) => (
                  <div key={l}><p className="text-sm text-muted font-bold">{l}</p><p className={`text-xl font-black ${c}`}>{v}</p></div>
                ))}
              </Card>
              <DataTable>
                <thead><tr><th>Instalment</th><th>Due</th><th className="num">Amount</th><th className="num">Received</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {inst.map((i: any) => (
                    <tr key={i.id}>
                      <td className="font-semibold">{i.label}{i.reference && <span className="block text-muted text-xs font-normal">{i.mode} · {i.reference} · {fmtDate(i.paid_on)}</span>}</td>
                      <td>{fmtDate(i.due_date)}</td><td className="num">{inr(i.amount)}</td><td className="num">{inr(i.paid_amount)}</td>
                      <td><StatusBadge status={instStatus(i)} /></td>
                      <td className="min-w-[14rem]">
                        {canMoney && i.paid_amount < i.amount && (
                          <details>
                            <summary className="cursor-pointer font-bold text-primary">Record payment</summary>
                            <ActionForm action={recordPayment.bind(null, i.id)} className="mt-3 space-y-3">
                              <Field label="Amount received (₹)"><input name="amount" type="number" step="0.01" min={1} max={i.amount - i.paid_amount} defaultValue={i.amount - i.paid_amount} required className="input" /></Field>
                              <Field label="Received on"><input name="paid_on" type="date" max={todayIST()} defaultValue={todayIST()} required className="input" /></Field>
                              <Field label="Paid by"><select name="mode" className="input"><option>NEFT</option><option>RTGS</option><option>Cheque</option><option>Demand draft</option><option>Cash</option><option>UPI</option></select></Field>
                              <Field label="Transaction or cheque number" required><input name="reference" required className="input" /></Field>
                              <Button size="sm">Save payment</Button>
                            </ActionForm>
                          </details>
                        )}
                        {canSchedule && i.paid_amount === 0 && <form action={removeInstallment.bind(null, i.id)} className="mt-2"><button className="text-sm font-bold text-bad hover:underline cursor-pointer">Remove</button></form>}
                      </td>
                    </tr>
                  ))}
                  {!inst.length && <tr><td colSpan={6} className="text-muted py-8 text-center">No instalments yet. Add the first one below.</td></tr>}
                </tbody>
              </DataTable>
              {canSchedule && ['approved', 'confirmed'].includes(b.status) && scheduled < b.total_amount && (
                <Card className="mt-4">
                  <h3 className="text-lg mb-4">Add an instalment</h3>
                  <ActionForm action={addInstallment.bind(null, id)} className="grid gap-4 sm:grid-cols-[1fr_9rem_11rem_auto] items-end">
                    <Field label="Name" hint="For example Advance or Balance"><input name="label" required className="input" /></Field>
                    <Field label="Amount (₹)"><input name="amount" type="number" min={1} step="0.01" defaultValue={b.total_amount - scheduled} required className="input" /></Field>
                    <Field label="Pay by"><input name="due" type="date" required className="input" /></Field>
                    <Button>Add</Button>
                  </ActionForm>
                </Card>
              )}
            </Section>
          )}
        </div>
        <aside className="xl:sticky xl:top-32"><Card><h2 className="text-xl mb-4">History</h2><Timeline bookingId={id} /></Card></aside>
      </div>
    </div>
  )
}
