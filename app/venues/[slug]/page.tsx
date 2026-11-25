import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { one } from '@/lib/db'
import { entriesFor, type Venue } from '@/lib/queries'
import { inr, monthOf } from '@/lib/dates'
import MonthCalendar from '@/components/MonthCalendar'
import { Button, Card, Facts, Page, PageHeader, Section } from '@/components/ui'

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
    <Page>
      <PageHeader back={{ href: '/venues', label: 'All venues' }} eyebrow={v.kind} title={v.name} description={v.description} />
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] items-start">
        <div>
          <Section title="Available dates" description="White days are free. Pick your dates, then apply.">
            <Card><MonthCalendar ym={m.ym} entries={entries} href={(ym) => `/venues/${v.slug}?m=${ym}`} /></Card>
          </Section>
          <Section title="Facilities">
            <ul className="grid sm:grid-cols-2 gap-3">{v.amenities.map((a) => <li key={a} className="card card-pad !py-3 font-semibold">{a}</li>)}</ul>
          </Section>
        </div>
        <Card as="aside" className="lg:sticky lg:top-32">
          <Facts items={[['Capacity', `${v.capacity.toLocaleString('en-IN')} people`], ['Area', v.area_sqft ? `${v.area_sqft.toLocaleString('en-IN')} sq ft` : ''], ['Tariff', <strong key="t">{inr(v.tariff_per_day)} per day</strong>]]} />
          <p className="text-sm text-muted mt-3">Excludes GST and charges for power and other services.</p>
          <Button href={`/account/bookings/new?venue=${v.id}`} full className="mt-5">Apply to book this venue</Button>
          <p className="text-sm text-muted mt-3 text-center">You need an organizer account. <a href="/register" className="font-bold">Register free</a></p>
        </Card>
      </div>
    </Page>
  )
}
