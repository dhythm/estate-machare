import 'server-only'

import {
  isThreadKind,
  type Listing,
  type ThreadKind,
  type ThreadStatus,
} from '@/lib/data'
import { configuredAccounts, type UserRole } from './auth/accounts'
import { listRecentDealEvents } from './deal-events'
import type { DealKind } from './store'
import { orderStatusLabels } from '@/lib/data'
import { rentalStatusLabels } from '@/lib/rent-to-own'
import type { AccountStatus } from './store'
import type { RentalWithListing } from './rentals'
import { getStore, type Review, type Submission } from './store'

export type AdminCounts = {
  pendingListings: number
  requestedRentals: number
  activeRentals: number
  requestedOrders: number
  openThreads: number
}

export type ActivityItem = {
  id: string
  kind: DealKind
  dealId: string
  title: string
  statusLabel: string
  actorName?: string
  createdAt: string
  href: string
}

export type ThreadSummary = {
  id: string
  kind: ThreadKind
  targetId?: string
  targetName: string
  senderName: string
  status: ThreadStatus
  replyCount: number
  receivedAt: string
  payload: Record<string, unknown>
}

export type AccountSummary = {
  id: string
  name: string
  email: string
  role: UserRole
  listingCount: number
  rentalCount: number
  status: AccountStatus['status']
  note?: string
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function isPending(entity: { moderationStatus?: string }): boolean {
  return entity.moderationStatus === 'pending'
}

export async function getAdminCounts(): Promise<AdminCounts> {
  const store = getStore()
  const [listings, rentals, submissions, orders] = await Promise.all([
    store.listings.list(),
    store.rentals.list(),
    store.submissions.list(),
    store.orders.list(),
  ])
  return {
    pendingListings: listings.filter(isPending).length,
    requestedRentals: rentals.filter((rental) => rental.status === 'requested')
      .length,
    activeRentals: rentals.filter((rental) => rental.status === 'active')
      .length,
    requestedOrders: orders.filter((order) => order.status === 'requested')
      .length,
    openThreads: submissions.filter(
      (submission) =>
        isThreadKind(submission.kind) && (submission.status ?? 'new') === 'new',
    ).length,
  }
}

export async function listAllRentals(): Promise<RentalWithListing[]> {
  const store = getStore()
  const [rentals, listings] = await Promise.all([
    store.rentals.list(),
    store.listings.list(),
  ])
  const byId = new Map(listings.map((listing) => [listing.id, listing]))
  return rentals.map((rental) => ({
    rental,
    listing: byId.get(rental.listingId),
  }))
}

function targetNameOf(
  submission: Submission,
  listings: Map<string, Listing>,
): string {
  if (!submission.targetId) return '（対象なし）'
  const name = listings.get(submission.targetId)?.name
  return name ?? '（削除済み）'
}

export async function listThreadSummaries(
  kind: ThreadSummary['kind'],
): Promise<ThreadSummary[]> {
  const store = getStore()
  const [submissions, messages, listings] = await Promise.all([
    store.submissions.list(),
    store.messages.list(),
    store.listings.list(),
  ])
  const listingById = new Map(listings.map((listing) => [listing.id, listing]))
  const replyCounts = new Map<string, number>()
  for (const message of messages)
    replyCounts.set(
      message.threadId,
      (replyCounts.get(message.threadId) ?? 0) + 1,
    )
  return submissions
    .filter((submission) => submission.kind === kind)
    .map((submission) => ({
      id: submission.id,
      kind,
      targetId: submission.targetId,
      targetName: targetNameOf(submission, listingById),
      senderName: text(submission.payload.name),
      status: submission.status ?? 'new',
      replyCount: replyCounts.get(submission.id) ?? 0,
      receivedAt: submission.receivedAt,
      payload: submission.payload,
    }))
}

/** Accounts come from the environment; passwords never leave accounts.ts. */
export async function listAccountSummaries(): Promise<AccountSummary[]> {
  const store = getStore()
  const [listings, rentals, statuses] = await Promise.all([
    store.listings.list(),
    store.rentals.list(),
    store.accountStatuses.list(),
  ])
  const statusById = new Map(statuses.map((row) => [row.id, row]))
  return configuredAccounts().map(({ id, name, email, role }) => ({
    id,
    name,
    email,
    role,
    status: statusById.get(id)?.status ?? 'active',
    note: statusById.get(id)?.note,
    listingCount: listings.filter((listing) => listing.ownerUserId === id)
      .length,
    rentalCount: rentals.filter((rental) => rental.renterUserId === id).length,
  }))
}

export async function listAllReviews(): Promise<
  { review: Review; listingName: string }[]
> {
  const store = getStore()
  const [reviews, listings] = await Promise.all([
    store.reviews.list(),
    store.listings.list(),
  ])
  const nameById = new Map(
    listings.map((listing) => [listing.id, listing.name]),
  )
  return reviews.map((review) => ({
    review,
    listingName: nameById.get(review.listingId) ?? '（削除済み）',
  }))
}

function eventStatusLabel(kind: DealKind, status: string): string {
  if (kind === 'order')
    return orderStatusLabels[status as keyof typeof orderStatusLabels] ?? status
  if (kind === 'rental')
    return (
      rentalStatusLabels[status as keyof typeof rentalStatusLabels] ?? status
    )
  return status
}

/** The newest deal events with their target names and actors, for the dashboard. */
export async function listRecentActivity(
  limit: number,
): Promise<ActivityItem[]> {
  const store = getStore()
  const [events, orders, rentals, listings] = await Promise.all([
    listRecentDealEvents(limit),
    store.orders.list(),
    store.rentals.list(),
    store.listings.list(),
  ])
  const listingName = new Map(
    listings.map((listing) => [listing.id, listing.name]),
  )
  const orderListing = new Map(
    orders.map((order) => [order.id, order.listingId]),
  )
  const rentalListing = new Map(
    rentals.map((rental) => [rental.id, rental.listingId]),
  )
  const accountName = new Map(
    configuredAccounts().map((account) => [account.id, account.name]),
  )
  return events.map((event) => {
    const title = listingName.get(
      (event.dealKind === 'order' ? orderListing : rentalListing).get(
        event.dealId,
      ) ?? '',
    )
    return {
      id: event.id,
      kind: event.dealKind,
      dealId: event.dealId,
      title: title ?? '（削除済み）',
      statusLabel: eventStatusLabel(event.dealKind, event.status),
      actorName: event.actorUserId
        ? (accountName.get(event.actorUserId) ?? event.actorUserId)
        : undefined,
      createdAt: event.createdAt,
      href: `/account/deals/${event.dealKind}/${event.dealId}`,
    }
  })
}

export async function listRecentReviews(limit: number) {
  return (await listAllReviews()).slice(0, limit)
}
