import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignJWT, jwtVerify } from 'jose'
import { one } from './db'

export type Role = 'organizer' | 'super_admin' | 'booking_manager' | 'accounts' | 'management'
export type User = { id: number; name: string; email: string; role: Role; phone: string | null; organisation: string | null }

export const ADMIN_ROLES: Role[] = ['super_admin', 'booking_manager', 'accounts', 'management']
export const ROLE_LABEL: Record<Role, string> = {
  organizer: 'Organizer',
  super_admin: 'Super Administrator',
  booking_manager: 'Booking Management',
  accounts: 'Accounts',
  management: 'Management View',
}

const COOKIE = 'wbtpo_session'
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET)

export async function startSession(uid: number) {
  const token = await new SignJWT({ uid }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').sign(key())
  ;(await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 86400,
  })
}
export async function endSession() {
  ;(await cookies()).delete(COOKIE)
}

export const getUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, key())
    return await one<User>('select id,name,email,role,phone,organisation from users where id=$1', [payload.uid])
  } catch {
    return null
  }
})

export async function requireUser() {
  const u = await getUser()
  if (!u) redirect('/login')
  return u
}
export async function requireRole(...roles: Role[]) {
  const u = await requireUser()
  if (!roles.includes(u.role)) redirect(u.role === 'organizer' ? '/account' : '/admin')
  return u
}
export const requireAdmin = () => requireRole(...ADMIN_ROLES)
