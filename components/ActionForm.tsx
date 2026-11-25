'use client'
import { useActionState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export type State = { error?: string; ok?: string } | null

// Wraps a server action: shows its error/ok message and disables the fields while it runs.
export default function ActionForm({
  action, children, className,
}: { action: (prev: State, fd: FormData) => Promise<State>; children: React.ReactNode; className?: string }) {
  const [state, run, pending] = useActionState(action, null)
  return (
    <form action={run}>
      {state?.error && <p role="alert" className="alert alert-error mb-4"><AlertCircle size={22} className="shrink-0" aria-hidden />{state.error}</p>}
      {state?.ok && <p role="status" className="alert alert-success mb-4"><CheckCircle2 size={22} className="shrink-0" aria-hidden />{state.ok}</p>}
      <fieldset disabled={pending} className={`min-w-0 ${className ?? ""}`}>{children}</fieldset>
    </form>
  )
}
