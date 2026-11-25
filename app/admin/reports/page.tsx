import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'

export const metadata: Metadata = { title: 'Reports' }

const R = [
  ['bookings', 'Bookings register', 'Every application with organizer, venue, dates, status and approved amount.'],
  ['payments', 'Payments and receivables', 'Every instalment with due date, amount, received amount, outstanding balance and status.'],
  ['utilisation', 'Venue utilisation', 'Confirmed and completed booking days per venue.'],
]

export default async function Reports() {
  await requireAdmin()
  return (
    <div>
      <h1>Reports</h1>
      <p className="mt-2 text-muted">Downloads open in Excel or any spreadsheet program (CSV).</p>
      <ul className="mt-6 divide-y divide-line border-y border-line max-w-3xl">
        {R.map(([k, t, d]) => (
          <li key={k} className="py-4 flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-semibold">{t}</p><p className="text-sm text-muted">{d}</p></div>
            <a href={`/admin/export/${k}`} className="btn btn-quiet btn-sm">Download CSV</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
