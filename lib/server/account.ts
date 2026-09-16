import 'server-only'

import type { Listing, PropertyRequest } from '@/lib/data'
import {
  listLeasesForOwner,
  listLeasesForTenant,
  type LeaseWithListing,
} from './leases'
import { getStore, type Review, type Submission } from './store'
import { unreadThreadIds } from './thread-reads'
import { getAgentProfile, matchRequestsForAgent } from './agents'
import { listDealsForUser, type DealSummary } from './deals'
import {
  listOrdersForBuyer,
  listOrdersForSeller,
  type OrderWithListing,
} from './orders'
import type { AgentProfile } from './store'

export type AccountOverview = {
  listings: { listing: Listing; inquiries: Submission[] }[]
  propertyRequests: {
    request: PropertyRequest
    applications: Submission[]
    inquiries: Submission[]
  }[]
  sentInquiries: { submission: Submission; listing?: Listing }[]
  sentApplications: { submission: Submission; request?: PropertyRequest }[]
  /** Questions the user asked on other people's requests. */
  sentJobInquiries: { submission: Submission; request?: PropertyRequest }[]
  /** Number of replies per thread id, for threads that have any. */
  replyCounts: Record<string, number>
  leases: { asTenant: LeaseWithListing[]; asOwner: LeaseWithListing[] }
  /** Reviews the user wrote, keyed by `kind:sourceId`. */
  reviewedSources: Record<string, Review>
  unreadThreadIds: string[]
  /** Present once the user has registered as a agent. */
  agent?: { profile: AgentProfile; matchingRequests: PropertyRequest[] }
  orders: { asBuyer: OrderWithListing[]; asSeller: OrderWithListing[] }
  /** Every order, lease, and request the user is part of, newest change first. */
  deals: DealSummary[]
  summary: {
    unreadThreads: number
    /** Threads on the user's own listings and requests still marked new. */
    openInquiries: number
    /** Lease requests waiting for the user's approval. */
    requestedLeases: number
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
    requests,
    submissions,
    messages,
    asTenant,
    asOwner,
    reviews,
    unread,
    agentProfile,
    asBuyer,
    asSeller,
    deals,
  ] = await Promise.all([
    store.listings.list(),
    store.propertyRequests.list(),
    store.submissions.list(),
    store.messages.list(),
    listLeasesForTenant(userId),
    listLeasesForOwner(userId),
    store.reviews.list(),
    unreadThreadIds(userId),
    getAgentProfile(userId),
    listOrdersForBuyer(userId),
    listOrdersForSeller(userId),
    listDealsForUser(userId),
  ])
  const agent = agentProfile
    ? {
        profile: agentProfile,
        matchingRequests: await matchRequestsForAgent(agentProfile),
      }
    : undefined
  const reviewedSources: Record<string, Review> = {}
  for (const review of reviews)
    if (review.reviewerUserId === userId)
      reviewedSources[`${review.sourceKind}:${review.sourceId}`] = review
  const listingById = new Map(listings.map((listing) => [listing.id, listing]))
  const jobById = new Map(requests.map((request) => [request.id, request]))
  const sent = submissions.filter((submission) => submission.userId === userId)
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
  const ownedRequests = requests
    .filter((request) => request.ownerUserId === userId)
    .map((request) => ({
      request,
      applications: oldestFirst(
        submissions.filter(
          (submission) =>
            submission.kind === 'requestProposal' &&
            submission.targetId === request.id,
        ),
      ),
      inquiries: oldestFirst(
        submissions.filter(
          (submission) =>
            submission.kind === 'requestInquiry' &&
            submission.targetId === request.id,
        ),
      ),
    }))
  for (const { inquiries } of ownedListings)
    for (const inquiry of inquiries) involved.add(inquiry.id)
  for (const { applications, inquiries } of ownedRequests) {
    for (const application of applications) involved.add(application.id)
    for (const inquiry of inquiries) involved.add(inquiry.id)
  }
  for (const submission of sent) involved.add(submission.id)

  const replyCounts: Record<string, number> = {}
  for (const message of messages) {
    if (!involved.has(message.threadId)) continue
    replyCounts[message.threadId] = (replyCounts[message.threadId] ?? 0) + 1
  }

  const incoming = [
    ...ownedListings.flatMap((item) => item.inquiries),
    ...ownedRequests.flatMap((item) => [...item.applications, ...item.inquiries]),
  ]

  return {
    replyCounts,
    leases: { asTenant, asOwner },
    reviewedSources,
    unreadThreadIds: unread,
    agent,
    orders: { asBuyer, asSeller },
    deals,
    summary: {
      unreadThreads: unread.length,
      openInquiries: incoming.filter(
        (submission) => (submission.status ?? 'new') === 'new',
      ).length,
      requestedLeases: asOwner.filter(
        (item) => item.lease.status === 'requested',
      ).length,
      requestedOrders: asSeller.filter(
        (item) => item.order.status === 'requested',
      ).length,
      pendingListings: ownedListings.filter(
        (item) => item.listing.moderationStatus === 'pending',
      ).length,
    },
    listings: ownedListings,
    propertyRequests: ownedRequests,
    sentInquiries: sent
      .filter((submission) => submission.kind === 'listingInquiry')
      .map((submission) => ({
        submission,
        listing: submission.targetId
          ? listingById.get(submission.targetId)
          : undefined,
      })),
    sentApplications: sent
      .filter((submission) => submission.kind === 'requestProposal')
      .map((submission) => ({
        submission,
        request: submission.targetId ? jobById.get(submission.targetId) : undefined,
      })),
    sentJobInquiries: sent
      .filter((submission) => submission.kind === 'requestInquiry')
      .map((submission) => ({
        submission,
        request: submission.targetId ? jobById.get(submission.targetId) : undefined,
      })),
  }
}
