import { ADMIN_ROLES, getUser } from '@/lib/auth'
import { pool } from '@/lib/db'

const SQL: Record<string, [string[], string]> = {
  bookings: [
    ['Reference', 'Organizer', 'Organisation', 'Event', 'Venue', 'Start', 'End', 'Status', 'Approved amount'],
    `select b.ref,u.name,u.organisation,b.event_name,v.name,b.start_date,b.end_date,b.status,b.total_amount from bookings b
       join users u on u.id=b.organizer_id join venues v on v.id=b.venue_id order by b.id`,
  ],
  payments: [
    ['Reference', 'Organizer', 'Instalment', 'Due date', 'Amount', 'Received', 'Outstanding', 'Mode', 'Payment reference'],
    `select b.ref,u.name,i.label,i.due_date,i.amount,i.paid_amount,i.amount-i.paid_amount,i.mode,i.reference from installments i
       join bookings b on b.id=i.booking_id join users u on u.id=b.organizer_id order by i.due_date`,
  ],
  utilisation: [
    ['Venue', 'Bookings', 'Days booked'],
    `select v.name,count(b.id),coalesce(sum(b.end_date-b.start_date+1),0) from venues v
       left join bookings b on b.venue_id=v.id and b.status in ('confirmed','completed') group by v.id order by v.sort`,
  ],
}
const cell = (v: unknown) => {
  const s = v == null ? '' : String(v)
  return /^[=+\-@]/.test(s) ? `"'${s.replace(/"/g, '""')}"` : /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s // also blocks spreadsheet formula injection
}

export async function GET(_: Request, { params }: { params: Promise<{ kind: string }> }) {
  const user = await getUser()
  if (!user || !ADMIN_ROLES.includes(user.role)) return new Response('Forbidden', { status: 403 })
  const def = SQL[(await params).kind]
  if (!def) return new Response('Not found', { status: 404 })
  const { rows } = await pool.query({ text: def[1], rowMode: 'array' })
  const csv = [def[0], ...rows].map((r: unknown[]) => r.map(cell).join(',')).join('\r\n')
  return new Response('﻿' + csv, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="wbtpo-${(await params).kind}.csv"` },
  })
}
