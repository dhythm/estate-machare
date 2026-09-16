import type { Metadata } from 'next'
import { PageShell } from '@/components/page-shell'
import { ListingBrowser } from '@/components/listing-browser'
import { listingPageSize } from '@/lib/data'
import { parseListingSearchParams } from '@/lib/listing-search-params'
import { paginateListings } from '@/lib/server/listings'

export const metadata: Metadata = {
  title: '物件を探す | Estate Machare',
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const state = parseListingSearchParams(await searchParams)
  const initialPage = await paginateListings(state.filter, {
    page: state.page,
    pageSize: listingPageSize,
  })

  return (
    <PageShell>
      <ListingBrowser initialState={state} initialPage={initialPage} />
    </PageShell>
  )
}
