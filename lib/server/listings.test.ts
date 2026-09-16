import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createListing,
  deleteListing,
  getFeaturedListings,
  getListing,
  getListingIds,
  getRelatedListings,
  paginateListings,
  searchListings,
  setListingStatus,
  updateListing,
} from './listings'
import { listNotifications } from './notifications'
import { requestLease } from './leases'
import { demoAdmin, demoSeller, demoUser } from '@/test/mock-auth'
import { applyModeration } from './moderation'
import { resetStore } from './store'
import type { ListingSubmission } from '@/lib/validation/listing-submission'

vi.mock('server-only', () => ({}))

beforeEach(() => resetStore())

const submission: ListingSubmission = {
  images: [],
  name: 'クボタ トラクター 30馬力 テスト',
  category: 'トラクター',
  maker: 'クボタ',
  year: 2018,
  hours: 500,
  condition: '目立った傷なし',
  prefecture: '新潟県',
  city: '長岡市',
  deals: ['sale', 'rent'],
  salePrice: 1_500_000,
  rentPerMonth: 12_000,
  purchaseOption: true,
  summary: 'キャビン付き。',
  sellerName: 'テスト農園',
  sellerKind: '農業法人',
  contactEmail: 'seller@example.com',
}

describe('listing search', () => {
  it('returns every listing by default and keeps ids unique', async () => {
    const ids = await getListingIds()
    expect((await searchListings()).map((listing) => listing.id)).toEqual(ids)
    expect(ids.length).toBeGreaterThanOrEqual(40)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.slice(0, 6)).toEqual([
      'trc-001',
      'cmb-002',
      'rpl-003',
      'til-004',
      'drn-005',
      'trc-006',
    ])
  })

  it('combines category and deal filters', async () => {
    const result = await searchListings({
      category: 'トラクター',
      deal: 'rent',
    })
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].id).toBe('trc-001')
    expect(
      result.every(
        (listing) =>
          listing.category === 'トラクター' && listing.deals.includes('rent'),
      ),
    ).toBe(true)
  })

  it('limits purchase-option search to eligible listings', async () => {
    const result = await searchListings({
      category: 'すべて',
      deal: 'purchaseOption',
    })
    expect(result.map((listing) => listing.id).slice(0, 3)).toEqual([
      'trc-001',
      'cmb-002',
      'rpl-003',
    ])
    expect(result.every((listing) => listing.purchaseOption === true)).toBe(true)
  })

  it('matches keywords against name, maker, category, location, and tags', async () => {
    const byMaker = await searchListings({
      category: 'すべて',
      deal: 'all',
      keyword: 'クボタ',
    })
    expect(byMaker.length).toBeGreaterThan(0)
    expect(byMaker.every((listing) => listing.maker === 'クボタ')).toBe(true)

    expect(
      (
        await searchListings({
          category: 'すべて',
          deal: 'all',
          keyword: '長岡',
        })
      ).map((listing) => listing.id),
    ).toContain('trc-001')
    expect(
      (
        await searchListings({
          category: 'すべて',
          deal: 'all',
          keyword: '4WD',
        })
      ).map((listing) => listing.id),
    ).toContain('trc-001')
  })

  it('treats blank keywords as no filter and splits on whitespace', async () => {
    expect(
      await searchListings({ category: 'すべて', deal: 'all', keyword: '  ' }),
    ).toHaveLength((await getListingIds()).length)
    const result = await searchListings({
      category: 'すべて',
      deal: 'all',
      keyword: 'クボタ　新潟県',
    })
    expect(result.length).toBeGreaterThan(0)
    expect(
      result.every(
        (listing) =>
          listing.maker === 'クボタ' && listing.prefecture === '新潟県',
      ),
    ).toBe(true)
    expect(
      await searchListings({
        category: 'すべて',
        deal: 'all',
        keyword: '存在しないキーワード',
      }),
    ).toEqual([])
  })

  it('finds a listing and handles an unknown id', async () => {
    expect((await getListing('drn-005'))?.name).toContain('ドローン')
    expect(await getListing('missing')).toBeUndefined()
  })
})

