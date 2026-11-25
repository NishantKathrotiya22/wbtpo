import { LayoutDashboard, ClipboardList, CalendarDays, FileBarChart, Megaphone, PartyPopper, MessageSquare, Users, Settings, ScrollText, type LucideIcon } from 'lucide-react'
import { requireAdmin, ROLE_LABEL, type Role } from '@/lib/auth'
import NavLink from '@/components/NavLink'

const ALL: Role[] = ['super_admin', 'booking_manager', 'accounts', 'management']
const STAFF: Role[] = ['super_admin', 'booking_manager']
const GROUPS: { title: string; links: [string, string, LucideIcon, Role[], boolean?][] }[] = [
  { title: 'Daily work', links: [['/admin', 'Dashboard', LayoutDashboard, ALL, true], ['/admin/bookings', 'Bookings', ClipboardList, ALL], ['/admin/calendar', 'Calendar', CalendarDays, ALL]] },
  { title: 'Website', links: [['/admin/notices', 'Notices', Megaphone, STAFF], ['/admin/events', 'Events', PartyPopper, STAFF], ['/admin/enquiries', 'Enquiries', MessageSquare, STAFF]] },
  { title: 'Reports and control', links: [['/admin/reports', 'Reports', FileBarChart, ALL], ['/admin/users', 'Users and roles', Users, ['super_admin']], ['/admin/settings', 'Booking window', Settings, ['super_admin']], ['/admin/audit', 'Audit trail', ScrollText, ['super_admin']]] },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  return (
    <div className="wrap py-8 grid gap-8 lg:grid-cols-[17rem_1fr] items-start">
      <nav aria-label="Admin" className="card !p-3 lg:!p-6 lg:sticky lg:top-32 min-w-0">
        <div className="hidden lg:block mb-4">
          <p className="eyebrow">{ROLE_LABEL[user.role]}</p>
          <p className="font-black text-lg leading-tight">{user.name}</p>
        </div>
        <div className="flex gap-2 overflow-x-auto lg:block lg:overflow-visible">
          {GROUPS.map((g) => {
            const links = g.links.filter(([, , , r]) => r.includes(user.role))
            if (!links.length) return null
            return (
              <div key={g.title} className="flex gap-2 lg:block lg:mt-5 first:lg:mt-0">
                <p className="hidden lg:block text-xs font-extrabold uppercase tracking-wider text-muted px-3 mb-1">{g.title}</p>
                <ul className="flex gap-2 lg:grid lg:grid-cols-1 lg:gap-1">
                  {links.map(([href, label, Icon, , exact]) => (
                    <li key={href} className="shrink-0"><NavLink href={href} exact={exact}><span className="flex items-center gap-2.5 whitespace-nowrap"><Icon size={20} aria-hidden />{label}</span></NavLink></li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
