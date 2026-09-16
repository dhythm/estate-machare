'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CircleCheckBig } from 'lucide-react'
import {
  CheckboxField,
  FormAlert,
  SelectField,
  TextField,
  TextareaField,
} from '@/components/forms/fields'
import type { FormContact } from '@/components/forms/contact'
import { SubmitButton } from '@/components/forms/submit-button'
import { prefectureNames } from '@/lib/prefectures'
import {
  validateAgentProfile,
  type AgentProfileInput,
} from '@/lib/validation/agent'
import { listingCategories } from '@/lib/validation/listing-submission'
import { agentKinds } from '@/lib/validation/property-request'

type Values = {
  name: string
  kind: string
  prefecture: string
  handledCategories: string[]
  serviceAreas: string[]
  note: string
}

export function AgentProfileForm({
  contact,
  initial,
}: {
  contact?: FormContact
  initial?: AgentProfileInput & { note?: string }
}) {
  const router = useRouter()
  const [values, setValues] = useState<Values>({
    name: initial?.name ?? contact?.name ?? '',
    kind: initial?.kind ?? '',
    prefecture: initial?.prefecture ?? '',
    handledCategories: initial?.handledCategories ?? [],
    serviceAreas: initial?.serviceAreas ?? [],
    note: initial?.note ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string>()
  const [saved, setSaved] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }
  const toggle = (key: 'handledCategories' | 'serviceAreas', item: string) =>
    set(
      key,
      values[key].includes(item)
        ? values[key].filter((value) => value !== item)
        : [...values[key], item],
    )

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(undefined)
    setSaved(false)
    const parsed = validateAgentProfile(values)
    if (!parsed.ok) {
      setErrors(parsed.errors)
      return
    }
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/agents/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!response.ok) {
        setError('保存できませんでした。')
        return
      }
      setSaved(true)
      router.refresh()
    } catch {
      setError('保存できませんでした。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <FormAlert error={error} />
      {saved && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl bg-secondary/60 p-3 text-sm"
        >
          <CircleCheckBig className="size-4 text-primary" />
          保存しました
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="name"
          label="お名前・屋号"
          value={values.name}
          onChange={(event) => set('name', event.target.value)}
          error={errors.name}
        />
        <SelectField
          id="kind"
          label="区分"
          options={agentKinds}
          value={values.kind}
          onChange={(event) => set('kind', event.target.value)}
          error={errors.kind}
        />
        <SelectField
          id="prefecture"
          label="拠点の都道府県"
          options={prefectureNames}
          value={values.prefecture}
          onChange={(event) => set('prefecture', event.target.value)}
          error={errors.prefecture}
        />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">
          取扱カテゴリ
        </legend>
        <div className="flex flex-wrap gap-4">
          {listingCategories.map((category) => (
            <CheckboxField
              key={category}
              id={`category-${category}`}
              label={category}
              checked={values.handledCategories.includes(category)}
              onChange={() => toggle('handledCategories', category)}
            />
          ))}
        </div>
        {errors.handledCategories && (
          <p className="mt-1 text-xs text-destructive">
            {errors.handledCategories}
          </p>
        )}
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">
          対応地域
        </legend>
        <div className="grid grid-cols-3 gap-x-4 gap-y-1 sm:grid-cols-4 md:grid-cols-6">
          {prefectureNames.map((name) => (
            <CheckboxField
              key={name}
              id={`area-${name}`}
              label={name}
              checked={values.serviceAreas.includes(name)}
              onChange={() => toggle('serviceAreas', name)}
            />
          ))}
        </div>
        {errors.serviceAreas && (
          <p className="mt-1 text-xs text-destructive">{errors.serviceAreas}</p>
        )}
      </fieldset>
      <TextareaField
        id="note"
        label="補足"
        placeholder="対応できる曜日、保有資格など"
        value={values.note}
        onChange={(event) => set('note', event.target.value)}
        error={errors.note}
      />
      <div>
        <SubmitButton label="保存する" isSubmitting={isSubmitting} />
      </div>
    </form>
  )
}
