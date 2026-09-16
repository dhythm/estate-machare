import { seedLegacyRentalListings } from '@/test/legacy-listings'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listDealEvents, recordDealEvent } from './deal-events'
import { getListing } from './listings'
import { requestOrder, updateOrderStatus } from './orders'
import { requestRental, updateRentalStatus } from './rentals'
import { resetStore } from './store'
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
})
