import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listDealEvents, recordDealEvent } from './deal-events'
import { getListing } from './listings'
import { applyModeration } from './moderation'
import { requestOrder, updateOrderStatus } from './orders'
import { requestLease, updateLeaseStatus } from './leases'
import { resetStore } from './store'
import { acceptSubmission } from './submissions'
import { updateThreadStatus } from './threads'
import {
  createPropertyRequest,
  updatePropertyRequestStatus,
} from './property-requests'
import { demoAdmin, demoSeller, demoUser } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))

beforeEach(() => resetStore())

const later = () => new Promise((resolve) => setTimeout(resolve, 3))

describe('deal events', () => {
  it('lists events of one deal oldest first', async () => {
    await recordDealEvent({
      dealKind: 'order',
      dealId: 'o-1',
      status: 'requested',
      actorUserId: 'demo-user',
    })
    await later()
    await recordDealEvent({
      dealKind: 'order',
      dealId: 'o-1',
      status: 'accepted',
      actorUserId: 'demo-seller',
    })
    await recordDealEvent({
      dealKind: 'order',
      dealId: 'o-2',
      status: 'requested',
    })
    const events = await listDealEvents('order', 'o-1')
    expect(events.map((e) => e.status)).toEqual(['requested', 'accepted'])
    expect(events[1].actorUserId).toBe('demo-seller')
  })

  it('records the order lifecycle', async () => {
    const created = await requestOrder(
      (await getListing('apt-001'))!,
      demoUser,
      { message: '現金で' },
    )
    const id = created.ok ? created.value.id : ''
    await later()
    await updateOrderStatus(id, demoSeller, 'accepted')
    await later()
    await updateOrderStatus(id, demoAdmin, 'cancelled')
    const events = await listDealEvents('order', id)
    expect(events.map((e) => [e.status, e.actorUserId])).toEqual([
      ['requested', 'demo-user'],
      ['accepted', 'demo-seller'],
      ['cancelled', 'demo-admin'],
    ])
    expect(events[0].note).toBe('現金で')
  })

  it('records the lease lifecycle including the conversion order', async () => {
    const created = await requestLease(
      (await getListing('apt-001'))!,
      demoUser,
      {
        startDate: '2026-10-01',
        endDate: '2026-10-07',
      },
    )
    const id = created.ok ? created.value.id : ''
    await later()
    await updateLeaseStatus(id, demoSeller, 'active')
    await later()
    await updateLeaseStatus(id, demoUser, 'converted')
    expect((await listDealEvents('lease', id)).map((e) => e.status)).toEqual([
      'requested',
      'active',
      'converted',
    ])
  })

  it('records request creation, review, booking, haul, and completion', async () => {
    const request = await createPropertyRequest(
      {
        title: '駅徒歩10分以内の2LDKを借りたい',
        deal: 'rent',
        category: 'マンション',
        layout: '2LDK',
        prefecture: '東京都',
        city: '世田谷区',
        budget: 14_000,
        moveInDate: '2026-12-01',
        contactEmail: 'seller@example.com',
      },
      'demo-seller',
    )
    await later()
    await applyModeration('propertyRequest', request.id, {
      status: 'approved',
      note: '掲載可',
    })
    await later()
    const { id: threadId } = await acceptSubmission(
      'requestProposal',
      {
        name: '利用者デモ',
        vehicle: 'マンション',
        availableDate: '2026-10-03',
      },
      { targetId: request.id, userId: 'demo-user' },
    )
    await updateThreadStatus(threadId, demoSeller, 'agreed')
    await later()
    await updatePropertyRequestStatus(request.id, demoUser, '紹介中')
    await later()
    await updatePropertyRequestStatus(request.id, demoSeller, '成約')
    const events = await listDealEvents('propertyRequest', request.id)
    expect(events.map((e) => e.status)).toEqual([
      '募集中',
      'approved',
      '調整中',
      '紹介中',
      '成約',
    ])
    expect(events[1].note).toBe('掲載可')
    expect(events[2].actorUserId).toBe('demo-seller')
  })
})
