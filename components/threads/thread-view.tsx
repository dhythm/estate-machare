'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, MessageSquare, Handshake } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/badge'
import { FormAlert, TextareaField } from '@/components/forms/fields'
import { SubmitButton } from '@/components/forms/submit-button'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  formatYen,
  threadStatusLabels,
  threadStatuses,
  type ThreadStatus,
} from '@/lib/data'
import type { Thread } from '@/lib/server/threads'
import { validateMessage } from '@/lib/validation/thread'
import { ReviewForm } from '@/components/reviews/review-form'
import { StarRating } from '@/components/reviews/star-rating'
import type { Review } from '@/lib/server/store/types'
import { cn } from '@/lib/utils'

const inquiryModeLabels: Record<string, string> = {
  buy: '購入したい',
  rent: '賃貸したい',
  purchaseOption: '買取オプションしたい',
  question: '質問',
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function when(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP')
}

function TargetCard({ target }: { target: Thread['target'] }) {
  if (!target)
    return (
      <p className="text-sm text-muted-foreground">
        対象の物件・案件は削除されました。
      </p>
    )
  if (target.kind === 'listing') {
    const { listing } = target
    return (
      <div className="text-sm">
        <div className="mb-5 flex justify-center rounded-xl bg-muted/60 p-4">
          <Image
            src={listing.image}
            alt=""
            width={240}
            height={150}
            className="h-36 w-full object-contain"
          />
        </div>
        <p className="mb-2 text-xs text-muted-foreground">
          {listing.category} · {listing.zoning}
        </p>
        <Link
          href={`/listings/${listing.id}`}
          className="flex items-start justify-between gap-3 text-base font-semibold leading-relaxed text-foreground hover:text-primary"
        >
          {listing.name}
          <ArrowUpRight
            className="mt-1 size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
        </Link>
        <p className="mt-2 text-xs text-muted-foreground">
          {listing.prefecture} {listing.city}
        </p>
        <dl className="mt-5 space-y-3 border-t border-border pt-4">
          {listing.rentPerMonth && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-xs text-muted-foreground">賃貸 / 日</dt>
              <dd className="font-semibold tabular-nums">
                {formatYen(listing.rentPerMonth)}
              </dd>
            </div>
          )}
          {listing.salePrice && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-xs text-muted-foreground">販売価格</dt>
              <dd className="font-semibold tabular-nums">
                {formatYen(listing.salePrice)}
              </dd>
            </div>
          )}
        </dl>
      </div>
    )
  }
  const { request } = target
  return (
    <div className="text-sm">
      <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/5 text-primary">
        <Handshake className="size-6" aria-hidden="true" />
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/requests/${request.id}`}
          className="font-semibold text-foreground hover:text-primary"
        >
          {request.title}
        </Link>
        <Badge variant="muted">{request.status}</Badge>
      </div>
      <div className="mt-5 space-y-3 border-y border-border py-4">
        <p className="flex gap-3">
          <span className="text-xs text-muted-foreground">希望エリア</span>
          {request.prefecture} {request.city}
        </p>
        <p className="flex gap-3">
          <span className="text-xs text-muted-foreground">条件</span>
          {request.category}
          {request.layout ? ` / ${request.layout}` : ''}
        </p>
      </div>
      <p className="mt-4 flex justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {request.deal === 'rent' ? '月額賃料の上限' : '予算の上限'}
        </span>
        <span className="font-semibold tabular-nums">
          {formatYen(request.budget)}
        </span>
      </p>
    </div>
  )
}

function OpeningMessage({ thread }: { thread: Thread }) {
  const { payload } = thread.submission
  const isInquiry = thread.submission.kind === 'listingInquiry'
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {text(payload.name)}
        </span>
        <span>{when(thread.submission.receivedAt)}</span>
        {isInquiry && text(payload.mode) && (
          <Badge variant="outline">
            {inquiryModeLabels[text(payload.mode)] ?? text(payload.mode)}
          </Badge>
        )}
        {!isInquiry && (
          <span>
            {text(payload.vehicle)}
            {text(payload.availableDate) && `・${text(payload.availableDate)}`}
          </span>
        )}
        {isInquiry && text(payload.preferredDate) && (
          <span>希望日 {text(payload.preferredDate)}</span>
        )}
      </div>
      {text(payload.message) && (
        <p className="mt-2 whitespace-pre-wrap break-words leading-relaxed text-foreground">
          {text(payload.message)}
        </p>
      )}
    </div>
  )
}

export function ThreadView({
  thread,
  currentUserId,
  canReview = false,
  review,
}: {
  thread: Thread
  currentUserId: string
  /** The sender may review once the inquiry is agreed. */
  canReview?: boolean
  review?: Review
}) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [changing, setChanging] = useState<ThreadStatus>()
  const canReply = thread.role !== 'admin'
  const canDecide = thread.role === 'owner'

  const send = async (event: FormEvent) => {
    event.preventDefault()
    setError(undefined)
    const parsed = validateMessage({ body })
    if (!parsed.ok) {
      setFieldError(parsed.errors.body)
      return
    }
    setFieldError(undefined)
    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/threads/${thread.submission.id}/messages`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(parsed.value),
        },
      )
      if (!response.ok) {
        setError('送信できませんでした。')
        return
      }
      setBody('')
      router.refresh()
    } catch {
      setError('送信できませんでした。')
    } finally {
      setIsSubmitting(false)
    }
  }

  const decide = async (status: ThreadStatus) => {
    setChanging(status)
    setError(undefined)
    try {
      const response = await fetch(`/api/threads/${thread.submission.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        setError('状態を更新できませんでした。')
        return
      }
      router.refresh()
    } catch {
      setError('状態を更新できませんでした。')
    } finally {
      setChanging(undefined)
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
      <section
        aria-labelledby="conversation-title"
        className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-5 sm:px-6">
          <h2
            id="conversation-title"
            className="flex items-center gap-2.5 text-base font-semibold text-foreground"
          >
            <MessageSquare className="size-4 text-primary" aria-hidden="true" />
            メッセージ
          </h2>
          <span className="text-xs tabular-nums text-muted-foreground">
            {thread.messages.length + 1}件
          </span>
        </div>
        <div className="flex items-start justify-between gap-3 border-b border-border bg-secondary/40 px-5 py-3 text-xs lg:hidden">
          <p className="min-w-0 font-medium leading-relaxed">
            {thread.target?.kind === 'listing'
              ? thread.target.listing.name
              : thread.target?.request.title}
          </p>
          <Link
            href="#transaction-title"
            className="shrink-0 text-primary underline underline-offset-4"
          >
            取引情報
          </Link>
        </div>
        <div className="space-y-6 bg-muted/30 p-4 sm:p-6">
          <FormAlert error={error} />
          <OpeningMessage thread={thread} />
          <ol aria-label="返信の履歴" className="flex flex-col gap-5">
            {thread.messages.map((message) => {
              const mine = message.senderUserId === currentUserId
              return (
                <li
                  key={message.id}
                  className={cn(
                    'flex flex-col',
                    mine ? 'items-end' : 'items-start',
                  )}
                >
                  <span className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">
                      {mine ? '自分' : '相手'}
                    </span>
                    <span>{when(message.createdAt)}</span>
                  </span>
                  <p
                    className={cn(
                      'mt-2 max-w-[92%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[85%]',
                      mine
                        ? 'rounded-tr-sm bg-primary text-primary-foreground'
                        : 'rounded-tl-sm border border-border bg-card text-foreground',
                    )}
                  >
                    {message.body}
                  </p>
                </li>
              )
            })}
          </ol>
        </div>
        {canReply && (
          <form
            onSubmit={send}
            noValidate
            className="flex flex-col gap-3 border-t border-border p-4 sm:p-6"
          >
            <TextareaField
              id="reply"
              label="返信"
              value={body}
              error={fieldError}
              placeholder="メッセージを入力"
              onChange={(event) => setBody(event.target.value)}
            />
            <div className="flex justify-end">
              <SubmitButton label="送信する" isSubmitting={isSubmitting} />
            </div>
          </form>
        )}
      </section>
      <aside className="min-w-0 space-y-4">
        <section
          aria-labelledby="transaction-title"
          className="rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2
              id="transaction-title"
              className="text-xs font-semibold text-muted-foreground"
            >
              取引の情報
            </h2>
            <Badge variant={thread.status === 'new' ? 'default' : 'muted'}>
              {threadStatusLabels[thread.status]}
            </Badge>
          </div>
          <TargetCard target={thread.target} />
          {canDecide && (
            <div className="mt-6 border-t border-border pt-5">
              <h3 className="mb-3 text-xs font-semibold text-muted-foreground">
                取引の状態を変更
              </h3>
              <div className="flex flex-wrap gap-2">
                {threadStatuses
                  .filter((status) => status !== 'new')
                  .map((status) => (
                    <Button
                      key={status}
                      type="button"
                      size="sm"
                      className="min-h-9 flex-1"
                      variant={thread.status === status ? 'default' : 'outline'}
                      aria-pressed={thread.status === status}
                      disabled={changing !== undefined}
                      onClick={() => void decide(status)}
                    >
                      {threadStatusLabels[status]}
                    </Button>
                  ))}
              </div>
            </div>
          )}
          {thread.status === 'agreed' &&
            thread.target?.kind === 'listing' &&
            thread.role !== 'admin' && (
              <Link
                href={`/requests/new?listingId=${thread.target.listing.id}`}
                className={cn(buttonVariants(), 'mt-5 h-10 w-full')}
              >
                <Handshake className="size-4" aria-hidden="true" />
                希望条件を登録する
              </Link>
            )}
        </section>
        {review && (
          <section
            aria-label="投稿したレビュー"
            className="rounded-2xl border border-border bg-card p-5 text-sm"
          >
            <p className="mb-3 text-xs font-semibold text-muted-foreground">
              投稿したレビュー
            </p>
            <StarRating rating={review.rating} />
            {review.comment && (
              <p className="mt-2 leading-relaxed text-foreground">
                {review.comment}
              </p>
            )}
          </section>
        )}
        {canReview && !review && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <ReviewForm sourceKind="thread" sourceId={thread.submission.id} />
          </div>
        )}
      </aside>
    </div>
  )
}
