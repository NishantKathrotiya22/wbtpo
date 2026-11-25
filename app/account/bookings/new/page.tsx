import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { setting } from '@/lib/db'
import { venues } from '@/lib/queries'
import { addDays, inr, todayIST } from '@/lib/dates'
import { submitBooking } from '@/lib/actions'
import ActionForm from '@/components/ActionForm'
import Field from '@/components/Field'
import { Alert, Button, Card, Page, PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'New booking application' }
const TYPES = ['Trade fair / exhibition', 'Conference / seminar', 'Cultural programme', 'Workshop / training', 'Buyer–seller meet', 'Press conference', 'Other']

const Part = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <Card as="section">
    <div className="flex items-center gap-3 mb-5">
      <span className="grid place-items-center size-10 rounded-full bg-primary text-white font-black" aria-hidden>{n}</span>
      <h2 className="text-xl">{title}</h2>
    </div>
    <div className="space-y-5">{children}</div>
  </Card>
)

export default async function NewBooking({ searchParams }: { searchParams: Promise<{ venue?: string }> }) {
  await requireRole('organizer')
  const { venue } = await searchParams
  const [vs, notice, advance] = [await venues(), await setting('min_notice_days', 7), await setting('advance_booking_days', 365)]
  const min = addDays(todayIST(), notice)
  return (
    <Page narrow>
      <PageHeader back={{ href: '/account', label: 'My bookings' }} eyebrow="New application" title="Apply to book a venue" description="Three short parts. Fields marked with a red star must be filled in." />
      <Alert tone="info" className="mb-6">Sending this form does not reserve the dates. An officer will review it and, if it can go ahead, hold the dates for you. Apply at least {notice} days before the event, and no more than {advance} days ahead.</Alert>
      <ActionForm action={submitBooking} className="space-y-6">
        <Part n={1} title="Choose the venue and dates">
          <Field label="Venue" required>
            <select name="venue" required defaultValue={venue} className="input">
              <option value="">Select a venue</option>
              {vs.map((v) => <option key={v.id} value={v.id}>{v.name}: {inr(v.tariff_per_day)} per day, up to {v.capacity.toLocaleString('en-IN')} people</option>)}
            </select>
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="First day of the event" required><input type="date" name="start" min={min} required className="input" /></Field>
            <Field label="Last day of the event" hint="Leave empty if it is a one-day event."><input type="date" name="end" min={min} className="input" /></Field>
          </div>
        </Part>
        <Part n={2} title="Tell us about the event">
          <Field label="Name of the event" required><input name="event_name" required maxLength={150} className="input" /></Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Type of event" required><select name="event_type" required className="input">{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Expected number of people" required><input type="number" name="attendance" min={1} required className="input" /></Field>
          </div>
          <Field label="Anything else we should know" hint="For example set-up needs, stalls, sound, power load, timings."><textarea name="remarks" maxLength={1500} className="input" /></Field>
        </Part>
        <Part n={3} title="Upload your documents">
          <Field label="Supporting documents" hint="Registration papers, authorisation letter or event brief. PDF, JPG or PNG, up to 5 MB each. You may select more than one.">
            <input type="file" name="docs" multiple accept=".pdf,.jpg,.jpeg,.png" className="input !py-2.5" />
          </Field>
        </Part>
        <div className="flex flex-wrap gap-3"><Button>Send application</Button><Button href="/account" variant="secondary">Cancel</Button></div>
      </ActionForm>
    </Page>
  )
}
