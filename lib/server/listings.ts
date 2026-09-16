import 'server-only'

import { randomUUID } from 'node:crypto'
import { isApproved } from '@/lib/data'
import type {
  Listing,
  ListingFilter,
  ListingPage,
  PageRequest,
} from '@/lib/data'
import { rangesOverlap } from '@/lib/lease'
import type { ListingSubmission } from '@/lib/validation/listing-submission'
import type { AuthenticatedUser } from './auth/accounts'
import { canManage } from './auth/access'
import { notify } from './notifications'
import { getStore } from './store'
import { deleteSubmissionsFor } from './submissions'

const imageByCategory: Record<string, string> = {
  マンション: '/properties/apartment.svg',
  戸建: '/properties/house.svg',
  土地: '/properties/land.svg',
  事業用: '/properties/commercial.svg',
}

/** Lists carry only the thumbnail; the detail page loads the full pictures. */
function withoutImages(listing: Listing): Listing {
  const rest = { ...listing }
  delete rest.images
  return rest
}

function normalize(value: string): string {
  return value.normalize('NFKC').toLowerCase()
}

function keywordTerms(keyword: string | undefined): string[] {
  if (!keyword) return []
  return normalize(keyword)
    .split(/\s+/)
    .filter((term) => term.length > 0)
}

function searchableText(listing: Listing): string {
  return normalize(
    [
      listing.name,
      listing.category,
      listing.zoning,
      listing.layout ?? '',
      listing.nearestStation,
      listing.prefecture,
      listing.city,
      listing.seller.name,
      ...listing.tags,
    ].join(' '),
  )
}

function priceFor(listing: Listing, filter: ListingFilter): number | undefined {
  return filter.deal === 'rent' ? listing.rentPerMonth : listing.salePrice
}

function withinPrice(listing: Listing, filter: ListingFilter): boolean {
  if (filter.priceMin === undefined && filter.priceMax === undefined)
    return true
  const price = priceFor(listing, filter)
  if (price === undefined) return false
  if (filter.priceMin !== undefined && price < filter.priceMin) return false
  if (filter.priceMax !== undefined && price > filter.priceMax) return false
  return true
}

/** Unpriced listings sort last whatever the direction. */
function compareBy(
  pick: (listing: Listing) => number | undefined,
  direction: 1 | -1,
) {
  return (a: Listing, b: Listing) => {
    const left = pick(a)
    const right = pick(b)
    if (left === undefined && right === undefined) return 0
    if (left === undefined) return 1
    if (right === undefined) return -1
    return (left - right) * direction
  }
}

function sortListings(listings: Listing[], sort: ListingFilter['sort']) {
  switch (sort) {
    case 'priceAsc':
      return [...listings].sort(compareBy((l) => l.salePrice, 1))
    case 'priceDesc':
      return [...listings].sort(compareBy((l) => l.salePrice, -1))
    case 'rentAsc':
      return [...listings].sort(compareBy((l) => l.rentPerMonth, 1))
    default:
      return listings
  }
}

/** Ids of listings booked (requested or active) over the wanted span. */
async function bookedListingIds(
  from: string,
  to: string,
): Promise<Set<string>> {
  const leases = await getStore().leases.list()
  return new Set(
    leases
      .filter(
        (lease) =>
          (lease.status === 'requested' || lease.status === 'active') &&
          rangesOverlap(lease, { startDate: from, endDate: to }),
      )
      .map((lease) => lease.listingId),
  )
}

function matches(listing: Listing, filter: ListingFilter, terms: string[]) {
  if (filter.category !== 'すべて' && listing.category !== filter.category)
    return false
  if (filter.prefecture && listing.prefecture !== filter.prefecture)
    return false
  if (filter.layout && listing.layout !== filter.layout) return false
  if (!withinPrice(listing, filter)) return false
  if (filter.deal === 'purchaseOption' && listing.purchaseOption !== true) return false
  if (
    filter.deal !== 'all' &&
    filter.deal !== 'purchaseOption' &&
    !listing.deals.includes(filter.deal)
  )
    return false
  if (terms.length === 0) return true
  const text = searchableText(listing)
  return terms.every((term) => text.includes(term))
}

export async function searchListings(
  filter: ListingFilter = { category: 'すべて', deal: 'all' },
): Promise<Listing[]> {
  const terms = keywordTerms(filter.keyword)
  const listings = await getStore().listings.list()
  const wantsDates =
    filter.availableFrom !== undefined && filter.availableTo !== undefined
  const booked = wantsDates
    ? await bookedListingIds(filter.availableFrom!, filter.availableTo!)
    : undefined
  const matched = listings.filter(
    (listing) =>
      isApproved(listing) &&
      matches(listing, filter, terms) &&
      (booked === undefined ||
        (listing.rentPerMonth !== undefined && !booked.has(listing.id))),
  )
  return sortListings(matched, filter.sort).map(withoutImages)
}

