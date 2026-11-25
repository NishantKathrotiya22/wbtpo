import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { setting } from '@/lib/db'
import { saveSettings } from '@/lib/actions'
import ActionForm from '@/components/ActionForm'
import Field from '@/components/Field'
import { Button, Card, PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Booking window' }

export default async function Settings() {
  await requireRole('super_admin')
  const [advance, notice] = [await setting('advance_booking_days', 365), await setting('min_notice_days', 7)]
  return (
    <div>
      <PageHeader eyebrow="Control" title="Booking window" description="Decide how far ahead, and how late, organizers can apply." />
      <Card className="max-w-xl">
        <ActionForm action={saveSettings} className="space-y-5">
          <Field label="Accept applications up to this many days ahead" hint="For example 365 means one year in advance."><input type="number" name="advance_booking_days" defaultValue={advance} min={1} max={1095} className="input" /></Field>
          <Field label="Minimum days of notice before an event" hint="Applications for dates sooner than this are refused."><input type="number" name="min_notice_days" defaultValue={notice} min={0} max={180} className="input" /></Field>
          <Button>Save</Button>
        </ActionForm>
      </Card>
    </div>
  )
}
