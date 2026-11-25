import type { Metadata } from 'next'
import { Users, Maximize2 } from 'lucide-react'
import { venues } from '@/lib/queries'
import { inr } from '@/lib/dates'
import { Alert, Button, Card, Page, PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Venues and tariffs' }

export default async function Venues() {
  const vs = await venues()
  return (
    <Page>
      <PageHeader eyebrow="Venues" title="Venues and tariffs" description="Pick the venue that fits your event, then check its dates." />
      <Alert tone="info" className="mb-8">Rates are per day and exclude GST. Power, generator use, security and other services are charged separately as per the tariff schedule.</Alert>
      <div className="grid gap-6 md:grid-cols-2">
        {vs.map((v) => (
          <Card as="article" key={v.id} className="flex flex-col">
            <p className="eyebrow">{v.kind}</p>
            <h2 className="text-2xl mt-1">{v.name}</h2>
            <p className="mt-3 text-muted">{v.description}</p>
            <p className="mt-3 text-sm text-muted">{v.amenities.join(' · ')}</p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 font-semibold">
              <span className="inline-flex items-center gap-2"><Users size={18} className="text-primary" aria-hidden />{v.capacity.toLocaleString('en-IN')} people</span>
              {v.area_sqft && <span className="inline-flex items-center gap-2"><Maximize2 size={18} className="text-primary" aria-hidden />{v.area_sqft.toLocaleString('en-IN')} sq ft</span>}
            </div>
            <div className="mt-auto pt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xl font-black">{inr(v.tariff_per_day)} <span className="text-base font-medium text-muted">per day</span></p>
              <Button href={`/venues/${v.slug}`} size="sm">View dates</Button>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  )
}
