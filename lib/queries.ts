import { q } from './db'
import { todayIST } from './dates'

export type Venue = {
  id: number; slug: string; name: string; kind: string; description: string
  capacity: number; area_sqft: number | null; amenities: string[]; tariff_per_day: number
}
export const venues = () => q<Venue>('select * from venues where active order by sort')

export type Entry = { id: number; venue_id: number; start_date: string; end_date: string; status: string; reason: string | null; ref: string | null; booking_id: number | null }
export const entriesFor = (venueId: number, from: string, to: string) =>
  q<Entry>(
    `select e.id, e.venue_id, e.start_date, e.end_date, e.status, e.reason, e.booking_id, b.ref
       from calendar_entries e left join bookings b on b.id = e.booking_id
      where e.venue_id=$1 and e.start_date <= $3 and e.end_date >= $2
      order by e.start_date`,
    [venueId, from, to],
  )

export const instStatus = (i: { amount: number; paid_amount: number; due_date: string }) =>
  i.paid_amount >= i.amount ? 'Paid' : i.paid_amount > 0 ? 'Part paid' : i.due_date < todayIST() ? 'Overdue' : 'Due'

export const publishedNotices = (limit = 50) =>
  q<{ id: number; title: string; body: string; category: string; publish_on: string }>(
    `select id,title,body,category,publish_on from notices where status='published' and publish_on <= current_date order by publish_on desc, id desc limit $1`,
    [limit],
  )
