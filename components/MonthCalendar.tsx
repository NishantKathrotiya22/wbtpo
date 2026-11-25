import { Button } from './ui'
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
        <Button href={href(m.prev)} variant="secondary" size="sm">← Previous</Button>
        <h3 aria-live="polite" className="text-xl">{monthTitle(m.ym)}</h3>
        <Button href={href(m.next)} variant="secondary" size="sm">Next →</Button>
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
        <span><i style={{ background: '#ffffff' }} />Available</span>
        <span><i style={{ background: '#fef3c7' }} />On hold (application being processed)</span>
        <span><i style={{ background: '#dbeafe' }} />Booked</span>
        <span><i style={{ background: '#fee2e2' }} />Unavailable</span>
      </p>
    </div>
  )
}
