// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Listing, PropertyRequest } from '@/lib/data'
import { createMemoryStore } from './memory'
import { createPgliteStore } from './pglite'
import type {
  AccountStatus,
  AgentProfile,
  DealEvent,
  Message,
  Notification,
  Order,
  Lease,
  Review,
  Store,
  Submission,
  ThreadRead,
} from './types'

vi.mock('server-only', () => ({}))

const listing = (id: string, name: string): Listing => ({
  id,
  name,
  category: 'マンション',
  zoning: '第一種住居地域',
  layout: '3LDK',
  floorArea: 74.2,
  builtYear: 2019,
  nearestStation: '小田急線 経堂駅',
  walkMinutes: 6,
  prefecture: '新潟県',
  city: '長岡市',
  image: '/properties/apartment.svg',
  summary: '説明',
  deals: ['sale', 'rent'],
  salePrice: 88_000_000,
  rentPerMonth: 22_000,
  purchaseOption: true,
  purchaseOptionCreditRate: 50,
  purchaseOptionCreditCap: 5_000_000,
  images: ['data:image/png;base64,iVBORw0KGgo='],
  seller: { name: '中村不動産', kind: '宅建業者', rating: 4.8, reviews: 34 },
  tags: ['キャビン付', '4WD'],
  createdAt: '2026-09-13T00:00:00.000Z',
  updatedAt: '2026-09-13T00:00:00.000Z',
  ownerUserId: 'demo-seller',
})

const request = (id: string): PropertyRequest => ({
  id,
  title: '駅徒歩10分以内の2LDKを借りたい',
  deal: 'rent',
  category: 'マンション',
  layout: '2LDK',
  prefecture: '東京都',
  city: '世田谷区',
  budget: 38_000,
  moveInDate: '2026-12-01',
  status: '募集中',
  ownerUserId: 'demo-seller',
})

const submission = (id: string): Submission => ({
  id,
  kind: 'contact',
  targetId: undefined,
  receivedAt: '2026-09-13T01:02:03.000Z',
  payload: { message: 'hello', nested: { count: 2 }, list: ['a'] },
  userId: 'demo-user',
})

const stores: { name: string; store: Store }[] = [
  { name: 'memory', store: createMemoryStore() },
  { name: 'pglite', store: createPgliteStore({ dataDir: 'memory://' }) },
]

afterAll(async () => {
  for (const { store } of stores) await store.close()
})

