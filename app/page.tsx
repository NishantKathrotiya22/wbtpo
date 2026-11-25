import Link from 'next/link'
import { Building2, CalendarDays, Megaphone } from 'lucide-react'
import { q } from '@/lib/db'
import { venues, publishedNotices } from '@/lib/queries'
import { fmtDate, fmtRange, inr } from '@/lib/dates'
import { Button, Card, Checklist, Chip, DarkPanel, Faq, Journey, Page, ResourceCard, Section, SupportPanel } from '@/components/ui'

const STEPS: [string, string][] = [
  ['Check dates', 'See which dates are free for the venue you need.'],
  ['Register and apply', 'Create an account and send your event details with documents.'],
  ['Review', 'An officer checks your application and holds the dates for you.'],
  ['Approval and payment', 'You receive the amount payable and the instalment dates.'],
  ['Confirmation', 'Once the advance is received, the booking is confirmed.'],
]

const NEED: [string, string][] = [
  ['Name and mobile number', 'The office will call this number if something is unclear.'],
  ['Event name and expected crowd', 'The number of people decides which venue suits you.'],
  ['First and last day of the event', 'Include set-up days if you need the venue before the event.'],
  ['Organisation papers', 'Registration or authorisation letter, as PDF, JPG or PNG.'],
]

const FAQS: [string, string][] = [
  ['Does submitting the form reserve my dates?', 'No. Your dates are held only after an officer reviews the application and blocks them. You can follow every step on your “My bookings” page.'],
  ['How long does approval take?', 'Applications are reviewed in the order received. If the office needs anything more, it will call or email you.'],
  ['How do I pay?', 'Online payment is not available yet. After approval you get a payment table with amounts and due dates. Pay as advised by the Accounts section, and the office records your payment against the booking.'],
  ['Can I cancel or change my dates?', 'You can withdraw an application while it is being reviewed. For changes after that, contact the office with your reference number.'],
]

export default async function Home() {
  const [vs, notices, events] = await Promise.all([
    venues(),
    publishedNotices(3),
    q<{ id: number; title: string; start_date: string; end_date: string; venue: string | null }>(
      `select e.id,e.title,e.start_date,e.end_date,v.name as venue from events e left join venues v on v.id=e.venue_id
        where e.status='published' and e.end_date >= current_date order by e.start_date limit 3`),
  ])
  return (
    <Page className="flex flex-col gap-16 md:gap-24">
      {/* Hero: what this is, who it is for, what to do first */}
      <section className="panel-hero p-6 md:p-12 grid gap-10 lg:grid-cols-[1.25fr_1fr] items-center">
        <div>
          <p className="eyebrow mb-3">For fairs, conferences and cultural programmes</p>
          <h1>Book a venue at Milan Mela Prangan</h1>
          <p className="mt-5 text-lg text-muted max-w-[52ch]">Check which halls and grounds are free, apply online, and follow your application until the dates are confirmed. Tariffs and facilities are listed for every venue.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/availability" stack>Check available dates</Button>
            <Button href="#how" variant="secondary" stack>How booking works</Button>
          </div>
        </div>
        <form action="/availability" className="card card-soft card-pad space-y-4">
          <p className="text-xl font-black">Quick date check</p>
          <label className="field"><span>Venue</span><select name="venue" className="input">{vs.map((v) => <option key={v.id} value={v.slug}>{v.name}</option>)}</select></label>
          <label className="field"><span>Month</span><input type="month" name="m" className="input" /></label>
          <Button full>Show availability</Button>
        </form>
      </section>

      <Section title="How booking works" description="Five steps from first enquiry to a confirmed booking." className="!mb-0">
        <div id="how" className="scroll-mt-32"><Journey steps={STEPS} /></div>
      </Section>

      <Section title="Keep these ready before you apply" description="It takes about ten minutes if you have them to hand." className="!mb-0">
        <Checklist items={NEED} />
      </Section>

      <Section title="Our venues" description="Rates are per day and exclude GST and charges for power or extra services." action={<Button href="/venues" variant="secondary" size="sm">See all details</Button>} className="!mb-0">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vs.map((v) => (
            <ResourceCard key={v.id} href={`/venues/${v.slug}`} icon={Building2} label={v.kind} title={v.name}>
              Up to {v.capacity.toLocaleString('en-IN')} people · {inr(v.tariff_per_day)} per day
            </ResourceCard>
          ))}
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card as="section">
          <div className="flex items-center justify-between mb-4"><h2 className="text-2xl flex items-center gap-2"><Megaphone className="text-primary" size={26} aria-hidden />Notice board</h2><Link href="/notices" className="font-bold">All notices</Link></div>
          <ul className="divide-y divide-line">
            {notices.map((n) => (<li key={n.id} className="py-3"><p className="text-sm text-muted">{fmtDate(n.publish_on)} · <span className="capitalize">{n.category}</span></p><p className="font-bold leading-snug">{n.title}</p></li>))}
            {!notices.length && <li className="py-3 text-muted">No notices at present.</li>}
          </ul>
        </Card>
        <Card as="section">
          <div className="flex items-center justify-between mb-4"><h2 className="text-2xl flex items-center gap-2"><CalendarDays className="text-primary" size={26} aria-hidden />Coming up</h2><Link href="/events" className="font-bold">All events</Link></div>
          <ul className="divide-y divide-line">
            {events.map((e) => (<li key={e.id} className="py-3"><p className="text-sm text-muted">{fmtRange(e.start_date, e.end_date)}{e.venue && ` · ${e.venue}`}</p><p className="font-bold leading-snug">{e.title}</p></li>))}
            {!events.length && <li className="py-3 text-muted">No upcoming events have been published.</li>}
          </ul>
        </Card>
      </div>

      <DarkPanel eyebrow="After you apply" title="Every booking is tracked from start to finish">
        <p className="text-slate-300 max-w-[56ch] mb-6">Once you have an account, everything about your booking is on one page. There is nothing to chase.</p>
        <div className="flex flex-wrap gap-3"><Chip>Reference number</Chip><Chip>Status and history</Chip><Chip>Payment schedule</Chip><Chip>Uploaded documents</Chip><Chip>Dates held for you</Chip></div>
      </DarkPanel>

      <Section title="Common questions" className="!mb-0"><Faq items={FAQS} /></Section>

      <SupportPanel title="Not sure which venue suits you?" actions={<><Button href="/contact" variant="light" stack>Contact the office</Button><Button href="/venues" variant="ghost-light" stack>Compare venues</Button></>}>
        Tell us about your event and the office will suggest a venue and dates.
      </SupportPanel>
    </Page>
  )
}
