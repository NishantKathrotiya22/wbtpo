import Link from 'next/link'
import { Building2, CalendarSearch, ClipboardEdit, ListChecks } from 'lucide-react'
import { q } from '@/lib/db'
import { venues, publishedNotices } from '@/lib/queries'
import { fmtDate, fmtRange, inr } from '@/lib/dates'
import NoticeTicker from '@/components/NoticeTicker'
import { Button, Faq, Journey, Section, SupportPanel } from '@/components/ui'

const MENU: [string, string][] = [
  ['/availability', 'Check available dates'], ['/venues', 'Venues and tariffs'], ['/register', 'Register as an organizer'], ['/login', 'Sign in'],
  ['/account/bookings/new', 'Apply for a venue'], ['/account', 'My bookings'], ['/notices', 'Notices and tenders'], ['/events', 'Events'], ['/contact', 'Contact the office'],
]
const STEPS: [string, string][] = [
  ['Check dates', 'See which dates are free for the venue you need.'],
  ['Register and apply', 'Create an account and send your event details with documents.'],
  ['Review', 'An officer checks your application and holds the dates for you.'],
  ['Approval and payment', 'You receive the amount payable and the instalment dates.'],
  ['Confirmation', 'Once the advance is received, the booking is confirmed.'],
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
    publishedNotices(30),
    q<{ id: number; title: string; start_date: string; end_date: string; venue: string | null }>(
      `select e.id,e.title,e.start_date,e.end_date,v.name as venue from events e left join venues v on v.id=e.venue_id
        where e.status='published' and e.end_date >= current_date order by e.start_date limit 6`),
  ])
  return (
    <>
      {/* Banner */}
      <section className="banner">
        <div className="wrap py-10 md:py-14 grid gap-8 lg:grid-cols-[1.3fr_1fr] items-center">
          <div>
            <p className="font-semibold text-amber-300 tracking-wide uppercase text-sm">Milan Mela Prangan, Kolkata</p>
            <h1 className="mt-2 text-[clamp(1.9rem,4.4vw,3rem)] font-semibold">Book a venue for your fair, conference or cultural programme</h1>
            <p className="mt-4 text-lg text-white/90 max-w-[52ch]">Check which halls and grounds are free, apply online, and follow your application until the dates are confirmed.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/availability" variant="brand" stack>Check available dates</Button>
              <Button href="/register" variant="ghost-light" stack>Register as an organizer</Button>
            </div>
          </div>
          <form action="/availability" className="bg-white text-ink p-5 md:p-6 border-t-4 border-brand space-y-4">
            <p className="text-xl font-semibold text-brown">Quick date check</p>
            <label className="field"><span>Venue</span><select name="venue" className="input">{vs.map((v) => <option key={v.id} value={v.slug}>{v.name}</option>)}</select></label>
            <label className="field"><span>Month</span><input type="month" name="m" className="input" /></label>
            <Button full>Show availability</Button>
          </form>
        </div>
      </section>

      <div className="wrap mt-5 space-y-5">
        {/* Notice bar */}
        <div className="ticker" role="region" aria-label="Latest notices">
          <span className="ticker-label">Notices</span>
          <NoticeTicker notices={notices} />
          <Link href="/notices" className="btn btn-brand btn-sm self-center mr-3">View all</Link>
        </div>

        {/* Menu | About | Tiles */}
        <div className="grid gap-5 lg:grid-cols-[15.5rem_1fr_15.5rem] items-start">
          <nav aria-label="Quick links" className="side-menu order-2 lg:order-1">
            <p className="side-title">Quick links</p>
            <ul>{MENU.map(([href, l]) => <li key={href}><Link href={href}>{l}</Link></li>)}</ul>
          </nav>

          <section className="order-1 lg:order-2 bg-grey">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-[1.6rem] font-normal">About <span className="text-accent font-semibold">Milan Mela Prangan</span></h2>
            </div>
            <div className="px-6 pb-6 space-y-3 text-[.98rem]">
              <p><strong className="text-accent">West Bengal Trade Promotion Organisation (WBTPO)</strong> is a Government of West Bengal undertaking. It manages the halls and open grounds at Milan Mela Prangan, Kolkata, used for trade fairs, conferences, exhibitions and cultural programmes.</p>
              <p>This website shows which venues are free, lets organizers apply online, and tracks each application through review, approval, payment and confirmation.</p>
              <Link href="/venues" className="btn btn-brand btn-sm">Read more</Link>
            </div>
            <ul className="grid sm:grid-cols-3 border-t border-line bg-white">
              {[['Venues', String(vs.length)], ['Largest capacity', Math.max(...vs.map((v) => v.capacity)).toLocaleString('en-IN')], ['Upcoming events', String(events.length)]].map(([l, v]) => (
                <li key={l} className="px-6 py-4 border-b sm:border-b-0 sm:border-r last:border-0 border-line"><p className="text-2xl font-semibold text-brown tabular-nums">{v}</p><p className="text-sm text-muted">{l}</p></li>
              ))}
            </ul>
          </section>

          <div className="order-3 grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
            <Link href="/availability" className="tile" style={{ background: 'linear-gradient(135deg,#1f6b4a,#1b4f55)' }}><CalendarSearch size={34} aria-hidden className="mb-2" />Check dates<small>See free days at each venue</small></Link>
            <Link href="/account/bookings/new" className="tile" style={{ background: 'linear-gradient(135deg,#885000,#b06b0a)' }}><ClipboardEdit size={34} aria-hidden className="mb-2" />Apply online<small>Send your event details</small></Link>
            <Link href="/account" className="tile" style={{ background: 'linear-gradient(135deg,#7a1f1f,#3d2400)' }}><ListChecks size={34} aria-hidden className="mb-2" />Track booking<small>Status, payments, documents</small></Link>
          </div>
        </div>
      </div>

      <div className="wrap mt-14 flex flex-col gap-14">
        <Section title="How booking works" description="Five steps from first enquiry to a confirmed booking." className="!mb-0"><Journey steps={STEPS} /></Section>
      </div>

      {/* Venue band */}
      <section className="band mt-14">
        <div className="wrap py-10">
          <h2 className="text-center text-[1.7rem] font-semibold text-amber-300">Our venues</h2>
          <ul className="mt-8 grid sm:grid-cols-2 lg:grid-cols-5">
            {vs.map((v) => (
              <li key={v.id} className="border-t sm:border-t-0 sm:border-l border-white/25 first:border-0">
                <Link href={`/venues/${v.slug}`} className="block h-full text-center px-5 py-6 text-white no-underline hover:bg-black/20">
                  <Building2 size={40} className="mx-auto mb-3" aria-hidden />
                  <p className="text-lg font-semibold">{v.name}</p>
                  <p className="text-sm italic text-white/85 mt-1">{v.kind} · up to {v.capacity.toLocaleString('en-IN')} people</p>
                  <p className="mt-2 font-semibold text-amber-200">{inr(v.tariff_per_day)} per day</p>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-sm text-white/85">Rates exclude GST and charges for power or extra services.</p>
        </div>
      </section>

      <div className="wrap mt-14 flex flex-col gap-14">
        <div className="grid gap-10 lg:grid-cols-2">
          <section>
            <div className="flex items-center justify-between mb-3"><h2 className="text-brown font-normal text-[1.6rem]">Notices &amp; Tenders</h2><Link href="/notices" className="btn btn-brand btn-sm">View all</Link></div>
            <ul className="border border-line max-h-[22rem] overflow-y-auto">
              {notices.map((n) => (
                <li key={n.id} className="px-4 py-3 border-b border-line last:border-0"><p className="text-accent font-semibold text-sm">{fmtDate(n.publish_on)} · <span className="capitalize">{n.category}</span></p><p>{n.title}</p></li>
              ))}
              {!notices.length && <li className="px-4 py-6 text-muted">No notices at present.</li>}
            </ul>
          </section>
          <section>
            <div className="flex items-center justify-between mb-3"><h2 className="text-brown font-normal text-[1.6rem]">Upcoming Events</h2><Link href="/events" className="btn btn-brand btn-sm">View all</Link></div>
            <ul className="border border-line max-h-[22rem] overflow-y-auto">
              {events.map((e) => (
                <li key={e.id} className="px-4 py-3 border-b border-line last:border-0"><p className="text-accent font-semibold text-sm">{fmtRange(e.start_date, e.end_date)}{e.venue && ` · ${e.venue}`}</p><p>{e.title}</p></li>
              ))}
              {!events.length && <li className="px-4 py-6 text-muted">No upcoming events have been published.</li>}
            </ul>
          </section>
        </div>

        <Section title="Common questions" className="!mb-0"><Faq items={FAQS} /></Section>

        <SupportPanel title="Not sure which venue suits you?" actions={<><Button href="/contact" variant="light" stack>Contact the office</Button><Button href="/venues" variant="ghost-light" stack>Compare venues</Button></>}>
          Tell us about your event and the office will suggest a venue and dates.
        </SupportPanel>
      </div>
    </>
  )
}
