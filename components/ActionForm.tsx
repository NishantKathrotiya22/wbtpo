'use client'
import { useActionState } from 'react'

export type State = { error?: string; ok?: string } | null

// Wraps a server action: shows its error/ok message and disables the fields while it runs.
export default function ActionForm({
  action,
  children,
  className,
}: {
  action: (prev: State, fd: FormData) => Promise<State>
  children: React.ReactNode
  className?: string
}) {
  const [state, run, pending] = useActionState(action, null)
  return (
    <form action={run} className={className}>
      {state?.error && <p role="alert" className="alert alert-err mb-4">{state.error}</p>}
      {state?.ok && <p role="status" className="alert alert-ok mb-4">{state.ok}</p>}
      <fieldset disabled={pending} className="contents">{children}</fieldset>
    </form>
  )
}
