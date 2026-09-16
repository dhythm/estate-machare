import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RequestBoard } from './request-board'
import { getPropertyRequests } from '@/lib/server/property-requests'

vi.mock('@/lib/server/property-requests', () => ({
  getPropertyRequests: vi.fn(),
}))

describe('RequestBoard', () => {
  it('keeps application links for open requests and detail links for requests under coordination', async () => {
    vi.mocked(getPropertyRequests).mockResolvedValue([
      {
        id: 'open-request',
        title: '駅徒歩10分以内の2LDKを借りたい',
        deal: 'rent',
        category: 'マンション',
        layout: '2LDK',
        prefecture: '東京都',
        city: '世田谷区',
        budget: 45000,
        moveInDate: '2026-12-01',
        status: '募集中',
      },
      {
        id: 'coordinating-request',
        title: '二世帯で住める戸建を購入したい',
        deal: 'sale',
        category: '戸建',
        layout: '4LDK以上',
        prefecture: '神奈川県',
        city: '横浜市港北区',
        budget: 68_000_000,
        moveInDate: '2027-03-01',
        status: '調整中',
      },
    ])

    render(await RequestBoard())

    const openCard = screen
      .getByText('駅徒歩10分以内の2LDKを借りたい')
      .closest('li')!
    const coordinatingCard = screen
      .getByText('二世帯で住める戸建を購入したい')
      .closest('li')!
    expect(
      within(openCard).getByRole('link', { name: 'このリクエストに提案する' }),
    ).toHaveAttribute('href', '/requests/open-request')
    expect(
      within(coordinatingCard).getByRole('link', {
        name: 'リクエストの詳細を見る',
      }),
    ).toHaveAttribute('href', '/requests/coordinating-request')
  })

  it('shows a useful empty state while keeping the request and agent registration entrances', async () => {
    vi.mocked(getPropertyRequests).mockResolvedValue([])
    render(await RequestBoard())

    expect(
      screen.getByText('現在、公開中の物件リクエストはありません'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: '条件を登録する' }),
    ).toHaveAttribute('href', '/requests/new')
    expect(
      screen.getByRole('link', { name: '担当者として登録する' }),
    ).toHaveAttribute('href', '/requests/register')
  })
})
