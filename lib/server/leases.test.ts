import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listBookedRanges,
  listLeasesForOwner,
  listLeasesForTenant,
  requestLease,
  updateLeaseStatus,
} from './leases'
import { getListing } from './listings'
import { resetStore } from './store'
import { listNotifications } from './notifications'
import { demoAdmin, demoSeller, demoUser } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))

beforeEach(() => resetStore())

const week = { startDate: '2026-10-01', endDate: '2026-10-07' }

async function request(listingId = 'trc-001', user = demoUser, range = week) {
  const listing = (await getListing(listingId))!
  return requestLease(listing, user, range)
}

describe('requestLease', () => {
  it('snapshots the listing terms and books the range', async () => {
    const result = await request()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toMatchObject({
      listingId: 'trc-001',
      tenantUserId: 'demo-user',
      ...week,
      days: 7,
      rentPerMonth: 22_000,
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

describe('updateLeaseStatus', () => {
  it('follows the owner and tenant transitions', async () => {
    const created = await request()
    const id = created.ok ? created.value.id : ''
    expect((await updateLeaseStatus(id, demoUser, 'active')).ok).toBe(false)
    expect((await updateLeaseStatus(id, demoAdmin, 'active')).ok).toBe(false)
    const active = await updateLeaseStatus(id, demoSeller, 'active')
    expect(active.ok && active.value.status).toBe('active')
    expect((await updateLeaseStatus(id, demoSeller, 'requested')).ok).toBe(
      false,
    )
    expect((await updateLeaseStatus(id, demoSeller, 'converted')).ok).toBe(
      false,
    )
    const converted = await updateLeaseStatus(id, demoUser, 'converted')
    expect(converted.ok && converted.value).toMatchObject({
      status: 'converted',
      purchasePrice: 18_800_000 - 77_000,
    })
    expect(await listBookedRanges('trc-001')).toEqual([])
  })

  it('lets either side cancel a request and the owner complete a lease', async () => {
    const first = await request()
    const firstId = first.ok ? first.value.id : ''
    const cancelled = await updateLeaseStatus(firstId, demoUser, 'cancelled')
    expect(cancelled.ok && cancelled.value.status).toBe('cancelled')
    expect(await listBookedRanges('trc-001')).toEqual([])

    const second = await request()
    const secondId = second.ok ? second.value.id : ''
    await updateLeaseStatus(secondId, demoSeller, 'active')
    const done = await updateLeaseStatus(secondId, demoSeller, 'completed')
    expect(done.ok && done.value.status).toBe('completed')
    expect((await updateLeaseStatus('nope', demoSeller, 'active')).ok).toBe(
      false,
    )
  })

  it('blocks conversion when the listing is not purchase-option', async () => {
    const created = await request('til-004')
    expect(created.ok).toBe(true)
    const id = created.ok ? created.value.id : ''
    await updateLeaseStatus(id, demoSeller, 'active')
    const result = await updateLeaseStatus(id, demoUser, 'converted')
    expect(!result.ok && result.reason).toBe('transition')
  })
})

describe('admin cancellation', () => {
  it('lets an admin cancel a requested or active lease and notifies both sides', async () => {
    const created = await request()
    const id = created.ok ? created.value.id : ''
    await updateLeaseStatus(id, demoSeller, 'active')
    expect((await updateLeaseStatus(id, demoAdmin, 'completed')).ok).toBe(
      false,
    )
    const cancelled = await updateLeaseStatus(id, demoAdmin, 'cancelled')
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

describe('lease lists', () => {
  it('lists leases for the tenant and for the listing owner with the listing', async () => {
    await request()
    const mine = await listLeasesForTenant('demo-user')
    expect(mine).toHaveLength(1)
    expect(mine[0].listing?.name).toContain('クボタ')
    const incoming = await listLeasesForOwner('demo-seller')
    expect(incoming.map((item) => item.lease.listingId)).toEqual(['trc-001'])
    expect(await listLeasesForOwner('demo-user')).toEqual([])
  })
})
