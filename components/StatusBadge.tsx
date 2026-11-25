const MAP: Record<string, [string, string]> = {
  submitted: ['Submitted', 'text-info'],
  under_scrutiny: ['Under scrutiny', 'text-info'],
  provisional: ['Provisionally blocked', 'text-hold'],
  approved: ['Approved – payment due', 'text-hold'],
  confirmed: ['Confirmed', 'text-ok'],
  completed: ['Completed', 'text-muted'],
  rejected: ['Rejected', 'text-bad'],
  cancelled: ['Cancelled', 'text-bad'],
  Paid: ['Paid', 'text-ok'],
  'Part paid': ['Part paid', 'text-hold'],
  Due: ['Due', 'text-info'],
  Overdue: ['Overdue', 'text-bad'],
  draft: ['Draft', 'text-muted'],
  published: ['Published', 'text-ok'],
  archived: ['Archived', 'text-muted'],
  new: ['New', 'text-info'],
  replied: ['Replied', 'text-ok'],
  closed: ['Closed', 'text-muted'],
}
export default function StatusBadge({ status }: { status: string }) {
  const [label, tone] = MAP[status] ?? [status, 'text-muted']
  return <span className={`badge ${tone}`}>{label}</span>
}
