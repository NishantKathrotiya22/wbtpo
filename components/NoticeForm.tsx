import ActionForm from './ActionForm'
import Field from './Field'
import { saveNotice } from '@/lib/actions'
import { todayIST } from '@/lib/dates'

export default function NoticeForm({ n }: { n?: any }) {
  return (
    <ActionForm action={saveNotice.bind(null, n?.id ?? null)} className="panel p-6 space-y-4 max-w-2xl">
      <Field label="Title"><input name="title" required defaultValue={n?.title} className="input" /></Field>
      <Field label="Text"><textarea name="body" required defaultValue={n?.body} className="input" style={{ minHeight: '9rem' }} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Type"><select name="category" defaultValue={n?.category ?? 'notice'} className="input"><option value="notice">Notice</option><option value="announcement">Announcement</option><option value="tender">Tender</option></select></Field>
        <Field label="Publish on"><input type="date" name="publish_on" required defaultValue={n?.publish_on ?? todayIST()} className="input" /></Field>
        <Field label="Status"><select name="status" defaultValue={n?.status ?? 'draft'} className="input"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></Field>
      </div>
      <button className="btn">Save notice</button>
    </ActionForm>
  )
}
