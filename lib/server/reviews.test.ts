import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createReview,
  findReviewForSource,
  listReviewsForSeller,
  reviewableSources,
} from './reviews'
import { getListing } from './listings'
import { requestLease, updateLeaseStatus } from './leases'
import { resetStore } from './store'
import { acceptSubmission } from './submissions'
import { updateThreadStatus } from './threads'
import { demoAdmin, demoSeller, demoUser } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))

beforeEach(() => resetStore())

async function completedLease() {
  const created = await requestLease(
    (await getListing('trc-001'))!,
    demoUser,
    {
      startDate: '2026-10-01',
      endDate: '2026-10-07',
    },
  )
  const id = created.ok ? created.value.id : ''
  await updateLeaseStatus(id, demoSeller, 'active')
  await updateLeaseStatus(id, demoSeller, 'completed')
  return id
}

async function agreedInquiry() {
  const { id } = await acceptSubmission(
    'listingInquiry',
    { mode: 'buy', name: '利用者デモ', message: '買います' },
    { targetId: 'trc-001', userId: 'demo-user' },
  )
  await updateThreadStatus(id, demoSeller, 'agreed')
  return id
}

describe('createReview', () => {
  it('lets the tenant review a completed lease and updates the seller rating', async () => {
    const before = (await getListing('trc-001'))!.seller
    expect(before).toMatchObject({ rating: 4.8, reviews: 34 })
    const id = await completedLease()
    const result = await createReview(demoUser, {
      sourceKind: 'lease',
      sourceId: id,
      rating: 3,
      comment: '普通でした',
    })
    expect(result.ok && result.value).toMatchObject({
      listingId: 'trc-001',
      sellerUserId: 'demo-seller',
      reviewerUserId: 'demo-user',
      rating: 3,
    })
    const after = (await getListing('trc-001'))!.seller
    expect(after.reviews).toBe(35)
    expect(after.rating).toBe(4.7)
    expect((await getListing('cmb-002'))!.seller.reviews).toBe(59)
    expect(await findReviewForSource('lease', id)).toMatchObject({ rating: 3 })
    const again = await createReview(demoUser, {
      sourceKind: 'lease',
      sourceId: id,
      rating: 5,
    })
    expect(!again.ok && again.reason).toBe('duplicate')
  })

  it('lets the sender review an agreed inquiry and lists seller reviews newest first', async () => {
    const id = await agreedInquiry()
    const result = await createReview(demoUser, {
      sourceKind: 'thread',
      sourceId: id,
      rating: 5,
      comment: '丁寧でした',
    })
    expect(result.ok).toBe(true)
    const leaseId = await completedLease()
    await createReview(demoUser, {
      sourceKind: 'lease',
      sourceId: leaseId,
      rating: 4,
    })
    const reviews = await listReviewsForSeller('demo-seller')
    expect(reviews.map((review) => review.rating)).toEqual([4, 5])
    expect(await listReviewsForSeller('demo-user')).toEqual([])
  })

  it('refuses the wrong person, the wrong state, and unknown sources', async () => {
    const created = await requestLease(
      (await getListing('trc-001'))!,
      demoUser,
      {
        startDate: '2026-11-01',
        endDate: '2026-11-02',
      },
    )
    const pending = created.ok ? created.value.id : ''
    const early = await createReview(demoUser, {
      sourceKind: 'lease',
      sourceId: pending,
      rating: 5,
    })
    expect(!early.ok && early.reason).toBe('not_reviewable')
    const other = await createReview(demoSeller, {
      sourceKind: 'lease',
      sourceId: pending,
      rating: 5,
    })
    expect(!other.ok && other.reason).toBe('forbidden')
    const admin = await createReview(demoAdmin, {
      sourceKind: 'lease',
      sourceId: pending,
      rating: 5,
    })
    expect(!admin.ok && admin.reason).toBe('forbidden')
    const missing = await createReview(demoUser, {
      sourceKind: 'thread',
      sourceId: 'nope',
      rating: 5,
    })
    expect(!missing.ok && missing.reason).toBe('not_found')
  })
})

describe('reviewableSources', () => {
  it('tells which of the user leases and threads can still be reviewed', async () => {
    const leaseId = await completedLease()
    const threadId = await agreedInquiry()
    const before = await reviewableSources(demoUser)
    expect(before.leases).toEqual([leaseId])
    expect(before.threads).toEqual([threadId])
    await createReview(demoUser, {
      sourceKind: 'lease',
      sourceId: leaseId,
      rating: 4,
    })
    const after = await reviewableSources(demoUser)
    expect(after.leases).toEqual([])
    expect(after.threads).toEqual([threadId])
  })
})
