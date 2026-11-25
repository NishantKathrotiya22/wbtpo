import type { Metadata } from 'next'
import { q } from '@/lib/db'
import { fmtRange, todayIST } from '@/lib/dates'
import { Card, EmptyState, Page, PageHeader, Section } from '@/components/ui'

export const metadata: Metadata = { title: 'Events' }
type E = { id: number; title: string; description: string; start_date: string; end_date: string; venue: string | null }

const List = ({ items }: { items: E[] }) => (
  <div className="grid gap-4">
    {items.map((e) => (
      <Card as="article" key={e.id} className="grid md:grid-cols-[15rem_1fr] gap-2 md:gap-8">
        <p className="font-bold text-primary-strong">{fmtRange(e.start_date, e.end_date)}{e.venue && <span className="block text-muted font-medium">{e.venue}</span>}</p>
        <div><h3>{e.title}</h3>{e.description && <p className="mt-1 text-muted">{e.description}</p>}</div>
      </Card>
    ))}
  </div>
)

export default async function Events() {
  const rows = await q<E>(
    `select e.id,e.title,e.description,e.start_date,e.end_date,v.name as venue from events e left join venues v on v.id=e.venue_id
      where e.status='published' order by e.start_date`)
  const t = todayIST()
  const upcoming = rows.filter((e) => e.end_date >= t)
  const past = rows.filter((e) => e.end_date < t).reverse()
  return (
    <Page narrow>
      <PageHeader eyebrow="Programme" title="Events" />
      <Section title="Upcoming">{upcoming.length ? <List items={upcoming} /> : <Card><EmptyState title="No upcoming events">Events will appear here once they are published.</EmptyState></Card>}</Section>
      {past.length > 0 && <Section title="Past events"><List items={past} /></Section>}
    </Page>
  )
}
