// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HomeStatus } from './home-status'

describe('HomeStatus', () => {
  it('shows the signed-in user their counts with links', () => {
    render(
      <HomeStatus
        name="出品者デモ"
        status={{
          unreadThreads: 2,
          openInquiries: 1,
          requestedLeases: 0,
          requestedOrders: 1,
          pendingListings: 3,
          matchingRequests: 4,
          unreadNotifications: 5,
        }}
      />,
    )
    const region = screen.getByRole('region', { name: 'あなたの状況' })
    expect(within(region).getByText('出品者デモ')).toBeInTheDocument()
    expect(
      within(region).getByRole('link', { name: /未読のやり取り/ }),
    ).toHaveAttribute('href', '/account')
    expect(within(region).getByRole('link', { name: /通知/ })).toHaveAttribute(
      'href',
      '/account/notifications',
    )
    expect(
      within(region).getByRole('link', { name: /対応地域の募集中案件/ }),
    ).toHaveAttribute('href', '/transport')
    expect(within(region).getByText('5')).toBeInTheDocument()
    expect(
      within(region).getByRole('link', { name: /承諾待ちの注文/ }),
    ).toBeInTheDocument()
    expect(within(region).queryByText(/申込中のレンタル/)).toBeNull()
  })
})
