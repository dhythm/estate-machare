import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDeal, listDealsForUser } from './deals'
import { getListing } from './listings'
import { requestOrder, updateOrderStatus } from './orders'
import { requestLease, updateLeaseStatus } from './leases'
import { resetStore } from './store'
import { acceptSubmission } from './submissions'
import { updateThreadStatus } from './threads'
import { demoAdmin, demoSeller, demoUser } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))

beforeEach(() => resetStore())

describe('getDeal', () => {
  it('summarizes an order for its parties and admins with events and related threads', async () => {
    await acceptSubmission(
      'listingInquiry',
      { mode: 'buy', name: '利用者デモ', message: '現物を見たい' },
      { targetId: 'apt-001', userId: 'demo-user' },
    )
    const created = await requestOrder(
      (await getListing('apt-001'))!,
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
      title: expect.stringContaining('シティタワー'),
      href: '/listings/apt-001',
      amount: 88_000_000,
      status: 'accepted',
      statusLabel: '承諾',
      role: '買い手',
      counterpart: '出品者デモ',
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

  it('links a converted lease and its order both ways', async () => {
    const lease = await requestLease((await getListing('apt-001'))!, demoUser, {
      startDate: '2026-10-01',
      endDate: '2026-10-07',
    })
    const leaseId = lease.ok ? lease.value.id : ''
    await updateLeaseStatus(leaseId, demoSeller, 'active')
    await updateLeaseStatus(leaseId, demoUser, 'converted')
    const deal = await getDeal('lease', leaseId, demoUser)
    expect(deal.ok && deal.value.relatedDeals.map((d) => d.kind)).toEqual([
      'order',
    ])
    const orderId = deal.ok ? deal.value.relatedDeals[0].id : ''
    const order = await getDeal('order', orderId, demoSeller)
    expect(order.ok && order.value.relatedDeals.map((d) => d.id)).toEqual([
      leaseId,
    ])
  })

  it('exposes a property request to its owner and the agreed agent', async () => {
    const { id: threadId } = await acceptSubmission(
      'requestProposal',
      {
        name: '利用者デモ',
        vehicle: 'マンション',
        availableDate: '2026-10-03',
      },
      { targetId: 'pr-01', userId: 'demo-user' },
    )
    expect((await getDeal('propertyRequest', 'pr-01', demoUser)).ok).toBe(false)
    await updateThreadStatus(threadId, demoSeller, 'agreed')
    const asAgent = await getDeal('propertyRequest', 'pr-01', demoUser)
    expect(asAgent.ok && asAgent.value.summary).toMatchObject({
      title: expect.stringContaining('2LDK'),
      href: '/requests/pr-01',
      status: '調整中',
      role: '担当者',
      amount: 220_000,
    })
  })
})

describe('listDealsForUser', () => {
  it('lists every deal the user is part of, newest first', async () => {
    await requestOrder((await getListing('hse-002'))!, demoUser, {})
    await new Promise((resolve) => setTimeout(resolve, 3))
    await requestLease((await getListing('apt-001'))!, demoUser, {
      startDate: '2026-10-01',
      endDate: '2026-10-02',
    })
    const mine = await listDealsForUser('demo-user')
    expect(mine.map((d) => d.kind)).toEqual(['lease', 'order'])
    const seller = await listDealsForUser('demo-seller')
    expect(seller.map((d) => d.kind).sort()).toEqual([
      'lease',
      'order',
      'propertyRequest',
      'propertyRequest',
    ])
    expect(await listDealsForUser('nobody')).toEqual([])
  })
})
