import Link from 'next/link'
import { requireAdmin, ROLE_LABEL, type Role } from '@/lib/auth'

const ALL: Role[] = ['super_admin', 'booking_manager', 'accounts', 'management']
const STAFF: Role[] = ['super_admin', 'booking_manager']
const LINKS: [string, string, Role[]][] = [
  ['/admin', 'Dashboard', ALL],
  ['/admin/bookings', 'Bookings', ALL],
  ['/admin/calendar', 'Calendar', ALL],
  ['/admin/reports', 'Reports', ALL],
  ['/admin/notices', 'Notices', STAFF],
  ['/admin/events', 'Events', STAFF],
  ['/admin/enquiries', 'Enquiries', STAFF],
  ['/admin/users', 'Users', ['super_admin']],
  ['/admin/settings', 'Settings', ['super_admin']],
  ['/admin/audit', 'Audit trail', ['super_admin']],
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  return (
    <div className="wrap py-8 grid gap-8 lg:grid-cols-[13rem_1fr]">
      <nav aria-label="Admin" className="lg:border-r lg:border-line lg:pr-6">
        <p className="eyebrow">{ROLE_LABEL[user.role]}</p>
        <p className="font-semibold mb-4">{user.name}</p>
        <ul className="flex flex-wrap lg:block gap-x-5 gap-y-1">
          {LINKS.filter(([, , r]) => r.includes(user.role)).map(([href, label]) => (
            <li key={href} className="lg:mb-1"><Link href={href} className="text-ink no-underline hover:underline">{label}</Link></li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
