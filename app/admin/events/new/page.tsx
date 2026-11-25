import { requireRole } from '@/lib/auth'
import EventForm from '@/components/EventForm'
import { PageHeader } from '@/components/ui'

export default async function NewEvent() {
  await requireRole('super_admin', 'booking_manager')
  return <div><PageHeader back={{ href: '/admin/events', label: 'All events' }} eyebrow="Website" title="New event" /><EventForm /></div>
}
