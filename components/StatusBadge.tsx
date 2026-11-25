// One place that decides how every status is worded and coloured, across public, organizer and admin screens.
const MAP: Record<string, [string, 'info' | 'ok' | 'hold' | 'bad' | 'muted']> = {
  submitted: ['Applied', 'info'],
  under_scrutiny: ['Under review', 'info'],
  provisional: ['Dates held', 'hold'],
  approved: ['Approved, advance due', 'hold'],
  confirmed: ['Confirmed', 'ok'],
  completed: ['Completed', 'muted'],
  rejected: ['Not approved', 'bad'],
  cancelled: ['Cancelled', 'bad'],
  Paid: ['Paid', 'ok'],
  'Part paid': ['Part paid', 'hold'],
  Due: ['Due', 'info'],
  Overdue: ['Overdue', 'bad'],
  draft: ['Draft', 'muted'],
  published: ['Published', 'ok'],
  archived: ['Archived', 'muted'],
  new: ['New', 'info'],
  replied: ['Replied', 'ok'],
  closed: ['Closed', 'muted'],
}
export default function StatusBadge({ status }: { status: string }) {
  const [label, tone] = MAP[status] ?? [status, 'muted']
  return <span className={`badge tone-${tone}`}>{label}</span>
}
