import type { Metadata } from 'next'
import ActionForm from '@/components/ActionForm'
import Field from '@/components/Field'
import { Button, Card, Page, PageHeader } from '@/components/ui'
import { login } from '@/lib/actions'

export const metadata: Metadata = { title: 'Sign in' }

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <Page narrow="sm">
      <PageHeader title="Sign in" description="Use the email and password you registered with." />
      <Card>
        <ActionForm action={login} className="space-y-5">
          <input type="hidden" name="next" value={next ?? ''} />
          <Field label="Email" required><input name="email" type="email" required autoComplete="username" className="input" /></Field>
          <Field label="Password" required><input name="password" type="password" required autoComplete="current-password" className="input" /></Field>
          <Button full>Sign in</Button>
        </ActionForm>
      </Card>
      <p className="mt-5 text-center">New organizer? <a href="/register" className="font-bold">Create a free account</a></p>
    </Page>
  )
}
