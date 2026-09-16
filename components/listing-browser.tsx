'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Search, ArrowUpRight, SlidersHorizontal } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { listingPageSize, type ListingPage } from '@/lib/data'
import { listingQueryOptions } from '@/lib/queries/listings'
import {
  buildListingSearchParams,
  parseListingSearchParams,
  type ListingSearchState,
} from '@/lib/listing-search-params'
import {
  CategoryChips,
  DealFilterToggle,
  SearchRefinements,
} from '@/components/listing-filters'
import { ListingResults } from '@/components/listing-results'
import { Pagination } from '@/components/pagination'

function sameState(a: ListingSearchState, b: ListingSearchState): boolean {
  return (
    a.page === b.page &&
    buildListingSearchParams(a.filter, 1) ===
      buildListingSearchParams(b.filter, 1)
  )
}

export function ListingBrowser({
  initialState,
  initialPage,
}: {
  initialState: ListingSearchState
  initialPage: ListingPage
}) {
  const [state, setState] = useState(initialState)
  const [keywordInput, setKeywordInput] = useState(initialState.filter.keyword)

  const navigate = useCallback((next: ListingSearchState) => {
    setState(next)
    const search = buildListingSearchParams(next.filter, next.page)
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${search ? `?${search}` : ''}`,
    )
  }, [])

  useEffect(() => {
    const sync = () => {
      const next = parseListingSearchParams(
        new URLSearchParams(window.location.search),
      )
      setState(next)
      setKeywordInput(next.filter.keyword)
    }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const query = useQuery({
    ...listingQueryOptions(state.filter, {
      page: state.page,
      pageSize: listingPageSize,
    }),
    initialData: sameState(state, initialState) ? initialPage : undefined,
    placeholderData: (previous) => previous,
  })

  const update = (patch: Partial<ListingSearchState['filter']>) =>
    navigate({ filter: { ...state.filter, ...patch }, page: 1 })

  const submitKeyword = (event: FormEvent) => {
    event.preventDefault()
    update({ keyword: keywordInput.trim() })
  }

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow mb-3">THE MARKETPLACE</p>
          <h1 className="text-balance font-display text-3xl font-bold sm:text-4xl tracking-tight text-foreground">
            物件を探す
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            エリアと条件から、あなたの暮らしに合う物件を。
          </p>
        </div>
        <Link
          href="/listings/new"
          className="inline-flex items-center gap-2 text-xs font-bold text-primary"
        >
          物件を掲載する
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <form
            role="search"
            onSubmit={submitKeyword}
            className="flex w-full max-w-xl gap-2"
          >
            <label className="relative flex-1">
              <span className="sr-only">キーワード</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                name="q"
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder="物件名・駅名・間取り・地域"
                className="h-12 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </label>
            <button
              type="submit"
              className="h-12 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground"
            >
              検索
            </button>
          </form>

          <DealFilterToggle
            value={state.filter.deal}
            onChange={(deal) => update({ deal })}
          />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-5">
          <SlidersHorizontal className="hidden size-4 text-muted-foreground sm:block" />
          <CategoryChips
            value={state.filter.category}
            onChange={(category) => update({ category })}
          />
        </div>
        <div className="mt-5 border-t border-border pt-5">
          <SearchRefinements
            key={buildListingSearchParams(state.filter, 1)}
            value={state.filter}
            onChange={(patch) => update(patch)}
          />
        </div>
      </div>

      {query.data && (
        <p className="mt-8 border-b border-border pb-4 text-sm font-medium text-muted-foreground">
          {query.data.total}件
          {state.filter.keyword ? `（「${state.filter.keyword}」で検索）` : ''}
        </p>
      )}

      <ListingResults query={query} />

      {query.data && (
        <Pagination
          page={state.page}
          pageCount={query.data.pageCount}
          onChange={(page) => {
            navigate({ ...state, page })
            window.scrollTo({ top: 0 })
          }}
        />
      )}
    </div>
  )
}
