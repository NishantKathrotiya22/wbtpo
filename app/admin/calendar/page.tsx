import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { entriesFor, venues } from '@/lib/queries'
import { fmtRange, monthOf } from '@/lib/dates'
import { blockDates, unblockDates } from '@/lib/actions'
import ActionForm from '@/components/ActionForm'
import Field from '@/components/Field'
import MonthCalendar from '@/components/MonthCalendar'

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
      <h1>Calendar</h1>
      <nav aria-label="Venue" className="mt-5 flex flex-wrap gap-2">
        {vs.map((x) => <Link key={x.id} href={`/admin/calendar?venue=${x.id}&m=${m.ym}`} className={`btn btn-sm ${x.id === v.id ? '' : 'btn-quiet'}`}>{x.name}</Link>)}
      </nav>
      <div className="mt-6"><MonthCalendar ym={m.ym} entries={entries} admin href={(ym) => `/admin/calendar?venue=${v.id}&m=${ym}`} /></div>

      <h2 className="mt-10 mb-3">Holds and blocks this month</h2>
      <div className="panel overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Dates</th><th>Status</th><th>Details</th><th /></tr></thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{fmtRange(e.start_date, e.end_date)}</td>
                <td className="capitalize">{e.status}</td>
                <td>{e.booking_id ? <Link href={`/admin/bookings/${e.booking_id}`}>{e.ref}</Link> : e.reason}</td>
                <td>{canBlock && e.status === 'blocked' && <form action={unblockDates.bind(null, e.id)}><button className="text-bad hover:underline cursor-pointer">Unblock</button></form>}</td>
              </tr>
            ))}
            {!entries.length && <tr><td colSpan={4} className="text-muted py-6 text-center">Nothing held or blocked this month.</td></tr>}
          </tbody>
        </table>
      </div>

      {canBlock && (
        <>
          <h2 className="mt-10 mb-3">Block dates</h2>
          <ActionForm action={blockDates} className="panel p-5 grid gap-4 sm:grid-cols-2">
            <Field label="Venue"><select name="venue" defaultValue={v.id} className="input">{vs.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
            <Field label="Reason" hint="For example maintenance or a government programme."><input name="reason" required className="input" /></Field>
            <Field label="From"><input type="date" name="start" required className="input" /></Field>
            <Field label="To" hint="Leave blank for a single day."><input type="date" name="end" className="input" /></Field>
            <div className="sm:col-span-2"><button className="btn">Block dates</button></div>
          </ActionForm>
        </>
      )}
    </div>
  )
}
