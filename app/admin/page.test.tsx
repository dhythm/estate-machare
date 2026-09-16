// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AdminDashboardPage from './page'

vi.mock('next/navigation', () => ({ usePathname: () => '/admin' }))
vi.mock('@/lib/server/admin-overview', () => ({
  getAdminCounts: vi.fn(async () => ({
    pendingListings: 2,
    pendingPropertyRequests: 3,
    requestedLeases: 4,
    activeLeases: 1,
    requestedOrders: 5,
    introducingRequests: 2,
    openThreads: 6,
    agents: 8,
  })),
  listRecentActivity: vi.fn(async () => [
    {
      id: 'e-1',
      kind: 'order',
      dealId: 'o-1',
      title: 'クボタ 45馬力',
      statusLabel: '承諾',
      actorName: '出品者デモ',
      createdAt: '2026-09-13T01:00:00.000Z',
      href: '/account/deals/order/o-1',
    },
  ]),
  listRecentReviews: vi.fn(async () => [
    {
      review: {
        id: 'rv-1',
        listingId: 'trc-001',
        sellerUserId: 'demo-seller',
        reviewerUserId: 'demo-user',
        sourceKind: 'order',
        sourceId: 'o-1',
        rating: 4,
        comment: '助かりました',
        createdAt: '2026-09-13T02:00:00.000Z',
      },
      listingName: 'クボタ 45馬力',
    },
  ]),
}))

describe('AdminDashboardPage', () => {
  it('prioritizes pending review work and provides access to every operation', async () => {
    render(await AdminDashboardPage())
    expect(
      screen.getByRole('heading', { name: '審査を待っている案件' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('審査待ち 5 件')).toBeInTheDocument()
    for (const path of [
      '/admin/deals',
      '/admin/deals/orders',
      '/admin/deals/leases',
      '/admin/deals/inquiries',
      '/admin/deals/reviews',
      '/admin/transport',
      '/admin/transport/applications',
      '/admin/transport/inquiries',
      '/admin/transport/agents',
      '/admin/accounts',
    ]) {
      expect(
        screen
          .getAllByRole('link')
          .some((link) => link.getAttribute('href') === path),
      ).toBe(true)
    }
  })

  it('shows order and haul metrics, recent activity, and recent reviews', async () => {
    render(await AdminDashboardPage())
    expect(screen.getByText('承諾待ちの注文')).toBeInTheDocument()
    expect(screen.getByText('運搬中の案件')).toBeInTheDocument()
    const activity = screen.getByRole('region', { name: '直近の取引の動き' })
    expect(
      within(activity).getByRole('link', { name: /クボタ 45馬力/ }),
    ).toHaveAttribute('href', '/account/deals/order/o-1')
    expect(within(activity).getByText('承諾')).toBeInTheDocument()
    expect(within(activity).getByText('出品者デモ')).toBeInTheDocument()
    const reviews = screen.getByRole('region', { name: '直近のレビュー' })
    expect(within(reviews).getByText('助かりました')).toBeInTheDocument()
    expect(within(reviews).getByLabelText('評価 4')).toBeInTheDocument()
  })
})
