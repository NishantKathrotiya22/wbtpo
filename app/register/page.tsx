import type { Metadata } from 'next'
import ActionForm from '@/components/ActionForm'
import Field from '@/components/Field'
import { Button, Card, Page, PageHeader } from '@/components/ui'
import { register } from '@/lib/actions'

export const metadata: Metadata = { title: 'Create an organizer account' }

export default function Register() {
  return (
    <Page narrow>
      <PageHeader eyebrow="Step 1 of applying" title="Create an organizer account" description="With an account you can apply for a venue, upload documents and follow your application." />
      <Card>
        <ActionForm action={register} className="space-y-5">
          <Field label="Your name" required><input name="name" required autoComplete="name" className="input" /></Field>
          <Field label="Organisation" hint="Leave blank if you are applying as an individual."><input name="organisation" autoComplete="organization" className="input" /></Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Mobile number" required><input name="phone" type="tel" required autoComplete="tel" className="input" /></Field>
            <Field label="Email" required><input name="email" type="email" required autoComplete="email" className="input" /></Field>
          </div>
          <Field label="Choose a password" required hint="At least 8 characters."><input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" /></Field>
          <Button full>Create account</Button>
        </ActionForm>
      </Card>
      <p className="mt-5 text-center">Already registered? <a href="/login" className="font-bold">Sign in</a></p>
    </Page>
  )
}