describe('listing refinements', () => {
  it('filters by prefecture and price range for the selected deal', async () => {
    const niigata = await searchListings({
      category: 'すべて',
      deal: 'all',
      prefecture: '新潟県',
    })
    expect(niigata.length).toBeGreaterThan(0)
    expect(niigata.every((listing) => listing.prefecture === '新潟県')).toBe(
      true,
    )

    const cheapSales = await searchListings({
      category: 'すべて',
      deal: 'sale',
      priceMax: 500_000,
    })
    expect(cheapSales.length).toBeGreaterThan(0)
    expect(
      cheapSales.every((listing) => (listing.salePrice ?? 0) <= 500_000),
    ).toBe(true)

    const dailyRent = await searchListings({
      category: 'すべて',
      deal: 'rent',
      priceMin: 20_000,
      priceMax: 30_000,
    })
    expect(dailyRent.length).toBeGreaterThan(0)
    expect(
      dailyRent.every(
        (listing) =>
          listing.rentPerMonth !== undefined &&
          listing.rentPerMonth >= 20_000 &&
          listing.rentPerMonth <= 30_000,
      ),
    ).toBe(true)
  })

  it('sorts by price with unpriced listings last', async () => {
    const asc = await searchListings({
      category: 'すべて',
      deal: 'all',
      sort: 'priceAsc',
    })
    const priced = asc.filter((listing) => listing.salePrice !== undefined)
    const prices = priced.map((listing) => listing.salePrice as number)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
    expect(
      asc.slice(0, priced.length).every((l) => l.salePrice !== undefined),
    ).toBe(true)
    const desc = await searchListings({
      category: 'すべて',
      deal: 'all',
      sort: 'priceDesc',
    })
    expect(desc[0].salePrice).toBe(Math.max(...prices))
    const rent = await searchListings({
      category: 'すべて',
      deal: 'all',
      sort: 'rentAsc',
    })
    const rents = rent
      .filter((l) => l.rentPerMonth !== undefined)
      .map((l) => l.rentPerMonth as number)
    expect(rents).toEqual([...rents].sort((a, b) => a - b))
  })

  it('keeps only rentable listings free for the requested dates', async () => {
    await requestLease((await getListing('trc-001'))!, demoUser, {
      startDate: '2026-10-01',
      endDate: '2026-10-07',
    })
    const busy = await searchListings({
      category: 'すべて',
      deal: 'all',
      availableFrom: '2026-10-05',
      availableTo: '2026-10-06',
    })
    expect(busy.map((l) => l.id)).not.toContain('trc-001')
    expect(busy.every((l) => l.rentPerMonth !== undefined)).toBe(true)
    const free = await searchListings({
      category: 'すべて',
      deal: 'all',
      availableFrom: '2026-10-08',
      availableTo: '2026-10-09',
    })
    expect(free.map((l) => l.id)).toContain('trc-001')
  })
})

describe('listing pagination', () => {
  const filter = { category: 'すべて', deal: 'all' } as const

  it('returns one page with totals', async () => {
    const total = (await getListingIds()).length
    const page = await paginateListings(filter, { page: 1, pageSize: 12 })
    expect(page.items).toHaveLength(12)
    expect(page).toMatchObject({
      total,
      page: 1,
      pageSize: 12,
      pageCount: Math.ceil(total / 12),
    })
    expect(page.items[0].id).toBe('trc-001')
  })

  it('returns the remainder on the last page and nothing beyond it', async () => {
    const total = (await getListingIds()).length
    const last = await paginateListings(filter, { page: 1000, pageSize: 12 })
    expect(last.items).toEqual([])
    expect(last.total).toBe(total)
    const lastPage = await paginateListings(filter, {
      page: Math.ceil(total / 12),
      pageSize: 12,
    })
    expect(lastPage.items.length).toBe(total - 12 * (lastPage.pageCount - 1))
  })

  it('reports an empty page for a filter with no matches', async () => {
    expect(
      await paginateListings(
        { ...filter, keyword: '存在しないキーワード' },
        { page: 1, pageSize: 12 },
      ),
    ).toEqual({ items: [], total: 0, page: 1, pageSize: 12, pageCount: 0 })
  })
})

describe('featured listings', () => {
  it('returns the first listings up to the limit', async () => {
    const featured = await getFeaturedListings(6)
    expect(featured).toHaveLength(6)
    expect(featured[0].id).toBe('trc-001')
  })
})

