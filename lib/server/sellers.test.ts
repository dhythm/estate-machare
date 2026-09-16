import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSellerProfile } from './sellers'
import { getListing, setListingStatus } from './listings'
import { requestLease, updateLeaseStatus } from './leases'
import { createReview } from './reviews'
import { resetStore } from './store'
import { demoSeller, demoUser } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))

beforeEach(() => resetStore())

async function reviewCompletedLease(rating: number) {
  const created = await requestLease(
    (await getListing('trc-001'))!,
    demoUser,
    { startDate: '2026-10-01', endDate: '2026-10-07' },
  )
  const id = created.ok ? created.value.id : ''
  await updateLeaseStatus(id, demoSeller, 'active')
  await updateLeaseStatus(id, demoSeller, 'completed')
  await createReview(demoUser, {
    sourceKind: 'lease',
    sourceId: id,
    rating,
    comment: '良かったです',
  })
}

describe('getSellerProfile', () => {
  it('collects the live listings and the review average of a seller account', async () => {
    await reviewCompletedLease(5)
    await reviewCompletedLease(4)
    await setListingStatus('cmb-002', 'withdrawn', demoSeller)

    const profile = await getSellerProfile('demo-seller')

    expect(profile).toMatchObject({
      id: 'demo-seller',
      name: '出品者デモ',
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
