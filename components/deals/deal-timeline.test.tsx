// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DealTimeline } from './deal-timeline'

describe('DealTimeline', () => {
  it('shows the summary, events in order, and related links', () => {
    render(
      <DealTimeline
        deal={{
          summary: {
            kind: 'order',
            id: 'o-1',
            title: 'クボタ 45馬力',
            href: '/listings/apt-001',
            amount: 88_000_000,
            status: 'accepted',
            statusLabel: '承諾',
            role: '買い手',
            counterpart: '出品者デモ',
            updatedAt: '2026-09-13T01:00:00.000Z',
          },
          events: [
            {
              id: 'e-1',
              statusLabel: '申込中',
              actorName: '利用者デモ',
              note: '現金で',
              createdAt: '2026-09-13T00:00:00.000Z',
            },
            {
              id: 'e-2',
              statusLabel: '承諾',
              actorName: '出品者デモ',
              createdAt: '2026-09-13T01:00:00.000Z',
            },
          ],
          relatedThreads: [
            { id: 't-1', label: '問い合わせ', statusLabel: '成約' },
          ],
          relatedDeals: [
            {
              kind: 'lease',
              id: 'r-1',
              title: 'クボタ 45馬力',
              statusLabel: '購入に切替',
            },
          ],
        }}
      />,
    )
    expect(screen.getByRole('link', { name: 'クボタ 45馬力' })).toHaveAttribute(
      'href',
      '/listings/apt-001',
    )
    expect(screen.getByText('¥88,000,000')).toBeInTheDocument()
    const timeline = screen.getByRole('list', { name: '履歴' })
    const items = within(timeline).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('申込中')
    expect(items[0]).toHaveTextContent('現金で')
    expect(items[1]).toHaveTextContent('出品者デモ')
    expect(screen.getByRole('link', { name: /問い合わせ/ })).toHaveAttribute(
      'href',
      '/account/threads/t-1',
    )
    expect(screen.getByRole('link', { name: /賃貸/ })).toHaveAttribute(
      'href',
      '/account/deals/lease/r-1',
    )
  })
})
