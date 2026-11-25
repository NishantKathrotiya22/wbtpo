import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { one } from '@/lib/db'
import EventForm from '@/components/EventForm'
import { PageHeader } from '@/components/ui'

export default async function EditEvent({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('super_admin', 'booking_manager')
  const id = Number((await params).id)
  const e = await one<any>('select * from events where id=$1', [Number.isInteger(id) ? id : 0])
  if (!e) notFound()
  return <div><PageHeader back={{ href: '/admin/events', label: 'All events' }} eyebrow="Website" title="Edit event" /><EventForm e={e} /></div>
}
