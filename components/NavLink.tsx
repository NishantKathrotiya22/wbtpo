'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavLink({ href, exact, children, className = 'nav-link' }: { href: string; exact?: boolean; children: React.ReactNode; className?: string }) {
  const path = usePathname()
  const on = exact ? path === href : path === href || path.startsWith(href + '/')
  return <Link href={href} className={className} aria-current={on ? 'page' : undefined}>{children}</Link>
}
