import ActionForm from './ActionForm'
import Field from './Field'
import { Button, Card } from './ui'
import { saveNotice } from '@/lib/actions'
import { todayIST } from '@/lib/dates'

export default function NoticeForm({ n }: { n?: any }) {
  return (
    <Card className="max-w-3xl">
      <ActionForm action={saveNotice.bind(null, n?.id ?? null)} className="space-y-5">
        <Field label="Title" required><input name="title" required defaultValue={n?.title} className="input" /></Field>
        <Field label="Text" required><textarea name="body" required defaultValue={n?.body} className="input" style={{ minHeight: '10rem' }} /></Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Type"><select name="category" defaultValue={n?.category ?? 'notice'} className="input"><option value="notice">Notice</option><option value="announcement">Announcement</option><option value="tender">Tender</option></select></Field>
          <Field label="Show from" required><input type="date" name="publish_on" required defaultValue={n?.publish_on ?? todayIST()} className="input" /></Field>
          <Field label="Status" hint="Only “Published” is visible to the public."><select name="status" defaultValue={n?.status ?? 'draft'} className="input"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></Field>
        </div>
        <div className="flex gap-3"><Button>Save notice</Button><Button href="/admin/notices" variant="secondary">Cancel</Button></div>
      </ActionForm>
    </Card>
  )
}
