'use server'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ADMIN_ROLES, endSession, requireRole, startSession, type Role } from './auth'
import { audit, one, q, setting, tx } from './db'
import { addDays, diffDays, fmtRange, inr, isDate, todayIST } from './dates'

type State = { error?: string; ok?: string } | null
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()
const num = (fd: FormData, k: string) => Number(str(fd, k))
const OVERLAP = '23P01' // postgres exclusion_violation
const STAFF: Role[] = ['super_admin', 'booking_manager']

/* ---------- accounts ---------- */

export async function login(_: State, fd: FormData): Promise<State> {
  const email = str(fd, 'email').toLowerCase()
  const u = await one<{ id: number; role: Role; password_hash: string }>('select id, role, password_hash from users where email=$1', [email])
  if (!u || !(await bcrypt.compare(str(fd, 'password'), u.password_hash))) return { error: 'Email or password is incorrect.' }
  await startSession(u.id)
  const next = str(fd, 'next')
  redirect(next.startsWith('/') && !next.startsWith('//') ? next : ADMIN_ROLES.includes(u.role) ? '/admin' : '/account')
}

export async function register(_: State, fd: FormData): Promise<State> {
  const name = str(fd, 'name'), email = str(fd, 'email').toLowerCase(), pw = str(fd, 'password')
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return { error: 'Enter your name and a valid email address.' }
  if (!/^[0-9+\- ]{8,15}$/.test(str(fd, 'phone'))) return { error: 'Enter a valid mobile number.' }
  if (pw.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (await one('select 1 from users where email=$1', [email])) return { error: 'An account with this email already exists. Sign in instead.' }
  const u = await one<{ id: number }>(
    'insert into users (name,email,phone,organisation,password_hash) values ($1,$2,$3,$4,$5) returning id',
    [name, email, str(fd, 'phone'), str(fd, 'organisation') || null, await bcrypt.hash(pw, 10)],
  )
  await startSession(u!.id)
  redirect('/account')
}

export async function logout() {
  await endSession()
  redirect('/')
}

/* ---------- organizer: booking application ---------- */

const MAX_FILE = 5 * 1024 * 1024
const FILE_OK = /\.(pdf|jpe?g|png)$/i

export async function submitBooking(_: State, fd: FormData): Promise<State> {
  const user = await requireRole('organizer')
  const venueId = num(fd, 'venue'), start = str(fd, 'start'), end = str(fd, 'end') || start
  const name = str(fd, 'event_name'), type = str(fd, 'event_type'), attendance = num(fd, 'attendance')
  if (!venueId || !name || !type || !attendance) return { error: 'Please fill in all required fields.' }
  if (!isDate(start) || !isDate(end) || end < start) return { error: 'Choose valid dates. The end date cannot be before the start date.' }

  const venue = await one<{ capacity: number }>('select capacity from venues where id=$1 and active', [venueId])
  if (!venue) return { error: 'Choose a venue.' }
  if (attendance > venue.capacity) return { error: `This venue holds up to ${venue.capacity} people.` }

  const today = todayIST()
  const [notice, advance] = [await setting('min_notice_days', 7), await setting('advance_booking_days', 365)]
  if (start < addDays(today, notice)) return { error: `Applications must be made at least ${notice} days before the event.` }
  if (end > addDays(today, advance)) return { error: `Bookings can be made up to ${advance} days in advance.` }

  const files = fd.getAll('docs').filter((f): f is File => f instanceof File && f.size > 0)
  for (const f of files) {
    if (f.size > MAX_FILE) return { error: `${f.name} is larger than 5 MB.` }
    if (!FILE_OK.test(f.name)) return { error: `${f.name}: only PDF, JPG or PNG files are accepted.` }
  }

  const clash = await one(
    `select 1 from calendar_entries where venue_id=$1 and daterange(start_date,end_date,'[]') && daterange($2::date,$3::date,'[]')`,
    [venueId, start, end],
  )
  if (clash) return { error: 'The venue is not available on all of those dates. Check the availability calendar and pick other dates.' }

  const b = await one<{ id: number }>(
    `insert into bookings (organizer_id,venue_id,event_name,event_type,attendance,start_date,end_date,remarks)
     values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
    [user.id, venueId, name, type, attendance, start, end, str(fd, 'remarks') || null],
  )
  await mkdir('uploads', { recursive: true })
  for (const f of files) {
    const stored = randomUUID() + (f.name.match(FILE_OK)?.[0] ?? '')
    await writeFile(`uploads/${stored}`, Buffer.from(await f.arrayBuffer()))
    await q('insert into booking_documents (booking_id,filename,stored_name,size) values ($1,$2,$3,$4)', [b!.id, f.name.slice(0, 200), stored, f.size])
  }
  await audit(user.id, 'booking', b!.id, 'submitted', 'Application submitted')
  redirect(`/account/bookings/${b!.id}`)
}

export async function withdrawBooking(id: number) {
  const user = await requireRole('organizer')
  const r = await q(
    `update bookings set status='cancelled', updated_at=now() where id=$1 and organizer_id=$2 and status in ('submitted','under_scrutiny') returning id`,
    [id, user.id],
  )
  if (r.length) await audit(user.id, 'booking', id, 'cancelled', 'Withdrawn by organizer')
  revalidatePath(`/account/bookings/${id}`)
}

/* ---------- staff: booking workflow ---------- */

const FLOW: Record<string, { from: string[]; to: string; label: string }> = {
  scrutiny: { from: ['submitted'], to: 'under_scrutiny', label: 'Scrutiny started' },
  provisional: { from: ['submitted', 'under_scrutiny'], to: 'provisional', label: 'Dates provisionally blocked' },
  approve: { from: ['provisional'], to: 'approved', label: 'Application approved' },
  confirm: { from: ['approved'], to: 'confirmed', label: 'Booking confirmed' },
  complete: { from: ['confirmed'], to: 'completed', label: 'Event completed' },
  reject: { from: ['submitted', 'under_scrutiny', 'provisional', 'approved'], to: 'rejected', label: 'Application rejected' },
  cancel: { from: ['provisional', 'approved', 'confirmed'], to: 'cancelled', label: 'Booking cancelled' },
}

export async function bookingAction(id: number, action: string, _: State, fd: FormData): Promise<State> {
  const user = await requireRole(...STAFF)
  const step = FLOW[action]
  if (!step) return { error: 'Unknown action.' }
  const note = str(fd, 'note')
  if ((action === 'reject' || action === 'cancel') && !note) return { error: 'Give a reason. It is shown to the organizer and kept in the history.' }

  try {
    const err = await tx(async (c) => {
      const { rows } = await c.query('select * from bookings where id=$1 for update', [id])
      const b = rows[0]
      if (!b) return 'Booking not found.'
      if (!step.from.includes(b.status)) return 'This booking has already moved on. Reload the page.'

      if (action === 'provisional')
        await c.query(`insert into calendar_entries (venue_id,start_date,end_date,status,booking_id,created_by) values ($1,$2,$3,'provisional',$4,$5)`, [b.venue_id, b.start_date, b.end_date, id, user.id])

      if (action === 'approve') {
        let total = num(fd, 'total')
        if (!(total > 0)) {
          const v = (await c.query('select tariff_per_day from venues where id=$1', [b.venue_id])).rows[0]
          total = Number(v.tariff_per_day) * (diffDays(b.start_date, b.end_date) + 1)
        }
        await c.query('update bookings set total_amount=$2 where id=$1', [id, total])
      }

      if (action === 'confirm') {
        const first = (await c.query('select * from installments where booking_id=$1 order by due_date, id limit 1', [id])).rows[0]
        if (!first) return 'Set up the payment schedule first.'
        if (Number(first.paid_amount) < Number(first.amount)) return 'The first instalment (advance) has not been paid in full yet.'
        await c.query(`update calendar_entries set status='confirmed' where booking_id=$1`, [id])
      }

      if (action === 'complete') {
        if (b.end_date > todayIST()) return 'The event has not ended yet.'
      }

      if (action === 'reject' || action === 'cancel') await c.query('delete from calendar_entries where booking_id=$1', [id])

      await c.query('update bookings set status=$2, rejection_reason=coalesce($3, rejection_reason), updated_at=now() where id=$1', [id, step.to, note || null])
      await c.query('insert into audit_log (actor_id,entity,entity_id,action,detail) values ($1,$2,$3,$4,$5)', [user.id, 'booking', id, step.to, [step.label, note].filter(Boolean).join(': ')])
      return null
    })
    if (err) return { error: err }
  } catch (e: any) {
    if (e.code === OVERLAP) return { error: 'Another booking or block already holds some of these dates at this venue. This application cannot be provisionally blocked as it stands.' }
    throw e
  }
  revalidatePath(`/admin/bookings/${id}`)
  return { ok: step.label + '.' }
}

/* ---------- staff: payment schedule and receipts (recorded manually; no gateway yet) ---------- */

export async function addInstallment(bookingId: number, _: State, fd: FormData): Promise<State> {
  const user = await requireRole('super_admin', 'accounts', 'booking_manager')
  const label = str(fd, 'label'), amount = num(fd, 'amount'), due = str(fd, 'due')
  if (!label || !(amount > 0) || !isDate(due)) return { error: 'Enter a label, an amount and a due date.' }
  const b = await one<{ total_amount: number | null; status: string }>('select total_amount,status from bookings where id=$1', [bookingId])
  if (!b || !['approved', 'confirmed'].includes(b.status) || !b.total_amount) return { error: 'The schedule can be set once the booking is approved.' }
  const { sum } = (await one<{ sum: number }>('select coalesce(sum(amount),0) as sum from installments where booking_id=$1', [bookingId]))!
  if (sum + amount > b.total_amount) return { error: `Instalments would exceed the approved amount. ${inr(b.total_amount - sum)} is still unscheduled.` }
  await q('insert into installments (booking_id,label,amount,due_date) values ($1,$2,$3,$4)', [bookingId, label, amount, due])
  await audit(user.id, 'booking', bookingId, 'schedule', `Instalment added: ${label}, ${inr(amount)} due ${due}`)
  revalidatePath(`/admin/bookings/${bookingId}`)
  return { ok: 'Instalment added.' }
}

export async function removeInstallment(id: number) {
  const user = await requireRole('super_admin', 'accounts', 'booking_manager')
  const r = await one<{ booking_id: number; label: string }>('delete from installments where id=$1 and paid_amount=0 returning booking_id,label', [id])
  if (r) {
    await audit(user.id, 'booking', r.booking_id, 'schedule', `Instalment removed: ${r.label}`)
    revalidatePath(`/admin/bookings/${r.booking_id}`)
  }
}

export async function recordPayment(installmentId: number, _: State, fd: FormData): Promise<State> {
  const user = await requireRole('super_admin', 'accounts')
  const amount = num(fd, 'amount'), on = str(fd, 'paid_on'), mode = str(fd, 'mode'), ref = str(fd, 'reference')
  if (!(amount > 0) || !isDate(on) || !mode || !ref) return { error: 'Enter the amount, date, mode and reference number.' }
  if (on > todayIST()) return { error: 'The payment date cannot be in the future.' }
  const i = await one<{ booking_id: number; amount: number; paid_amount: number; label: string }>('select * from installments where id=$1', [installmentId])
  if (!i) return { error: 'Instalment not found.' }
  if (amount > i.amount - i.paid_amount) return { error: `Only ${inr(i.amount - i.paid_amount)} is outstanding on this instalment.` }
  await q('update installments set paid_amount=paid_amount+$2, paid_on=$3, mode=$4, reference=$5, recorded_by=$6 where id=$1', [installmentId, amount, on, mode, ref, user.id])
  await audit(user.id, 'booking', i.booking_id, 'payment', `${inr(amount)} received for ${i.label} (${mode}, ref ${ref})`)
  revalidatePath(`/admin/bookings/${i.booking_id}`)
  return { ok: 'Payment recorded.' }
}

/* ---------- staff: calendar blocks ---------- */

export async function blockDates(_: State, fd: FormData): Promise<State> {
  const user = await requireRole(...STAFF)
  const venueId = num(fd, 'venue'), start = str(fd, 'start'), end = str(fd, 'end') || start, reason = str(fd, 'reason')
  if (!venueId || !isDate(start) || !isDate(end) || end < start) return { error: 'Choose a venue and a valid date range.' }
  if (!reason) return { error: 'A reason is required. It is kept in the history.' }
  try {
    const e = await one<{ id: number }>(
      `insert into calendar_entries (venue_id,start_date,end_date,status,reason,created_by) values ($1,$2,$3,'blocked',$4,$5) returning id`,
      [venueId, start, end, reason, user.id],
    )
    await audit(user.id, 'calendar', e!.id, 'blocked', `${fmtRange(start, end)}: ${reason}`)
  } catch (e: any) {
    if (e.code === OVERLAP) return { error: 'Part of that range is already held by a booking or another block. Remove or resolve it first.' }
    throw e
  }
  revalidatePath('/admin/calendar')
  return { ok: 'Dates blocked.' }
}

export async function unblockDates(id: number) {
  const user = await requireRole(...STAFF)
  const r = await one<{ start_date: string; end_date: string }>(`delete from calendar_entries where id=$1 and status='blocked' returning start_date,end_date`, [id])
  if (r) await audit(user.id, 'calendar', id, 'unblocked', fmtRange(r.start_date, r.end_date))
  revalidatePath('/admin/calendar')
}

/* ---------- staff: content ---------- */

export async function saveNotice(id: number | null, _: State, fd: FormData): Promise<State> {
  const user = await requireRole(...STAFF)
  const title = str(fd, 'title'), body = str(fd, 'body'), category = str(fd, 'category'), status = str(fd, 'status'), on = str(fd, 'publish_on')
  if (!title || !body || !isDate(on)) return { error: 'Title, text and publish date are required.' }
  if (id) await q('update notices set title=$2,body=$3,category=$4,status=$5,publish_on=$6 where id=$1', [id, title, body, category, status, on])
  else await q('insert into notices (title,body,category,status,publish_on,created_by) values ($1,$2,$3,$4,$5,$6)', [title, body, category, status, on, user.id])
  await audit(user.id, 'notice', id, id ? 'updated' : 'created', title)
  redirect('/admin/notices')
}
export async function setNoticeStatus(id: number, status: string) {
  const user = await requireRole(...STAFF)
  await q('update notices set status=$2 where id=$1', [id, status])
  await audit(user.id, 'notice', id, status)
  revalidatePath('/admin/notices')
}

export async function saveEvent(id: number | null, _: State, fd: FormData): Promise<State> {
  const user = await requireRole(...STAFF)
  const title = str(fd, 'title'), start = str(fd, 'start'), end = str(fd, 'end') || start
  if (!title || !isDate(start) || !isDate(end) || end < start) return { error: 'Title and a valid date range are required.' }
  const args = [title, str(fd, 'description'), num(fd, 'venue') || null, start, end, str(fd, 'status')]
  if (id) await q('update events set title=$2,description=$3,venue_id=$4,start_date=$5,end_date=$6,status=$7 where id=$1', [id, ...args])
  else await q('insert into events (title,description,venue_id,start_date,end_date,status) values ($1,$2,$3,$4,$5,$6)', args)
  await audit(user.id, 'event', id, id ? 'updated' : 'created', title)
  redirect('/admin/events')
}
export async function setEventStatus(id: number, status: string) {
  const user = await requireRole(...STAFF)
  await q('update events set status=$2 where id=$1', [id, status])
  await audit(user.id, 'event', id, status)
  revalidatePath('/admin/events')
}

export async function submitEnquiry(_: State, fd: FormData): Promise<State> {
  const name = str(fd, 'name'), email = str(fd, 'email'), phone = str(fd, 'phone'), message = str(fd, 'message')
  if (!name || !message) return { error: 'Please enter your name and message.' }
  if (!email && !phone) return { error: 'Give an email address or a phone number so we can reply.' }
  await q('insert into enquiries (name,email,phone,message) values ($1,$2,$3,$4)', [name, email || null, phone || null, message.slice(0, 2000)])
  return { ok: 'Thank you. Your enquiry has been received and the office will get back to you.' }
}
export async function setEnquiryStatus(id: number, status: string) {
  const user = await requireRole(...STAFF)
  await q('update enquiries set status=$2 where id=$1', [id, status])
  await audit(user.id, 'enquiry', id, status)
  revalidatePath('/admin/enquiries')
}

/* ---------- super admin ---------- */

export async function setUserRole(id: number, _: State, fd: FormData): Promise<State> {
  const me = await requireRole('super_admin')
  const role = str(fd, 'role') as Role
  if (!['organizer', ...ADMIN_ROLES].includes(role)) return { error: 'Invalid role.' }
  if (id === me.id) return { error: 'You cannot change your own role.' }
  await q('update users set role=$2 where id=$1', [id, role])
  await audit(me.id, 'user', id, 'role', role)
  revalidatePath('/admin/users')
  return { ok: 'Role updated.' }
}

export async function saveSettings(_: State, fd: FormData): Promise<State> {
  const me = await requireRole('super_admin')
  const advance = num(fd, 'advance_booking_days'), notice = num(fd, 'min_notice_days')
  if (!(advance >= 1 && advance <= 1095) || !(notice >= 0 && notice <= 180)) return { error: 'Advance window must be 1–1095 days and notice period 0–180 days.' }
  await q(`insert into settings values ('advance_booking_days',$1),('min_notice_days',$2) on conflict (key) do update set value=excluded.value`, [String(advance), String(notice)])
  await audit(me.id, 'settings', null, 'updated', `advance=${advance}, notice=${notice}`)
  return { ok: 'Settings saved.' }
}