describe('listing CRUD', () => {
  it('creates a listing as pending so it stays off the public list', async () => {
    const created = await createListing(submission, 'demo-seller')
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(created).toMatchObject({
      name: submission.name,
      image: '/equipment/tractor.png',
      moderationStatus: 'pending',
      ownerUserId: 'demo-seller',
      seller: { name: 'テスト農園', kind: '農業法人', rating: 0, reviews: 0 },
      createdAt: expect.any(String),
    })
    expect((await getListing(created.id))?.name).toBe(submission.name)
    expect((await getFeaturedListings(1))[0].id).toBe('trc-001')
    expect(
      await searchListings({
        category: 'すべて',
        deal: 'all',
        keyword: 'テスト農園',
      }),
    ).toEqual([])
    expect(await getListingIds()).not.toContain(created.id)
  })

  it('publishes a listing after approval and hides a rejected one', async () => {
    const created = await createListing(submission, 'demo-seller')
    const approved = await applyModeration('listing', created.id, {
      status: 'approved',
    })
    expect(approved?.moderationStatus).toBe('approved')
    expect(
      (
        await searchListings({
          category: 'すべて',
          deal: 'all',
          keyword: 'テスト農園',
        })
      ).map((listing) => listing.id),
    ).toEqual([created.id])
    expect((await getFeaturedListings(1))[0].id).toBe(created.id)

    await applyModeration('listing', created.id, {
      status: 'rejected',
      note: '写真が不足',
    })
    expect((await getListing(created.id))?.moderationNote).toBe('写真が不足')
    expect(
      await searchListings({
        category: 'すべて',
        deal: 'all',
        keyword: 'テスト農園',
      }),
    ).toEqual([])
  })

  it('stores uploaded pictures, uses the thumbnail for lists, and keeps full images off lists', async () => {
    const full = 'data:image/jpeg;base64,/9j/4AAQ'
    const thumb = 'data:image/jpeg;base64,/9j/thumb'
    const created = await createListing(
      { ...submission, images: [full, full], thumbnail: thumb },
      'demo-seller',
    )
    expect(created.image).toBe(thumb)
    expect(created.images).toEqual([full, full])
    await applyModeration('listing', created.id, { status: 'approved' })
    const detail = await getListing(created.id)
    expect(detail?.images).toHaveLength(2)
    const listed = (
      await searchListings({
        category: 'すべて',
        deal: 'all',
        keyword: 'テスト農園',
      })
    )[0]
    expect(listed.image).toBe(thumb)
    expect(listed.images).toBeUndefined()
    expect((await getFeaturedListings(1))[0].images).toBeUndefined()
    expect(
      (await getRelatedListings({ ...created, id: 'other' }, 5)).every(
        (item) => item.images === undefined,
      ),
    ).toBe(true)
    const withoutPictures = await createListing(submission, 'demo-seller')
    expect(withoutPictures.image).toBe('/equipment/tractor.png')
    expect(withoutPictures.images).toEqual([])
  })

  it('withdraws and republishes a listing, refusing while a lease is open', async () => {
    const withdrawn = await setListingStatus('trc-001', 'withdrawn', demoSeller)
    expect(withdrawn.ok && withdrawn.value.withdrawnAt).toEqual(
      expect.any(String),
    )
    expect(await getListingIds()).not.toContain('trc-001')
    expect((await getFeaturedListings(1))[0].id).not.toBe('trc-001')
    const republished = await setListingStatus('trc-001', 'listed', demoAdmin)
    expect(republished.ok && republished.value.withdrawnAt).toBeUndefined()
    expect(await getListingIds()).toContain('trc-001')

    await requestLease((await getListing('trc-001'))!, demoUser, {
      startDate: '2026-10-01',
      endDate: '2026-10-02',
    })
    const blocked = await setListingStatus('trc-001', 'withdrawn', demoSeller)
    expect(!blocked.ok && blocked.reason).toBe('lease_open')
    const stranger = await setListingStatus('trc-001', 'withdrawn', demoUser)
    expect(!stranger.ok && stranger.reason).toBe('forbidden')
    const missing = await setListingStatus('nope', 'withdrawn', demoAdmin)
    expect(!missing.ok && missing.reason).toBe('not_found')
  })

  it('notifies the owner when an admin withdraws', async () => {
    await setListingStatus('trc-001', 'withdrawn', demoAdmin)
    expect(
      (await listNotifications('demo-seller')).map((n) => n.title),
    ).toEqual(['出品が運営により取り下げられました'])
    await setListingStatus('trc-001', 'listed', demoSeller)
    expect(await listNotifications('demo-seller')).toHaveLength(1)
  })

  it('does not store the contact email on the public listing', async () => {
    const created = await createListing(submission, 'demo-seller')
    expect(JSON.stringify(created)).not.toContain('seller@example.com')
  })

  it('updates an existing listing and keeps its id, seller rating, and history', async () => {
    const created = await createListing(submission, 'demo-seller')
    const updated = await updateListing(created.id, {
      ...submission,
      name: '更新後の名前',
      deals: ['rent'],
      salePrice: undefined,
      purchaseOption: false,
    })
    expect(updated).toMatchObject({
      id: created.id,
      name: '更新後の名前',
      deals: ['rent'],
      purchaseOption: false,
      seller: { rating: 0, reviews: 0 },
      createdAt: created.createdAt,
    })
    expect(updated?.salePrice).toBeUndefined()
    expect(updated?.updatedAt).not.toBe(created.updatedAt)
    expect(await updateListing('missing', submission)).toBeUndefined()
  })

  it('keeps a seeded seller rating when a seeded listing is updated', async () => {
    const updated = await updateListing('trc-001', submission)
    expect(updated?.seller).toMatchObject({
      name: 'テスト農園',
      rating: 4.8,
      reviews: 34,
    })
  })

  it('deletes a listing', async () => {
    expect(await deleteListing('trc-001')).toBe(true)
    expect(await getListing('trc-001')).toBeUndefined()
    expect(await deleteListing('trc-001')).toBe(false)
  })
})
