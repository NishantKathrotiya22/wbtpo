import { Check } from 'lucide-react'
import { Alert, Card } from './ui'

const STEPS = ['Applied', 'Under review', 'Dates held', 'Approved', 'Confirmed']
const NOW: Record<string, number> = { submitted: 1, under_scrutiny: 1, provisional: 2, approved: 3, confirmed: 4, completed: 5 }

// Plain-language "what is happening / what do I do" per status, written for the organizer.
export const ORGANIZER_NEXT: Record<string, { title: string; body: string; tone: 'info' | 'success' | 'warn' | 'error' }> = {
  submitted: { title: 'We have received your application', body: 'An officer will start reviewing it shortly. You do not need to do anything right now.', tone: 'info' },
  under_scrutiny: { title: 'An officer is reviewing your application', body: 'If anything is missing, the office will contact you by phone or email. You do not need to do anything right now.', tone: 'info' },
  provisional: { title: 'Your dates are being held for you', body: 'No one else can book these dates while your application is processed. Approval comes next. You do not need to do anything right now.', tone: 'info' },
  approved: { title: 'Approved. Please pay the advance', body: 'See the payment table below for the amount and due date. Pay as advised by the Accounts section and keep your transaction reference. Your dates stay on hold until the advance is received.', tone: 'warn' },
  confirmed: { title: 'Your booking is confirmed', body: 'The dates are yours. Pay any remaining instalments by their due dates (see the payment table below).', tone: 'success' },
  completed: { title: 'This event is complete', body: 'Thank you for using the venue. You can book again any time.', tone: 'success' },
}

export default function BookingProgress({ status, audience = 'organizer' }: { status: string; audience?: 'organizer' | 'staff' }) {
  if (status === 'rejected' || status === 'cancelled') return null
  const now = NOW[status] ?? 0
  const msg = ORGANIZER_NEXT[status]
  return (
    <Card className="mb-8">
      <ol className="progress" aria-label="Booking progress">
        {STEPS.map((s, i) => {
          const state = i < now ? 'done' : i === now ? 'now' : ''
          return (
            <li key={s} className={state} aria-current={state === 'now' ? 'step' : undefined}>
              <span className="dot">{state === 'done' ? <Check size={18} strokeWidth={3} aria-hidden /> : i + 1}</span>
              {s}
            </li>
          )
        })}
      </ol>
      {audience === 'organizer' && msg && <Alert tone={msg.tone} title={msg.title} className="mt-6">{msg.body}</Alert>}
    </Card>
  )
}
