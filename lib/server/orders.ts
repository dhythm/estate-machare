import 'server-only'

import { randomUUID } from 'node:crypto'
import {
  isApproved,
  orderStatusLabels,
  type Listing,
  type OrderStatus,
} from '@/lib/data'
import type { OrderRequestInput } from '@/lib/validation/order'
import type { AuthenticatedUser } from './auth/accounts'
import { recordDealEvent } from './deal-events'
import { notify } from './notifications'
import { getStore, type Order } from './store'

export type OrderResult<T> =
  | { ok: true; value: T }
  | {
      ok: false
      reason:
        'not_found' | 'forbidden' | 'conflict' | 'unavailable' | 'transition'
    }

export type OrderWithListing = { order: Order; listing?: Listing }

const fail = (reason: Extract<OrderResult<never>, { ok: false }>['reason']) =>
  ({ ok: false, reason }) as const

/** Orders that still hold the listing for one buyer. */
function isOpen(order: Order): boolean {
  return (
    order.status === 'requested' ||
    order.status === 'accepted' ||
    order.status === 'delivered'
  )
}

export async function requestOrder(
  listing: Listing,
  user: AuthenticatedUser,
  input: OrderRequestInput,
): Promise<OrderResult<Order>> {
  if (!listing.salePrice || !listing.ownerUserId || !isApproved(listing))
    return fail('unavailable')
  if (listing.ownerUserId === user.id) return fail('forbidden')
  const store = getStore()
  const orders = await store.orders.list()
  if (orders.some((order) => order.listingId === listing.id && isOpen(order)))
    return fail('conflict')
  const now = new Date().toISOString()
  const order = await store.orders.create({
    id: randomUUID(),
    listingId: listing.id,
    buyerUserId: user.id,
    sellerUserId: listing.ownerUserId,
    price: listing.salePrice,
    status: 'requested',
    message: input.message,
    createdAt: now,
    updatedAt: now,
  })
  await recordDealEvent({
    dealKind: 'order',
    dealId: order.id,
    status: 'requested',
    actorUserId: user.id,
    note: input.message,
  })
  await notify({
    userId: listing.ownerUserId,
    kind: 'lease',
    title: '購入の申込が届きました',
    body: listing.name,
    href: '/account',
  })
  return { ok: true, value: order }
}

/** A purchase-option conversion: the buyer already has the machine, so it starts delivered. */
export async function createOrderFromLease(input: {
  listing: Listing
  buyerUserId: string
  price: number
  leaseId: string
}): Promise<Order | undefined> {
  if (!input.listing.ownerUserId) return undefined
  const now = new Date().toISOString()
  const order = await getStore().orders.create({
    id: randomUUID(),
    listingId: input.listing.id,
    buyerUserId: input.buyerUserId,
    sellerUserId: input.listing.ownerUserId,
    price: input.price,
    status: 'delivered',
    sourceLeaseId: input.leaseId,
    createdAt: now,
    updatedAt: now,
  })
  await recordDealEvent({
    dealKind: 'order',
    dealId: order.id,
    status: 'delivered',
    actorUserId: input.buyerUserId,
    note: '賃貸から購入に切り替え',
  })
  return order
}

type Party = 'buyer' | 'seller' | 'admin'

const transitions: Record<
  Party,
  Partial<Record<OrderStatus, OrderStatus[]>>
> = {
  seller: { requested: ['accepted', 'cancelled'], accepted: ['delivered'] },
  buyer: { requested: ['cancelled'], delivered: ['completed'] },
  admin: {
    requested: ['cancelled'],
    accepted: ['cancelled'],
    delivered: ['cancelled'],
  },
}

function partyOf(order: Order, user: AuthenticatedUser): Party | undefined {
  if (order.buyerUserId === user.id) return 'buyer'
  if (order.sellerUserId === user.id) return 'seller'
  return user.role === 'admin' ? 'admin' : undefined
}

/** Sellers accept, decline, and deliver; buyers cancel a request or confirm receipt; admins cancel. */
export async function updateOrderStatus(
  id: string,
  user: AuthenticatedUser,
  status: OrderStatus,
): Promise<OrderResult<Order>> {
  const store = getStore()
  const order = await store.orders.get(id)
  if (!order) return fail('not_found')
  const party = partyOf(order, user)
  if (!party) return fail('forbidden')
  if (!transitions[party][order.status]?.includes(status))
    return fail('transition')
  const now = new Date().toISOString()
  const updated = await store.orders.update(id, { status, updatedAt: now })
  if (!updated) return fail('not_found')
  await recordDealEvent({
    dealKind: 'order',
    dealId: id,
    status,
    actorUserId: user.id,
  })
  const listing = await store.listings.get(order.listingId)
  if (status === 'completed' && listing && listing.withdrawnAt === undefined)
    await store.listings.update(listing.id, {
      withdrawnAt: now,
      updatedAt: now,
    })
  const recipients =
    party === 'admin'
      ? [order.buyerUserId, order.sellerUserId]
      : party === 'seller'
        ? [order.buyerUserId]
        : [order.sellerUserId]
  await Promise.all(
    recipients.map((userId) =>
      notify({
        userId,
        kind: 'lease',
        title: `購入が「${orderStatusLabels[status]}」になりました`,
        body: listing?.name,
        href: '/account',
      }),
    ),
  )
  return { ok: true, value: updated }
}

async function withListings(orders: Order[]): Promise<OrderWithListing[]> {
  const listings = await getStore().listings.list()
  const byId = new Map(listings.map((listing) => [listing.id, listing]))
  return orders.map((order) => ({ order, listing: byId.get(order.listingId) }))
}

export async function listOrdersForBuyer(
  userId: string,
): Promise<OrderWithListing[]> {
  const orders = await getStore().orders.list()
  return withListings(orders.filter((order) => order.buyerUserId === userId))
}

export async function listOrdersForSeller(
  userId: string,
): Promise<OrderWithListing[]> {
  const orders = await getStore().orders.list()
  return withListings(orders.filter((order) => order.sellerUserId === userId))
}

/** True while a request, acceptance, or delivery holds the listing. */
export async function listingHasOpenOrder(listingId: string): Promise<boolean> {
  const orders = await getStore().orders.list()
  return orders.some((order) => order.listingId === listingId && isOpen(order))
}

export async function listAllOrders(): Promise<OrderWithListing[]> {
  return withListings(await getStore().orders.list())
}
