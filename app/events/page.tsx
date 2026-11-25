import type { Metadata } from 'next'
import { q } from '@/lib/db'
import { fmtRange, todayIST } from '@/lib/dates'

export const metadata: Metadata = { title: 'Events' }
type E = { id: number; title: string; description: string; start_date: string; end_date: string; venue: string | null }

export default async function Events() {
  const rows = await q<E>(
    `select e.id,e.title,e.description,e.start_date,e.end_date,v.name as venue from events e left join venues v on v.id=e.venue_id
      where e.status='published' order by e.start_date`)
  const t = todayIST()
  const upcoming = rows.filter((e) => e.end_date >= t)
  const past = rows.filter((e) => e.end_date < t).reverse()
  const List = ({ items }: { items: E[] }) => (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((e) => (
        <li key={e.id} className="py-5 grid md:grid-cols-[15rem_1fr] gap-1 md:gap-8">
          <p className="text-muted">{fmtRange(e.start_date, e.end_date)}{e.venue && <><br />{e.venue}</>}</p>
          <div><h3>{e.title}</h3>{e.description && <p className="mt-1 max-w-[60ch]">{e.description}</p>}</div>
        </li>
      ))}
    </ul>
  )
  return (
    <div className="wrap py-12">
      <h1>Events</h1>
      <h2 className="mt-10 mb-3">Upcoming</h2>
      {upcoming.length ? <List items={upcoming} /> : <p className="text-muted">No upcoming events have been published.</p>}
      {past.length > 0 && (<><h2 className="mt-12 mb-3">Past events</h2><List items={past} /></>)}
    </div>
  )
}
