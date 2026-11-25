import ActionForm from './ActionForm'
import Field from './Field'
import { Button, Card } from './ui'
import { saveEvent } from '@/lib/actions'
import { venues } from '@/lib/queries'

export default async function EventForm({ e }: { e?: any }) {
  const vs = await venues()
  return (
    <Card className="max-w-3xl">
      <ActionForm action={saveEvent.bind(null, e?.id ?? null)} className="space-y-5">
        <Field label="Event title" required><input name="title" required defaultValue={e?.title} className="input" /></Field>
        <Field label="Description"><textarea name="description" defaultValue={e?.description} className="input" /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="From" required><input type="date" name="start" required defaultValue={e?.start_date} className="input" /></Field>
          <Field label="To" hint="Leave empty for a single day."><input type="date" name="end" defaultValue={e?.end_date !== e?.start_date ? e?.end_date : ''} className="input" /></Field>
          <Field label="Venue"><select name="venue" defaultValue={e?.venue_id ?? ''} className="input"><option value="">Not specified</option>{vs.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
          <Field label="Status" hint="Only “Published” is visible to the public."><select name="status" defaultValue={e?.status ?? 'draft'} className="input"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></Field>
        </div>
        <div className="flex gap-3"><Button>Save event</Button><Button href="/admin/events" variant="secondary">Cancel</Button></div>
      </ActionForm>
    </Card>
  )
}
