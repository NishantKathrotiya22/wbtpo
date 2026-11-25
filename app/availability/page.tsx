import type { Metadata } from 'next'
import { entriesFor, venues } from '@/lib/queries'
import { monthOf } from '@/lib/dates'
import MonthCalendar from '@/components/MonthCalendar'
import { Alert, Button, Card, Page, PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Check available dates' }

export default async function Availability({ searchParams }: { searchParams: Promise<{ venue?: string; m?: string }> }) {
  const sp = await searchParams
  const vs = await venues()
  const v = vs.find((x) => x.slug === sp.venue) ?? vs[0]
  const m = monthOf(sp.m)
  const entries = await entriesFor(v.id, m.first, m.last)
  return (
    <Page>
      <PageHeader eyebrow="Availability" title="Check available dates" description="Step 1: choose a venue. Step 2: look for white days. Step 3: apply." />
      <nav aria-label="Venue" className="mb-6 flex flex-wrap gap-2">
        {vs.map((x) => <Button key={x.id} href={`/availability?venue=${x.slug}&m=${m.ym}`} size="sm" variant={x.id === v.id ? 'primary' : 'secondary'}>{x.name}</Button>)}
      </nav>
      <Card><MonthCalendar ym={m.ym} entries={entries} href={(ym) => `/availability?venue=${v.slug}&m=${ym}`} /></Card>
      <Alert tone="info" className="mt-6">Days marked “On hold” are being processed for another organizer. They may become free again if that application is not approved.</Alert>
      <div className="mt-8"><Button href={`/account/bookings/new?venue=${v.id}`}>Apply to book {v.name}</Button></div>
    </Page>
  )
}
