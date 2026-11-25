import { requireRole } from '@/lib/auth'
import NoticeForm from '@/components/NoticeForm'
import { PageHeader } from '@/components/ui'

export default async function NewNotice() {
  await requireRole('super_admin', 'booking_manager')
  return <div><PageHeader back={{ href: '/admin/notices', label: 'All notices' }} eyebrow="Website" title="New notice" /><NoticeForm /></div>
}
