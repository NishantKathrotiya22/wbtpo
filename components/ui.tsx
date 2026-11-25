// Shared UI kit. Every page builds from these so spacing, radii, colours and wording patterns stay identical.
import Link from 'next/link'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Info, TriangleAlert, Check, type LucideIcon } from 'lucide-react'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/* ---------- Button ---------- */
type Variant = 'primary' | 'secondary' | 'danger' | 'light' | 'ghost-light'
type BtnProps = { variant?: Variant; size?: 'md' | 'sm'; full?: boolean; stack?: boolean; className?: string; children: React.ReactNode }
const btnClass = ({ variant = 'primary', size = 'md', full, stack, className }: BtnProps) =>
  cx('btn', variant !== 'primary' && `btn-${variant}`, size === 'sm' && 'btn-sm', full && 'btn-full', stack && 'btn-stack', className)

export function Button({ href, ...p }: BtnProps & ({ href: string } | ({ href?: undefined } & React.ComponentProps<'button'>))) {
  const { variant, size, full, stack, className, children, ...rest } = p as BtnProps & Record<string, unknown>
  const cls = btnClass({ variant, size, full, stack, className, children })
  return href ? <Link href={href} className={cls}>{children}</Link> : <button className={cls} {...(rest as object)}>{children}</button>
}

/* ---------- Layout ---------- */
export function Page({ children, narrow, className }: { children: React.ReactNode; narrow?: boolean | 'sm'; className?: string }) {
  return <div className={cx('wrap py-10 md:py-14', narrow === true && 'max-w-[860px]', narrow === 'sm' && 'max-w-[560px]', className)}>{children}</div>
}

