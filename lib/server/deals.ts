import 'server-only'

import {
  orderStatusLabels,
  threadKindLabels,
  threadStatusLabels,
  isThreadKind,
  type Listing,
  type TransportJob,
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
  if (kind === 'rental')
    return (
      rentalStatusLabels[status as keyof typeof rentalStatusLabels] ?? status
    )
  return jobStatusLabels[status] ?? status
}

function accountName(userId: string | undefined): string {
  if (!userId) return '未定'
  return (
    configuredAccounts().find((account) => account.id === userId)?.name ??
    userId
  )
}

async function agreedCarrierOf(jobId: string): Promise<string | undefined> {
  const submissions = await getStore().submissions.list()
  return submissions.find(
    (submission) =>
      submission.kind === 'transportApplication' &&
      submission.targetId === jobId &&
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
      kind: 'rental'
      rental: Rental
      listing?: Listing
      parties: [string, string | undefined]
    }
  | {
      kind: 'transportJob'
      job: TransportJob
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
  const job = await store.transportJobs.get(id)
  if (!job) return undefined
  return { kind, job, parties: [job.ownerUserId, await agreedCarrierOf(id)] }
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
  if (loaded.kind === 'rental') {
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
  const { job, parties } = loaded
  const isOwner = job.ownerUserId === viewerId
  return {
    kind: 'transportJob',
    id: job.id,
    title: job.item,
    href: `/transport/${job.id}`,
    amount: job.reward,
    status: job.status,
    statusLabel: job.status,
    role: isOwner
      ? '依頼者'
      : parties[1] === viewerId
        ? '引越しパートナー'
        : '運営',
    counterpart: accountName(isOwner ? parties[1] : job.ownerUserId),
    updatedAt: job.updatedAt ?? job.createdAt ?? '',
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
    loaded.kind === 'transportJob'
      ? loaded.job.id
      : loaded.kind === 'order'
        ? loaded.order.listingId
        : loaded.rental.listingId
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

/** Every order, rental, and job the user takes part in, newest change first. */
export async function listDealsForUser(userId: string): Promise<DealSummary[]> {
  const store = getStore()
  const [orders, rentals, jobs, listings, submissions] = await Promise.all([
    store.orders.list(),
    store.rentals.list(),
    store.transportJobs.list(),
    store.listings.list(),
    store.submissions.list(),
  ])
  const listingById = new Map(listings.map((listing) => [listing.id, listing]))
  const carrierByJob = new Map(
    submissions
      .filter(
        (submission) =>
          submission.kind === 'transportApplication' &&
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
  for (const job of jobs) {
    const carrier = carrierByJob.get(job.id)
    if (job.ownerUserId === userId || carrier === userId)
      deals.push(
        summarize(
          { kind: 'transportJob', job, parties: [job.ownerUserId, carrier] },
          userId,
        ),
      )
  }
  return deals.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
