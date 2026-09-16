import 'server-only'

import {
  orderStatusLabels,
  threadKindLabels,
  threadStatusLabels,
  isThreadKind,
  type Listing,
  type PropertyRequest,
} from '@/lib/data'
import { leaseStatusLabels } from '@/lib/lease'
import { configuredAccounts, type AuthenticatedUser } from './auth/accounts'
import { listDealEvents } from './deal-events'
import {
  getStore,
  type DealKind,
  type Order,
  type Lease,
  type Submission,
} from './store'

export type DealSummary = {
  kind: DealKind
  id: string
  title: string
  href: string
  amount: number
  status: string
  statusLabel: string
  /** The viewer's side of the deal. */
  role: string
  counterpart: string
  updatedAt: string
}

type DealEventView = {
  id: string
  statusLabel: string
  actorName?: string
  note?: string
  createdAt: string
}

export type DealView = {
  summary: DealSummary
  events: DealEventView[]
  relatedThreads: { id: string; label: string; statusLabel: string }[]
  relatedDeals: {
    kind: DealKind
    id: string
    title: string
    statusLabel: string
  }[]
}

export type DealResult<T> =
  { ok: true; value: T } | { ok: false; reason: 'not_found' | 'forbidden' }

const jobStatusLabels: Record<string, string> = {
  approved: '承認',
  rejected: '却下',
}

function statusLabel(kind: DealKind, status: string): string {
  if (kind === 'order')
    return orderStatusLabels[status as keyof typeof orderStatusLabels] ?? status
  if (kind === 'lease')
    return leaseStatusLabels[status as keyof typeof leaseStatusLabels] ?? status
  return jobStatusLabels[status] ?? status
}

function accountName(userId: string | undefined): string {
  if (!userId) return '未定'
  return (
    configuredAccounts().find((account) => account.id === userId)?.name ??
    userId
  )
}

async function agreedAgentOf(requestId: string): Promise<string | undefined> {
  const submissions = await getStore().submissions.list()
  return submissions.find(
    (submission) =>
      submission.kind === 'requestProposal' &&
      submission.targetId === requestId &&
      submission.status === 'agreed',
  )?.userId
}

type Loaded =
  | {
      kind: 'order'
      order: Order
      listing?: Listing
      parties: [string, string]
    }
  | {
      kind: 'lease'
      lease: Lease
      listing?: Listing
      parties: [string, string | undefined]
    }
  | {
      kind: 'propertyRequest'
      request: PropertyRequest
      parties: [string | undefined, string | undefined]
    }

async function load(kind: DealKind, id: string): Promise<Loaded | undefined> {
  const store = getStore()
  if (kind === 'order') {
    const order = await store.orders.get(id)
    if (!order) return undefined
    const listing = await store.listings.get(order.listingId)
    return {
      kind,
      order,
      listing,
      parties: [order.buyerUserId, order.sellerUserId],
    }
  }
  if (kind === 'lease') {
    const lease = await store.leases.get(id)
    if (!lease) return undefined
    const listing = await store.listings.get(lease.listingId)
    return {
      kind,
      lease,
      listing,
      parties: [lease.tenantUserId, listing?.ownerUserId],
    }
  }
  const request = await store.propertyRequests.get(id)
  if (!request) return undefined
  return {
    kind,
    request,
    parties: [request.ownerUserId, await agreedAgentOf(id)],
  }
}

function summarize(loaded: Loaded, viewerId: string): DealSummary {
  if (loaded.kind === 'order') {
    const { order, listing } = loaded
    const isBuyer = order.buyerUserId === viewerId
    return {
      kind: 'order',
      id: order.id,
      title: listing?.name ?? '削除された物件',
      href: `/listings/${order.listingId}`,
      amount: order.price,
      status: order.status,
      statusLabel: orderStatusLabels[order.status],
      role: isBuyer
        ? '買い手'
        : order.sellerUserId === viewerId
          ? '出品者'
          : '運営',
      counterpart: accountName(
        isBuyer ? order.sellerUserId : order.buyerUserId,
      ),
      updatedAt: order.updatedAt,
    }
  }
  if (loaded.kind === 'lease') {
    const { lease, listing } = loaded
    const isTenant = lease.tenantUserId === viewerId
    return {
      kind: 'lease',
      id: lease.id,
      title: listing?.name ?? '削除された物件',
      href: `/listings/${lease.listingId}`,
      amount: lease.purchasePrice ?? lease.rentTotal,
      status: lease.status,
      statusLabel: leaseStatusLabels[lease.status],
      role: isTenant
        ? '申込者'
        : listing?.ownerUserId === viewerId
          ? '所有者'
          : '運営',
      counterpart: accountName(
        isTenant ? listing?.ownerUserId : lease.tenantUserId,
      ),
      updatedAt: lease.updatedAt,
    }
  }
  const { request, parties } = loaded
  const isOwner = request.ownerUserId === viewerId
  return {
    kind: 'propertyRequest',
    id: request.id,
    title: request.title,
    href: `/requests/${request.id}`,
    amount: request.budget,
    status: request.status,
    statusLabel: request.status,
    role: isOwner ? '募集者' : parties[1] === viewerId ? '担当者' : '運営',
    counterpart: accountName(isOwner ? parties[1] : request.ownerUserId),
    updatedAt: request.updatedAt ?? request.createdAt ?? '',
  }
}

