import 'server-only'

import { randomUUID } from 'node:crypto'
import type { Listing } from '@/lib/data'
import {
  calculateInitialCost,
  countLeaseMonths,
  leaseStatusLabels,
  rangesOverlap,
  type DateRange,
  type LeaseStatus,
} from '@/lib/lease'
import { calculatePurchaseOption } from '@/lib/purchase-option'
import type { AuthenticatedUser } from './auth/accounts'
import { recordDealEvent } from './deal-events'
import { notify } from './notifications'
import { createOrderFromLease } from './orders'
import { getStore, type Lease } from './store'

export type LeaseResult<T> =
  | { ok: true; value: T }
  | {
      ok: false
      reason:
        | 'not_found'
        | 'forbidden'
        | 'conflict'
        | 'unavailable'
        | 'invalid'
        | 'transition'
    }

export type LeaseWithListing = { lease: Lease; listing?: Listing }

const fail = (reason: Extract<LeaseResult<never>, { ok: false }>['reason']) =>
  ({ ok: false, reason }) as const

/** Ranges that block new requests: pending and running leases. */
function isBooking(lease: Lease): boolean {
  return lease.status === 'requested' || lease.status === 'active'
}

export async function listBookedRanges(
  listingId: string,
): Promise<DateRange[]> {
  const leases = await getStore().leases.list()
  return leases
    .filter((lease) => lease.listingId === listingId && isBooking(lease))
    .map(({ startDate, endDate }) => ({ startDate, endDate }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
}

export async function requestLease(
  listing: Listing,
  user: AuthenticatedUser,
  range: DateRange,
): Promise<LeaseResult<Lease>> {
  if (!listing.rentPerMonth) return fail('unavailable')
  if (listing.ownerUserId === user.id) return fail('forbidden')
  const months = countLeaseMonths(range.startDate, range.endDate)
  if (months === 0) return fail('invalid')
  const booked = await listBookedRanges(listing.id)
  if (booked.some((existing) => rangesOverlap(existing, range)))
    return fail('conflict')
  const now = new Date().toISOString()
  const cost = calculateInitialCost({
    rentPerMonth: listing.rentPerMonth,
    depositMonths: listing.depositMonths,
    keyMoneyMonths: listing.keyMoneyMonths,
  })
  const lease = await getStore().leases.create({
    id: randomUUID(),
    listingId: listing.id,
    tenantUserId: user.id,
    startDate: range.startDate,
    endDate: range.endDate,
    months,
    rentPerMonth: listing.rentPerMonth,
    rentTotal: listing.rentPerMonth * months,
    deposit: cost.deposit,
    keyMoney: cost.keyMoney,
    initialCost: cost.total,
    salePrice: listing.salePrice,
    creditRate: listing.purchaseOption ? listing.purchaseOptionCreditRate : undefined,
    creditCap: listing.purchaseOption ? listing.purchaseOptionCreditCap : undefined,
    status: 'requested',
    createdAt: now,
    updatedAt: now,
  })
  await recordDealEvent({
    dealKind: 'lease',
    dealId: lease.id,
    status: 'requested',
    actorUserId: user.id,
    note: `${range.startDate} 〜 ${range.endDate}`,
  })
  if (listing.ownerUserId)
    await notify({
      userId: listing.ownerUserId,
      kind: 'lease',
      title: '入居の申込が届きました',
      body: `${listing.name}（${range.startDate} 〜 ${range.endDate}）`,
      href: '/account',
    })
  return { ok: true, value: lease }
}

type Party = 'owner' | 'tenant' | 'admin'

const transitions: Record<
  Party,
  Partial<Record<LeaseStatus, LeaseStatus[]>>
> = {
  owner: { requested: ['active', 'cancelled'], active: ['completed'] },
  tenant: { requested: ['cancelled'], active: ['converted'] },
  admin: { requested: ['cancelled'], active: ['cancelled'] },
}

async function partyOf(
  lease: Lease,
  user: AuthenticatedUser,
): Promise<Party | undefined> {
  if (lease.tenantUserId === user.id) return 'tenant'
  const listing = await getStore().listings.get(lease.listingId)
  if (listing?.ownerUserId === user.id) return 'owner'
  return user.role === 'admin' ? 'admin' : undefined
}

/** Owners approve, decline, and end a lease; tenants cancel or convert to a purchase. */
export async function updateLeaseStatus(
  id: string,
  user: AuthenticatedUser,
  status: LeaseStatus,
): Promise<LeaseResult<Lease>> {
  const store = getStore()
  const lease = await store.leases.get(id)
  if (!lease) return fail('not_found')
  const party = await partyOf(lease, user)
  if (!party) return fail('forbidden')
  if (!transitions[party][lease.status]?.includes(status))
    return fail('transition')
  const patch: Partial<Lease> = { status, updatedAt: new Date().toISOString() }
  if (status === 'converted') {
    if (lease.salePrice === undefined || lease.creditRate === undefined)
      return fail('transition')
    patch.purchasePrice = calculatePurchaseOption(
      {
        rentPerMonth: lease.rentPerMonth,
        salePrice: lease.salePrice,
        creditRate: lease.creditRate,
        creditCap: lease.creditCap,
      },
      lease.months,
    ).purchasePrice
  }
  const updated = await store.leases.update(id, patch)
  if (!updated) return fail('not_found')
  await recordDealEvent({
    dealKind: 'lease',
    dealId: id,
    status,
    actorUserId: user.id,
  })
  const listing = await store.listings.get(lease.listingId)
  if (status === 'converted' && listing && patch.purchasePrice !== undefined)
    await createOrderFromLease({
      listing,
      buyerUserId: lease.tenantUserId,
      price: patch.purchasePrice,
      leaseId: lease.id,
    })
  const recipients =
    party === 'admin'
      ? [lease.tenantUserId, listing?.ownerUserId]
      : party === 'owner'
        ? [lease.tenantUserId]
        : [listing?.ownerUserId]
  await Promise.all(
    recipients
      .filter((userId): userId is string => userId !== undefined)
      .map((userId) =>
        notify({
          userId,
          kind: 'lease',
          title: `賃貸借契約が「${leaseStatusLabels[status]}」になりました`,
          body: listing?.name,
          href: '/account',
        }),
      ),
  )
  return { ok: true, value: updated }
}

async function withListings(leases: Lease[]): Promise<LeaseWithListing[]> {
  const listings = await getStore().listings.list()
  const byId = new Map(listings.map((listing) => [listing.id, listing]))
  return leases.map((lease) => ({
    lease,
    listing: byId.get(lease.listingId),
  }))
}

export async function listLeasesForTenant(
  userId: string,
): Promise<LeaseWithListing[]> {
  const leases = await getStore().leases.list()
  return withListings(
    leases.filter((lease) => lease.tenantUserId === userId),
  )
}

export async function listLeasesForOwner(
  userId: string,
): Promise<LeaseWithListing[]> {
  const [leases, listings] = await Promise.all([
    getStore().leases.list(),
    getStore().listings.list(),
  ])
  const owned = new Set(
    listings
      .filter((listing) => listing.ownerUserId === userId)
      .map((listing) => listing.id),
  )
  return withListings(leases.filter((lease) => owned.has(lease.listingId)))
}
