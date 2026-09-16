import { seedLegacyRentalListings } from '@/test/legacy-listings'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  countUnread,
  listNotifications,
  markAllRead,
  markRead,
  notify,
} from './notifications'
import { getListing } from './listings'
import { applyModeration } from './moderation'
import { requestRental, updateRentalStatus } from './rentals'
import { resetStore } from './store'
import { acceptSubmission } from './submissions'
import { addMessage, updateThreadStatus } from './threads'
import { createListing } from './listings'
import { demoSeller, demoUser } from '@/test/mock-auth'

vi.mock('server-only', () => ({}))

beforeEach(async () => {
  await resetStore()
  await seedLegacyRentalListings()
})

const titles = async (userId: string) =>
  (await listNotifications(userId)).map((n) => n.title)

describe('notifications service', () => {
  it('creates, lists newest first, counts unread, and marks read', async () => {
    const first = await notify({
      userId: 'demo-user',
      kind: 'reply',
      title: '返信があります',
      href: '/account/threads/t-1',
    })
    await notify({
      userId: 'demo-user',
      kind: 'rental',
      title: 'レンタルが承認されました',
      body: 'クボタ',
      href: '/account',
    })
    await notify({
      userId: 'demo-seller',
      kind: 'inquiry',
      title: '他人宛て',
      href: '/account',
    })
    expect(await titles('demo-user')).toEqual([
      'レンタルが承認されました',
      '返信があります',
    ])
    expect(await countUnread('demo-user')).toBe(2)
    expect(await markRead(first.id, 'demo-user')).toMatchObject({
      id: first.id,
      readAt: expect.any(String),
    })
    expect(await markRead(first.id, 'demo-seller')).toBeUndefined()
    expect(await countUnread('demo-user')).toBe(1)
    await markAllRead('demo-user')
    expect(await countUnread('demo-user')).toBe(0)
    expect(await countUnread('demo-seller')).toBe(1)
  })
})

describe('notification triggers', () => {
  it('tells the owner about a new inquiry and the other side about replies and status', async () => {
    const { id } = await acceptSubmission(
      'listingInquiry',
      { mode: 'rent', name: '利用者デモ', message: '借りたい' },
      { targetId: 'trc-001', userId: 'demo-user' },
    )
    expect(await titles('demo-seller')).toEqual(['問い合わせが届きました'])
    expect((await listNotifications('demo-seller'))[0].href).toBe(
      `/account/threads/${id}`,
    )
    await addMessage(id, demoSeller, '在庫あります')
    expect(await titles('demo-user')).toEqual(['返信が届きました'])
    await addMessage(id, demoUser, '見に行きます')
    expect(await titles('demo-seller')).toEqual([
      '返信が届きました',
      '問い合わせが届きました',
    ])
    await updateThreadStatus(id, demoSeller, 'agreed')
    expect(await titles('demo-user')).toEqual([
      '問い合わせが「成約」になりました',
      '返信が届きました',
    ])
  })

  it('follows a rental through request, approval, and conversion', async () => {
    const created = await requestRental(
      (await getListing('trc-001'))!,
      demoUser,
      {
        startDate: '2026-10-01',
        endDate: '2026-10-07',
      },
    )
    const id = created.ok ? created.value.id : ''
    expect(await titles('demo-seller')).toEqual(['レンタルの申込が届きました'])
    await updateRentalStatus(id, demoSeller, 'active')
    expect(await titles('demo-user')).toEqual([
      'レンタルが「レンタル中」になりました',
    ])
    await updateRentalStatus(id, demoUser, 'converted')
    expect(await titles('demo-seller')).toEqual([
      'レンタルが「購入に切替」になりました',
      'レンタルの申込が届きました',
    ])
  })

  it('tells the owner about a moderation decision', async () => {
    const listing = await createListing(
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
    await applyModeration('listing', listing.id, { status: 'approved' })
    const items = await listNotifications('demo-seller')
    expect(items.map((n) => n.title)).toEqual(['掲載が承認されました'])
    expect(items[0].href).toBe(`/listings/${listing.id}`)
  })
})
