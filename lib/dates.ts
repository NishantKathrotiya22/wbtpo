// All dates are plain 'YYYY-MM-DD' strings; arithmetic goes through UTC so the server timezone never matters.
const D = (s: string) => new Date(s + 'T00:00:00Z')
const S = (d: Date) => d.toISOString().slice(0, 10)

export const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
export const addDays = (s: string, n: number) => S(new Date(D(s).getTime() + n * 864e5))
export const diffDays = (a: string, b: string) => Math.round((D(b).getTime() - D(a).getTime()) / 864e5)
export const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(D(s).getTime())

export const fmtDate = (s: string) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(D(s))
export const fmtRange = (a: string, b: string) => (a === b ? fmtDate(a) : `${fmtDate(a)} – ${fmtDate(b)}`)
export const fmtStamp = (d: Date | string) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(d))
export const inr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export function monthOf(ym: string | undefined) {
  const m = /^(\d{4})-(\d{2})$/.test(ym ?? '') ? (ym as string) : todayIST().slice(0, 7)
  const first = m + '-01'
  const next = S(new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 1)))
  const prev = S(new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 2, 1))).slice(0, 7)
  return { ym: m, first, last: addDays(next, -1), prev, next: next.slice(0, 7) }
}
export const monthTitle = (ym: string) =>
  new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(D(ym + '-01'))
export const weekdayMon0 = (s: string) => (D(s).getUTCDay() + 6) % 7
