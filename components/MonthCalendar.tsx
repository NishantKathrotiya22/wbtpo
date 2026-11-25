import Link from 'next/link'
import { addDays, monthOf, monthTitle, todayIST, weekdayMon0 } from '@/lib/dates'
import type { Entry } from '@/lib/queries'

const PUBLIC_LABEL: Record<string, string> = { confirmed: 'Booked', provisional: 'On hold', blocked: 'Unavailable' }
const RANK: Record<string, number> = { confirmed: 3, blocked: 2, provisional: 1 }

export default function MonthCalendar({
  ym, entries, href, admin = false,
}: { ym: string; entries: Entry[]; href: (ym: string) => string; admin?: boolean }) {
  const m = monthOf(ym)
  const today = todayIST()
  const byDay = new Map<string, Entry>()
  for (const e of entries)
    for (let d = e.start_date < m.first ? m.first : e.start_date; d <= e.end_date && d <= m.last; d = addDays(d, 1)) {
      const cur = byDay.get(d)
      if (!cur || RANK[e.status] > RANK[cur.status]) byDay.set(d, e)
    }

  const lead = weekdayMon0(m.first)
  const total = Math.ceil((lead + Number(m.last.slice(8))) / 7) * 7
  const cells = Array.from({ length: total }, (_, i) => addDays(m.first, i - lead))

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Link href={href(m.prev)} className="btn btn-quiet btn-sm" aria-label="Previous month">← Previous</Link>
        <h3 aria-live="polite">{monthTitle(m.ym)}</h3>
        <Link href={href(m.next)} className="btn btn-quiet btn-sm" aria-label="Next month">Next →</Link>
      </div>
      <table className="cal">
        <thead><tr>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <th key={d} scope="col">{d}</th>)}</tr></thead>
        <tbody>
          {Array.from({ length: total / 7 }, (_, w) => (
            <tr key={w}>
              {cells.slice(w * 7, w * 7 + 7).map((d) => {
                const e = byDay.get(d)
                const inMonth = d.startsWith(m.ym)
                return (
                  <td key={d} className={`${!inMonth ? 'out' : ''} ${e && inMonth ? e.status : ''} ${d === today ? 'today' : ''}`}>
                    <span className="d">{Number(d.slice(8))}</span>
                    {e && inMonth && (
                      <small>
                        {admin ? (e.ref ?? e.reason ?? 'Blocked') : PUBLIC_LABEL[e.status]}
                        <span className="sr-only">{PUBLIC_LABEL[e.status]}</span>
                      </small>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="key mt-3 text-sm text-muted flex flex-wrap gap-x-5 gap-y-1">
        <span><i style={{ background: '#fffdf8' }} />Available</span>
        <span><i style={{ background: '#f3e5c5' }} />On hold (application being processed)</span>
        <span><i style={{ background: '#dbe6ef' }} />Booked</span>
        <span><i style={{ background: '#ecd0cd' }} />Unavailable</span>
      </p>
    </div>
  )
}
