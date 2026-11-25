import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { q } from '@/lib/db'
import { fmtStamp } from '@/lib/dates'
import { setEnquiryStatus } from '@/lib/actions'
import StatusBadge from '@/components/StatusBadge'

export const metadata: Metadata = { title: 'Enquiries' }

export default async function Enquiries() {
  await requireRole('super_admin', 'booking_manager')
  const rows = await q<any>('select * from enquiries order by created_at desc limit 100')
  return (
    <div>
      <h1>Enquiries</h1>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {rows.map((e) => (
          <li key={e.id} className="py-4 grid gap-2 md:grid-cols-[1fr_auto]">
            <div>
              <p><strong>{e.name}</strong> <span className="text-muted text-sm">· {fmtStamp(e.created_at)}</span> <StatusBadge status={e.status} /></p>
              <p className="text-sm text-muted">{[e.email, e.phone].filter(Boolean).join(' · ')}</p>
              <p className="mt-1 whitespace-pre-line max-w-[70ch]">{e.message}</p>
            </div>
            <div className="flex gap-3 text-sm self-start">
              {e.status !== 'replied' && <form action={setEnquiryStatus.bind(null, e.id, 'replied')}><button className="text-brick hover:underline cursor-pointer">Mark replied</button></form>}
              {e.status !== 'closed' && <form action={setEnquiryStatus.bind(null, e.id, 'closed')}><button className="text-brick hover:underline cursor-pointer">Close</button></form>}
            </div>
          </li>
        ))}
        {!rows.length && <li className="py-6 text-muted">No enquiries yet.</li>}
      </ul>
    </div>
  )
}
