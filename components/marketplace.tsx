'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  featuredListingCount,
  type DealFilter,
  type ListingPage,
} from '@/lib/data'
import { listingQueryOptions } from '@/lib/queries/listings'
import { buildListingSearchParams } from '@/lib/listing-search-params'
import { CategoryChips, DealFilterToggle } from '@/components/listing-filters'
import { ListingResults } from '@/components/listing-results'

export function Marketplace({ initialPage }: { initialPage: ListingPage }) {
  const [category, setCategory] = useState<string>('すべて')
  const [deal, setDeal] = useState<DealFilter>('all')
  const filter = { category, deal, keyword: '' }

  const query = useQuery({
    ...listingQueryOptions(filter, { page: 1, pageSize: featuredListingCount }),
    initialData:
      category === 'すべて' && deal === 'all' ? initialPage : undefined,
  })
  const search = buildListingSearchParams(filter, 1)
  const allHref = search ? `/listings?${search}` : '/listings'

  return (
    <section
      id="marketplace"
      className="mx-auto max-w-[1280px] scroll-mt-32 px-5 py-10 sm:px-8 sm:py-14"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-3">THE MARKETPLACE</p>
          <h2 className="text-balance font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            次の住まいを、見つけよう。
          </h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            暮らしに合う一件を、あなたに合う持ち方で。
          </p>
        </div>
        <DealFilterToggle value={deal} onChange={setDeal} />
      </div>

      <div className="mt-6">
        <CategoryChips value={category} onChange={setCategory} />
      </div>

      <ListingResults query={query} />

      <div className="mt-8 flex justify-center">
        <Link
          href={allHref}
          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-transparent px-7 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          すべての物件を見る
          {query.data ? `（${query.data.total}件）` : ''}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}
