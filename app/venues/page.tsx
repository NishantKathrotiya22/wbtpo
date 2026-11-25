import Link from 'next/link'
import type { Metadata } from 'next'
import { venues } from '@/lib/queries'
import { inr } from '@/lib/dates'

export const metadata: Metadata = { title: 'Venues and tariffs' }

export default async function Venues() {
  const vs = await venues()
  return (
    <div className="wrap py-12">
      <h1>Venues and tariffs</h1>
      <p className="mt-3 max-w-[60ch] text-muted">Rates are per day, exclusive of GST. Power, generator use, security and other services are charged separately as per the tariff schedule.</p>
      <div className="mt-8 divide-y divide-line border-y border-line">
        {vs.map((v) => (
          <article key={v.id} className="py-6 grid gap-4 md:grid-cols-[1fr_16rem]">
            <div>
              <p className="eyebrow">{v.kind}</p>
              <h2 className="mt-1"><Link href={`/venues/${v.slug}`} className="text-ink no-underline hover:underline">{v.name}</Link></h2>
              <p className="mt-2 max-w-[62ch]">{v.description}</p>
              <p className="mt-2 text-sm text-muted">{v.amenities.join(' · ')}</p>
            </div>
            <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 self-start">
              <dt className="text-muted">Capacity</dt><dd>{v.capacity.toLocaleString('en-IN')}</dd>
              {v.area_sqft && (<><dt className="text-muted">Area</dt><dd>{v.area_sqft.toLocaleString('en-IN')} sq ft</dd></>)}
              <dt className="text-muted">Tariff</dt><dd className="font-semibold">{inr(v.tariff_per_day)} / day</dd>
              <dd className="col-span-2 mt-2"><Link href={`/venues/${v.slug}`}>Details and calendar</Link></dd>
            </dl>
          </article>
        ))}
      </div>
    </div>
  )
}
