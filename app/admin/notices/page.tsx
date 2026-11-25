import Link from 'next/link'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { q } from '@/lib/db'
import { fmtDate } from '@/lib/dates'
import { setNoticeStatus } from '@/lib/actions'
import StatusBadge from '@/components/StatusBadge'

export const metadata: Metadata = { title: 'Notices' }

export default async function AdminNotices() {
  await requireRole('super_admin', 'booking_manager')
  const rows = await q<any>('select * from notices order by publish_on desc, id desc')
  return (
    <div>
      <div className="flex items-center justify-between"><h1>Notices and tenders</h1><Link href="/admin/notices/new" className="btn">New notice</Link></div>
      <div className="panel mt-6 overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Title</th><th>Type</th><th>Publish on</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rows.map((n) => (
              <tr key={n.id}>
                <td className="font-semibold">{n.title}</td><td className="capitalize">{n.category}</td><td>{fmtDate(n.publish_on)}</td><td><StatusBadge status={n.status} /></td>
                <td className="whitespace-nowrap space-x-4">
                  <Link href={`/admin/notices/${n.id}`}>Edit</Link>
                  {n.status !== 'published' && <form className="inline" action={setNoticeStatus.bind(null, n.id, 'published')}><button className="text-brick hover:underline cursor-pointer">Publish</button></form>}
                  {n.status === 'published' && <form className="inline" action={setNoticeStatus.bind(null, n.id, 'archived')}><button className="text-brick hover:underline cursor-pointer">Archive</button></form>}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="text-muted py-6 text-center">No notices yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
