'use client'

import { layouts } from '@/lib/data'
import { prefectureNames } from '@/lib/prefectures'
import {
  hasBuilding,
  listingCategories,
} from '@/lib/validation/listing-submission'
import { validatePropertyRequest } from '@/lib/validation/property-request'
import { useSubmissionForm } from './use-submission-form'
import { FormAlert, SelectField, TextField } from './fields'
import { ReceiptPanel } from './receipt'
import type { FormContact } from './contact'
import { SubmitButton } from './submit-button'

/** Carried over from a listing the seeker was looking at. */
export type PropertyRequestInitial = {
  title?: string
  deal?: string
  category?: string
  layout?: string
  prefecture?: string
  city?: string
}

type PropertyRequestValues = {
  title: string
  deal: string
  category: string
  layout: string
  prefecture: string
  city: string
  budget: string
  moveInDate: string
  contactEmail: string
}

export type PropertyRequestEdit = {
  requestId: string
  values: PropertyRequestValues
}

const dealOptions = [
  { value: 'sale', label: '購入したい' },
  { value: 'rent', label: '借りたい' },
]

export function PropertyRequestForm({
  contact,
  initial,
  edit,
}: {
  contact?: FormContact
  initial?: PropertyRequestInitial
  /** Present when editing an existing request. */
  edit?: PropertyRequestEdit
}) {
  const form = useSubmissionForm({
    url: edit ? `/api/requests/${edit.requestId}` : '/api/requests',
    method: edit ? 'PUT' : 'POST',
    validate: validatePropertyRequest,
    initialValues: edit?.values ?? {
      title: initial?.title ?? '',
      deal: initial?.deal ?? 'rent',
      category: initial?.category ?? '',
      layout: initial?.layout ?? '',
      prefecture: initial?.prefecture ?? '',
      city: initial?.city ?? '',
      budget: '',
      moveInDate: '',
      contactEmail: contact?.email ?? '',
    },
  })
  const withBuilding = hasBuilding(form.values.category)

  if (form.receipt) {
    return (
      <ReceiptPanel
        receipt={form.receipt}
        title={edit ? 'リクエストの更新' : '物件リクエストの登録'}
        description={
          edit ? '更新しました。' : '審査後にリクエスト一覧へ掲載します。'
        }
        links={
          edit
            ? [
                {
                  href: `/requests/${edit.requestId}`,
                  label: 'リクエストの詳細を見る',
                },
                { href: '/account', label: 'マイページにもどる' },
              ]
            : [{ href: '/requests', label: 'リクエスト一覧にもどる' }]
        }
      />
    )
  }

  return (
    <form onSubmit={form.submit} noValidate className="flex flex-col gap-5">
      <FormAlert error={form.failed ? '送信できませんでした。' : undefined} />
      <TextField
        id="title"
        label="希望条件の見出し"
        placeholder="例: 保育園に通える2LDKを探しています"
        value={form.values.title}
        onChange={(e) => form.setValue('title', e.target.value)}
        error={form.errors.title}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-foreground">
            希望する取引
          </span>
          <select
            id="deal"
            aria-label="希望する取引"
            value={form.values.deal}
            onChange={(e) => form.setValue('deal', e.target.value)}
            className="mt-2 h-12 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {dealOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {form.errors.deal && (
            <span className="mt-1 block text-xs text-destructive">
              {form.errors.deal}
            </span>
          )}
        </label>
        <SelectField
          id="category"
          label="カテゴリ"
          options={listingCategories}
          value={form.values.category}
          onChange={(e) => form.setValue('category', e.target.value)}
          error={form.errors.category}
        />
        {withBuilding && (
          <SelectField
            id="layout"
            label="希望の間取り"
            options={layouts}
            value={form.values.layout}
            onChange={(e) => form.setValue('layout', e.target.value)}
            error={form.errors.layout}
          />
        )}
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">
          希望エリア
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            id="prefecture"
            label="都道府県"
            options={prefectureNames}
            value={form.values.prefecture}
            onChange={(e) => form.setValue('prefecture', e.target.value)}
            error={form.errors.prefecture}
          />
          <TextField
            id="city"
            label="市区町村"
            placeholder="例: 世田谷区"
            value={form.values.city}
            onChange={(e) => form.setValue('city', e.target.value)}
            error={form.errors.city}
          />
        </div>
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="budget"
          label={
            form.values.deal === 'rent'
              ? '月額賃料の上限（円）'
              : '予算の上限（円）'
          }
          inputMode="numeric"
          value={form.values.budget}
          onChange={(e) => form.setValue('budget', e.target.value)}
          error={form.errors.budget}
        />
        <TextField
          id="moveInDate"
          label="入居・引渡し希望日"
          type="date"
          value={form.values.moveInDate}
          onChange={(e) => form.setValue('moveInDate', e.target.value)}
          error={form.errors.moveInDate}
        />
      </div>
      <TextField
        id="contactEmail"
        label="メールアドレス"
        type="email"
        value={form.values.contactEmail}
        onChange={(e) => form.setValue('contactEmail', e.target.value)}
        error={form.errors.contactEmail}
      />
      <div>
        <SubmitButton
          label={edit ? '更新する' : '条件を登録する'}
          isSubmitting={form.isSubmitting}
        />
      </div>
    </form>
  )
}
