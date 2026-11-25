import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { entriesFor, venues } from '@/lib/queries'
import { fmtRange, monthOf } from '@/lib/dates'
import { blockDates, unblockDates } from '@/lib/actions'
import ActionForm from '@/components/ActionForm'
import Field from '@/components/Field'
import MonthCalendar from '@/components/MonthCalendar'
import { Button, Card, DataTable, EmptyState, PageHeader, Section } from '@/components/ui'

export const metadata: Metadata = { title: 'Calendar' }

export default async function AdminCalendar({ searchParams }: { searchParams: Promise<{ venue?: string; m?: string }> }) {
  const user = await requireAdmin()
  const sp = await searchParams
  const vs = await venues()
  const v = vs.find((x) => String(x.id) === sp.venue) ?? vs[0]
  const m = monthOf(sp.m)
  const entries = await entriesFor(v.id, m.first, m.last)
  const canBlock = ['super_admin', 'booking_manager'].includes(user.role)
  return (
    <div>
      <PageHeader eyebrow="Calendar" title="Venue calendar" description="Pick a venue to see its holds, bookings and blocked dates." />
      <nav aria-label="Venue" className="mb-6 flex flex-wrap gap-2">
        {vs.map((x) => <Button key={x.id} href={`/admin/calendar?venue=${x.id}&m=${m.ym}`} size="sm" variant={x.id === v.id ? 'primary' : 'secondary'}>{x.name}</Button>)}
      </nav>
      <Card className="mb-10"><MonthCalendar ym={m.ym} entries={entries} admin href={(ym) => `/admin/calendar?venue=${v.id}&m=${ym}`} /></Card>

      <Section title="Holds and blocks this month">
        <DataTable empty={!entries.length && <EmptyState title="Nothing is held or blocked this month" />}>
          {entries.length > 0 && (<><thead><tr><th>Dates</th><th>Type</th><th>Details</th><th><span className="sr-only">Action</span></th></tr></thead>
            <tbody>{entries.map((e) => (
              <tr key={e.id}>
                <td className="font-semibold">{fmtRange(e.start_date, e.end_date)}</td>
                <td className="capitalize">{e.status}</td>
                <td>{e.booking_id ? <Link href={`/admin/bookings/${e.booking_id}`} className="font-bold">{e.ref}</Link> : e.reason}</td>
                <td>{canBlock && e.status === 'blocked' && <form action={unblockDates.bind(null, e.id)}><Button variant="danger" size="sm">Unblock</Button></form>}</td>
              </tr>))}</tbody></>)}
        </DataTable>
      </Section>

      {canBlock && (
        <Section title="Block dates" description="Use this when a venue cannot be booked, for example maintenance or a government programme.">
          <Card>
            <ActionForm action={blockDates} className="grid gap-5 sm:grid-cols-2">
              <Field label="Venue"><select name="venue" defaultValue={v.id} className="input">{vs.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
              <Field label="Reason" required><input name="reason" required className="input" /></Field>
              <Field label="From" required><input type="date" name="start" required className="input" /></Field>
              <Field label="To" hint="Leave empty for a single day."><input type="date" name="end" className="input" /></Field>
              <div className="sm:col-span-2"><Button>Block these dates</Button></div>
            </ActionForm>
          </Card>
        </Section>
      )}
    </div>
  )
}
