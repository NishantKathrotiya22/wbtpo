import type { Metadata } from 'next'
import ActionForm from '@/components/ActionForm'
import Field from '@/components/Field'
import { Button, Card, Page, PageHeader } from '@/components/ui'
import { submitEnquiry } from '@/lib/actions'

export const metadata: Metadata = { title: 'Contact the office' }

export default function Contact() {
  return (
    <Page narrow>
      <PageHeader eyebrow="Help" title="Contact the office" description="Ask about tariffs, dates or how to apply. Please give a phone number or email so we can reply." />
      <Card>
        <ActionForm action={submitEnquiry} className="space-y-5">
          <Field label="Your name" required><input name="name" required className="input" autoComplete="name" /></Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Mobile number"><input name="phone" type="tel" className="input" autoComplete="tel" /></Field>
            <Field label="Email"><input name="email" type="email" className="input" autoComplete="email" /></Field>
          </div>
          <Field label="Your question" required><textarea name="message" required maxLength={2000} className="input" /></Field>
          <Button>Send enquiry</Button>
        </ActionForm>
      </Card>
    </Page>
  )
}
