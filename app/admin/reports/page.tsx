import type { Metadata } from 'next'
import { Download } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { Card, PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Reports' }

const R = [
  ['bookings', 'Bookings register', 'Every application with organizer, venue, dates, status and approved amount.'],
  ['payments', 'Payments and receivables', 'Every instalment with due date, amount received and balance.'],
  ['utilisation', 'Venue use', 'Confirmed and completed booking days for each venue.'],
]

export default async function Reports() {
  await requireAdmin()
  return (
    <div>
      <PageHeader eyebrow="Reports" title="Download reports" description="Files open in Excel or any spreadsheet program." />
      <div className="grid gap-4 max-w-3xl">
        {R.map(([k, t, d]) => (
          <Card as="article" key={k} className="flex flex-wrap items-center justify-between gap-4">
            <div><h2 className="text-xl">{t}</h2><p className="text-muted">{d}</p></div>
            <a href={`/admin/export/${k}`} className="btn btn-secondary"><Download size={18} aria-hidden />Download</a>
          </Card>
        ))}
      </div>
    </div>
  )
}
