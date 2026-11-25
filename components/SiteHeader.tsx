import Link from 'next/link'
import { getUser, ADMIN_ROLES } from '@/lib/auth'
import { logout } from '@/lib/actions'
import NavLink from './NavLink'
import { Button } from './ui'

const NAV = [['/venues', 'Venues'], ['/availability', 'Check dates'], ['/events', 'Events'], ['/notices', 'Notices'], ['/contact', 'Contact']]

export default async function SiteHeader() {
  const user = await getUser()
  const isAdmin = !!user && ADMIN_ROLES.includes(user.role)
  return (
    <header className="bg-surface border-b border-line sticky top-0 z-40">
      <div className="bg-dark text-slate-300 text-xs">
        <div className="wrap py-1.5 flex justify-between gap-4"><span>A Government of West Bengal Undertaking</span><span className="hidden sm:inline">Milan Mela Prangan, Kolkata</span></div>
      </div>
      <div className="wrap py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <Link href="/" className="no-underline text-ink hover:text-ink leading-tight">
          <span className="block font-black text-lg sm:text-xl tracking-tight">West Bengal Trade Promotion Organisation</span>
          <span className="block text-sm text-muted font-medium">Milan Mela Prangan venue booking</span>
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-1.5">
          {NAV.map(([href, label]) => (
            <NavLink key={href} href={href} className="px-3.5 py-2 rounded-full font-semibold text-ink no-underline hover:bg-soft aria-[current=page]:bg-soft aria-[current=page]:text-primary-strong">{label}</NavLink>
          ))}
          {user ? (
            <>
              <Button href={isAdmin ? '/admin' : '/account'} size="sm">{isAdmin ? 'Admin panel' : 'My bookings'}</Button>
              <form action={logout}><button className="px-3 py-2 font-semibold text-muted hover:text-ink cursor-pointer">Sign out</button></form>
            </>
          ) : (
            <Button href="/login" size="sm">Sign in</Button>
          )}
        </nav>
      </div>
    </header>
  )
}
