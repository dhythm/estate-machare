import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RequestBoard } from './request-board'
import { getPropertyRequests } from '@/lib/server/property-requests'

vi.mock('@/lib/server/property-requests', () => ({ getPropertyRequests: vi.fn() }))

describe('RequestBoard', () => {
  it('keeps application links for open requests and detail links for requests under coordination', async () => {
    vi.mocked(getPropertyRequests).mockResolvedValue([
      {
        id: 'open-request',
        item: 'トラクター 45馬力',
        from: '新潟県 長岡市',
        to: '長野県 長野市',
        distanceKm: 180,
        weight: '2t',
        desiredDate: '10月1日',
        reward: 45000,
        status: '募集中',
      },
      {
        id: 'coordinating-request',
        item: 'コンバイン 4条刈',
        from: '秋田県 大仙市',
        to: '山形県 天童市',
        distanceKm: 120,
        weight: '2.4t',
        desiredDate: '10月2日',
        reward: 38000,
        status: '調整中',
      },
    ])

    render(await RequestBoard())

    const openCard = screen.getByText('トラクター 45馬力').closest('li')!
    const coordinatingCard = screen.getByText('コンバイン 4条刈').closest('li')!
    expect(
      within(openCard).getByRole('link', { name: 'この案件に応募する' }),
    ).toHaveAttribute('href', '/transport/open-request')
    expect(
      within(coordinatingCard).getByRole('link', { name: '案件の詳細を見る' }),
    ).toHaveAttribute('href', '/transport/coordinating-request')
  })

  it('shows a useful empty state while keeping the request and agent registration entrances', async () => {
    vi.mocked(getPropertyRequests).mockResolvedValue([])
    render(await RequestBoard())

    expect(
      screen.getByText('現在、公開中の運搬案件はありません'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: '運搬を依頼する' }),
    ).toHaveAttribute('href', '/transport/new')
    expect(
      screen.getByRole('link', { name: '運搬者として登録する' }),
    ).toHaveAttribute('href', '/transport/register')
  })
})
