import Link from 'next/link'
import { q } from '@/lib/db'
import { venues, publishedNotices } from '@/lib/queries'
import { fmtDate, fmtRange, inr } from '@/lib/dates'

const STEPS = [
  ['Check dates', 'See which dates are free for the venue you need.'],
  ['Register and apply', 'Create an organizer account and submit your event details with supporting documents.'],
  ['Scrutiny', 'WBTPO officers review the application and may hold the dates for you.'],
  ['Approval and payment schedule', 'On approval you receive the amount payable and the instalment dates.'],
  ['Confirmation', 'Once the advance is received the booking is confirmed and the dates are closed to others.'],
]

export default async function Home() {
  const [vs, notices, events] = await Promise.all([
    venues(),
    publishedNotices(4),
    q<{ id: number; title: string; start_date: string; end_date: string; venue: string | null }>(
      `select e.id,e.title,e.start_date,e.end_date,v.name as venue from events e left join venues v on v.id=e.venue_id
        where e.status='published' and e.end_date >= current_date order by e.start_date limit 4`),
  ])
  return (
    <>
      <section className="border-b border-line">
        <div className="wrap py-14 grid gap-12 lg:grid-cols-[1.35fr_1fr]">
          <div>
            <p className="eyebrow mb-3">Milan Mela Prangan, Kolkata</p>
            <h1 className="max-w-[18ch]">Book a venue for your fair, conference or cultural programme</h1>
            <p className="mt-5 max-w-[56ch] text-lg text-muted">
              Look up which halls and grounds are free, apply online, and follow your application until the dates are confirmed. Tariffs and amenities are listed for each venue.
            </p>
            <form action="/availability" className="mt-8 panel p-4 flex flex-wrap items-end gap-3 max-w-xl">
              <label className="field flex-1 min-w-[12rem]">
                <span>Venue</span>
                <select name="venue" className="input">
                  {vs.map((v) => <option key={v.id} value={v.slug}>{v.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Month</span>
                <input type="month" name="m" className="input" />
              </label>
              <button className="btn">Check availability</button>
            </form>
          </div>

          <aside aria-labelledby="nb" className="panel self-start">
            <div className="flex items-baseline justify-between px-5 pt-4 pb-2 border-b-2 border-ink">
              <h2 id="nb" className="text-lg">Notice board</h2>
              <Link href="/notices" className="text-sm">All notices</Link>
            </div>
            <ul className="divide-y divide-line">
              {notices.map((n) => (
                <li key={n.id} className="px-5 py-3">
                  <p className="text-xs text-muted">{fmtDate(n.publish_on)} · {n.category}</p>
                  <p className="font-semibold leading-snug">{n.title}</p>
                </li>
              ))}
              {!notices.length && <li className="px-5 py-4 text-muted">No notices at present.</li>}
            </ul>
          </aside>
        </div>
      </section>

      <section className="wrap py-14">
        <h2>How booking works</h2>
        <ol className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="border-t-2 border-ink pt-3">
              <p className="font-serif text-3xl text-brick leading-none">{i + 1}</p>
              <p className="font-semibold mt-2">{t}</p>
              <p className="text-sm text-muted mt-1">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap pb-14">
        <div className="flex items-baseline justify-between">
          <h2>Venues</h2>
          <Link href="/venues">Details and floor areas</Link>
        </div>
        <div className="panel mt-4 overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Venue</th><th>Type</th><th className="num">Capacity</th><th className="num">Tariff per day</th></tr></thead>
            <tbody>
              {vs.map((v) => (
                <tr key={v.id}>
                  <td><Link href={`/venues/${v.slug}`} className="font-semibold">{v.name}</Link></td>
                  <td>{v.kind}</td>
                  <td className="num">{v.capacity.toLocaleString('en-IN')}</td>
                  <td className="num">{inr(v.tariff_per_day)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted mt-2">Tariffs exclude GST and any charges for power, generator or additional services.</p>
      </section>

      <section className="wrap pb-6">
        <div className="flex items-baseline justify-between">
          <h2>Coming up</h2>
          <Link href="/events">All events</Link>
        </div>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {events.map((e) => (
            <li key={e.id} className="py-3 grid sm:grid-cols-[14rem_1fr] gap-1 sm:gap-6">
              <span className="text-muted">{fmtRange(e.start_date, e.end_date)}</span>
              <span><span className="font-semibold">{e.title}</span>{e.venue && <span className="text-muted"> · {e.venue}</span>}</span>
            </li>
          ))}
          {!events.length && <li className="py-4 text-muted">No upcoming events have been published.</li>}
        </ul>
      </section>
    </>
  )
}
