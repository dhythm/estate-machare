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
  category: 'マンション',
  zoning: '第一種住居地域',
  layout: '3LDK',
  floorArea: 74.2,
  builtYear: 2019,
  nearestStation: '小田急線 経堂駅',
  walkMinutes: 6,
  prefecture: '新潟県',
  city: '長岡市',
  deals: ['sale'],
  salePrice: 1_000_000,
  purchaseOption: false,
  summary: '説明',
  sellerName: '利用者デモ',
  sellerKind: '個人',
  contactEmail: 'user@example.com',
}

const jobInput: PropertyRequestInput = {
  title: '駅徒歩10分以内の2LDKを借りたい',
  deal: 'rent',
  category: 'マンション',
  layout: '2LDK',
  prefecture: '東京都',
  city: '世田谷区',
  budget: 14_000,
  moveInDate: '2026-12-01',
  contactEmail: 'user@example.com',
}

describe('getAccountOverview', () => {
  it('collects what the user owns and what they sent, with what came in', async () => {
    await acceptSubmission(
      'listingInquiry',
      { mode: 'rent', name: '利用者デモ', message: '借りたい' },
      { targetId: 'apt-001', userId: 'demo-user' },
    )
    await acceptSubmission(
      'requestProposal',
      { name: '利用者デモ', vehicle: 'マンション' },
      { targetId: 'pr-01', userId: 'demo-user' },
    )
    await acceptSubmission(
      'listingInquiry',
      { mode: 'buy', name: '匿名', message: '昔の問い合わせ' },
      { targetId: 'apt-001' },
    )
    await addMessage(
      (await getAccountOverviewSentInquiryId()) ?? '',
      demoSeller,
      '在庫あります',
    )
    await requestLease((await getListing('apt-001'))!, demoUser, {
      startDate: '2026-10-01',
      endDate: '2026-10-07',
    })
    await requestOrder((await getListing('hse-002'))!, demoUser, {})
    const mine = await createListing(listingInput, 'demo-user')
    const myJob = await createPropertyRequest(jobInput, 'demo-user')

    const seller = await getAccountOverview('demo-seller')
    expect(seller.listings.map((item) => item.listing.id)).toContain('apt-001')
    expect(seller.listings.map((item) => item.listing.id)).not.toContain(
      mine.id,
    )
    const trc001 = seller.listings.find((item) => item.listing.id === 'apt-001')
    expect(trc001?.inquiries.map((inquiry) => inquiry.payload.message)).toEqual(
      ['借りたい', '昔の問い合わせ'],
    )
    expect(seller.propertyRequests.map((item) => item.request.id)).toEqual([
      'pr-01',
      'pr-02',
    ])
    expect(seller.propertyRequests[0].applications).toHaveLength(1)
    expect(seller.sentInquiries).toEqual([])
    expect(seller.sentApplications).toEqual([])

    const user = await getAccountOverview('demo-user')
    expect(user.listings.map((item) => item.listing.id)).toEqual([mine.id])
    expect(user.listings[0].inquiries).toEqual([])
    expect(user.propertyRequests.map((item) => item.request.id)).toEqual([
      myJob.id,
    ])
    expect(user.sentInquiries).toHaveLength(1)
    expect(user.sentInquiries[0].listing?.id).toBe('apt-001')
    expect(user.sentApplications).toHaveLength(1)
    expect(user.sentApplications[0].request?.id).toBe('pr-01')
    expect(user.replyCounts).toEqual({
      [user.sentInquiries[0].submission.id]: 1,
    })
    expect(user.leases.asTenant.map((item) => item.lease.listingId)).toEqual([
      'apt-001',
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
    expect(user.orders.asBuyer[0].listing?.id).toBe('hse-002')
    expect(user.unreadThreadIds).toEqual([user.sentInquiries[0].submission.id])
    expect(user.summary.pendingListings).toBe(1)
    await acceptSubmission(
      'requestInquiry',
      { name: '利用者デモ', message: '積載方法は？' },
      { targetId: 'pr-01', userId: 'demo-user' },
    )
    const sellerAgain = await getAccountOverview('demo-seller')
    expect(sellerAgain.propertyRequests[0].inquiries).toHaveLength(1)
    const userAgain = await getAccountOverview('demo-user')
    expect(userAgain.sentJobInquiries).toHaveLength(1)
    expect(userAgain.sentJobInquiries[0].request?.id).toBe('pr-01')
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
