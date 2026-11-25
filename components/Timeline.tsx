import { q } from '@/lib/db'
import { fmtStamp } from '@/lib/dates'

export default async function Timeline({ bookingId }: { bookingId: number }) {
  const rows = await q<{ id: number; action: string; detail: string | null; created_at: Date; actor: string | null }>(
    `select a.id,a.action,a.detail,a.created_at,u.name as actor from audit_log a left join users u on u.id=a.actor_id
      where a.entity='booking' and a.entity_id=$1 order by a.created_at, a.id`, [bookingId])
  return (
    <ol className="border-l-2 border-line ml-1.5 space-y-4">
      {rows.map((r) => (
        <li key={r.id} className="pl-5 relative">
          <span className="absolute -left-[7px] top-[.45rem] size-3 rounded-full bg-brick" aria-hidden />
          <p className="font-semibold leading-snug">{r.detail ?? r.action}</p>
          <p className="text-xs text-muted">{fmtStamp(r.created_at)}{r.actor ? ` · ${r.actor}` : ''}</p>
        </li>
      ))}
    </ol>
  )
}
