import { requireRole } from '@/lib/auth'
import EventForm from '@/components/EventForm'

export default async function NewEvent() {
  await requireRole('super_admin', 'booking_manager')
  return <div><h1 className="mb-6">New event</h1><EventForm /></div>
}
