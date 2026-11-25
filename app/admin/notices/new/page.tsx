import { requireRole } from '@/lib/auth'
import NoticeForm from '@/components/NoticeForm'

export default async function NewNotice() {
  await requireRole('super_admin', 'booking_manager')
  return <div><h1 className="mb-6">New notice</h1><NoticeForm /></div>
}
