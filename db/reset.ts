// Rebuilds the schema and loads demo data. Dev only: `npm run db:reset`.
// Venue names, capacities and tariffs below are placeholders until WBTPO supplies the real figures.
import { readFileSync } from 'node:fs'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const q = (t: string, p: unknown[] = []) => pool.query(t, p)
const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)

async function main() {
  await q('drop schema public cascade; create schema public;')
  await q(readFileSync('db/schema.sql', 'utf8'))

  const hash = await bcrypt.hash('Wbtpo@123', 10)
  const users: [string, string, string, string | null, string | null][] = [
    ['Super Administrator', 'admin@wbtpo.test', 'super_admin', null, null],
    ['Booking Officer', 'booking@wbtpo.test', 'booking_manager', null, null],
    ['Accounts Officer', 'accounts@wbtpo.test', 'accounts', null, null],
    ['Management Viewer', 'management@wbtpo.test', 'management', null, null],
    ['Rina Sen', 'organizer@wbtpo.test', 'organizer', '9830012345', 'Eastern Crafts Guild'],
  ]
  for (const [name, email, role, phone, org] of users)
    await q('insert into users (name,email,role,phone,organisation,password_hash) values ($1,$2,$3,$4,$5,$6)', [name, email, role, phone, org, hash])

  const venues = [
    ['main-ground', 'Main Exhibition Ground', 'Open ground', 'Large open ground for trade fairs, book fairs and cultural fairs. Stall layouts are agreed with WBTPO before the booking is confirmed.', 5000, 60000, ['Power supply', 'Water points', 'Perimeter fencing', 'Parking area', 'Security cabin'], 85000, 1],
    ['hall-a', 'Hall A', 'Covered hall', 'Air-conditioned hall suited to conferences, buyer-seller meets and product launches.', 600, 9000, ['Air conditioning', 'Stage', 'Sound system', 'Generator backup', 'Green room'], 32000, 2],
    ['hall-b', 'Hall B', 'Covered hall', 'Medium hall with flexible seating, used for workshops, training programmes and small exhibitions.', 300, 5000, ['Air conditioning', 'Projector', 'Movable seating', 'Generator backup'], 18000, 3],
    ['amphitheatre', 'Open Air Amphitheatre', 'Open stage', 'Tiered open-air seating around a performance stage for cultural programmes.', 1200, 11000, ['Fixed stage', 'Stage lighting points', 'Tiered seating', 'Green room'], 24000, 4],
    ['seminar-room', 'Seminar Room', 'Meeting room', 'Small room for board meetings, press conferences and interviews.', 60, 900, ['Air conditioning', 'Projector', 'Whiteboard'], 6000, 5],
  ]
  for (const v of venues)
    await q('insert into venues (slug,name,kind,description,capacity,area_sqft,amenities,tariff_per_day,sort) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)', v)

  await q("insert into settings values ('advance_booking_days','365'),('min_notice_days','7')")

  await q(
    `insert into notices (title,body,category,status,publish_on) values
     ('Tariff schedule for 2026–27 uploaded','The revised venue tariff schedule is now available on each venue page. Organizers are advised to check the rates before submitting an application.','notice','published',$1),
     ('Booking applications for the winter fair season','Applications for dates between December and February are being accepted. Applications are scrutinised in the order received.','announcement','published',$2),
     ('Closure of Hall B for maintenance','Hall B will not be available for bookings on the dates shown as unavailable on its calendar.','notice','published',$3)`,
    [day(-12), day(-6), day(-2)],
  )

  await q(
    `insert into events (title,description,venue_id,start_date,end_date,status) values
     ('Kolkata Handloom and Handicrafts Fair','Annual fair with artisans from districts across West Bengal.',1,$1,$2,'published'),
     ('MSME Buyer–Seller Meet','Structured meetings between MSME exporters and registered buyers.',2,$3,$3,'published'),
     ('Folk Music Evening','Baul and bhatiali performances by district artists.',4,$4,$4,'published'),
     ('Annual Book Fair (previous edition)','Concluded. Photographs will be added to the gallery.',1,$5,$6,'published')`,
    [day(20), day(29), day(34), day(41), day(-75), day(-66)],
  )

  // One sample booking in each interesting state, so the admin screens aren't empty.
  const org = (await q("select id from users where email='organizer@wbtpo.test'")).rows[0].id
  const mk = async (venue: number, s: number, e: number, name: string, type: string, att: number, status: string, total: number | null) =>
    (await q(
      'insert into bookings (organizer_id,venue_id,event_name,event_type,attendance,start_date,end_date,status,total_amount) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id',
      [org, venue, name, type, att, day(s), day(e), status, total],
    )).rows[0].id as number
  const hold = (venue: number, s: number, e: number, status: string, booking: number | null, reason?: string) =>
    q('insert into calendar_entries (venue_id,start_date,end_date,status,booking_id,reason) values ($1,$2,$3,$4,$5,$6)', [venue, day(s), day(e), status, booking, reason ?? null])

  await mk(3, 45, 46, 'Weaver Training Workshop', 'Workshop', 80, 'submitted', null)
  const b2 = await mk(2, 12, 12, 'Handloom Exporters Conclave', 'Conference', 350, 'provisional', null)
  await hold(2, 12, 12, 'provisional', b2)
  const b3 = await mk(4, 26, 27, 'Rabindra Sangeet Sandhya', 'Cultural programme', 900, 'confirmed', 48000)
  await hold(4, 26, 27, 'confirmed', b3)
  await q('insert into installments (booking_id,label,amount,due_date,paid_amount,paid_on,mode,reference) values ($1,$2,$3,$4,$3,$5,$6,$7)', [b3, 'Advance (50%)', 24000, day(-5), day(-6), 'NEFT', 'UTR2026110456712'])
  await q('insert into installments (booking_id,label,amount,due_date) values ($1,$2,$3,$4)', [b3, 'Balance', 24000, day(15)])
  await hold(3, 3, 8, 'blocked', null, 'Maintenance and repainting')
  await q("insert into audit_log (entity,entity_id,action,detail) values ('booking',$1,'submitted','Application submitted'),('booking',$2,'submitted','Application submitted')", [b2, b3])

  await pool.end()
  console.log('Database ready. Demo logins use password Wbtpo@123')
}
main().catch((e) => { console.error(e); process.exit(1) })
