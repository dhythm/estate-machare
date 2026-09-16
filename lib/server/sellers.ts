import 'server-only'

import { isApproved, type Listing } from '@/lib/data'
import { configuredAccounts } from './auth/accounts'
import { getStore, type Review } from './store'

export type SellerProfile = {
  id: string
  name: string
  /** Average of the received reviews, one decimal; unset before the first. */
  rating?: number
  reviewCount: number
  /** Live listings, newest first. */
  listings: Listing[]
  /** Newest first, as the store lists them. */
  reviews: Review[]
}

function byNewest(a: Listing, b: Listing): number {
  return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
}

/** A signed-in owner's live listings, for offering one in a proposal. */
export async function listListingsForOwner(
  userId: string,
): Promise<{ id: string; name: string }[]> {
  const listings = await getStore().listings.list()
  return listings
    .filter((listing) => listing.ownerUserId === userId && isApproved(listing))
    .sort(byNewest)
    .map((listing) => ({ id: listing.id, name: listing.name }))
}

export async function getSellerProfile(
  userId: string,
): Promise<SellerProfile | undefined> {
  const account = configuredAccounts().find((entry) => entry.id === userId)
  if (!account) return undefined
  const store = getStore()
  const [listings, reviews] = await Promise.all([
    store.listings.list(),
    store.reviews.list(),
  ])
  const owned = listings.filter((listing) => listing.ownerUserId === userId)
  const received = reviews.filter((review) => review.sellerUserId === userId)
  if (owned.length === 0 && received.length === 0) return undefined
  const total = received.reduce((sum, review) => sum + review.rating, 0)
  return {
    id: userId,
    name: account.name,
    rating:
      received.length > 0
        ? Math.round((total / received.length) * 10) / 10
        : undefined,
    reviewCount: received.length,
    listings: owned.filter(isApproved).sort(byNewest),
    reviews: received,
  }
}
