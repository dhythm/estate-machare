// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Listing, PropertyRequest } from '@/lib/data'
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
  category: 'マンション',
  zoning: '第一種住居地域',
  layout: '3LDK',
  floorArea: 74.2,
  builtYear: 2019,
  nearestStation: '小田急線 経堂駅',
  walkMinutes: 6,
  prefecture: '新潟県',
  city: '長岡市',
  image: '/properties/apartment.svg',
  summary: '説明',
  deals: ['sale'],
  salePrice: 1_000_000,
  seller: { name: '出品者デモ', kind: '宅建業者', rating: 0, reviews: 0 },
  tags: [],
  ...extra,
})

const request: PropertyRequest = {
  id: 'pr-01',
  title: '駅徒歩10分以内の2LDKを借りたい',
  deal: 'rent',
  category: 'マンション',
  layout: '2LDK',
  prefecture: '東京都',
  city: '世田谷区',
  budget: 220_000,
  moveInDate: '2026-12-01',
  status: '募集中',
}

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
  propertyRequests: [{ request, applications: [], inquiries: [] }],
  sentInquiries: [
    {
      submission: {
        id: 'i-2',
        kind: 'listingInquiry',
        targetId: 'apt-001',
        userId: 'me',
        receivedAt: '2026-09-13T02:00:00.000Z',
        payload: { mode: 'buy', message: '買いたい' },
      },
      listing: listing('apt-001', 'クボタ 45馬力'),
    },
  ],
  sentApplications: [
    {
      submission: {
        id: 'a-1',
        kind: 'requestProposal',
        targetId: 'pr-09',
        userId: 'me',
        receivedAt: '2026-09-13T03:00:00.000Z',
        payload: { vehicle: 'マンション', availableDate: '2026-10-03' },
        status: 'agreed',
      },
      request: {
        ...request,
        id: 'pr-09',
        title: '受託した3LDK',
        status: '調整中',
      },
    },
  ],
  sentJobInquiries: [
    {
      submission: {
        id: 'q-1',
        kind: 'requestInquiry',
        targetId: 'pr-01',
        userId: 'me',
        receivedAt: '2026-09-13T04:00:00.000Z',
        payload: { message: '積載方法は？' },
      },
      request,
    },
  ],
  replyCounts: { 'i-1': 2 },
  reviewedSources: {},
  orders: {
    asBuyer: [
      {
        order: {
          id: 'o-1',
          listingId: 'apt-006',
          buyerUserId: 'me',
          sellerUserId: 'demo-seller',
          price: 21_000_000,
          status: 'delivered',
          createdAt: '2026-09-13T00:00:00.000Z',
          updatedAt: '2026-09-13T00:00:00.000Z',
        },
        listing: listing('apt-006', 'ジョンディア 90馬力'),
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
      counterpart: '出品者デモ',
      updatedAt: '2026-09-13T00:00:00.000Z',
    },
    {
      kind: 'propertyRequest',
      id: 'pr-01',
      title: '駅徒歩10分以内の2LDKを借りたい',
      href: '/requests/pr-01',
      amount: 220_000,
      status: '募集中',
      statusLabel: '募集中',
      role: '募集者',
      counterpart: '未定',
      updatedAt: '',
    },
  ],
  unreadThreadIds: ['i-1'],
  agent: {
    profile: {
      id: 'me',
      name: '高橋不動産',
      kind: '法人',
      prefecture: '秋田県',
      handledCategories: ['マンション'],
      serviceAreas: ['秋田県', '山形県'],
      createdAt: '2026-09-13T00:00:00.000Z',
      updatedAt: '2026-09-13T00:00:00.000Z',
    },
    matchingRequests: [request],
  },
  summary: {
    unreadThreads: 1,
    openInquiries: 2,
    requestedLeases: 1,
    requestedOrders: 1,
    pendingListings: 1,
  },
  leases: {
    asTenant: [
      {
        lease: {
          id: 'r-1',
          listingId: 'apt-001',
          tenantUserId: 'me',
          startDate: '2026-10-01',
          endDate: '2027-09-30',
          months: 12,
          rentPerMonth: 268_000,
          rentTotal: 3_216_000,
          deposit: 536_000,
          keyMoney: 268_000,
          initialCost: 1_340_000,
          salePrice: 88_000_000,
          creditRate: 50,
          status: 'converted',
          purchasePrice: 86_392_000,
          createdAt: '2026-09-13T00:00:00.000Z',
          updatedAt: '2026-09-13T00:00:00.000Z',
        },
        listing: listing('apt-001', 'シティタワー 世田谷区 3LDK', {
          purchaseOption: true,
        }),
      },
    ],
    asOwner: [
      {
        lease: {
          id: 'r-2',
          listingId: 'l-1',
          tenantUserId: 'demo-user',
          startDate: '2026-11-01',
          endDate: '2028-10-31',
          months: 24,
          deposit: 0,
          keyMoney: 0,
          initialCost: 0,
          rentPerMonth: 10_000,
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
    const navigation = screen.getByRole('navigation', { name: '取引メニュー' })
    expect(
      within(navigation).getByRole('link', { name: '出品管理' }),
    ).toHaveAttribute('href', '#equipment')
    expect(
      within(navigation).getByRole('link', { name: '賃貸管理' }),
    ).toHaveAttribute('href', '#leases')
    expect(
      within(navigation).getByRole('link', { name: 'リクエスト管理' }),
    ).toHaveAttribute('href', '#requests')
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
            'lease:r-1': {
              id: 'rv-1',
              listingId: 'apt-001',
              sellerUserId: 'demo-seller',
              reviewerUserId: 'me',
              sourceKind: 'lease',
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
    const mine = screen.getByRole('region', { name: '自分の出品' })
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
    expect(
      within(summary).getByText('未対応の問い合わせ・提案'),
    ).toBeInTheDocument()
    expect(within(summary).getAllByText('1件')).toHaveLength(3)
    expect(within(summary).getByText('2件')).toBeInTheDocument()
    const agent = screen.getByRole('region', { name: '担当者プロフィール' })
    expect(within(agent).getByText('高橋不動産')).toBeInTheDocument()
    expect(
      within(agent).getByRole('link', { name: 'プロフィールを編集' }),
    ).toHaveAttribute('href', '/requests/register')
    expect(
      within(agent).getByRole('link', {
        name: '駅徒歩10分以内の2LDKを借りたい',
      }),
    ).toHaveAttribute('href', '/requests/pr-01')
    expect(within(mine).getByText('未対応')).toBeInTheDocument()
    const requests = screen.getByRole('region', {
      name: '自分の物件リクエスト',
    })
    expect(
      within(requests).getByText('駅徒歩10分以内の2LDKを借りたい'),
    ).toBeInTheDocument()
    expect(
      within(requests).getByText('提案はまだありません'),
    ).toBeInTheDocument()
    expect(
      within(requests).getByRole('button', { name: '成約にする' }),
    ).toBeInTheDocument()
    const sent = screen.getByRole('region', { name: '送った問い合わせ' })
    expect(
      within(sent).getByRole('link', { name: 'クボタ 45馬力' }),
    ).toHaveAttribute('href', '/listings/apt-001')
    expect(within(sent).getByText('買いたい')).toBeInTheDocument()
    expect(
      within(sent).getByRole('link', { name: 'やり取りを開く' }),
    ).toHaveAttribute('href', '/account/threads/i-2')
    const applications = screen.getByRole('region', { name: '送った提案' })
    expect(within(applications).getByText('受託した3LDK')).toBeInTheDocument()
    expect(
      within(applications).getByRole('button', {
        name: '紹介を開始する',
      }),
    ).toBeInTheDocument()
    const questions = screen.getByRole('region', { name: '送った質問' })
    expect(within(questions).getByText('積載方法は？')).toBeInTheDocument()
    const bought = screen.getByRole('region', { name: '買った物件' })
    expect(within(bought).getByText('ジョンディア 90馬力')).toBeInTheDocument()
    expect(within(bought).getByText('引き渡し済み')).toBeInTheDocument()
    expect(
      within(bought).getByRole('button', { name: '受け取りを確認' }),
    ).toBeInTheDocument()
    expect(
      within(bought).getByRole('link', { name: '希望条件を登録する' }),
    ).toHaveAttribute('href', '/requests/new?listingId=apt-006')
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
    expect(within(renting).getByText('購入へ切替')).toBeInTheDocument()
    expect(
      within(renting).getByRole('link', { name: '希望条件を登録する' }),
    ).toHaveAttribute('href', '/requests/new?listingId=apt-001')
    expect(
      within(renting).getByRole('button', { name: 'レビューを送る' }),
    ).toBeInTheDocument()
    expect(
      within(renting).getByText('2026-10-01 〜 2027-09-30・12か月・¥3,216,000'),
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
