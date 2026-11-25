import Link from 'next/link'
import type { Metadata } from 'next'
import ActionForm from '@/components/ActionForm'
import Field from '@/components/Field'
import { login } from '@/lib/actions'

export const metadata: Metadata = { title: 'Sign in' }

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <div className="wrap py-12 max-w-md">
      <h1>Sign in</h1>
      <ActionForm action={login} className="mt-6 panel p-6 space-y-4">
        <input type="hidden" name="next" value={next ?? ''} />
        <Field label="Email"><input name="email" type="email" required autoComplete="username" className="input" /></Field>
        <Field label="Password"><input name="password" type="password" required autoComplete="current-password" className="input" /></Field>
        <button className="btn w-full">Sign in</button>
      </ActionForm>
      <p className="mt-4 text-sm">New organizer? <Link href="/register">Create an account</Link></p>
    </div>
  )
}
