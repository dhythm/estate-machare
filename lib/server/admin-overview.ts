import 'server-only'

import {
  isThreadKind,
  type Listing,
  type ThreadKind,
  type ThreadStatus,
  type PropertyRequest,
} from '@/lib/data'
import { configuredAccounts, type UserRole } from './auth/accounts'
import { listRecentDealEvents } from './deal-events'
import type { DealKind } from './store'
import { orderStatusLabels } from '@/lib/data'
import { leaseStatusLabels } from '@/lib/lease'
import type { AccountStatus } from './store'
import type { LeaseWithListing } from './leases'
import {
  getStore,
  type AgentProfile,
  type Review,
  type Submission,
} from './store'

export type AdminCounts = {
  pendingListings: number
  pendingPropertyRequests: number
  requestedLeases: number
  activeLeases: number
  requestedOrders: number
  introducingRequests: number
  openThreads: number
  agents: number
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
  propertyRequestCount: number
  leaseCount: number
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
  const [listings, requests, leases, submissions, agents, orders] =
    await Promise.all([
      store.listings.list(),
      store.propertyRequests.list(),
      store.leases.list(),
      store.submissions.list(),
      store.agentProfiles.list(),
      store.orders.list(),
    ])
  return {
    pendingListings: listings.filter(isPending).length,
    pendingPropertyRequests: requests.filter(isPending).length,
    requestedLeases: leases.filter((lease) => lease.status === 'requested')
      .length,
    activeLeases: leases.filter((lease) => lease.status === 'active').length,
    requestedOrders: orders.filter((order) => order.status === 'requested')
      .length,
    introducingRequests: requests.filter(
      (request) => request.status === '紹介中',
    ).length,
    openThreads: submissions.filter(
      (submission) =>
        isThreadKind(submission.kind) && (submission.status ?? 'new') === 'new',
    ).length,
    agents: agents.length,
  }
}

export async function listAllLeases(): Promise<LeaseWithListing[]> {
  const store = getStore()
  const [leases, listings] = await Promise.all([
    store.leases.list(),
    store.listings.list(),
  ])
  const byId = new Map(listings.map((listing) => [listing.id, listing]))
  return leases.map((lease) => ({
    lease,
    listing: byId.get(lease.listingId),
  }))
}

function targetNameOf(
  submission: Submission,
  listings: Map<string, Listing>,
  requests: Map<string, PropertyRequest>,
): string {
  if (!submission.targetId) return '（対象なし）'
  const name =
    submission.kind === 'listingInquiry'
      ? listings.get(submission.targetId)?.name
      : requests.get(submission.targetId)?.title
  return name ?? '（削除済み）'
}

export async function listThreadSummaries(
  kind: ThreadSummary['kind'],
): Promise<ThreadSummary[]> {
  const store = getStore()
  const [submissions, messages, listings, requests] = await Promise.all([
    store.submissions.list(),
    store.messages.list(),
    store.listings.list(),
    store.propertyRequests.list(),
  ])
  const listingById = new Map(listings.map((listing) => [listing.id, listing]))
  const jobById = new Map(requests.map((request) => [request.id, request]))
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
      targetName: targetNameOf(submission, listingById, jobById),
      senderName: text(submission.payload.name),
      status: submission.status ?? 'new',
      replyCount: replyCounts.get(submission.id) ?? 0,
      receivedAt: submission.receivedAt,
      payload: submission.payload,
    }))
}

export function listTransportApplications(): Promise<ThreadSummary[]> {
  return listThreadSummaries('requestProposal')
}

export function listAgents(): Promise<AgentProfile[]> {
  return getStore().agentProfiles.list()
}

/** Accounts come from the environment; passwords never leave accounts.ts. */
export async function listAccountSummaries(): Promise<AccountSummary[]> {
  const store = getStore()
  const [listings, requests, leases, statuses] = await Promise.all([
    store.listings.list(),
    store.propertyRequests.list(),
    store.leases.list(),
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
    propertyRequestCount: requests.filter(
      (request) => request.ownerUserId === id,
    ).length,
    leaseCount: leases.filter((lease) => lease.tenantUserId === id).length,
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

const jobEventLabels: Record<string, string> = {
  approved: '承認',
  rejected: '却下',
}

function eventStatusLabel(kind: DealKind, status: string): string {
  if (kind === 'order')
    return orderStatusLabels[status as keyof typeof orderStatusLabels] ?? status
  if (kind === 'lease')
    return leaseStatusLabels[status as keyof typeof leaseStatusLabels] ?? status
  return jobEventLabels[status] ?? status
}

/** The newest deal events with their target names and actors, for the dashboard. */
export async function listRecentActivity(
  limit: number,
): Promise<ActivityItem[]> {
  const store = getStore()
  const [events, orders, leases, requests, listings] = await Promise.all([
    listRecentDealEvents(limit),
    store.orders.list(),
    store.leases.list(),
    store.propertyRequests.list(),
    store.listings.list(),
  ])
  const listingName = new Map(
    listings.map((listing) => [listing.id, listing.name]),
  )
  const orderListing = new Map(
    orders.map((order) => [order.id, order.listingId]),
  )
  const leaseListing = new Map(
    leases.map((lease) => [lease.id, lease.listingId]),
  )
  const requestTitle = new Map(
    requests.map((request) => [request.id, request.title]),
  )
  const accountName = new Map(
    configuredAccounts().map((account) => [account.id, account.name]),
  )
  return events.map((event) => {
    const title =
      event.dealKind === 'propertyRequest'
        ? requestTitle.get(event.dealId)
        : listingName.get(
            (event.dealKind === 'order' ? orderListing : leaseListing).get(
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
