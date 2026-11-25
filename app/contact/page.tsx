import type { Metadata } from 'next'
import ActionForm from '@/components/ActionForm'
import Field from '@/components/Field'
import { submitEnquiry } from '@/lib/actions'

export const metadata: Metadata = { title: 'Contact' }

export default function Contact() {
  return (
    <div className="wrap py-12 max-w-2xl">
      <h1>Contact the office</h1>
      <p className="mt-3 text-muted">Questions about tariffs, dates or the booking process can be sent here. Please include a phone number or email so the office can reply.</p>
      <ActionForm action={submitEnquiry} className="mt-8 panel p-6 space-y-4">
        <Field label="Your name"><input name="name" required className="input" autoComplete="name" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email"><input name="email" type="email" className="input" autoComplete="email" /></Field>
          <Field label="Phone"><input name="phone" type="tel" className="input" autoComplete="tel" /></Field>
        </div>
        <Field label="Message"><textarea name="message" required maxLength={2000} className="input" /></Field>
        <button className="btn">Send enquiry</button>
      </ActionForm>
    </div>
  )
}
