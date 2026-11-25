import Link from 'next/link'
import { getUser, ADMIN_ROLES } from '@/lib/auth'
import { logout } from '@/lib/actions'

const nav = [
  ['/venues', 'Venues'],
  ['/availability', 'Availability'],
  ['/events', 'Events'],
  ['/notices', 'Notices'],
  ['/contact', 'Contact'],
]

export default async function SiteHeader() {
  const user = await getUser()
  const home = user ? (ADMIN_ROLES.includes(user.role) ? '/admin' : '/account') : '/login'
  return (
    <header className="border-b border-line bg-paper">
      <div className="bg-ink text-paper/90 text-xs">
        <div className="wrap py-1.5 flex justify-between gap-4">
          <span>A Government of West Bengal Undertaking</span>
          <span className="hidden sm:inline">Milan Mela Prangan, Kolkata</span>
        </div>
      </div>
      <div className="wrap py-4 flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <Link href="/" className="no-underline text-ink hover:text-ink">
          <span className="block font-serif text-xl font-semibold leading-tight">West Bengal Trade Promotion Organisation</span>
          <span className="block text-sm text-muted">Milan Mela Prangan venue booking</span>
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[.95rem]">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="text-ink no-underline hover:underline">{label}</Link>
          ))}
          {user ? (
            <>
              <Link href={home} className="btn btn-quiet btn-sm">{user.role === 'organizer' ? 'My bookings' : 'Admin'}</Link>
              <form action={logout}><button className="text-muted hover:underline text-sm cursor-pointer">Sign out</button></form>
            </>
          ) : (
            <Link href="/login" className="btn btn-sm">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  )
}
