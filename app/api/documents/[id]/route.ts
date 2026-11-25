import { readFile } from 'node:fs/promises'
import { ADMIN_ROLES, getUser } from '@/lib/auth'
import { one } from '@/lib/db'

const TYPE: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' }

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return new Response('Sign in required', { status: 401 })
  const id = Number((await params).id)
  const d = await one<{ filename: string; stored_name: string; organizer_id: number }>(
    `select d.filename,d.stored_name,b.organizer_id from booking_documents d join bookings b on b.id=d.booking_id where d.id=$1`,
    [Number.isInteger(id) ? id : 0])
  if (!d || (d.organizer_id !== user.id && !ADMIN_ROLES.includes(user.role))) return new Response('Not found', { status: 404 })
  const ext = d.stored_name.split('.').pop()!.toLowerCase()
  return new Response(await readFile(`uploads/${d.stored_name}`), {
    headers: { 'Content-Type': TYPE[ext] ?? 'application/octet-stream', 'Content-Disposition': `inline; filename="${encodeURIComponent(d.filename)}"`, 'X-Content-Type-Options': 'nosniff' },
  })
}
