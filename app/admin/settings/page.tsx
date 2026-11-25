import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { setting } from '@/lib/db'
import { saveSettings } from '@/lib/actions'
import ActionForm from '@/components/ActionForm'
import Field from '@/components/Field'

export const metadata: Metadata = { title: 'Settings' }

export default async function Settings() {
  await requireRole('super_admin')
  const [advance, notice] = [await setting('advance_booking_days', 365), await setting('min_notice_days', 7)]
  return (
    <div>
      <h1>Booking window</h1>
      <ActionForm action={saveSettings} className="panel p-6 mt-6 space-y-4 max-w-md">
        <Field label="Accept bookings up to (days ahead)"><input type="number" name="advance_booking_days" defaultValue={advance} min={1} max={1095} className="input" /></Field>
        <Field label="Minimum notice before an event (days)"><input type="number" name="min_notice_days" defaultValue={notice} min={0} max={180} className="input" /></Field>
        <button className="btn">Save</button>
      </ActionForm>
    </div>
  )
}
