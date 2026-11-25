import Link from 'next/link'
import { fmtDate } from '@/lib/dates'

type N = { id: number; title: string; publish_on: string }

// Pure CSS marquee. The list is rendered twice so the loop has no jump; the copy is hidden from screen readers and the tab order.
export default function NoticeTicker({ notices }: { notices: N[] }) {
  if (!notices.length) return <p className="flex-1 px-4 py-3 text-muted">No notices at present.</p>
  // Each half must be wider than the bar or the loop shows a gap, so short lists are repeated to fill ~1900px.
  const width = notices.reduce((s, n) => s + n.title.length * 7.5 + 170, 0)
  const reps = Math.max(1, Math.ceil(1900 / width))
  const dur = Math.round((width * reps) / 45) // ~45px per second: slow enough to read
  const items = Array.from({ length: reps }, () => notices).flat()
  const set = (dup: boolean) => (
    <ul className={`ticker-set ${dup ? 'ticker-dup' : ''}`} aria-hidden={dup || undefined}>
      {items.map((n, i) => (
        <li key={`${n.id}-${i}`} aria-hidden={i >= notices.length || undefined}>
          <Link href={`/notices#n-${n.id}`} className="ticker-item" tabIndex={dup || i >= notices.length ? -1 : undefined}>
            <time dateTime={n.publish_on}>{fmtDate(n.publish_on)}</time>{n.title}
          </Link>
        </li>
      ))}
    </ul>
  )
  return (
    <div className="ticker-viewport" style={{ ['--dur' as string]: `${dur}s` }}>
      <div className="ticker-track">{set(false)}{set(true)}</div>
    </div>
  )
}
