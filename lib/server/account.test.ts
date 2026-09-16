import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAccountOverview } from './account'
import { createListing, getListing } from './listings'
import { requestLease } from './leases'
import { requestOrder } from './orders'
import { resetStore } from './store'
import { acceptSubmission } from './submissions'
import { addMessage } from './threads'
import { createPropertyRequest } from './property-requests'
import { listSubmissionsByUser } from './submissions'
import { demoSeller, demoUser } from '@/test/mock-auth'

async function getAccountOverviewSentInquiryId() {
  const mine = await listSubmissionsByUser('demo-user')
  return mine.find((submission) => submission.kind === 'listingInquiry')?.id
}
import type { ListingSubmission } from '@/lib/validation/listing-submission'
import type { PropertyRequestInput } from '@/lib/validation/property-request'

vi.mock('server-only', () => ({}))

beforeEach(() => resetStore())

const listingInput: ListingSubmission = {
  images: [],
  name: '買い手の出品',
  category: 'トラクター',
  maker: 'クボタ',
  year: 2018,
  hours: 500,
  condition: '目立った傷なし',
  prefecture: '新潟県',
  city: '長岡市',
  deals: ['sale'],
  salePrice: 1_000_000,
  purchaseOption: false,
  summary: '説明',
  sellerName: '利用者デモ',
  sellerKind: '個人農家',
  contactEmail: 'user@example.com',
}

const jobInput: PropertyRequestInput = {
  item: 'トラクター',
  from: '長野県 松本市',
  to: '長野県 諏訪市',
  distanceKm: 40,
  weight: '約1.2t',
  desiredDate: '相談',
  reward: 14_000,
  contactEmail: 'user@example.com',
}

describe('getAccountOverview', () => {
  it('collects what the user owns and what they sent, with what came in', async () => {
    await acceptSubmission(
      'listingInquiry',
      { mode: 'rent', name: '利用者デモ', message: '借りたい' },
      { targetId: 'trc-001', userId: 'demo-user' },
    )
    await acceptSubmission(
      'requestProposal',
      { name: '利用者デモ', vehicle: '2tトラック' },
      { targetId: 'tj-01', userId: 'demo-user' },
    )
    await acceptSubmission(
      'listingInquiry',
      { mode: 'buy', name: '匿名', message: '昔の問い合わせ' },
      { targetId: 'trc-001' },
    )
    await addMessage(
      (await getAccountOverviewSentInquiryId()) ?? '',
      demoSeller,
      '在庫あります',
    )
    await requestLease((await getListing('trc-001'))!, demoUser, {
      startDate: '2026-10-01',
      endDate: '2026-10-07',
    })
    await requestOrder((await getListing('cmb-002'))!, demoUser, {})
    const mine = await createListing(listingInput, 'demo-user')
    const myJob = await createPropertyRequest(jobInput, 'demo-user')

    const seller = await getAccountOverview('demo-seller')
    expect(seller.listings.map((item) => item.listing.id)).toContain('trc-001')
    expect(seller.listings.map((item) => item.listing.id)).not.toContain(
      mine.id,
    )
    const trc001 = seller.listings.find((item) => item.listing.id === 'trc-001')
    expect(trc001?.inquiries.map((inquiry) => inquiry.payload.message)).toEqual(
      ['借りたい', '昔の問い合わせ'],
    )
    expect(seller.propertyRequests.map((item) => item.request.id)).toEqual([
      'tj-01',
      'tj-02',
    ])
    expect(seller.propertyRequests[0].applications).toHaveLength(1)
    expect(seller.sentInquiries).toEqual([])
    expect(seller.sentApplications).toEqual([])

    const user = await getAccountOverview('demo-user')
    expect(user.listings.map((item) => item.listing.id)).toEqual([mine.id])
    expect(user.listings[0].inquiries).toEqual([])
    expect(user.propertyRequests.map((item) => item.request.id)).toEqual([myJob.id])
    expect(user.sentInquiries).toHaveLength(1)
    expect(user.sentInquiries[0].listing?.id).toBe('trc-001')
    expect(user.sentApplications).toHaveLength(1)
    expect(user.sentApplications[0].request?.id).toBe('tj-01')
    expect(user.replyCounts).toEqual({
      [user.sentInquiries[0].submission.id]: 1,
    })
    expect(user.leases.asTenant.map((item) => item.lease.listingId)).toEqual([
      'trc-001',
    ])
    expect(seller.leases.asOwner).toHaveLength(1)
    expect(seller.unreadThreadIds).toHaveLength(3)
    expect(seller.summary).toEqual({
      unreadThreads: 3,
      openInquiries: 3,
      requestedLeases: 1,
      requestedOrders: 1,
      pendingListings: 0,
    })
    expect(seller.orders.asSeller).toHaveLength(1)
    expect(user.orders.asBuyer[0].listing?.id).toBe('cmb-002')
    expect(user.unreadThreadIds).toEqual([user.sentInquiries[0].submission.id])
    expect(user.summary.pendingListings).toBe(1)
    await acceptSubmission(
      'requestInquiry',
      { name: '利用者デモ', message: '積載方法は？' },
      { targetId: 'tj-01', userId: 'demo-user' },
    )
    const sellerAgain = await getAccountOverview('demo-seller')
    expect(sellerAgain.propertyRequests[0].inquiries).toHaveLength(1)
    const userAgain = await getAccountOverview('demo-user')
    expect(userAgain.sentJobInquiries).toHaveLength(1)
    expect(userAgain.sentJobInquiries[0].request?.id).toBe('tj-01')
  })

  it('is empty for a user with no activity', async () => {
    expect(await getAccountOverview('nobody')).toEqual({
      listings: [],
      propertyRequests: [],
      sentInquiries: [],
      sentApplications: [],
      replyCounts: {},
      leases: { asTenant: [], asOwner: [] },
      reviewedSources: {},
      unreadThreadIds: [],
      sentJobInquiries: [],
      agent: undefined,
      orders: { asBuyer: [], asSeller: [] },
      deals: [],
      summary: {
        unreadThreads: 0,
        openInquiries: 0,
        requestedLeases: 0,
        requestedOrders: 0,
        pendingListings: 0,
      },
    })
  })
})
