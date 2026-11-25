import type { Metadata } from 'next'
import { Plus } from 'lucide-react'
import { requireRole } from '@/lib/auth'
import { q } from '@/lib/db'
import { fmtDate } from '@/lib/dates'
import { setNoticeStatus } from '@/lib/actions'
import StatusBadge from '@/components/StatusBadge'
import { Button, DataTable, EmptyState, PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Notices' }

export default async function AdminNotices() {
  await requireRole('super_admin', 'booking_manager')
  const rows = await q<any>('select * from notices order by publish_on desc, id desc')
  return (
    <div>
      <PageHeader eyebrow="Website" title="Notices and tenders" description="Only notices marked Published appear on the public site." actions={<Button href="/admin/notices/new"><Plus size={18} aria-hidden />New notice</Button>} />
      <DataTable empty={!rows.length && <EmptyState title="No notices yet" />}>
        {rows.length > 0 && (<><thead><tr><th>Title</th><th>Type</th><th>Show from</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{rows.map((n) => (
            <tr key={n.id}>
              <td className="font-semibold">{n.title}</td><td className="capitalize">{n.category}</td><td>{fmtDate(n.publish_on)}</td><td><StatusBadge status={n.status} /></td>
              <td className="whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Button href={`/admin/notices/${n.id}`} variant="secondary" size="sm">Edit</Button>
                  {n.status !== 'published' && <form action={setNoticeStatus.bind(null, n.id, 'published')}><Button size="sm">Publish</Button></form>}
                  {n.status === 'published' && <form action={setNoticeStatus.bind(null, n.id, 'archived')}><Button variant="secondary" size="sm">Archive</Button></form>}
                </div>
              </td>
            </tr>))}</tbody></>)}
      </DataTable>
    </div>
  )
}
