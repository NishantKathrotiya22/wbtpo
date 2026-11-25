import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { one } from '@/lib/db'
import { entriesFor, type Venue } from '@/lib/queries'
import { inr, monthOf } from '@/lib/dates'
import MonthCalendar from '@/components/MonthCalendar'

type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ m?: string }> }
const get = (slug: string) => one<Venue>('select * from venues where slug=$1 and active', [slug])

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const v = await get((await params).slug)
  return { title: v?.name ?? 'Venue' }
}

export default async function VenuePage({ params, searchParams }: P) {
  const { slug } = await params
  const v = await get(slug)
  if (!v) notFound()
  const m = monthOf((await searchParams).m)
  const entries = await entriesFor(v.id, m.first, m.last)
  return (
    <div className="wrap py-12">
      <p className="text-sm"><Link href="/venues">← All venues</Link></p>
      <p className="eyebrow mt-4">{v.kind}</p>
      <h1 className="mt-1">{v.name}</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <p className="max-w-[62ch] text-lg">{v.description}</p>
          <h2 className="mt-10 mb-3">Amenities</h2>
          <ul className="columns-2 gap-8 list-disc pl-5 marker:text-brick">{v.amenities.map((a) => <li key={a}>{a}</li>)}</ul>
          <h2 className="mt-10 mb-4">Availability</h2>
          <MonthCalendar ym={m.ym} entries={entries} href={(ym) => `/venues/${v.slug}?m=${ym}`} />
        </div>
        <aside className="panel p-5 self-start">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <dt className="text-muted">Capacity</dt><dd>{v.capacity.toLocaleString('en-IN')} people</dd>
            {v.area_sqft && (<><dt className="text-muted">Area</dt><dd>{v.area_sqft.toLocaleString('en-IN')} sq ft</dd></>)}
            <dt className="text-muted">Tariff</dt><dd className="font-semibold">{inr(v.tariff_per_day)} per day</dd>
          </dl>
          <p className="text-sm text-muted mt-3">Excludes GST and charges for power and other services.</p>
          <Link href={`/account/bookings/new?venue=${v.id}`} className="btn w-full mt-5">Apply to book this venue</Link>
          <p className="text-sm text-muted mt-3">You need an organizer account to apply. <Link href="/register">Register</Link></p>
        </aside>
      </div>
    </div>
  )
}