function threadInvolves(
  submission: Submission,
  targetId: string,
  parties: (string | undefined)[],
) {
  return (
    isThreadKind(submission.kind) &&
    submission.targetId === targetId &&
    submission.userId !== undefined &&
    parties.includes(submission.userId)
  )
}

export async function getDeal(
  kind: DealKind,
  id: string,
  user: AuthenticatedUser,
): Promise<DealResult<DealView>> {
  const loaded = await load(kind, id)
  if (!loaded) return { ok: false, reason: 'not_found' }
  const parties = loaded.parties as (string | undefined)[]
  if (!parties.includes(user.id) && user.role !== 'admin')
    return { ok: false, reason: 'forbidden' }
  const store = getStore()
  const targetId =
    loaded.kind === 'propertyRequest'
      ? loaded.request.id
      : loaded.kind === 'order'
        ? loaded.order.listingId
        : loaded.lease.listingId
  const [events, submissions, orders, leases] = await Promise.all([
    listDealEvents(kind, id),
    store.submissions.list(),
    store.orders.list(),
    store.leases.list(),
  ])
  const relatedThreads = submissions
    .filter((submission) => threadInvolves(submission, targetId, parties))
    .map((submission) => ({
      id: submission.id,
      label: isThreadKind(submission.kind)
        ? threadKindLabels[submission.kind]
        : 'やり取り',
      statusLabel: threadStatusLabels[submission.status ?? 'new'],
    }))
  const relatedDeals: DealView['relatedDeals'] = []
  if (loaded.kind === 'lease') {
    for (const order of orders.filter((order) => order.sourceLeaseId === id))
      relatedDeals.push({
        kind: 'order',
        id: order.id,
        title: loaded.listing?.name ?? '削除された物件',
        statusLabel: orderStatusLabels[order.status],
      })
  }
  if (loaded.kind === 'order' && loaded.order.sourceLeaseId) {
    const lease = leases.find(
      (lease) => lease.id === loaded.order.sourceLeaseId,
    )
    if (lease)
      relatedDeals.push({
        kind: 'lease',
        id: lease.id,
        title: loaded.listing?.name ?? '削除された物件',
        statusLabel: leaseStatusLabels[lease.status],
      })
  }
  return {
    ok: true,
    value: {
      summary: summarize(loaded, user.id),
      events: events.map((event) => ({
        id: event.id,
        statusLabel: statusLabel(kind, event.status),
        actorName: event.actorUserId
          ? accountName(event.actorUserId)
          : undefined,
        note: event.note,
        createdAt: event.createdAt,
      })),
      relatedThreads,
      relatedDeals,
    },
  }
}

/** Every order, lease, and request the user takes part in, newest change first. */
export async function listDealsForUser(userId: string): Promise<DealSummary[]> {
  const store = getStore()
  const [orders, leases, requests, listings, submissions] = await Promise.all([
    store.orders.list(),
    store.leases.list(),
    store.propertyRequests.list(),
    store.listings.list(),
    store.submissions.list(),
  ])
  const listingById = new Map(listings.map((listing) => [listing.id, listing]))
  const agentByJob = new Map(
    submissions
      .filter(
        (submission) =>
          submission.kind === 'requestProposal' &&
          submission.status === 'agreed',
      )
      .map((submission) => [submission.targetId, submission.userId]),
  )
  const deals: DealSummary[] = []
  for (const order of orders)
    if (order.buyerUserId === userId || order.sellerUserId === userId)
      deals.push(
        summarize(
          {
            kind: 'order',
            order,
            listing: listingById.get(order.listingId),
            parties: [order.buyerUserId, order.sellerUserId],
          },
          userId,
        ),
      )
  for (const lease of leases) {
    const listing = listingById.get(lease.listingId)
    if (lease.tenantUserId === userId || listing?.ownerUserId === userId)
      deals.push(
        summarize(
          {
            kind: 'lease',
            lease,
            listing,
            parties: [lease.tenantUserId, listing?.ownerUserId],
          },
          userId,
        ),
      )
  }
  for (const request of requests) {
    const agent = agentByJob.get(request.id)
    if (request.ownerUserId === userId || agent === userId)
      deals.push(
        summarize(
          {
            kind: 'propertyRequest',
            request,
            parties: [request.ownerUserId, agent],
          },
          userId,
        ),
      )
  }
  return deals.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
