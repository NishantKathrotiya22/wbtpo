import Link from 'next/link'
import type { Metadata } from 'next'
import ActionForm from '@/components/ActionForm'
import Field from '@/components/Field'
import { register } from '@/lib/actions'

export const metadata: Metadata = { title: 'Register as an organizer' }

export default function Register() {
  return (
    <div className="wrap py-12 max-w-xl">
      <h1>Register as an organizer</h1>
      <p className="mt-3 text-muted">An account lets you apply for venues, upload documents and follow the status of each application.</p>
      <ActionForm action={register} className="mt-6 panel p-6 space-y-4">
        <Field label="Your name"><input name="name" required autoComplete="name" className="input" /></Field>
        <Field label="Organisation" hint="Leave blank if applying as an individual."><input name="organisation" autoComplete="organization" className="input" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email"><input name="email" type="email" required autoComplete="email" className="input" /></Field>
          <Field label="Mobile number"><input name="phone" type="tel" required autoComplete="tel" className="input" /></Field>
        </div>
        <Field label="Password" hint="At least 8 characters."><input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" /></Field>
        <button className="btn w-full">Create account</button>
      </ActionForm>
      <p className="mt-4 text-sm">Already registered? <Link href="/login">Sign in</Link></p>
    </div>
  )
}