// Booting the embedded Postgres can exceed the default 5s under load.
describe.each(stores)('$name store', { timeout: 20_000 }, ({ store }) => {
  beforeEach(() => store.reset())

  it('is seeded with sample data in seed order', async () => {
    const listings = await store.listings.list()
    expect(listings.length).toBeGreaterThanOrEqual(48)
    expect(listings.slice(0, 3).map((item) => item.id)).toEqual([
      'apt-001',
      'hse-002',
      'apt-003',
    ])
    expect((await store.propertyRequests.list())[0].id).toBe('pr-01')
    expect(await store.submissions.list()).toEqual([])
  })

  it('round-trips a listing with every field', async () => {
    const created = await store.listings.create(listing('new-1', '新規'))
    expect(created).toEqual(listing('new-1', '新規'))
    expect(await store.listings.get('new-1')).toEqual(listing('new-1', '新規'))
    expect((await store.listings.list())[0].id).toBe('new-1')
  })

  it('stores optional listing fields as absent', async () => {
    const minimal: Listing = {
      ...listing('new-2', '最小'),
      deals: ['rent'],
      salePrice: undefined,
      purchaseOption: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    }
    const created = await store.listings.create(minimal)
    expect(created.salePrice).toBeUndefined()
    expect('salePrice' in created).toBe(false)
    expect(created.createdAt).toBeUndefined()
  })

  it('updates in place, keeps the id, and ignores unknown ids', async () => {
    const updated = await store.listings.update('apt-001', {
      name: '更新',
      seller: { name: 'X', kind: '法人', rating: 1.5, reviews: 2 },
      tags: [],
    })
    expect(updated).toMatchObject({
      id: 'apt-001',
      name: '更新',
      seller: { name: 'X', rating: 1.5 },
      tags: [],
      zoning: '第一種住居地域',
    })
    expect((await store.listings.get('apt-001'))?.name).toBe('更新')
    expect(
      await store.listings.update('missing', { name: 'x' }),
    ).toBeUndefined()
  })

  it('deletes and rejects duplicate ids', async () => {
    expect(await store.listings.delete('apt-001')).toBe(true)
    expect(await store.listings.delete('apt-001')).toBe(false)
    await expect(
      store.listings.create(listing('hse-002', 'dup')),
    ).rejects.toThrow()
  })

  it('round-trips moderation fields', async () => {
    const created = await store.listings.create({
      ...listing('mod-1', '審査'),
      moderationStatus: 'pending',
    })
    expect(created.moderationStatus).toBe('pending')
    const decided = await store.listings.update('mod-1', {
      moderationStatus: 'rejected',
      moderationNote: '写真が不足',
      moderatedAt: '2026-09-13T02:00:00.000Z',
    })
    expect(decided).toMatchObject({
      moderationStatus: 'rejected',
      moderationNote: '写真が不足',
      moderatedAt: '2026-09-13T02:00:00.000Z',
    })
  })

  it('round-trips property requests and submissions', async () => {
    expect(await store.propertyRequests.create(request('request-1'))).toEqual(
      request('request-1'),
    )
    expect(
      await store.propertyRequests.update('request-1', {
        status: '調整中',
        budget: 1,
      }),
    ).toMatchObject({
      status: '調整中',
      budget: 1,
      title: '駅徒歩10分以内の2LDKを借りたい',
    })

    await store.submissions.create(submission('s-1'))
    await store.submissions.create({
      ...submission('s-2'),
      kind: 'listingInquiry',
      targetId: 'apt-001',
    })
    const stored = await store.submissions.list()
    expect(stored.map((item) => item.id)).toEqual(['s-2', 's-1'])
    expect(stored[1]).toEqual(submission('s-1'))
    expect(stored[0].targetId).toBe('apt-001')
    expect(await store.submissions.delete('s-1')).toBe(true)
  })

  it('round-trips a submission status and messages', async () => {
    await store.submissions.create({ ...submission('s-3'), status: 'agreed' })
    expect((await store.submissions.get('s-3'))?.status).toBe('agreed')
    expect(
      (await store.submissions.update('s-3', { status: 'declined' }))?.status,
    ).toBe('declined')

    const message: Message = {
      id: 'm-1',
      threadId: 's-3',
      senderUserId: 'demo-seller',
      body: 'ご連絡ありがとうございます。',
      createdAt: '2026-09-13T03:00:00.000Z',
    }
    expect(await store.messages.create(message)).toEqual(message)
    await store.messages.create({ ...message, id: 'm-2', body: '二通目' })
    expect((await store.messages.list()).map((item) => item.id)).toEqual([
      'm-2',
      'm-1',
    ])
    expect(await store.messages.delete('m-1')).toBe(true)
    await store.reset()
    expect(await store.messages.list()).toEqual([])
  })

  it('round-trips leases', async () => {
    const lease: Lease = {
      id: 'r-1',
      listingId: 'apt-001',
      tenantUserId: 'demo-user',
      startDate: '2026-10-01',
      endDate: '2026-10-07',
      months: 7,

      deposit: 0,

      keyMoney: 0,

      initialCost: 0,
      rentPerMonth: 22_000,
      rentTotal: 154_000,
      salePrice: 88_000_000,
      creditRate: 50,
      creditCap: 5_000_000,
      status: 'requested',
      createdAt: '2026-09-13T04:00:00.000Z',
      updatedAt: '2026-09-13T04:00:00.000Z',
    }
    expect(await store.leases.create(lease)).toEqual(lease)
    expect(
      await store.leases.update('r-1', {
        status: 'converted',
        purchasePrice: 18_723_000,
      }),
    ).toMatchObject({ status: 'converted', purchasePrice: 18_723_000 })
    await store.leases.create({
      ...lease,
      id: 'r-2',
      salePrice: undefined,
      creditCap: undefined,
    })
    const second = await store.leases.get('r-2')
    expect(second?.salePrice).toBeUndefined()
    expect(second?.creditCap).toBeUndefined()
    await store.reset()
    expect(await store.leases.list()).toEqual([])
  })

  it('round-trips account statuses keyed by user id', async () => {
    const status: AccountStatus = {
      id: 'demo-user',
      status: 'suspended',
      note: '規約違反',
      updatedAt: '2026-09-13T05:00:00.000Z',
    }
    expect(await store.accountStatuses.create(status)).toEqual(status)
    expect(
      (await store.accountStatuses.update('demo-user', { status: 'active' }))
        ?.status,
    ).toBe('active')
    await store.reset()
    expect(await store.accountStatuses.list()).toEqual([])
  })

  it('round-trips notifications', async () => {
    const notification: Notification = {
      id: 'n-1',
      userId: 'demo-seller',
      kind: 'inquiry',
      title: '問い合わせが届きました',
      body: 'クボタ 45馬力',
      href: '/account/threads/t-1',
      createdAt: '2026-09-13T06:00:00.000Z',
    }
    expect(await store.notifications.create(notification)).toEqual(notification)
    expect(
      (
        await store.notifications.update('n-1', {
          readAt: '2026-09-13T06:05:00.000Z',
        })
      )?.readAt,
    ).toBe('2026-09-13T06:05:00.000Z')
    await store.reset()
    expect(await store.notifications.list()).toEqual([])
  })

  it('round-trips reviews', async () => {
    const review: Review = {
      id: 'rv-1',
      listingId: 'apt-001',
      sellerUserId: 'demo-seller',
      reviewerUserId: 'demo-user',
      sourceKind: 'lease',
      sourceId: 'r-1',
      rating: 5,
      comment: '整備が行き届いていました',
      createdAt: '2026-09-13T07:00:00.000Z',
    }
    expect(await store.reviews.create(review)).toEqual(review)
    await store.reviews.create({ ...review, id: 'rv-2', comment: undefined })
    expect((await store.reviews.get('rv-2'))?.comment).toBeUndefined()
    await store.reset()
    expect(await store.reviews.list()).toEqual([])
  })

  it('round-trips thread reads', async () => {
    const read: ThreadRead = {
      id: 't-1:demo-user',
      threadId: 't-1',
      userId: 'demo-user',
      readAt: '2026-09-13T08:00:00.000Z',
    }
    expect(await store.threadReads.create(read)).toEqual(read)
    expect(
      (
        await store.threadReads.update('t-1:demo-user', {
          readAt: '2026-09-13T09:00:00.000Z',
        })
      )?.readAt,
    ).toBe('2026-09-13T09:00:00.000Z')
    await store.reset()
    expect(await store.threadReads.list()).toEqual([])
  })

  it('round-trips agent profiles', async () => {
    const profile: AgentProfile = {
      id: 'demo-user',
      name: '高橋運送',
      kind: '法人',
      prefecture: '秋田県',
      handledCategories: ['マンション'],
      serviceAreas: ['秋田県', '山形県'],
      note: '週末対応可',
      createdAt: '2026-09-13T09:00:00.000Z',
      updatedAt: '2026-09-13T09:00:00.000Z',
    }
    expect(await store.agentProfiles.create(profile)).toEqual(profile)
    expect(
      (await store.agentProfiles.update('demo-user', { note: undefined }))
        ?.note,
    ).toBeUndefined()
    await store.reset()
    expect(await store.agentProfiles.list()).toEqual([])
  })

  it('round-trips orders', async () => {
    const order: Order = {
      id: 'o-1',
      listingId: 'apt-001',
      buyerUserId: 'demo-user',
      sellerUserId: 'demo-seller',
      price: 88_000_000,
      status: 'requested',
      message: '現金で',
      createdAt: '2026-09-13T10:00:00.000Z',
      updatedAt: '2026-09-13T10:00:00.000Z',
    }
    expect(await store.orders.create(order)).toEqual(order)
    await store.orders.create({
      ...order,
      id: 'o-2',
      message: undefined,
      sourceLeaseId: 'r-1',
      status: 'delivered',
    })
    const second = await store.orders.get('o-2')
    expect(second?.message).toBeUndefined()
    expect(second?.sourceLeaseId).toBe('r-1')
    expect(
      (await store.orders.update('o-1', { status: 'accepted' }))?.status,
    ).toBe('accepted')
    await store.reset()
    expect(await store.orders.list()).toEqual([])
  })

  it('round-trips deal events', async () => {
    const event: DealEvent = {
      id: 'e-1',
      dealKind: 'order',
      dealId: 'o-1',
      actorUserId: 'demo-user',
      status: 'requested',
      note: '現金で',
      createdAt: '2026-09-13T11:00:00.000Z',
    }
    expect(await store.dealEvents.create(event)).toEqual(event)
    await store.dealEvents.create({
      ...event,
      id: 'e-2',
      actorUserId: undefined,
      note: undefined,
    })
    expect((await store.dealEvents.get('e-2'))?.actorUserId).toBeUndefined()
    await store.reset()
    expect(await store.dealEvents.list()).toEqual([])
  })

  it('does not let callers mutate stored data through returned objects', async () => {
    const first = (await store.listings.get('apt-001'))!
    first.tags.push('hacked')
    expect((await store.listings.get('apt-001'))?.tags).not.toContain('hacked')
  })
})
