import type { Metadata } from 'next'
import { publishedNotices } from '@/lib/queries'
import { fmtDate } from '@/lib/dates'
import { Card, EmptyState, Page, PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Notices and tenders' }

export default async function Notices() {
  const rows = await publishedNotices()
  return (
    <Page narrow>
      <PageHeader eyebrow="Information" title="Notices and tenders" />
      <div className="grid gap-4">
        {rows.map((n) => (
          <Card as="article" key={n.id} id={`n-${n.id}`}>
            <p className="text-sm text-muted font-semibold">{fmtDate(n.publish_on)} · <span className="capitalize">{n.category}</span></p>
            <h2 className="text-xl mt-1">{n.title}</h2>
            <p className="mt-2 whitespace-pre-line text-muted">{n.body}</p>
          </Card>
        ))}
        {!rows.length && <Card><EmptyState title="No notices at present" /></Card>}
      </div>
    </Page>
  )
}
