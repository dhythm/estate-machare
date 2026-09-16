import { seedLegacyRentalListings } from '@/test/legacy-listings'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSellerProfile } from './sellers'
import { getListing, setListingStatus } from './listings'
import { requestRental, updateRentalStatus } from './rentals'
import { createReview } from './reviews'
import { resetStore } from './store'
import { demoSeller, demoUser } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))

beforeEach(async () => {
  await resetStore()
  await seedLegacyRentalListings()
})

async function reviewCompletedRental(rating: number) {
  const created = await requestRental(
    (await getListing('trc-001'))!,
    demoUser,
    { startDate: '2026-10-01', endDate: '2026-10-07' },
  )
  const id = created.ok ? created.value.id : ''
  await updateRentalStatus(id, demoSeller, 'active')
  await updateRentalStatus(id, demoSeller, 'completed')
  await createReview(demoUser, {
    sourceKind: 'rental',
    sourceId: id,
    rating,
    comment: '良かったです',
  })
}

describe('getSellerProfile', () => {
  it('collects the live listings and the review average of a seller account', async () => {
    await reviewCompletedRental(5)
    await reviewCompletedRental(4)
    await setListingStatus('cmb-002', 'withdrawn', demoSeller)

    const profile = await getSellerProfile('demo-seller')

    expect(profile).toMatchObject({
      id: 'demo-seller',
      name: '掲載者デモ',
      rating: 4.5,
      reviewCount: 2,
    })
    expect(profile?.listings.map((listing) => listing.id)).not.toContain(
      'cmb-002',
    )
    expect(profile?.listings.map((listing) => listing.id)).toContain('trc-001')
    expect(profile?.reviews.map((review) => review.rating)).toEqual([4, 5])
  })

  it('has no rating before the first review', async () => {
    const profile = await getSellerProfile('demo-seller')
    expect(profile?.rating).toBeUndefined()
    expect(profile?.reviewCount).toBe(0)
  })

  it('is undefined for an unknown account or one without any listing', async () => {
    expect(await getSellerProfile('nobody')).toBeUndefined()
    expect(await getSellerProfile('demo-user')).toBeUndefined()
  })
})
