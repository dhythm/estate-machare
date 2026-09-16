import { seedLegacyRentalListings } from '@/test/legacy-listings'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listDealEvents, recordDealEvent } from './deal-events'
import { getListing } from './listings'
import { applyModeration } from './moderation'
import { requestOrder, updateOrderStatus } from './orders'
import { requestRental, updateRentalStatus } from './rentals'
import { resetStore } from './store'
import { acceptSubmission } from './submissions'
import { updateThreadStatus } from './threads'
import { createTransportJob, updateTransportJobStatus } from './transport'
import { demoAdmin, demoSeller, demoUser } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))

beforeEach(async () => {
  await resetStore()
  await seedLegacyRentalListings()
})

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
      (await getListing('trc-001'))!,
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

  it('records the rental lifecycle including the conversion order', async () => {
    const created = await requestRental(
      (await getListing('trc-001'))!,
      demoUser,
      {
        startDate: '2026-10-01',
        endDate: '2026-10-07',
      },
    )
    const id = created.ok ? created.value.id : ''
    await later()
    await updateRentalStatus(id, demoSeller, 'active')
    await later()
    await updateRentalStatus(id, demoUser, 'converted')
    expect((await listDealEvents('rental', id)).map((e) => e.status)).toEqual([
      'requested',
      'active',
      'converted',
    ])
  })

  it('records job creation, review, booking, haul, and completion', async () => {
    const job = await createTransportJob(
      {
        item: 'トラクター',
        from: '新潟県 長岡市',
        to: '新潟県 上越市',
        distanceKm: 40,
        weight: '約1.2t',
        desiredDate: '相談',
        reward: 14_000,
        contactEmail: 'seller@example.com',
      },
      'demo-seller',
    )
    await later()
    await applyModeration('transportJob', job.id, {
      status: 'approved',
      note: '掲載可',
    })
    await later()
    const { id: threadId } = await acceptSubmission(
      'transportApplication',
      {
        name: '利用者デモ',
        vehicle: '2tトラック',
        availableDate: '2026-10-03',
      },
      { targetId: job.id, userId: 'demo-user' },
    )
    await updateThreadStatus(threadId, demoSeller, 'agreed')
    await later()
    await updateTransportJobStatus(job.id, demoUser, '運搬中')
    await later()
    await updateTransportJobStatus(job.id, demoSeller, '完了')
    const events = await listDealEvents('transportJob', job.id)
    expect(events.map((e) => e.status)).toEqual([
      '募集中',
      'approved',
      '調整中',
      '運搬中',
      '完了',
    ])
    expect(events[1].note).toBe('掲載可')
    expect(events[2].actorUserId).toBe('demo-seller')
  })
})
