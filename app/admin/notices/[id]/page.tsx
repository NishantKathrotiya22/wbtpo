import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { one } from '@/lib/db'
import NoticeForm from '@/components/NoticeForm'
import { PageHeader } from '@/components/ui'

export default async function EditNotice({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('super_admin', 'booking_manager')
  const id = Number((await params).id)
  const n = await one<any>('select * from notices where id=$1', [Number.isInteger(id) ? id : 0])
  if (!n) notFound()
  return <div><PageHeader back={{ href: '/admin/notices', label: 'All notices' }} eyebrow="Website" title="Edit notice" /><NoticeForm n={n} /></div>
}
