'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { CircleCheckBig } from 'lucide-react'
import { FormAlert, TextField } from '@/components/forms/fields'
import { SubmitButton } from '@/components/forms/submit-button'
import { buttonVariants } from '@/components/ui/button'
import { formatYen } from '@/lib/data'
import { countLeaseMonths, type DateRange } from '@/lib/lease'
import { validateLeaseRequest } from '@/lib/validation/lease'
import { cn } from '@/lib/utils'

function shortDate(iso: string): string {
  const [, month, day] = iso.split('-')
  return `${Number(month)}/${Number(day)}`
}

function BookedRanges({ booked }: { booked: DateRange[] }) {
  if (booked.length === 0) return null
  return (
    <p className="text-xs text-muted-foreground">
      契約中:{' '}
      {booked.map((range, index) => (
        <span key={range.startDate + range.endDate}>
          {index > 0 && '、'}
          {shortDate(range.startDate)} 〜 {shortDate(range.endDate)}
        </span>
      ))}
    </p>
  )
}

export function LeaseRequestForm({
  listingId,
  rentPerMonth,
  booked,
  signedIn,
}: {
  listingId: string
  rentPerMonth: number
  booked: DateRange[]
  signedIn: boolean
}) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const months = countLeaseMonths(startDate, endDate)

  if (!signedIn) {
    return (
      <div className="flex flex-col gap-2">
        <BookedRanges booked={booked} />
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(`/listings/${listingId}`)}`}
          className={cn(buttonVariants(), 'h-11')}
        >
          ログインして申し込む
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div
        role="status"
        className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-sm"
      >
        <CircleCheckBig className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          入居を申し込みました。出品者の承認をお待ちください。
          <Link href="/account" className="ml-1 font-medium text-primary">
            マイページで確認する
          </Link>
        </span>
      </div>
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(undefined)
    const parsed = validateLeaseRequest({ startDate, endDate })
    if (!parsed.ok) {
      setErrors(parsed.errors)
      return
    }
    if (months === 0) {
      setErrors({ endDate: '終了日は開始日以降にしてください。' })
      return
    }
    setErrors({})
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/listings/${listingId}/leases`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.value),
      })
      if (response.status === 201) {
        setDone(true)
        return
      }
      const body = (await response.json()) as { error?: string }
      setError(body.error ?? '申し込めませんでした。')
    } catch {
      setError('申し込めませんでした。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <FormAlert error={error} />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          id="lease-start"
          label="開始日"
          type="date"
          value={startDate}
          error={errors.startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
        <TextField
          id="lease-end"
          label="終了日"
          type="date"
          value={endDate}
          error={errors.endDate}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </div>
      <BookedRanges booked={booked} />
      {months > 0 && (
        <p className="text-sm text-foreground">
          {months}か月 · {formatYen(rentPerMonth * months)}
        </p>
      )}
      <SubmitButton label="入居を申し込む" isSubmitting={isSubmitting} />
    </form>
  )
}
