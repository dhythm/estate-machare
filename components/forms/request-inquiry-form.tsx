'use client'

import { validateRequestInquiry } from '@/lib/validation/property-request'
import { useSubmissionForm } from './use-submission-form'
import { FormAlert, TextareaField } from './fields'
import { ReceiptPanel } from './receipt'
import { SubmitButton } from './submit-button'

export function RequestInquiryForm({ requestId }: { requestId: string }) {
  const form = useSubmissionForm({
    url: `/api/transport/requests/${requestId}/inquiries`,
    validate: validateRequestInquiry,
    initialValues: { message: '' },
  })

  if (form.receipt) {
    return (
      <ReceiptPanel
        receipt={form.receipt}
        title="質問"
        description="依頼者からの返信はやり取りの画面に届きます。"
        links={[
          {
            href: `/account/threads/${form.receipt.id}`,
            label: 'やり取りを見る',
          },
          { href: `/transport/${requestId}`, label: '案件の詳細にもどる' },
        ]}
      />
    )
  }

  return (
    <form onSubmit={form.submit} noValidate className="flex flex-col gap-5">
      <FormAlert error={form.failed ? '送信できませんでした。' : undefined} />
      <TextareaField
        id="message"
        label="質問"
        placeholder="積載方法、立ち会い、日程の相談など"
        value={form.values.message}
        onChange={(event) => form.setValue('message', event.target.value)}
        error={form.errors.message}
      />
      <div>
        <SubmitButton label="質問を送る" isSubmitting={form.isSubmitting} />
      </div>
    </form>
  )
}
