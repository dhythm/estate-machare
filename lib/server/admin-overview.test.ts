import { seedLegacyRentalListings } from '@/test/legacy-listings'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getAdminCounts,
  listAccountSummaries,
  listAllRentals,
  listRecentActivity,
  listThreadSummaries,
} from './admin-overview'
import { getListing } from './listings'
import { requestRental } from './rentals'
import { resetStore } from './store'
import { acceptSubmission } from './submissions'
import { addMessage } from './threads'
import { createListing } from './listings'
import { setAccountStatus } from './auth/account-status'
import { requestOrder } from './orders'
import { demoSeller, demoUser } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))

beforeEach(async () => {
  vi.stubEnv('NODE_ENV', 'test')
  await resetStore()
  await seedLegacyRentalListings()
})

async function seedActivity() {
  const inquiry = await acceptSubmission(
    'listingInquiry',
    { mode: 'rent', name: '利用者デモ', message: '借りたい' },
    { targetId: 'trc-001', userId: 'demo-user' },
  )
  await addMessage(inquiry.id, demoSeller, '在庫あります')
  await acceptSubmission('contact', { message: 'hello' })
  await requestRental((await getListing('trc-001'))!, demoUser, {
    startDate: '2026-10-01',
    endDate: '2026-10-07',
  })
  await createListing(
    {
      name: '審査中',
      category: 'マンション',
      maker: 'クボタ',
      year: 2018,
      hours: 500,
      condition: '目立った傷なし',
      prefecture: '新潟県',
      city: '長岡市',
      deals: ['sale'],
      salePrice: 1_000_000,
      rentToOwn: false,
      images: [],
      summary: '説明',
      sellerName: '掲載者デモ',
      sellerKind: '不動産会社',
      contactEmail: 'seller@example.com',
    },
    'demo-seller',
  )
  return inquiry.id
}

describe('getAdminCounts', () => {
  it('counts what needs attention', async () => {
    await seedActivity()
    await requestOrder((await getListing('cmb-002'))!, demoUser, {})
    expect(await getAdminCounts()).toEqual({
      pendingListings: 1,
      requestedRentals: 1,
      activeRentals: 0,
      requestedOrders: 1,
      openThreads: 1,
    })
  })
})

describe('recent activity', () => {
  it('resolves the newest deal events to titles, actors, and history links', async () => {
    await seedActivity()
    await requestOrder((await getListing('cmb-002'))!, demoUser, {
      message: '現金で',
    })
    const activity = await listRecentActivity(8)
    expect(activity[0]).toMatchObject({
      kind: 'order',
      title: expect.stringContaining('一戸建て'),
      statusLabel: '申込中',
      actorName: '利用者デモ',
    })
    expect(activity[0].href).toMatch(/^\/account\/deals\/order\//)
    expect(
      activity.some(
        (item) => item.kind === 'rental' && item.statusLabel === '申込中',
      ),
    ).toBe(true)
    expect(activity.length).toBeLessThanOrEqual(8)
  })
})

describe('lists', () => {
  it('lists every rental with its listing', async () => {
    await seedActivity()
    const rentals = await listAllRentals()
    expect(rentals).toHaveLength(1)
    expect(rentals[0].listing?.id).toBe('trc-001')
    expect(rentals[0].rental.status).toBe('requested')
  })

  it('summarizes threads with target, sender, status, and reply count', async () => {
    const id = await seedActivity()
    const threads = await listThreadSummaries('listingInquiry')
    expect(threads).toHaveLength(1)
    expect(threads[0]).toMatchObject({
      id,
      targetName: expect.stringContaining('南向き'),
      senderName: '利用者デモ',
      status: 'new',
      replyCount: 1,
    })
  })

  it('summarizes accounts with their activity', async () => {
    await seedActivity()
    const accounts = await listAccountSummaries()
    expect(accounts.slice(0, 3).map((account) => account.id)).toEqual([
      'demo-admin',
      'demo-seller',
      'demo-user',
    ])
    expect(accounts.length).toBeGreaterThan(3)
    const seller = accounts.find((account) => account.id === 'demo-seller')
    expect(seller).toMatchObject({
      role: 'user',
      listingCount: 45,
      rentalCount: 0,
    })
    expect(
      accounts.find((account) => account.id === 'tamura')?.listingCount,
    ).toBeGreaterThan(0)
    const user = accounts.find((account) => account.id === 'demo-user')
    expect(user).toMatchObject({ listingCount: 0, rentalCount: 1 })
    expect(JSON.stringify(accounts)).not.toContain('password')
    expect(user?.status).toBe('active')
    await setAccountStatus('demo-user', 'suspended', '規約違反')
    const after = await listAccountSummaries()
    expect(after.find((account) => account.id === 'demo-user')).toMatchObject({
      status: 'suspended',
      note: '規約違反',
    })
  })
})
