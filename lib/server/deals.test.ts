import { seedLegacyRentalListings } from '@/test/legacy-listings'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDeal, listDealsForUser } from './deals'
import { getListing } from './listings'
import { requestOrder, updateOrderStatus } from './orders'
import { requestRental, updateRentalStatus } from './rentals'
import { resetStore } from './store'
import { acceptSubmission } from './submissions'
import { updateThreadStatus } from './threads'
import { demoAdmin, demoSeller, demoUser } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))

beforeEach(async () => {
  await resetStore()
  await seedLegacyRentalListings()
})

describe('getDeal', () => {
  it('summarizes an order for its parties and admins with events and related threads', async () => {
    await acceptSubmission(
      'listingInquiry',
      { mode: 'buy', name: '利用者デモ', message: '現物を見たい' },
      { targetId: 'trc-001', userId: 'demo-user' },
    )
    const created = await requestOrder(
      (await getListing('trc-001'))!,
      demoUser,
      { message: '現金で' },
    )
    const id = created.ok ? created.value.id : ''
    await updateOrderStatus(id, demoSeller, 'accepted')
    const asBuyer = await getDeal('order', id, demoUser)
    expect(asBuyer.ok).toBe(true)
    if (!asBuyer.ok) return
    expect(asBuyer.value.summary).toMatchObject({
      kind: 'order',
      title: expect.stringContaining('南向き'),
      href: '/listings/trc-001',
      amount: 18_800_000,
      status: 'accepted',
      statusLabel: '承諾',
      role: '買い手',
      counterpart: '掲載者デモ',
    })
    expect(asBuyer.value.events.map((e) => e.statusLabel)).toEqual([
      '申込中',
      '承諾',
    ])
    expect(asBuyer.value.events[0].actorName).toBe('利用者デモ')
    expect(asBuyer.value.relatedThreads).toHaveLength(1)
    expect(asBuyer.value.relatedThreads[0].label).toBe('問い合わせ')
    expect((await getDeal('order', id, demoSeller)).ok).toBe(true)
    expect((await getDeal('order', id, demoAdmin)).ok).toBe(true)
    const stranger = await getDeal('order', id, { ...demoUser, id: 'stranger' })
    expect(!stranger.ok && stranger.reason).toBe('forbidden')
    const missing = await getDeal('order', 'nope', demoUser)
    expect(!missing.ok && missing.reason).toBe('not_found')
  })

  it('links a converted rental and its order both ways', async () => {
    const rental = await requestRental(
      (await getListing('trc-001'))!,
      demoUser,
      {
        startDate: '2026-10-01',
        endDate: '2026-10-07',
      },
    )
    const rentalId = rental.ok ? rental.value.id : ''
    await updateRentalStatus(rentalId, demoSeller, 'active')
    await updateRentalStatus(rentalId, demoUser, 'converted')
    const deal = await getDeal('rental', rentalId, demoUser)
    expect(deal.ok && deal.value.relatedDeals.map((d) => d.kind)).toEqual([
      'order',
    ])
    const orderId = deal.ok ? deal.value.relatedDeals[0].id : ''
    const order = await getDeal('order', orderId, demoSeller)
    expect(order.ok && order.value.relatedDeals.map((d) => d.id)).toEqual([
      rentalId,
    ])
  })

  it('exposes a transport job to its owner and the agreed carrier', async () => {
    const { id: threadId } = await acceptSubmission(
      'transportApplication',
      {
        name: '利用者デモ',
        vehicle: '2tトラック',
        availableDate: '2026-10-03',
      },
      { targetId: 'tj-01', userId: 'demo-user' },
    )
    expect((await getDeal('transportJob', 'tj-01', demoUser)).ok).toBe(false)
    await updateThreadStatus(threadId, demoSeller, 'agreed')
    const asCarrier = await getDeal('transportJob', 'tj-01', demoUser)
    expect(asCarrier.ok && asCarrier.value.summary).toMatchObject({
      title: expect.stringContaining('引越し'),
      href: '/transport/tj-01',
      status: '調整中',
      role: '引越しパートナー',
      amount: 38_000,
    })
  })
})

describe('listDealsForUser', () => {
  it('lists every deal the user is part of, newest first', async () => {
    await requestOrder((await getListing('cmb-002'))!, demoUser, {})
    await new Promise((resolve) => setTimeout(resolve, 3))
    await requestRental((await getListing('trc-001'))!, demoUser, {
      startDate: '2026-10-01',
      endDate: '2026-10-02',
    })
    const mine = await listDealsForUser('demo-user')
    expect(mine.map((d) => d.kind)).toEqual(['rental', 'order'])
    const seller = await listDealsForUser('demo-seller')
    expect(seller.map((d) => d.kind).sort()).toEqual([
      'order',
      'rental',
      'transportJob',
      'transportJob',
    ])
    expect(await listDealsForUser('nobody')).toEqual([])
  })
})
