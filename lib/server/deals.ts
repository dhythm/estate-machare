import 'server-only'

import {
  orderStatusLabels,
  threadKindLabels,
  threadStatusLabels,
  isThreadKind,
  type Listing,
} from '@/lib/data'
import { rentalStatusLabels } from '@/lib/rent-to-own'
import { configuredAccounts, type AuthenticatedUser } from './auth/accounts'
import { listDealEvents } from './deal-events'
import {
  getStore,
  type DealKind,
  type Order,
  type Rental,
  type Submission,
} from './store'

export type DealSummary = {
  kind: Extract<DealKind, 'order' | 'rental'>
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
    kind: Extract<DealKind, 'order' | 'rental'>
    id: string
    title: string
    statusLabel: string
  }[]
}

export type DealResult<T> =
  { ok: true; value: T } | { ok: false; reason: 'not_found' | 'forbidden' }

function statusLabel(kind: DealKind, status: string): string {
  if (kind === 'order')
    return orderStatusLabels[status as keyof typeof orderStatusLabels] ?? status
  if (kind === 'rental')
    return (
      rentalStatusLabels[status as keyof typeof rentalStatusLabels] ?? status
    )
  return status
}

function accountName(userId: string | undefined): string {
  if (!userId) return '未定'
  return (
    configuredAccounts().find((account) => account.id === userId)?.name ??
    userId
  )
}

type Loaded =
  | {
      kind: 'order'
      order: Order
      listing?: Listing
      parties: [string, string]
    }
  | {
      kind: 'rental'
      rental: Rental
      listing?: Listing
      parties: [string, string | undefined]
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
  if (kind === 'rental') {
    const rental = await store.rentals.get(id)
    if (!rental) return undefined
    const listing = await store.listings.get(rental.listingId)
    return {
      kind,
      rental,
      listing,
      parties: [rental.renterUserId, listing?.ownerUserId],
    }
  }
  return undefined
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
          ? '掲載者'
          : '運営',
      counterpart: accountName(
        isBuyer ? order.sellerUserId : order.buyerUserId,
      ),
      updatedAt: order.updatedAt,
    }
  }
  const { rental, listing } = loaded
  const isRenter = rental.renterUserId === viewerId
  return {
    kind: 'rental',
    id: rental.id,
    title: listing?.name ?? '削除された物件',
    href: `/listings/${rental.listingId}`,
    amount: rental.purchasePrice ?? rental.rentTotal,
    status: rental.status,
    statusLabel: rentalStatusLabels[rental.status],
    role: isRenter
      ? '申込者'
      : listing?.ownerUserId === viewerId
        ? '所有者'
        : '運営',
    counterpart: accountName(
      isRenter ? listing?.ownerUserId : rental.renterUserId,
    ),
    updatedAt: rental.updatedAt,
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
    loaded.kind === 'order' ? loaded.order.listingId : loaded.rental.listingId
  const [events, submissions, orders, rentals] = await Promise.all([
    listDealEvents(kind, id),
    store.submissions.list(),
    store.orders.list(),
    store.rentals.list(),
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
  if (loaded.kind === 'rental') {
    for (const order of orders.filter((order) => order.sourceRentalId === id))
      relatedDeals.push({
        kind: 'order',
        id: order.id,
        title: loaded.listing?.name ?? '削除された物件',
        statusLabel: orderStatusLabels[order.status],
      })
  }
  if (loaded.kind === 'order' && loaded.order.sourceRentalId) {
    const rental = rentals.find(
      (rental) => rental.id === loaded.order.sourceRentalId,
    )
    if (rental)
      relatedDeals.push({
        kind: 'rental',
        id: rental.id,
        title: loaded.listing?.name ?? '削除された物件',
        statusLabel: rentalStatusLabels[rental.status],
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

/** Every order and rental the user takes part in, newest change first. */
export async function listDealsForUser(userId: string): Promise<DealSummary[]> {
  const store = getStore()
  const [orders, rentals, listings] = await Promise.all([
    store.orders.list(),
    store.rentals.list(),
    store.listings.list(),
  ])
  const listingById = new Map(listings.map((listing) => [listing.id, listing]))
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
  for (const rental of rentals) {
    const listing = listingById.get(rental.listingId)
    if (rental.renterUserId === userId || listing?.ownerUserId === userId)
      deals.push(
        summarize(
          {
            kind: 'rental',
            rental,
            listing,
            parties: [rental.renterUserId, listing?.ownerUserId],
          },
          userId,
        ),
      )
  }
  return deals.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
