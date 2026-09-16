'use client'

import type { Listing, ListingModeConfig } from '@/lib/data'
import {
  validateListingInquiry,
  type InquiryMode,
} from '@/lib/validation/listing-inquiry'
import { cn } from '@/lib/utils'
import { useSubmissionForm } from './use-submission-form'
import { FormAlert, TextField, TextareaField } from './fields'
import { ReceiptPanel } from './receipt'
import type { FormContact } from './contact'
import { SubmitButton } from './submit-button'

export function InquiryForm({
  listing,
  modes,
  initialMode,
  contact,
}: {
  listing: Listing
  modes: ListingModeConfig[]
  initialMode: InquiryMode
  contact?: FormContact
}) {
  const form = useSubmissionForm({
    url: `/api/listings/${listing.id}/inquiries`,
    validate: validateListingInquiry,
    initialValues: {
      mode: initialMode,
      name: contact?.name ?? '',
      email: contact?.email ?? '',
      preferredDate: '',
      message: '',
    },
  })
  const options: { id: InquiryMode; label: string }[] = [
    ...modes.map((mode) => ({ id: mode.id, label: mode.title })),
    { id: 'question', label: '質問だけする' },
  ]

  if (form.receipt) {
    return (
      <ReceiptPanel
        receipt={form.receipt}
        title="掲載者への連絡"
        description="掲載者とのやり取りはマイページで確認できます。"
        links={[
          {
            href: `/account/threads/${form.receipt.id}`,
            label: 'やり取りを開く',
          },
          { href: `/listings/${listing.id}`, label: '物件の詳細にもどる' },
          { href: '/listings', label: 'ほかの物件を探す' },
        ]}
      />
    )
  }

  return (
    <form
      onSubmit={form.submit}
      noValidate
      className="page-form flex flex-col gap-5"
    >
      <FormAlert error={form.failed ? '送信できませんでした。' : undefined} />
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">
          目的
        </legend>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <label
              key={option.id}
              className={cn(
                'cursor-pointer rounded-full border has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary px-3.5 py-1.5 text-sm font-medium transition-colors',
                form.values.mode === option.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <input
                type="radio"
                name="mode"
                value={option.id}
                checked={form.values.mode === option.id}
                onChange={() => form.setValue('mode', option.id)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
        {form.errors.mode && (
          <p className="mt-2 text-xs text-destructive">{form.errors.mode}</p>
        )}
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="name"
          label="お名前"
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
      </div>
      {form.values.mode !== 'question' && (
        <TextField
          id="preferredDate"
          label="希望日"
          type="date"
          className="sm:max-w-xs"
          value={form.values.preferredDate}
          onChange={(e) => form.setValue('preferredDate', e.target.value)}
          error={form.errors.preferredDate}
        />
      )}
      <TextareaField
        id="message"
        label="メッセージ"
        placeholder="利用期間、用途、質問したいことなど"
        value={form.values.message}
        onChange={(e) => form.setValue('message', e.target.value)}
        error={form.errors.message}
      />
      <div>
        <SubmitButton label="送信する" isSubmitting={form.isSubmitting} />
      </div>
    </form>
  )
}
