import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { q } from '@/lib/db'
import { fmtStamp } from '@/lib/dates'
import { setEnquiryStatus } from '@/lib/actions'
import StatusBadge from '@/components/StatusBadge'
import { Button, Card, EmptyState, PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Enquiries' }

export default async function Enquiries() {
  await requireRole('super_admin', 'booking_manager')
  const rows = await q<any>('select * from enquiries order by (status=\'new\') desc, created_at desc limit 100')
  return (
    <div>
      <PageHeader eyebrow="Website" title="Enquiries" description="Questions sent through the Contact page. Call or email the person, then mark it replied." />
      <div className="grid gap-4">
        {rows.map((e) => (
          <Card as="article" key={e.id} className="flex flex-wrap justify-between gap-4">
            <div className="min-w-0 max-w-[60ch]">
              <p className="flex flex-wrap items-center gap-2"><strong className="text-lg">{e.name}</strong><StatusBadge status={e.status} /></p>
              <p className="text-sm text-muted">{fmtStamp(e.created_at)} · {[e.phone, e.email].filter(Boolean).join(' · ')}</p>
              <p className="mt-2 whitespace-pre-line">{e.message}</p>
            </div>
            <div className="flex gap-2 self-start">
              {e.status !== 'replied' && <form action={setEnquiryStatus.bind(null, e.id, 'replied')}><Button size="sm">Mark replied</Button></form>}
              {e.status !== 'closed' && <form action={setEnquiryStatus.bind(null, e.id, 'closed')}><Button variant="secondary" size="sm">Close</Button></form>}
            </div>
          </Card>
        ))}
        {!rows.length && <Card><EmptyState title="No enquiries yet" /></Card>}
      </div>
    </div>
  )
}
