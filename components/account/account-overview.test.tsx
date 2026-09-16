// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Listing } from '@/lib/data'
import type { AccountOverview } from '@/lib/server/account'
import { AccountOverviewView } from './account-overview'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const listing = (
  id: string,
  name: string,
  extra: Partial<Listing> = {},
): Listing => ({
  id,
  name,
  category: 'トラクター',
  maker: 'クボタ',
  year: 2019,
  hours: 620,
  condition: '目立った傷なし',
  prefecture: '新潟県',
  city: '長岡市',
  image: '/equipment/tractor.png',
  summary: '説明',
  deals: ['sale'],
  salePrice: 1_000_000,
  seller: { name: '掲載者デモ', kind: '農業法人', rating: 0, reviews: 0 },
  tags: [],
  ...extra,
})

const overview: AccountOverview = {
  listings: [
    {
      listing: listing('l-1', '公開中のトラクター'),
      inquiries: [
        {
          id: 'i-1',
          kind: 'listingInquiry',
          targetId: 'l-1',
          userId: 'demo-user',
          receivedAt: '2026-09-13T01:00:00.000Z',
          payload: {
            mode: 'rent',
            name: '山田',
            email: 'y@example.com',
            message: '借りたい',
          },
        },
      ],
    },
    {
      listing: listing('l-2', '審査中のコンバイン', {
        moderationStatus: 'pending',
      }),
      inquiries: [],
    },
    {
      listing: listing('l-3', '取り下げ中の田植機', {
        withdrawnAt: '2026-09-13T00:00:00.000Z',
      }),
      inquiries: [],
    },
  ],
  sentInquiries: [
    {
      submission: {
        id: 'i-2',
        kind: 'listingInquiry',
        targetId: 'trc-001',
        userId: 'me',
        receivedAt: '2026-09-13T02:00:00.000Z',
        payload: { mode: 'buy', message: '買いたい' },
      },
      listing: listing('trc-001', 'クボタ 45馬力'),
    },
  ],
  replyCounts: { 'i-1': 2 },
  reviewedSources: {},
  orders: {
    asBuyer: [
      {
        order: {
          id: 'o-1',
          listingId: 'trc-006',
          buyerUserId: 'me',
          sellerUserId: 'demo-seller',
          price: 21_000_000,
          status: 'delivered',
          createdAt: '2026-09-13T00:00:00.000Z',
          updatedAt: '2026-09-13T00:00:00.000Z',
        },
        listing: listing('trc-006', 'ジョンディア 90馬力'),
      },
    ],
    asSeller: [
      {
        order: {
          id: 'o-2',
          listingId: 'l-1',
          buyerUserId: 'demo-user',
          sellerUserId: 'me',
          price: 1_000_000,
          status: 'requested',
          message: '現金で',
          createdAt: '2026-09-13T00:00:00.000Z',
          updatedAt: '2026-09-13T00:00:00.000Z',
        },
        listing: listing('l-1', '公開中のトラクター'),
      },
    ],
  },
  deals: [
    {
      kind: 'order',
      id: 'o-1',
      title: 'ジョンディア 90馬力',
      href: '/listings/trc-006',
      amount: 21_000_000,
      status: 'delivered',
      statusLabel: '引き渡し済み',
      role: '買い手',
      counterpart: '掲載者デモ',
      updatedAt: '2026-09-13T00:00:00.000Z',
    },
  ],
  unreadThreadIds: ['i-1'],
  summary: {
    unreadThreads: 1,
    openInquiries: 2,
    requestedRentals: 1,
    requestedOrders: 1,
    pendingListings: 1,
  },
  rentals: {
    asRenter: [
      {
        rental: {
          id: 'r-1',
          listingId: 'trc-001',
          renterUserId: 'me',
          startDate: '2026-10-01',
          endDate: '2026-10-07',
          days: 7,
          rentPerDay: 22_000,
          rentTotal: 154_000,
          salePrice: 18_800_000,
          creditRate: 50,
          status: 'converted',
          purchasePrice: 18_723_000,
          createdAt: '2026-09-13T00:00:00.000Z',
          updatedAt: '2026-09-13T00:00:00.000Z',
        },
        listing: listing('trc-001', 'クボタ 45馬力', { rentToOwn: true }),
      },
    ],
    asOwner: [
      {
        rental: {
          id: 'r-2',
          listingId: 'l-1',
          renterUserId: 'demo-user',
          startDate: '2026-11-01',
          endDate: '2026-11-03',
          days: 3,
          rentPerDay: 10_000,
          rentTotal: 30_000,
          status: 'requested',
          createdAt: '2026-09-13T00:00:00.000Z',
          updatedAt: '2026-09-13T00:00:00.000Z',
        },
        listing: listing('l-1', '公開中のトラクター'),
      },
    ],
  },
}

