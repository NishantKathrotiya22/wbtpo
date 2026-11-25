import Link from 'next/link'
import type { Metadata } from 'next'
import { ClipboardCheck, Wallet, CalendarClock, IndianRupee, Inbox, CalendarX, Megaphone, FileBarChart } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { q, one } from '@/lib/db'
import { fmtDate, fmtRange, inr, todayIST } from '@/lib/dates'
import StatusBadge from '@/components/StatusBadge'
import { Button, DataTable, EmptyState, PageHeader, ResourceCard, Section, Stat } from '@/components/ui'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function Dashboard() {
  const user = await requireAdmin()
  const staff = ['super_admin', 'booking_manager'].includes(user.role)
  const t = todayIST()
  const [c, money, queue, overdue, upcoming, enq] = await Promise.all([
    one<{ pending: number; awaiting: number; soon: number }>(
      `select count(*) filter (where status in ('submitted','under_scrutiny')) as pending,
              count(*) filter (where status in ('provisional','approved')) as awaiting,
              count(*) filter (where status='confirmed' and start_date between $1::date and $1::date + 30) as soon from bookings`, [t]),
    one<{ collected: number; outstanding: number; overdue: number }>(
      `select coalesce(sum(i.paid_amount),0) as collected, coalesce(sum(i.amount-i.paid_amount),0) as outstanding,
              coalesce(sum(i.amount-i.paid_amount) filter (where i.due_date < $1::date),0) as overdue
         from installments i join bookings b on b.id=i.booking_id where b.status in ('approved','confirmed','completed')`, [t]),
    q<any>(`select b.id,b.ref,b.event_name,b.status,b.start_date,b.end_date,v.name as venue,u.name as organizer from bookings b
              join venues v on v.id=b.venue_id join users u on u.id=b.organizer_id where b.status in ('submitted','under_scrutiny') order by b.created_at limit 6`),
    q<any>(`select i.id,i.label,i.amount-i.paid_amount as due,i.due_date,b.id as booking_id,b.ref,u.name as organizer from installments i
              join bookings b on b.id=i.booking_id join users u on u.id=b.organizer_id
             where i.paid_amount < i.amount and i.due_date < $1::date and b.status in ('approved','confirmed') order by i.due_date limit 6`, [t]),
    q<any>(`select b.id,b.ref,b.event_name,b.start_date,b.end_date,v.name as venue from bookings b join venues v on v.id=b.venue_id
             where b.status='confirmed' and b.end_date >= $1::date order by b.start_date limit 5`, [t]),
    one<{ n: number }>(`select count(*) as n from enquiries where status='new'`),
  ])
  return (
    <div>
      <PageHeader eyebrow="Dashboard" title={`Welcome, ${user.name}`} description="Here is what needs attention today." />

      <Section title="Start here" description="The most common jobs, one click each.">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {staff && <ResourceCard href="/admin/bookings?status=submitted" icon={ClipboardCheck} label="Applications" title="Review new applications" badge={c!.pending > 0 ? <span className="badge tone-info">{c!.pending} waiting</span> : undefined}>Open an application and follow the next step shown.</ResourceCard>}
          {['super_admin', 'accounts'].includes(user.role) && <ResourceCard href="/admin/bookings?status=approved" icon={Wallet} label="Payments" title="Record a payment received" badge={money!.overdue > 0 ? <span className="badge tone-bad">Overdue</span> : undefined}>Open an approved booking and press “Record payment”.</ResourceCard>}
          {staff && <ResourceCard href="/admin/calendar" icon={CalendarX} label="Calendar" title="Block dates for maintenance">Close a venue on dates when it cannot be booked.</ResourceCard>}
          {staff && <ResourceCard href="/admin/notices/new" icon={Megaphone} label="Website" title="Publish a notice">Write a notice or tender announcement for the public site.</ResourceCard>}
          {staff && <ResourceCard href="/admin/enquiries" icon={Inbox} label="Enquiries" title="Reply to enquiries" badge={enq!.n > 0 ? <span className="badge tone-info">{enq!.n} new</span> : undefined}>See questions sent through the contact form.</ResourceCard>}
          <ResourceCard href="/admin/reports" icon={FileBarChart} label="Reports" title="Download reports">Bookings, payments and venue use as spreadsheet files.</ResourceCard>
        </div>
      </Section>

      <Section title="Overview">
        <div className="grid gap-5 sm:grid-cols-2">
          <Stat icon={ClipboardCheck} label="Awaiting review" value={c!.pending} hint="new applications" />
          <Stat icon={CalendarClock} tone="hold" label="Dates on hold" value={c!.awaiting} hint="approval or advance pending" />
          <Stat icon={CalendarClock} tone="ok" label="Next 30 days" value={c!.soon} hint="confirmed events" />
          <Stat icon={IndianRupee} tone={money!.overdue > 0 ? 'bad' : 'info'} label="Money to collect" value={inr(money!.outstanding)} hint={`${inr(money!.overdue)} overdue · ${inr(money!.collected)} received`} />
        </div>
      </Section>

      <div className="grid gap-x-8 2xl:grid-cols-2">
        <Section title="Applications to review" action={<Button href="/admin/bookings" variant="secondary" size="sm">All bookings</Button>}>
          <DataTable empty={!queue.length && <EmptyState title="Nothing is waiting for review" />}>
            {queue.length > 0 && <tbody>{queue.map((b: any) => (
              <tr key={b.id}>
                <td><Link href={`/admin/bookings/${b.id}`} className="font-bold">{b.ref}</Link><br /><span className="text-muted">{b.organizer}</span></td>
                <td>{b.event_name}<br /><span className="text-muted">{b.venue}, {fmtRange(b.start_date, b.end_date)}</span></td>
                <td><StatusBadge status={b.status} /></td>
              </tr>
            ))}</tbody>}
          </DataTable>
        </Section>
        <Section title="Overdue payments">
          <DataTable empty={!overdue.length && <EmptyState title="No payments are overdue" />}>
            {overdue.length > 0 && <tbody>{overdue.map((i: any) => (
              <tr key={i.id}>
                <td><Link href={`/admin/bookings/${i.booking_id}`} className="font-bold">{i.ref}</Link><br /><span className="text-muted">{i.organizer}</span></td>
                <td>{i.label}<br /><span className="text-muted">due {fmtDate(i.due_date)}</span></td>
                <td className="num font-black text-bad">{inr(i.due)}</td>
              </tr>
            ))}</tbody>}
          </DataTable>
        </Section>
      </div>

      <Section title="Upcoming confirmed bookings">
        <DataTable empty={!upcoming.length && <EmptyState title="No confirmed bookings ahead" />}>
          {upcoming.length > 0 && (<><thead><tr><th>Dates</th><th>Event</th><th>Venue</th><th>Reference</th></tr></thead>
            <tbody>{upcoming.map((b: any) => (<tr key={b.id}><td>{fmtRange(b.start_date, b.end_date)}</td><td className="font-semibold">{b.event_name}</td><td>{b.venue}</td><td><Link href={`/admin/bookings/${b.id}`} className="font-bold">{b.ref}</Link></td></tr>))}</tbody></>)}
        </DataTable>
      </Section>
    </div>
  )
}
