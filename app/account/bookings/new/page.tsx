import Link from 'next/link'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { setting } from '@/lib/db'
import { venues } from '@/lib/queries'
import { addDays, todayIST } from '@/lib/dates'
import { inr } from '@/lib/dates'
import { submitBooking } from '@/lib/actions'
import ActionForm from '@/components/ActionForm'
import Field from '@/components/Field'

export const metadata: Metadata = { title: 'New booking application' }
const TYPES = ['Trade fair / exhibition', 'Conference / seminar', 'Cultural programme', 'Workshop / training', 'Buyer–seller meet', 'Press conference', 'Other']

export default async function NewBooking({ searchParams }: { searchParams: Promise<{ venue?: string }> }) {
  await requireRole('organizer')
  const { venue } = await searchParams
  const [vs, notice, advance] = [await venues(), await setting('min_notice_days', 7), await setting('advance_booking_days', 365)]
  const min = addDays(todayIST(), notice)
  return (
    <div className="wrap py-12 max-w-3xl">
      <p className="text-sm"><Link href="/account">← My bookings</Link></p>
      <h1 className="mt-3">New booking application</h1>
      <p className="mt-3 text-muted max-w-[60ch]">
        Submitting does not reserve the dates. WBTPO will scrutinise the application and, if it can go ahead, hold the dates for you.
        Applications must be made at least {notice} days ahead and no more than {advance} days in advance.
      </p>
      <ActionForm action={submitBooking} className="mt-8 panel p-6 space-y-5">
        <Field label="Venue">
          <select name="venue" required defaultValue={venue} className="input">
            <option value="">Select a venue</option>
            {vs.map((v) => <option key={v.id} value={v.id}>{v.name} – {inr(v.tariff_per_day)} per day, up to {v.capacity.toLocaleString('en-IN')} people</option>)}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First day of event"><input type="date" name="start" min={min} required className="input" /></Field>
          <Field label="Last day of event" hint="Leave blank for a one-day event."><input type="date" name="end" min={min} className="input" /></Field>
        </div>
        <Field label="Name of the event"><input name="event_name" required maxLength={150} className="input" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type of event">
            <select name="event_type" required className="input">{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <Field label="Expected attendance"><input type="number" name="attendance" min={1} required className="input" /></Field>
        </div>
        <Field label="Anything else we should know" hint="Set-up needs, stalls, sound, power load, time of day, and so on.">
          <textarea name="remarks" maxLength={1500} className="input" />
        </Field>
        <Field label="Supporting documents" hint="Organisation registration, authorisation letter, event brief. PDF, JPG or PNG, up to 5 MB each.">
          <input type="file" name="docs" multiple accept=".pdf,.jpg,.jpeg,.png" className="input" />
        </Field>
        <button className="btn">Submit application</button>
      </ActionForm>
    </div>
  )
}
