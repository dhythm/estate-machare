import { seedLegacyRentalListings } from '@/test/legacy-listings'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listOrdersForBuyer,
  listOrdersForSeller,
  requestOrder,
  updateOrderStatus,
} from './orders'
import { getListing } from './listings'
import { listNotifications } from './notifications'
import { requestRental, updateRentalStatus } from './rentals'
import { createReview, reviewableSources } from './reviews'
import { resetStore } from './store'
import { demoAdmin, demoSeller, demoUser } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))

beforeEach(async () => {
  await resetStore()
  await seedLegacyRentalListings()
})

const titles = async (userId: string) =>
  (await listNotifications(userId)).map((n) => n.title)

async function request(
  listingId = 'trc-001',
  user = demoUser,
  message?: string,
) {
  return requestOrder((await getListing(listingId))!, user, { message })
}

describe('requestOrder', () => {
  it('snapshots the price, notifies the seller, and blocks a second open order', async () => {
    const created = await request('trc-001', demoUser, '現金で')
    expect(created.ok && created.value).toMatchObject({
      listingId: 'trc-001',
      buyerUserId: 'demo-user',
      sellerUserId: 'demo-seller',
      price: 18_800_000,
      status: 'requested',
      message: '現金で',
    })
    expect(await titles('demo-seller')).toEqual(['購入の申込が届きました'])
    const again = await request('trc-001', demoUser)
    expect(!again.ok && again.reason).toBe('conflict')
  })

  it('refuses the owner, listings without a sale price, and unpublished listings', async () => {
    const own = await request('trc-001', demoSeller)
    expect(!own.ok && own.reason).toBe('forbidden')
    const rentOnly = await request('drn-005')
    expect(!rentOnly.ok && rentOnly.reason).toBe('unavailable')
  })
})

describe('updateOrderStatus', () => {
  it('walks accept → deliver → complete and withdraws the listing at the end', async () => {
    const created = await request()
    const id = created.ok ? created.value.id : ''
    expect((await updateOrderStatus(id, demoUser, 'accepted')).ok).toBe(false)
    const accepted = await updateOrderStatus(id, demoSeller, 'accepted')
    expect(accepted.ok && accepted.value.status).toBe('accepted')
    expect(await titles('demo-user')).toContain('購入が「承諾」になりました')
    expect((await updateOrderStatus(id, demoUser, 'completed')).ok).toBe(false)
    const delivered = await updateOrderStatus(id, demoSeller, 'delivered')
    expect(delivered.ok && delivered.value.status).toBe('delivered')
    expect((await updateOrderStatus(id, demoSeller, 'completed')).ok).toBe(
      false,
    )
    const completed = await updateOrderStatus(id, demoUser, 'completed')
    expect(completed.ok && completed.value.status).toBe('completed')
    expect(await titles('demo-seller')).toContain('購入が「完了」になりました')
    expect((await getListing('trc-001'))?.withdrawnAt).toEqual(
      expect.any(String),
    )
  })

  it('lets the buyer cancel a request, the seller decline, and an admin cancel later', async () => {
    const first = await request()
    const firstId = first.ok ? first.value.id : ''
    expect((await updateOrderStatus(firstId, demoUser, 'cancelled')).ok).toBe(
      true,
    )
    const second = await request()
    const secondId = second.ok ? second.value.id : ''
    expect(
      (await updateOrderStatus(secondId, demoSeller, 'cancelled')).ok,
    ).toBe(true)
    const third = await request()
    const thirdId = third.ok ? third.value.id : ''
    await updateOrderStatus(thirdId, demoSeller, 'accepted')
    expect((await updateOrderStatus(thirdId, demoUser, 'cancelled')).ok).toBe(
      false,
    )
    const byAdmin = await updateOrderStatus(thirdId, demoAdmin, 'cancelled')
    expect(byAdmin.ok && byAdmin.value.status).toBe('cancelled')
    expect((await updateOrderStatus('nope', demoAdmin, 'cancelled')).ok).toBe(
      false,
    )
  })
})

describe('rental conversion', () => {
  it('creates a delivered order from the rental terms', async () => {
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
    const orders = await listOrdersForBuyer('demo-user')
    expect(orders).toHaveLength(1)
    expect(orders[0].order).toMatchObject({
      status: 'delivered',
      price: 18_800_000 - 77_000,
      sourceRentalId: rentalId,
    })
    expect(orders[0].listing?.id).toBe('trc-001')
    expect(
      (await listOrdersForSeller('demo-seller')).map((o) => o.order.id),
    ).toEqual([orders[0].order.id])
  })
})

describe('order reviews', () => {
  it('lets the buyer review a completed order', async () => {
    const created = await request()
    const id = created.ok ? created.value.id : ''
    await updateOrderStatus(id, demoSeller, 'accepted')
    await updateOrderStatus(id, demoSeller, 'delivered')
    expect((await reviewableSources(demoUser)).orders).toEqual([])
    await updateOrderStatus(id, demoUser, 'completed')
    expect((await reviewableSources(demoUser)).orders).toEqual([id])
    const review = await createReview(demoUser, {
      sourceKind: 'order',
      sourceId: id,
      rating: 5,
    })
    expect(review.ok && review.value.sellerUserId).toBe('demo-seller')
  })
})
