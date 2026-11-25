import type { Metadata } from 'next'
import { requireRole, ROLE_LABEL, type Role } from '@/lib/auth'
import { q } from '@/lib/db'
import { setUserRole } from '@/lib/actions'
import ActionForm from '@/components/ActionForm'

export const metadata: Metadata = { title: 'Users' }

export default async function Users() {
  const me = await requireRole('super_admin')
  const rows = await q<any>('select id,name,email,organisation,role from users order by role = \'organizer\', name')
  return (
    <div>
      <h1>Users and roles</h1>
      <p className="mt-2 text-muted max-w-[60ch]">New registrations are organizers. Give a registered person a staff role here. Role changes apply the next time they load a page.</p>
      <div className="panel mt-6 overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>{u.name}{u.organisation && <><br /><span className="text-muted">{u.organisation}</span></>}</td>
                <td>{u.email}</td>
                <td>
                  {u.id === me.id ? ROLE_LABEL[u.role as Role] : (
                    <ActionForm action={setUserRole.bind(null, u.id)} className="flex gap-2 items-center">
                      <select name="role" defaultValue={u.role} className="input !w-auto">{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
                      <button className="btn btn-quiet btn-sm">Save</button>
                    </ActionForm>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
