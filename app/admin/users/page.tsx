import type { Metadata } from 'next'
import { requireRole, ROLE_LABEL, type Role } from '@/lib/auth'
import { q } from '@/lib/db'
import { setUserRole } from '@/lib/actions'
import ActionForm from '@/components/ActionForm'
import { Button, DataTable, PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Users and roles' }

export default async function Users() {
  const me = await requireRole('super_admin')
  const rows = await q<any>('select id,name,email,organisation,role from users order by role = \'organizer\', name')
  return (
    <div>
      <PageHeader eyebrow="Control" title="Users and roles" description="People who register are organizers. To make someone a staff member, choose their role and press Save." />
      <DataTable>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
        <tbody>{rows.map((u) => (
          <tr key={u.id}>
            <td className="font-semibold">{u.name}{u.organisation && <span className="block text-muted font-normal">{u.organisation}</span>}</td>
            <td>{u.email}</td>
            <td>{u.id === me.id ? <span className="font-semibold">{ROLE_LABEL[u.role as Role]} (you)</span> : (
              <ActionForm action={setUserRole.bind(null, u.id)} className="flex flex-wrap gap-2 items-center">
                <select name="role" defaultValue={u.role} aria-label={`Role for ${u.name}`} className="input !w-auto">{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
                <Button variant="secondary" size="sm">Save</Button>
              </ActionForm>)}</td>
          </tr>))}</tbody>
      </DataTable>
    </div>
  )
}
