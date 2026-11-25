import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { FileText } from 'lucide-react'
import { requireRole } from '@/lib/auth'
import { q, one } from '@/lib/db'
import { instStatus } from '@/lib/queries'
import { fmtDate, fmtRange, inr } from '@/lib/dates'
import { withdrawBooking } from '@/lib/actions'
import StatusBadge from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'
import BookingProgress from '@/components/BookingProgress'
import { Alert, Button, Card, DataTable, Facts, Page, PageHeader, Section } from '@/components/ui'

export const metadata: Metadata = { title: 'Booking details' }

export default async function MyBooking({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('organizer')
  const id = Number((await params).id)
  const b = await one<any>(`select b.*, v.name as venue from bookings b join venues v on v.id=b.venue_id where b.id=$1 and b.organizer_id=$2`, [Number.isInteger(id) ? id : 0, user.id])
  if (!b) notFound()
  const [inst, docs] = await Promise.all([
    q<any>('select * from installments where booking_id=$1 order by due_date,id', [id]),
    q<any>('select id,filename,size from booking_documents where booking_id=$1 order by id', [id]),
  ])
  const paid = inst.reduce((s: number, i: any) => s + i.paid_amount, 0)
  return (
    <Page>
      <PageHeader back={{ href: '/account', label: 'My bookings' }} eyebrow={b.ref} title={<>{b.event_name} <StatusBadge status={b.status} /></>} />
      <BookingProgress status={b.status} />
      {b.status === 'rejected' && <Alert tone="error" title="This application was not approved" className="mb-8">Reason given: {b.rejection_reason}. You are welcome to apply again for other dates or another venue.</Alert>}
      {b.status === 'cancelled' && <Alert tone="error" title="This booking is cancelled" className="mb-8">{b.rejection_reason}</Alert>}

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem] items-start">
        <div>
          <Section title="Your application">
            <Card><Facts items={[
              ['Venue', b.venue], ['Dates', fmtRange(b.start_date, b.end_date)], ['Type of event', b.event_type],
              ['Expected people', b.attendance.toLocaleString('en-IN')], ['Remarks', b.remarks], ['Sent on', fmtDate(b.created_at.toISOString().slice(0, 10))],
            ]} /></Card>
          </Section>

          <Section title="Payments">
            {b.total_amount ? (
              <>
                <Card className="mb-4 grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-sm text-muted font-bold">Approved amount</p><p className="text-xl font-black">{inr(b.total_amount)}</p></div>
                  <div><p className="text-sm text-muted font-bold">Received</p><p className="text-xl font-black text-ok">{inr(paid)}</p></div>
                  <div><p className="text-sm text-muted font-bold">Still to pay</p><p className="text-xl font-black">{inr(b.total_amount - paid)}</p></div>
                </Card>
                {inst.length ? (
                  <DataTable>
                    <thead><tr><th>Instalment</th><th>Pay by</th><th className="num">Amount</th><th className="num">Paid</th><th>Status</th></tr></thead>
                    <tbody>{inst.map((i: any) => (
                      <tr key={i.id}><td className="font-semibold">{i.label}</td><td>{fmtDate(i.due_date)}</td><td className="num">{inr(i.amount)}</td><td className="num">{inr(i.paid_amount)}</td><td><StatusBadge status={instStatus(i)} /></td></tr>
                    ))}</tbody>
                  </DataTable>
                ) : <Alert tone="info">The office has not set the instalment dates yet. They will appear here.</Alert>}
                <p className="text-sm text-muted mt-3">Online payment is not available yet. Pay as advised by the Accounts section and keep your transaction reference. The office will record your payment here.</p>
              </>
            ) : <Alert tone="info">The amount to pay appears here once your application is approved.</Alert>}
          </Section>

          <Section title="Your documents">
            {docs.length ? (
              <Card pad={false}><ul className="divide-y divide-line">{docs.map((d: any) => (
                <li key={d.id}><a href={`/api/documents/${d.id}`} className="flex items-center gap-3 px-6 py-4 font-semibold no-underline"><FileText size={20} aria-hidden />{d.filename}<span className="ml-auto text-sm text-muted font-normal">{Math.ceil(d.size / 1024)} KB</span></a></li>
              ))}</ul></Card>
            ) : <Card><p className="text-muted">No documents were uploaded.</p></Card>}
          </Section>
        </div>

        <aside className="lg:sticky lg:top-32 space-y-6">
          <Card><h2 className="text-xl mb-4">History</h2><Timeline bookingId={id} /></Card>
          {['submitted', 'under_scrutiny'].includes(b.status) && (
            <form action={withdrawBooking.bind(null, id)}><Button variant="danger" full>Withdraw this application</Button></form>
          )}
        </aside>
      </div>
    </Page>
  )
}