describe('AccountOverviewView', () => {
  it('links each workspace area and puts unread conversations before new requests', () => {
    const incoming = overview.listings[0].inquiries[0]
    render(
      <AccountOverviewView
        overview={{
          ...overview,
          listings: [
            {
              ...overview.listings[0],
              inquiries: [
                { ...incoming, id: 'new-request', status: 'new' },
                { ...incoming, id: 'unread-reply', status: 'in_progress' },
              ],
            },
          ],
          unreadThreadIds: ['unread-reply'],
        }}
      />,
    )
    expect(
      screen
        .getAllByRole('link')
        .some((link) => link.getAttribute('href')?.includes('transport')),
    ).toBe(false)
    const navigation = screen.getByRole('navigation', { name: '取引メニュー' })
    expect(
      within(navigation).getByRole('link', { name: '掲載管理' }),
    ).toHaveAttribute('href', '#equipment')
    expect(
      within(navigation).getByRole('link', { name: '賃貸管理' }),
    ).toHaveAttribute('href', '#rentals')
    expect(
      within(navigation).getByRole('link', { name: '送信したやり取り' }),
    ).toHaveAttribute('href', '#sent')
    const activity = screen.getByRole('region', {
      name: '確認が必要なやり取り',
    })
    const links = within(activity).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/account/threads/unread-reply',
      '/account/threads/new-request',
    ])
    expect(
      screen.getByRole('link', { name: '賃貸申込を確認する' }),
    ).toHaveAttribute('href', '#lending')
  })

  it('shows the written review instead of the form', () => {
    render(
      <AccountOverviewView
        overview={{
          ...overview,
          reviewedSources: {
            'rental:r-1': {
              id: 'rv-1',
              listingId: 'trc-001',
              sellerUserId: 'demo-seller',
              reviewerUserId: 'me',
              sourceKind: 'rental',
              sourceId: 'r-1',
              rating: 4,
              comment: '助かりました',
              createdAt: '2026-09-13T00:00:00.000Z',
            },
          },
        }}
      />,
    )
    const renting = screen.getByRole('region', { name: '借りている物件' })
    expect(
      within(renting).queryByRole('button', { name: 'レビューを送る' }),
    ).toBeNull()
    expect(within(renting).getByText('助かりました')).toBeInTheDocument()
    expect(within(renting).getByLabelText('評価 4')).toBeInTheDocument()
  })

  it('lists owned rows with status and what came in', () => {
    render(<AccountOverviewView overview={overview} />)
    const mine = screen.getByRole('region', { name: '自分の掲載' })
    expect(within(mine).getByText('公開中のトラクター')).toBeInTheDocument()
    expect(within(mine).getByText('審査待ち')).toBeInTheDocument()
    expect(within(mine).getByText('取り下げ中')).toBeInTheDocument()
    expect(
      within(mine).getAllByRole('button', { name: '取り下げる' }),
    ).toHaveLength(2)
    expect(
      within(mine).getByRole('button', { name: '再掲載する' }),
    ).toBeInTheDocument()
    expect(within(mine).getByText('借りたい')).toBeInTheDocument()
    expect(within(mine).getByText('山田')).toBeInTheDocument()
    expect(
      within(mine).getByRole('link', { name: 'やり取りを開く' }),
    ).toHaveAttribute('href', '/account/threads/i-1')
    expect(within(mine).getByText('返信 2件')).toBeInTheDocument()
    expect(within(mine).getByText('未読')).toBeInTheDocument()
    const summary = screen.getByRole('region', { name: '概要' })
    expect(within(summary).getByText('未読のやり取り')).toBeInTheDocument()
    expect(within(summary).getByText('未対応の問い合わせ')).toBeInTheDocument()
    expect(within(summary).getAllByText('1件')).toHaveLength(3)
    expect(within(summary).getByText('2件')).toBeInTheDocument()
    const sent = screen.getByRole('region', { name: '送った問い合わせ' })
    expect(
      within(sent).getByRole('link', { name: 'クボタ 45馬力' }),
    ).toHaveAttribute('href', '/listings/trc-001')
    expect(within(sent).getByText('買いたい')).toBeInTheDocument()
    expect(
      within(sent).getByRole('link', { name: 'やり取りを開く' }),
    ).toHaveAttribute('href', '/account/threads/i-2')
    const bought = screen.getByRole('region', { name: '買った物件' })
    expect(within(bought).getByText('ジョンディア 90馬力')).toBeInTheDocument()
    expect(within(bought).getByText('引き渡し済み')).toBeInTheDocument()
    expect(
      within(bought).getByRole('button', { name: '受け取りを確認' }),
    ).toBeInTheDocument()
    expect(
      within(bought).queryByRole('link', { name: '引越しを依頼する' }),
    ).not.toBeInTheDocument()
    const history = screen.getByRole('region', { name: '取引の履歴' })
    expect(
      within(history).getByRole('link', { name: /ジョンディア 90馬力/ }),
    ).toHaveAttribute('href', '/account/deals/order/o-1')
    expect(within(history).queryByText('Invalid Date')).not.toBeInTheDocument()
    const sold = screen.getByRole('region', { name: '売った物件' })
    expect(within(sold).getByText('現金で')).toBeInTheDocument()
    expect(
      within(sold).getByRole('button', { name: '承諾する' }),
    ).toBeInTheDocument()
    const renting = screen.getByRole('region', { name: '借りている物件' })
    expect(within(renting).getByText('購入に切替')).toBeInTheDocument()
    expect(
      within(renting).queryByRole('link', { name: '引越しを依頼する' }),
    ).not.toBeInTheDocument()
    expect(
      within(renting).getByRole('button', { name: 'レビューを送る' }),
    ).toBeInTheDocument()
    expect(
      within(renting).getByText('2026-10-01 〜 2026-10-07・7日間・¥154,000'),
    ).toBeInTheDocument()
    expect(
      within(renting).queryByRole('button', { name: '購入に切り替える' }),
    ).toBeNull()
    const lending = screen.getByRole('region', { name: '貸している物件' })
    expect(within(lending).getByText('申込中')).toBeInTheDocument()
    expect(
      within(lending).getByRole('button', { name: '承認する' }),
    ).toBeInTheDocument()
  })
})
