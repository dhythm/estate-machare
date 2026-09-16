'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { FormAlert, TextareaField } from '@/components/forms/fields'
import { SubmitButton } from '@/components/forms/submit-button'
import type { ReviewSourceKind } from '@/lib/server/store/types'
import { cn } from '@/lib/utils'

export function ReviewForm({
  sourceKind,
  sourceId,
}: {
  sourceKind: ReviewSourceKind
  sourceId: string
}) {
  const router = useRouter()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(undefined)
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sourceKind,
          sourceId,
          rating,
          comment: comment.trim() || undefined,
        }),
      })
      if (response.status !== 201) {
        const body = (await response.json()) as { error?: string }
        setError(body.error ?? 'レビューを送れませんでした。')
        return
      }
      router.refresh()
    } catch {
      setError('レビューを送れませんでした。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <FormAlert error={error} />
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-foreground">
          出品者の評価
        </legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name={`rating-${sourceKind}-${sourceId}`}
                value={value}
                aria-label={String(value)}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              <Star
                className={cn(
                  'size-6 transition-colors',
                  value <= rating
                    ? 'fill-accent text-accent'
                    : 'text-muted-foreground/40',
                )}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <TextareaField
        id={`comment-${sourceKind}-${sourceId}`}
        label="コメント"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      <div>
        <SubmitButton label="レビューを送る" isSubmitting={isSubmitting} />
      </div>
    </form>
  )
}
