'use client'

import { useState } from 'react'
import Image from 'next/image'
import { propertyImage } from '@/lib/property-image'
import {
  Check,
  ClipboardCheck,
  Handshake,
  Search,
  SearchX,
  X,
} from 'lucide-react'
import { Badge } from '@/components/badge'
import { FormAlert } from '@/components/forms/fields'
import { Button } from '@/components/ui/button'
import { ListingStatusButton } from '@/components/listings/listing-status-button'
import {
  formatYen,
  type ModerationQueue,
  type ModerationQueueFilter,
} from '@/lib/data'

const filters: { id: ModerationQueueFilter; label: string }[] = [
  { id: 'all', label: 'すべて' },
  { id: 'pending', label: '審査待ち' },
  { id: 'approved', label: '承認済み' },
  { id: 'rejected', label: '却下済み' },
]

/** Pending rows first so review work is on top of the full list. */
function pendingFirst<T extends { moderationStatus?: string }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) =>
      Number(b.moderationStatus === 'pending') -
      Number(a.moderationStatus === 'pending'),
  )
}

export function AdminQueue({
  kind,
  initialQueue,
}: {
  kind: 'listing' | 'propertyRequest'
  initialQueue: ModerationQueue
}) {
  const [status, setStatus] = useState<ModerationQueueFilter>('all')
  const [queue, setQueue] = useState(initialQueue)
  const [error, setError] = useState<string>()
  const [pendingId, setPendingId] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const title = kind === 'listing' ? '出品' : '物件リクエスト'
  const normalizedQuery = query.trim().toLocaleLowerCase('ja-JP')

  const load = async (nextStatus: ModerationQueueFilter) => {
    setError(undefined)
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/queue?status=${nextStatus}`)
      if (!response.ok) throw new Error('Queue request failed')
      setQueue((await response.json()) as ModerationQueue)
      setStatus(nextStatus)
    } catch {
      setError('一覧を更新できませんでした。')
    } finally {
      setLoading(false)
    }
  }

  const decide = async (
    kind: 'listing' | 'propertyRequest',
    id: string,
    decision: 'approved' | 'rejected',
    note: string,
  ) => {
    setPendingId(id)
    setError(undefined)
    try {
      const response = await fetch('/api/admin/queue', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind,
          id,
          status: decision,
          note: note || undefined,
        }),
      })
      if (!response.ok) {
        setError('判定を保存できませんでした。')
        return
      }
      await load(status)
    } catch {
      setError('判定を保存できませんでした。')
    } finally {
      setPendingId(undefined)
    }
  }

  return (
    <div className="flex flex-col gap-5" aria-busy={loading}>
      <FormAlert error={error} />
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 xl:flex-row xl:items-center xl:justify-between">
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="審査状況"
        >
          {filters.map((filter) => (
            <Button
              key={filter.id}
              type="button"
              size="sm"
              variant={status === filter.id ? 'default' : 'outline'}
              aria-pressed={status === filter.id}
              disabled={loading || pendingId !== undefined}
              className="min-h-10 rounded-lg px-3"
              onClick={() => void load(filter.id)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        <label className="flex h-11 items-center gap-2.5 rounded-xl border border-border bg-background px-3 text-muted-foreground focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 xl:w-72">
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="sr-only">{title}を検索</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`${title}を検索`}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
      </div>

      {kind === 'listing' && (
        <QueueSection
          title="出品"
          empty="該当なし"
          pendingId={pendingId}
          items={pendingFirst(queue.listings)
            .filter((listing) =>
              `${listing.id} ${listing.name} ${listing.prefecture} ${listing.city} ${listing.seller.name}`
                .toLocaleLowerCase('ja-JP')
                .includes(normalizedQuery),
            )
            .map((listing) => ({
              id: listing.id,
              image: listing.image,
              withdrawn: listing.withdrawnAt !== undefined,
              title: listing.name,
              meta: `${listing.prefecture} ${listing.city}・${listing.seller.name}`,
              status: listing.moderationStatus ?? 'approved',
              note: listing.moderationNote,
            }))}
          onDecide={(id, decision, note) =>
            decide('listing', id, decision, note)
          }
        />
      )}

      {kind === 'propertyRequest' && (
        <QueueSection
          title="物件リクエスト"
          empty="該当なし"
          pendingId={pendingId}
          items={pendingFirst(queue.propertyRequests)
            .filter((request) =>
              `${request.id} ${request.title} ${request.prefecture} ${request.city} ${request.status}`
                .toLocaleLowerCase('ja-JP')
                .includes(normalizedQuery),
            )
            .map((request) => ({
              id: request.id,
              title: request.title,
              meta: `${request.prefecture} ${request.city}・${request.category}・${formatYen(request.budget)}・${request.status}`,
              status: request.moderationStatus ?? 'approved',
              note: request.moderationNote,
            }))}
          onDecide={(id, decision, note) =>
            decide('propertyRequest', id, decision, note)
          }
        />
      )}
    </div>
  )
}

function QueueSection({
  title,
  empty,
  items,
  pendingId,
  onDecide,
}: {
  title: string
  empty: string
  items: {
    id: string
    image?: string
    withdrawn?: boolean
    title: string
    meta: string
    status: string
    note?: string
  }[]
  pendingId?: string
  onDecide: (
    id: string,
    decision: 'approved' | 'rejected',
    note: string,
  ) => Promise<void>
}) {
  return (
    <section aria-label={`${title}一覧`}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">
          {title}
        </h2>
        <span
          aria-live="polite"
          className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold tabular-nums text-muted-foreground"
        >
          {items.length}件
        </span>
      </div>
      {items.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-muted-foreground">
          <SearchX className="size-7" aria-hidden="true" />
          <p className="text-sm">{empty}</p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {items.map((item) => (
            <QueueItem
              key={item.id}
              item={item}
              busy={pendingId === item.id}
              onDecide={onDecide}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function QueueItem({
  item,
  busy,
  onDecide,
}: {
  item: {
    id: string
    image?: string
    withdrawn?: boolean
    title: string
    meta: string
    status: string
    note?: string
  }
  busy: boolean
  onDecide: (
    id: string,
    decision: 'approved' | 'rejected',
    note: string,
  ) => Promise<void>
}) {
  const [note, setNote] = useState(item.note ?? '')
  const statusLabel =
    item.status === 'pending'
      ? '審査待ち'
      : item.status === 'rejected'
        ? '却下'
        : '承認済み'

  return (
    <li
      className={`overflow-hidden rounded-2xl border bg-card ${item.status === 'pending' ? 'border-primary/30' : 'border-border'}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 p-5 sm:p-6">
        <div className="flex min-w-0 items-start gap-4">
          {item.image && (
            <span className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:size-24">
              <Image
                src={propertyImage(item.image)}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </span>
          )}
          {!item.image && (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
              <Handshake className="size-6" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={item.status === 'pending' ? 'default' : 'muted'}>
                {statusLabel}
              </Badge>
              {item.withdrawn && <Badge>取り下げ中</Badge>}
            </div>
            <h3 className="font-display text-base font-bold text-foreground sm:text-lg">
              {item.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {item.meta}
            </p>
          </div>
        </div>
        <code className="max-w-full break-all text-xs text-muted-foreground">
          {item.id}
        </code>
      </div>
      <div className="flex flex-col gap-3 border-t border-border bg-muted/25 p-4 sm:flex-row sm:items-center sm:px-6">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <ClipboardCheck
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="sr-only">メモ</span>
          <input
            id={`note-${item.id}`}
            value={note}
            placeholder="審査メモ"
            onChange={(event) => setNote(event.target.value)}
            className="h-11 min-w-0 w-full bg-transparent text-sm text-foreground outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2 [&>button]:min-h-11 [&>button]:px-4">
          {item.status !== 'approved' && (
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => void onDecide(item.id, 'approved', note)}
            >
              <Check aria-hidden="true" />
              承認
            </Button>
          )}
          {item.status !== 'rejected' && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={() => void onDecide(item.id, 'rejected', note)}
            >
              <X aria-hidden="true" />
              却下
            </Button>
          )}
          {item.withdrawn !== undefined && (
            <ListingStatusButton
              listingId={item.id}
              withdrawn={item.withdrawn}
            />
          )}
        </div>
      </div>
    </li>
  )
}
