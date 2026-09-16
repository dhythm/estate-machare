'use client'

import type { PropertyRequest } from '@/lib/data'
import { validateRequestProposal } from '@/lib/validation/property-request'
import { useSubmissionForm } from './use-submission-form'
import { FormAlert, SelectField, TextField, TextareaField } from './fields'
import { ReceiptPanel } from './receipt'
import type { FormContact } from './contact'
import { SubmitButton } from './submit-button'

export function RequestProposalForm({
  request,
  contact,
  listings,
}: {
  request: PropertyRequest
  contact?: FormContact
  /** The proposer's own listings, offered as the property to introduce. */
  listings?: { id: string; name: string }[]
}) {
  const form = useSubmissionForm({
    url: `/api/requests/${request.id}/proposals`,
    validate: validateRequestProposal,
    initialValues: {
      name: contact?.name ?? '',
      email: contact?.email ?? '',
      listingId: '',
      availableDate: '',
      message: '',
    },
  })

  if (form.receipt) {
    return (
      <ReceiptPanel
        receipt={form.receipt}
        title="応募"
        description="応募の状況と依頼者からの返信はマイページで確認できます。"
        links={[
          {
            href: `/account/threads/${form.receipt.id}`,
            label: 'やり取りを開く',
          },
          { href: '/transport', label: 'ほかの案件を見る' },
          { href: '/transport/register', label: '運搬者として登録する' },
        ]}
      />
    )
  }

  return (
    <form onSubmit={form.submit} noValidate className="flex flex-col gap-5">
      <FormAlert error={form.failed ? '送信できませんでした。' : undefined} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="name"
          label="お名前・商号"
          value={form.values.name}
          onChange={(e) => form.setValue('name', e.target.value)}
          error={form.errors.name}
        />
        <TextField
          id="email"
          label="メールアドレス"
          type="email"
          value={form.values.email}
          onChange={(e) => form.setValue('email', e.target.value)}
          error={form.errors.email}
        />
        {listings && listings.length > 0 && (
          <label className="block">
            <span className="text-sm font-medium text-foreground">
              紹介する物件
            </span>
            <select
              id="listingId"
              aria-label="紹介する物件"
              value={form.values.listingId}
              onChange={(e) => form.setValue('listingId', e.target.value)}
              className="mt-2 h-12 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <option value="">選択しない</option>
              {listings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <TextField
          id="availableDate"
          label="案内可能日"
          type="date"
          value={form.values.availableDate}
          onChange={(e) => form.setValue('availableDate', e.target.value)}
          error={form.errors.availableDate}
        />
      </div>
      <TextareaField
        id="message"
        label="メッセージ"
        placeholder="提案できる物件、内見の候補日など"
        value={form.values.message}
        onChange={(e) => form.setValue('message', e.target.value)}
        error={form.errors.message}
      />
      <div>
        <SubmitButton label="提案する" isSubmitting={form.isSubmitting} />
      </div>
    </form>
  )
}
