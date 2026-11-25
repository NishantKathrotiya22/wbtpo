import type { Metadata } from 'next'
import { publishedNotices } from '@/lib/queries'
import { fmtDate } from '@/lib/dates'

export const metadata: Metadata = { title: 'Notices and tenders' }

export default async function Notices() {
  const rows = await publishedNotices()
  return (
    <div className="wrap py-12">
      <h1>Notices and tenders</h1>
      <ul className="mt-8 divide-y divide-line border-y border-line max-w-3xl">
        {rows.map((n) => (
          <li key={n.id} className="py-5">
            <p className="text-sm text-muted">{fmtDate(n.publish_on)} · <span className="capitalize">{n.category}</span></p>
            <h2 className="text-xl mt-1">{n.title}</h2>
            <p className="mt-2 whitespace-pre-line">{n.body}</p>
          </li>
        ))}
        {!rows.length && <li className="py-6 text-muted">There are no notices at present.</li>}
      </ul>
    </div>
  )
}
