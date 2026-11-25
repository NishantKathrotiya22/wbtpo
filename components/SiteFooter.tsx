import Link from 'next/link'

const COLS: [string, [string, string][]][] = [
  ['Venue booking', [['/venues', 'Venues and tariffs'], ['/availability', 'Check available dates'], ['/register', 'Register as an organizer'], ['/login', 'Sign in']]],
  ['Information', [['/notices', 'Notices and tenders'], ['/events', 'Events'], ['/contact', 'Contact the office']]],
]

export default function SiteFooter() {
  return (
    <footer className="mt-20 bg-dark text-slate-300">
      <div className="wrap py-12 grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-black text-white text-xl leading-snug">West Bengal Trade Promotion Organisation</p>
          <p className="mt-2 max-w-[34ch]">Government of West Bengal. Venue bookings for Milan Mela Prangan, Kolkata.</p>
        </div>
        {COLS.map(([h, links]) => (
          <div key={h}>
            <p className="eyebrow !text-blue-300 mb-3">{h}</p>
            <ul className="space-y-2">{links.map(([href, l]) => <li key={href}><Link href={href} className="!text-slate-200 hover:!text-white">{l}</Link></li>)}</ul>
          </div>
        ))}
      </div>
    </footer>
  )
}
