import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createListing } from './listings'
import { applyModeration, getModerationQueue } from './moderation'
import { resetStore } from './store'
import type { ListingSubmission } from '@/lib/validation/listing-submission'

vi.mock('server-only', () => ({}))

beforeEach(() => resetStore())

const listing: ListingSubmission = {
  images: [],
  name: '審査用マンション',
  category: 'マンション',
  maker: 'クボタ',
  year: 2018,
  hours: 500,
  condition: '目立った傷なし',
  prefecture: '新潟県',
  city: '長岡市',
  deals: ['sale'],
  salePrice: 1_000_000,
  rentToOwn: false,
  summary: '審査用。',
  sellerName: '審査農園',
  sellerKind: '不動産会社',
  contactEmail: 'review@example.com',
}

describe('moderation queue', () => {
  it('lists pending marketplace items and applies a decision', async () => {
    const createdListing = await createListing(listing, 'demo-seller')
    const pending = await getModerationQueue('pending')
    expect(pending.listings.map((item) => item.id)).toEqual([createdListing.id])

    expect(
      await applyModeration('listing', 'missing', { status: 'approved' }),
    ).toBeUndefined()
    await applyModeration('listing', createdListing.id, { status: 'approved' })

    expect((await getModerationQueue('pending')).listings).toEqual([])
    expect(
      (await getModerationQueue('approved')).listings.map((item) => item.id),
    ).toContain(createdListing.id)
    expect(
      (await getModerationQueue('all')).listings.map((item) => item.id),
    ).toContain(createdListing.id)
  })
})
