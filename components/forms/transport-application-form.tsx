'use client'

import type { TransportJob } from '@/lib/data'
import {
  validateTransportApplication,
  vehicleTypes,
} from '@/lib/validation/transport'
import { useSubmissionForm } from './use-submission-form'
import { FormAlert, SelectField, TextField, TextareaField } from './fields'
import { ReceiptPanel } from './receipt'
import type { FormContact } from './contact'
import { SubmitButton } from './submit-button'

export function TransportApplicationForm({
  job,
  contact,
  defaultVehicle,
}: {
  job: TransportJob
  contact?: FormContact
  defaultVehicle?: string
}) {
  const form = useSubmissionForm({
    url: `/api/transport/jobs/${job.id}/applications`,
    validate: validateTransportApplication,
    initialValues: {
      name: contact?.name ?? '',
      email: contact?.email ?? '',
      vehicle: defaultVehicle ?? '',
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
          {
            href: '/transport/register',
            label: '引越しパートナーとして登録する',
          },
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
          label="お名前・屋号"
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
        <SelectField
          id="vehicle"
          label="車両"
          options={vehicleTypes}
          value={form.values.vehicle}
          onChange={(e) => form.setValue('vehicle', e.target.value)}
          error={form.errors.vehicle}
        />
        <TextField
          id="availableDate"
          label="対応可能日"
          type="date"
          value={form.values.availableDate}
          onChange={(e) => form.setValue('availableDate', e.target.value)}
          error={form.errors.availableDate}
        />
      </div>
      <TextareaField
        id="message"
        label="メッセージ"
        placeholder="積載方法、立ち会いの希望など"
        value={form.values.message}
        onChange={(e) => form.setValue('message', e.target.value)}
        error={form.errors.message}
      />
      <div>
        <SubmitButton label="応募する" isSubmitting={form.isSubmitting} />
      </div>
    </form>
  )
}
