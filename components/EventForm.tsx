import ActionForm from './ActionForm'
import Field from './Field'
import { saveEvent } from '@/lib/actions'
import { venues } from '@/lib/queries'

export default async function EventForm({ e }: { e?: any }) {
  const vs = await venues()
  return (
    <ActionForm action={saveEvent.bind(null, e?.id ?? null)} className="panel p-6 space-y-4 max-w-2xl">
      <Field label="Title"><input name="title" required defaultValue={e?.title} className="input" /></Field>
      <Field label="Description"><textarea name="description" defaultValue={e?.description} className="input" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From"><input type="date" name="start" required defaultValue={e?.start_date} className="input" /></Field>
        <Field label="To" hint="Leave blank for a single day."><input type="date" name="end" defaultValue={e?.end_date !== e?.start_date ? e?.end_date : ''} className="input" /></Field>
        <Field label="Venue"><select name="venue" defaultValue={e?.venue_id ?? ''} className="input"><option value="">Not specified</option>{vs.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
        <Field label="Status"><select name="status" defaultValue={e?.status ?? 'draft'} className="input"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></Field>
      </div>
      <button className="btn">Save event</button>
    </ActionForm>
  )
}
