import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { one } from '@/lib/db'
import EventForm from '@/components/EventForm'

export default async function EditEvent({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('super_admin', 'booking_manager')
  const id = Number((await params).id)
  const e = await one<any>('select * from events where id=$1', [Number.isInteger(id) ? id : 0])
  if (!e) notFound()
  return <div><h1 className="mb-6">Edit event</h1><EventForm e={e} /></div>
}