export async function paginateListings(
  filter: ListingFilter,
  request: PageRequest,
): Promise<ListingPage> {
  const matched = await searchListings(filter)
  const pageSize = Math.max(1, Math.floor(request.pageSize))
  const page = Math.max(1, Math.floor(request.page))
  const start = (page - 1) * pageSize
  return {
    items: matched.slice(start, start + pageSize),
    total: matched.length,
    page,
    pageSize,
    pageCount: Math.ceil(matched.length / pageSize),
  }
}

export async function getFeaturedListings(limit: number): Promise<Listing[]> {
  return (await getStore().listings.list())
    .filter(isApproved)
    .slice(0, limit)
    .map(withoutImages)
}

export function getListing(id: string): Promise<Listing | undefined> {
  return getStore().listings.get(id)
}

export async function getRelatedListings(
  listing: Listing,
  limit: number,
): Promise<Listing[]> {
  const listings = await getStore().listings.list()
  return listings
    .filter(
      (candidate) =>
        candidate.id !== listing.id &&
        candidate.category === listing.category &&
        isApproved(candidate),
    )
    .slice(0, limit)
    .map(withoutImages)
}

export async function getListingIds(): Promise<string[]> {
  return (await getStore().listings.list())
    .filter(isApproved)
    .map((listing) => listing.id)
}

/** Public listing fields derived from a submission; contact details stay out. */
function listingFields(submission: ListingSubmission) {
  return {
    name: submission.name,
    category: submission.category,
    zoning: submission.zoning,
    layout: submission.layout,
    floorArea: submission.floorArea,
    builtYear: submission.builtYear,
    nearestStation: submission.nearestStation,
    walkMinutes: submission.walkMinutes,
    prefecture: submission.prefecture,
    city: submission.city,
    image:
      submission.thumbnail ??
      submission.images[0] ??
      imageByCategory[submission.category] ??
      '/placeholder.svg',
    images: submission.images,
    summary: submission.summary,
    deals: submission.deals,
    salePrice: submission.salePrice,
    rentPerMonth: submission.rentPerMonth,
    depositMonths: submission.depositMonths,
    keyMoneyMonths: submission.keyMoneyMonths,
    leaseType: submission.leaseType,
    purchaseOption: submission.purchaseOption,
    purchaseOptionCreditRate: submission.purchaseOptionCreditRate,
    purchaseOptionCreditCap: submission.purchaseOptionCreditCap,
    tags: [] as string[],
  }
}

export function createListing(
  submission: ListingSubmission,
  ownerUserId: string,
): Promise<Listing> {
  const now = new Date().toISOString()
  return getStore().listings.create({
    id: randomUUID(),
    ...listingFields(submission),
    ownerUserId,
    seller: {
      name: submission.sellerName,
      kind: submission.sellerKind,
      rating: 0,
      reviews: 0,
    },
    createdAt: now,
    updatedAt: now,
    moderationStatus: 'pending',
  })
}

export async function updateListing(
  id: string,
  submission: ListingSubmission,
): Promise<Listing | undefined> {
  const current = await getStore().listings.get(id)
  if (!current) return undefined
  return getStore().listings.update(id, {
    ...listingFields(submission),
    tags: current.tags,
    seller: {
      ...current.seller,
      name: submission.sellerName,
      kind: submission.sellerKind,
    },
    updatedAt: new Date(Date.now() + 1).toISOString(),
  })
}

export async function deleteListing(id: string): Promise<boolean> {
  const deleted = await getStore().listings.delete(id)
  if (deleted) await deleteSubmissionsFor(id)
  return deleted
}

export type ListingStatusResult =
  | { ok: true; value: Listing }
  | { ok: false; reason: 'not_found' | 'forbidden' | 'lease_open' }

/** Take a listing off the site or put it back; the review state is untouched. */
export async function setListingStatus(
  id: string,
  status: 'withdrawn' | 'listed',
  user: AuthenticatedUser,
): Promise<ListingStatusResult> {
  const store = getStore()
  const listing = await store.listings.get(id)
  if (!listing) return { ok: false, reason: 'not_found' }
  if (!canManage(user, listing)) return { ok: false, reason: 'forbidden' }
  if (status === 'withdrawn') {
    const leases = await store.leases.list()
    const open = leases.some(
      (lease) =>
        lease.listingId === id &&
        (lease.status === 'requested' || lease.status === 'active'),
    )
    if (open) return { ok: false, reason: 'lease_open' }
  }
  const now = new Date().toISOString()
  const updated = await store.listings.update(id, {
    withdrawnAt: status === 'withdrawn' ? now : undefined,
    updatedAt: now,
  })
  if (!updated) return { ok: false, reason: 'not_found' }
  if (
    status === 'withdrawn' &&
    listing.ownerUserId &&
    listing.ownerUserId !== user.id
  )
    await notify({
      userId: listing.ownerUserId,
      kind: 'moderation',
      title: '出品が運営により取り下げられました',
      body: listing.name,
      href: `/listings/${id}`,
    })
  return { ok: true, value: updated }
}
