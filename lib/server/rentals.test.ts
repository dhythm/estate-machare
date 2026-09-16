import { seedLegacyRentalListings } from '@/test/legacy-listings'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listBookedRanges,
  listRentalsForOwner,
  listRentalsForRenter,
  requestRental,
  updateRentalStatus,
} from './rentals'
import { getListing } from './listings'
import { resetStore } from './store'
import { listNotifications } from './notifications'
import { demoAdmin, demoSeller, demoUser } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))

beforeEach(async () => {
  await resetStore()
  await seedLegacyRentalListings()
})

const week = { startDate: '2026-10-01', endDate: '2026-10-07' }

async function request(listingId = 'trc-001', user = demoUser, range = week) {
  const listing = (await getListing(listingId))!
  return requestRental(listing, user, range)
}

describe('requestRental', () => {
  it('snapshots the listing terms and books the range', async () => {
    const result = await request()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toMatchObject({
      listingId: 'trc-001',
      renterUserId: 'demo-user',
      ...week,
      days: 7,
      rentPerDay: 22_000,
      rentTotal: 154_000,
      salePrice: 18_800_000,
      creditRate: 50,
      creditCap: 5_000_000,
      status: 'requested',
    })
    expect(await listBookedRanges('trc-001')).toEqual([week])
  })

  it('rejects overlapping ranges, owners, and listings without rent', async () => {
    await request()
    const overlap = await request('trc-001', demoUser, {
      startDate: '2026-10-07',
      endDate: '2026-10-09',
    })
    expect(!overlap.ok && overlap.reason).toBe('conflict')
    const later = await request('trc-001', demoUser, {
      startDate: '2026-10-08',
      endDate: '2026-10-09',
    })
    expect(later.ok).toBe(true)
    const own = await request('trc-001', demoSeller)
    expect(!own.ok && own.reason).toBe('forbidden')
    const saleOnly = await request('trc-006')
    expect(!saleOnly.ok && saleOnly.reason).toBe('unavailable')
    const reversed = await request('trc-001', demoUser, {
      startDate: '2026-11-09',
      endDate: '2026-11-01',
    })
    expect(!reversed.ok && reversed.reason).toBe('invalid')
  })
})

describe('updateRentalStatus', () => {
  it('follows the owner and renter transitions', async () => {
    const created = await request()
    const id = created.ok ? created.value.id : ''
    expect((await updateRentalStatus(id, demoUser, 'active')).ok).toBe(false)
    expect((await updateRentalStatus(id, demoAdmin, 'active')).ok).toBe(false)
    const active = await updateRentalStatus(id, demoSeller, 'active')
    expect(active.ok && active.value.status).toBe('active')
    expect((await updateRentalStatus(id, demoSeller, 'requested')).ok).toBe(
      false,
    )
    expect((await updateRentalStatus(id, demoSeller, 'converted')).ok).toBe(
      false,
    )
    const converted = await updateRentalStatus(id, demoUser, 'converted')
    expect(converted.ok && converted.value).toMatchObject({
      status: 'converted',
      purchasePrice: 18_800_000 - 77_000,
    })
    expect(await listBookedRanges('trc-001')).toEqual([])
  })

  it('lets either side cancel a request and the owner complete a rental', async () => {
    const first = await request()
    const firstId = first.ok ? first.value.id : ''
    const cancelled = await updateRentalStatus(firstId, demoUser, 'cancelled')
    expect(cancelled.ok && cancelled.value.status).toBe('cancelled')
    expect(await listBookedRanges('trc-001')).toEqual([])

    const second = await request()
    const secondId = second.ok ? second.value.id : ''
    await updateRentalStatus(secondId, demoSeller, 'active')
    const done = await updateRentalStatus(secondId, demoSeller, 'completed')
    expect(done.ok && done.value.status).toBe('completed')
    expect((await updateRentalStatus('nope', demoSeller, 'active')).ok).toBe(
      false,
    )
  })

  it('blocks conversion when the listing is not rent-to-own', async () => {
    const created = await request('til-004')
    expect(created.ok).toBe(true)
    const id = created.ok ? created.value.id : ''
    await updateRentalStatus(id, demoSeller, 'active')
    const result = await updateRentalStatus(id, demoUser, 'converted')
    expect(!result.ok && result.reason).toBe('transition')
  })
})

describe('admin cancellation', () => {
  it('lets an admin cancel a requested or active rental and notifies both sides', async () => {
    const created = await request()
    const id = created.ok ? created.value.id : ''
    await updateRentalStatus(id, demoSeller, 'active')
    expect((await updateRentalStatus(id, demoAdmin, 'completed')).ok).toBe(
      false,
    )
    const cancelled = await updateRentalStatus(id, demoAdmin, 'cancelled')
    expect(cancelled.ok && cancelled.value.status).toBe('cancelled')
    expect(await listBookedRanges('trc-001')).toEqual([])
    const titles = async (userId: string) =>
      (await listNotifications(userId)).map((n) => n.title)
    expect(await titles('demo-user')).toContain(
      'レンタルが「キャンセル」になりました',
    )
    expect(await titles('demo-seller')).toContain(
      'レンタルが「キャンセル」になりました',
    )
  })
})

describe('rental lists', () => {
  it('lists rentals for the renter and for the listing owner with the listing', async () => {
    await request()
    const mine = await listRentalsForRenter('demo-user')
    expect(mine).toHaveLength(1)
    expect(mine[0].listing?.name).toContain('南向き')
    const incoming = await listRentalsForOwner('demo-seller')
    expect(incoming.map((item) => item.rental.listingId)).toEqual(['trc-001'])
    expect(await listRentalsForOwner('demo-user')).toEqual([])
  })
})
