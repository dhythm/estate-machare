import 'server-only'

import type { Listing } from '@/lib/data'
import {
  listRentalsForOwner,
  listRentalsForRenter,
  type RentalWithListing,
} from './rentals'
import { getStore, type Review, type Submission } from './store'
import { unreadThreadIds } from './thread-reads'
import { listDealsForUser, type DealSummary } from './deals'
import {
  listOrdersForBuyer,
  listOrdersForSeller,
  type OrderWithListing,
} from './orders'

export type AccountOverview = {
  listings: { listing: Listing; inquiries: Submission[] }[]
  sentInquiries: { submission: Submission; listing?: Listing }[]
  /** Number of replies per thread id, for threads that have any. */
  replyCounts: Record<string, number>
  rentals: { asRenter: RentalWithListing[]; asOwner: RentalWithListing[] }
  /** Reviews the user wrote, keyed by `kind:sourceId`. */
  reviewedSources: Record<string, Review>
  unreadThreadIds: string[]
  orders: { asBuyer: OrderWithListing[]; asSeller: OrderWithListing[] }
  /** Every order and rental the user is part of, newest change first. */
  deals: DealSummary[]
  summary: {
    unreadThreads: number
    /** Threads on the user's own listings still marked new. */
    openInquiries: number
    /** Rental requests waiting for the user's approval. */
    requestedRentals: number
    /** Purchase requests waiting for the user's acceptance. */
    requestedOrders: number
    pendingListings: number
  }
}

/**
 * The store lists newest first; reverse before the stable sort so rows that
 * share a timestamp keep their insertion order.
 */
function oldestFirst(submissions: Submission[]): Submission[] {
  return [...submissions]
    .reverse()
    .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt))
}

/** Everything the user owns or sent, with what other people sent in return. */
export async function getAccountOverview(
  userId: string,
): Promise<AccountOverview> {
  const store = getStore()
  const [
    listings,
    submissions,
    messages,
    asRenter,
    asOwner,
    reviews,
    unread,
    asBuyer,
    asSeller,
    deals,
  ] = await Promise.all([
    store.listings.list(),
    store.submissions.list(),
    store.messages.list(),
    listRentalsForRenter(userId),
    listRentalsForOwner(userId),
    store.reviews.list(),
    unreadThreadIds(userId),
    listOrdersForBuyer(userId),
    listOrdersForSeller(userId),
    listDealsForUser(userId),
  ])
  const reviewedSources: Record<string, Review> = {}
  for (const review of reviews)
    if (review.reviewerUserId === userId)
      reviewedSources[`${review.sourceKind}:${review.sourceId}`] = review
  const listingById = new Map(listings.map((listing) => [listing.id, listing]))
  const sent = submissions.filter(
    (submission) =>
      submission.userId === userId && submission.kind === 'listingInquiry',
  )
  const involved = new Set<string>()

  const ownedListings = listings
    .filter((listing) => listing.ownerUserId === userId)
    .map((listing) => ({
      listing,
      inquiries: oldestFirst(
        submissions.filter(
          (submission) =>
            submission.kind === 'listingInquiry' &&
            submission.targetId === listing.id,
        ),
      ),
    }))
  for (const { inquiries } of ownedListings)
    for (const inquiry of inquiries) involved.add(inquiry.id)
  for (const submission of sent) involved.add(submission.id)

  const replyCounts: Record<string, number> = {}
  for (const message of messages) {
    if (!involved.has(message.threadId)) continue
    replyCounts[message.threadId] = (replyCounts[message.threadId] ?? 0) + 1
  }

  const incoming = [...ownedListings.flatMap((item) => item.inquiries)]

  return {
    replyCounts,
    rentals: { asRenter, asOwner },
    reviewedSources,
    unreadThreadIds: unread,
    orders: { asBuyer, asSeller },
    deals,
    summary: {
      unreadThreads: unread.length,
      openInquiries: incoming.filter(
        (submission) => (submission.status ?? 'new') === 'new',
      ).length,
      requestedRentals: asOwner.filter(
        (item) => item.rental.status === 'requested',
      ).length,
      requestedOrders: asSeller.filter(
        (item) => item.order.status === 'requested',
      ).length,
      pendingListings: ownedListings.filter(
        (item) => item.listing.moderationStatus === 'pending',
      ).length,
    },
    listings: ownedListings,
    sentInquiries: sent
      .filter((submission) => submission.kind === 'listingInquiry')
      .map((submission) => ({
        submission,
        listing: submission.targetId
          ? listingById.get(submission.targetId)
          : undefined,
      })),
  }
}
