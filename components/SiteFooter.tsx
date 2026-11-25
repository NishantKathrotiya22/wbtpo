import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t-2 border-ink bg-paper2">
      <div className="wrap py-10 grid gap-8 sm:grid-cols-3 text-sm">
        <div>
          <p className="font-serif text-lg font-semibold">West Bengal Trade Promotion Organisation</p>
          <p className="text-muted mt-1">Government of West Bengal</p>
        </div>
        <div>
          <p className="eyebrow mb-2">Venue booking</p>
          <ul className="space-y-1">
            <li><Link href="/venues">Venues and tariffs</Link></li>
            <li><Link href="/availability">Check availability</Link></li>
            <li><Link href="/register">Register as an organizer</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-2">Information</p>
          <ul className="space-y-1">
            <li><Link href="/notices">Notices and tenders</Link></li>
            <li><Link href="/events">Events</Link></li>
            <li><Link href="/contact">Contact the office</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
