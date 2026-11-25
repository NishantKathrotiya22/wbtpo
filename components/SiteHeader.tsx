import Link from 'next/link'
import { getUser, ADMIN_ROLES } from '@/lib/auth'
import { logout } from '@/lib/actions'
import NavLink from './NavLink'

const NAV: [string, string, boolean?][] = [['/', 'Home', true], ['/venues', 'Venues'], ['/availability', 'Check dates'], ['/events', 'Events'], ['/notices', 'Notices'], ['/contact', 'Contact']]
const today = () => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date())

export default async function SiteHeader() {
  const user = await getUser()
  const isAdmin = !!user && ADMIN_ROLES.includes(user.role)
  return (
    <header>
      <div className="topbar">
        <div className="wrap py-4">
          <Link href="/" className="no-underline hover:no-underline block">
            <span className="block font-semibold text-[1.4rem] sm:text-[1.9rem] leading-tight text-accent">West Bengal Trade Promotion Organisation</span>
            <span className="block italic text-ink text-sm sm:text-base mt-1">an undertaking of the Government of West Bengal</span>
            <span className="block italic text-muted text-sm sm:text-base">Milan Mela Prangan venue booking</span>
          </Link>
        </div>
      </div>
      <div className="navbar">
        <div className="wrap py-2.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p className="text-white font-semibold text-sm">{today()}</p>
          <nav aria-label="Main" className="navlinks flex flex-wrap items-center">
            {NAV.map(([href, label, exact]) => <NavLink key={href} href={href} exact={exact} className="">{label}</NavLink>)}
            {user ? (
              <>
                <Link href={isAdmin ? '/admin' : '/account'}>{isAdmin ? 'Admin panel' : 'My bookings'}</Link>
                <form action={logout}><button>Sign out</button></form>
              </>
            ) : (
              <>
                <Link href="/register">Register</Link>
                <Link href="/login">Sign in</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
