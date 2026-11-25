import Link from 'next/link'
import type { Metadata } from 'next'
import { entriesFor, venues } from '@/lib/queries'
import { monthOf } from '@/lib/dates'
import MonthCalendar from '@/components/MonthCalendar'

export const metadata: Metadata = { title: 'Venue availability' }

export default async function Availability({ searchParams }: { searchParams: Promise<{ venue?: string; m?: string }> }) {
  const sp = await searchParams
  const vs = await venues()
  const v = vs.find((x) => x.slug === sp.venue) ?? vs[0]
  const m = monthOf(sp.m)
  const entries = await entriesFor(v.id, m.first, m.last)
  return (
    <div className="wrap py-12">
      <h1>Venue availability</h1>
      <p className="mt-3 max-w-[60ch] text-muted">Dates marked “On hold” are being processed for another organizer and may become free again if that application is not approved.</p>
      <nav aria-label="Venue" className="mt-8 flex flex-wrap gap-2">
        {vs.map((x) => (
          <Link key={x.id} href={`/availability?venue=${x.slug}&m=${m.ym}`} aria-current={x.id === v.id ? 'page' : undefined}
            className={`btn btn-sm ${x.id === v.id ? '' : 'btn-quiet'}`}>{x.name}</Link>
        ))}
      </nav>
      <div className="mt-6">
        <MonthCalendar ym={m.ym} entries={entries} href={(ym) => `/availability?venue=${v.slug}&m=${ym}`} />
      </div>
      <p className="mt-6"><Link href={`/account/bookings/new?venue=${v.id}`} className="btn">Apply to book {v.name}</Link></p>
    </div>
  )
}
