export default function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}{required && <b className="req" aria-hidden> *</b>}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}
