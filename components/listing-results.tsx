'use client'

import type { UseQueryResult } from '@tanstack/react-query'
import type { ListingPage } from '@/lib/data'
import { ListingCard } from '@/components/listing-card'

export function ListingResults({
  query,
}: {
  query: UseQueryResult<ListingPage>
}) {
  if (query.isPending) {
    return (
      <p role="status" className="mt-8 text-muted-foreground">
        読み込み中…
      </p>
    )
  }
  if (query.isError) {
    return (
      <div
        role="alert"
        className="mt-8 rounded-2xl border border-border bg-card p-6"
      >
        <p>物件を取得できませんでした。</p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="mt-3 font-medium text-primary"
        >
          再試行
        </button>
      </div>
    )
  }
  if (query.data.items.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
        条件に合う物件が見つかりませんでした。フィルターを変えてお試しください。
      </div>
    )
  }
  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {query.data.items.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
