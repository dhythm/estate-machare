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

const term = { startDate: '2026-10-01', endDate: '2027-09-30' }

async function request(listingId = 'apt-001', user = demoUser, range = term) {
  const listing = (await getListing(listingId))!
  return requestLease(listing, user, range)
}

describe('requestLease', () => {
  it('snapshots the listing terms and books the range', async () => {
    const result = await request()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toMatchObject({
      listingId: 'apt-001',
      tenantUserId: 'demo-user',
      ...term,
      months: 12,
      rentPerMonth: 268_000,
      rentTotal: 3_216_000,
      deposit: 536_000,
      keyMoney: 268_000,
      initialCost: 1_340_000,
      salePrice: 88_000_000,
      creditRate: 50,
      creditCap: 5_000_000,
      status: 'requested',
    })
    expect(await listBookedRanges('apt-001')).toEqual([term])
  })

  it('rejects overlapping ranges, owners, and listings without rent', async () => {
    await request()
    const overlap = await request('apt-001', demoUser, {
      startDate: '2027-09-30',
      endDate: '2028-09-29',
    })
    expect(!overlap.ok && overlap.reason).toBe('conflict')
    const later = await request('apt-001', demoUser, {
      startDate: '2027-10-01',
      endDate: '2028-09-30',
    })
    expect(later.ok).toBe(true)
    const own = await request('apt-001', demoSeller)
    expect(!own.ok && own.reason).toBe('forbidden')
    const saleOnly = await request('lnd-004')
    expect(!saleOnly.ok && saleOnly.reason).toBe('unavailable')
    const reversed = await request('apt-001', demoUser, {
      startDate: '2029-11-09',
      endDate: '2029-11-01',
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
      purchasePrice: 88_000_000 - 1_608_000,
    })
    expect(await listBookedRanges('apt-001')).toEqual([])
  })

  it('lets either side cancel a request and the owner complete a lease', async () => {
    const first = await request()
    const firstId = first.ok ? first.value.id : ''
    const cancelled = await updateLeaseStatus(firstId, demoUser, 'cancelled')
    expect(cancelled.ok && cancelled.value.status).toBe('cancelled')
    expect(await listBookedRanges('apt-001')).toEqual([])

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
    const created = await request('apt-003')
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
    expect((await updateLeaseStatus(id, demoAdmin, 'completed')).ok).toBe(false)
    const cancelled = await updateLeaseStatus(id, demoAdmin, 'cancelled')
    expect(cancelled.ok && cancelled.value.status).toBe('cancelled')
    expect(await listBookedRanges('apt-001')).toEqual([])
    const titles = async (userId: string) =>
      (await listNotifications(userId)).map((n) => n.title)
    expect(await titles('demo-user')).toContain(
      '賃貸借契約が「キャンセル」になりました',
    )
    expect(await titles('demo-seller')).toContain(
      '賃貸借契約が「キャンセル」になりました',
    )
  })
})

describe('lease lists', () => {
  it('lists leases for the tenant and for the listing owner with the listing', async () => {
    await request()
    const mine = await listLeasesForTenant('demo-user')
    expect(mine).toHaveLength(1)
    expect(mine[0].listing?.name).toContain('シティタワー')
    const incoming = await listLeasesForOwner('demo-seller')
    expect(incoming.map((item) => item.lease.listingId)).toEqual(['apt-001'])
    expect(await listLeasesForOwner('demo-user')).toEqual([])
  })
})