export function PageHeader({ eyebrow, title, description, actions, back }: {
  eyebrow?: string; title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string }
}) {
  return (
    <header className="mb-8">
      {back && <Link href={back.href} className="inline-flex items-center gap-1.5 font-semibold text-sm mb-4 no-underline"><ArrowLeft size={16} />{back.label}</Link>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[46rem]">
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h1 className="text-[clamp(1.75rem,3.6vw,2.5rem)]">{title}</h1>
          {description && <p className="mt-3 text-lg text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </header>
  )
}

export function Section({ title, description, action, children, className }: {
  title?: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  return (
    <section className={cx('mb-10 md:mb-12', className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>{title && <h2 className="text-[1.6rem]">{title}</h2>}{description && <p className="text-muted mt-1">{description}</p>}</div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Card({ children, className, pad = true, soft, as: Tag = 'div' }: { children: React.ReactNode; className?: string; pad?: boolean; soft?: boolean; as?: 'div' | 'aside' | 'section' | 'article' | 'li' }) {
  return <Tag className={cx('card', pad && 'card-pad', soft && 'card-soft', className)}>{children}</Tag>
}

export function DataTable({ children, empty }: { children: React.ReactNode; empty?: React.ReactNode }) {
  return <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="tbl">{children}</table></div>{empty}</div>
}

/* key/value list used on every detail page */
export function Facts({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid sm:grid-cols-[12rem_1fr] gap-x-6 gap-y-3">
      {items.filter(([, v]) => v != null && v !== '').map(([k, v]) => (<div key={k} className="contents"><dt className="text-muted font-semibold">{k}</dt><dd>{v}</dd></div>))}
    </dl>
  )
}

/* ---------- Feedback ---------- */
const ALERT_ICON = { error: AlertCircle, success: CheckCircle2, info: Info, warn: TriangleAlert }
export function Alert({ tone = 'info', title, children, className }: { tone?: keyof typeof ALERT_ICON; title?: string; children?: React.ReactNode; className?: string }) {
  const I = ALERT_ICON[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cx('alert', `alert-${tone}`, className)}>
      <I size={22} className="shrink-0 mt-0.5" aria-hidden />
      <div>{title && <p className="font-bold">{title}</p>}{children && <div>{children}</div>}</div>
    </div>
  )
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="text-center py-12 px-6">
      <p className="font-bold text-lg">{title}</p>
      {children && <p className="text-muted mt-1 max-w-[44ch] mx-auto">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ---------- Content blocks ---------- */
export function Stat({ label, value, hint, icon: Icon, tone = 'info' }: { label: string; value: React.ReactNode; hint?: string; icon?: LucideIcon; tone?: 'info' | 'ok' | 'hold' | 'bad' }) {
  const bg = { info: 'bg-soft text-primary', ok: 'bg-ok-soft text-ok', hold: 'bg-hold-soft text-hold', bad: 'bg-bad-soft text-bad' }[tone]
  return (
    <Card className="flex items-start gap-4">
      {Icon && <span className={cx('grid place-items-center size-12 rounded-2xl shrink-0', bg)}><Icon size={24} aria-hidden /></span>}
      <div className="min-w-0">
        <p className="text-sm font-bold text-muted">{label}</p>
        <p className="text-[1.75rem] font-black leading-tight tabular-nums break-words">{value}</p>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
    </Card>
  )
}

/* icon + micro-label + title + description + arrow. The one tile used for "go to…" actions everywhere. */
export function ResourceCard({ href, icon: Icon, label, title, children, badge }: { href: string; icon: LucideIcon; label?: string; title: string; children?: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <Link href={href} className="card card-pad card-lift group block no-underline text-ink hover:text-ink">
      <div className="flex items-start justify-between">
        <span className="grid place-items-center size-12 rounded-2xl bg-soft text-primary"><Icon size={24} aria-hidden /></span>
        {badge}
      </div>
      {label && <p className="eyebrow mt-4">{label}</p>}
      <p className={cx('text-[1.15rem] font-black leading-snug', !label && 'mt-4')}>{title}</p>
      {children && <p className="text-muted mt-1">{children}</p>}
      <span className="mt-3 inline-flex items-center gap-1.5 font-bold text-primary transition-transform group-hover:translate-x-1">Open <ArrowRight size={16} aria-hidden /></span>
    </Link>
  )
}

export function Journey({ steps }: { steps: [string, string][] }) {
  return (
    <ol className="journey list-none p-0 m-0">
      {steps.map(([t, d], i) => (
        <li key={t} className="card card-pad card-lift text-center">
          <div className="step-badge mx-auto -mt-1 mb-3" aria-hidden>{String(i + 1).padStart(2, '0')}</div>
          <h3 className="text-[1.1rem]">{t}</h3>
          <p className="text-muted mt-1 text-[.95rem]">{d}</p>
        </li>
      ))}
    </ol>
  )
}

export function Checklist({ items }: { items: [string, string?][] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map(([t, d]) => (
        <li key={t} className="card card-pad flex gap-3 !py-4">
          <span className="grid place-items-center size-7 rounded-full bg-ok-soft text-ok shrink-0 mt-0.5"><Check size={16} strokeWidth={3} aria-hidden /></span>
          <div><p className="font-bold leading-snug">{t}</p>{d && <p className="text-muted text-[.95rem]">{d}</p>}</div>
        </li>
      ))}
    </ul>
  )
}

export function Faq({ items }: { items: [string, React.ReactNode][] }) {
  return <div className="grid gap-3">{items.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><div>{a}</div></details>)}</div>
}

export function DarkPanel({ eyebrow, title, children }: { eyebrow?: string; title: string; children: React.ReactNode }) {
  return (
    <section className="panel-dark p-7 md:p-10">
      {eyebrow && <p className="eyebrow !text-blue-300">{eyebrow}</p>}
      <h2 className="mt-2 max-w-[28ch]">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  )
}
export const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 font-bold text-[.95rem] text-white">{children}</span>
)

export function SupportPanel({ title, children, actions }: { title: string; children: React.ReactNode; actions: React.ReactNode }) {
  return (
    <section className="panel-support p-7 md:p-10 flex flex-wrap items-center justify-between gap-6">
      <div className="max-w-[40rem]"><h2>{title}</h2><p className="mt-2 text-blue-100 text-lg">{children}</p></div>
      <div className="flex flex-wrap gap-3">{actions}</div>
    </section>
  )
}
