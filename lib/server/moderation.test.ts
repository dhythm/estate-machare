import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createListing } from './listings'
import { applyModeration, getModerationQueue } from './moderation'
import { resetStore } from './store'
import { createTransportJob } from './transport'
import type { ListingSubmission } from '@/lib/validation/listing-submission'
import type { TransportJobInput } from '@/lib/validation/transport'

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

const job: TransportJobInput = {
  item: '審査用コンバイン',
  from: '新潟県 長岡市',
  to: '新潟県 上越市',
  distanceKm: 70,
  weight: '約2t',
  desiredDate: '相談',
  reward: 20_000,
  contactEmail: 'owner@example.com',
}

describe('moderation queue', () => {
  it('lists pending marketplace items and applies a decision', async () => {
    const createdListing = await createListing(listing, 'demo-seller')
    const createdJob = await createTransportJob(job, 'demo-seller')
    const pending = await getModerationQueue('pending')
    expect(pending.listings.map((item) => item.id)).toEqual([createdListing.id])
    expect(pending.transportJobs.map((item) => item.id)).toEqual([
      createdJob.id,
    ])

    expect(
      await applyModeration('listing', 'missing', { status: 'approved' }),
    ).toBeUndefined()
    await applyModeration('listing', createdListing.id, { status: 'approved' })
    await applyModeration('transportJob', createdJob.id, {
      status: 'rejected',
      note: '区間が不明瞭',
    })

    expect((await getModerationQueue('pending')).listings).toEqual([])
    expect(
      (await getModerationQueue('approved')).listings.map((item) => item.id),
    ).toContain(createdListing.id)
    expect(
      (await getModerationQueue('rejected')).transportJobs[0],
    ).toMatchObject({
      id: createdJob.id,
      moderationNote: '区間が不明瞭',
    })
    expect(
      (await getModerationQueue('all')).listings.map((item) => item.id),
    ).toContain(createdListing.id)
  })
})
