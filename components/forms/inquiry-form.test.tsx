// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Listing, ListingModeConfig } from '@/lib/data'
import { InquiryForm } from './inquiry-form'

const listing: Listing = {
  id: 'apt-001',
  name: 'クボタ 45馬力',
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
  summary: '',
  deals: ['sale', 'rent'],
  salePrice: 88_000_000,
  rentPerMonth: 22_000,
  seller: { name: '中村不動産', kind: '宅建業者', rating: 4.8, reviews: 34 },
  tags: [],
}

const modes: ListingModeConfig[] = [
  { id: 'rent', title: '借りる', price: '¥268,000/月', desc: '', cta: '' },
  { id: 'buy', title: '購入する', price: '¥88,000,000', desc: '', cta: '' },
]

function setup(initialMode: 'rent' | 'buy' | 'question' = 'rent') {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <InquiryForm
        listing={listing}
        modes={modes}
        initialMode={initialMode}
        contact={{ name: '利用者デモ', email: 'user@example.com' }}
      />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

afterEach(() => vi.unstubAllGlobals())

describe('InquiryForm', () => {
  it('validates before posting and hides the date for questions', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const user = setup()
    expect(screen.getByLabelText('希望日')).toBeInTheDocument()
    await user.click(screen.getByLabelText('質問だけする'))
    expect(screen.queryByLabelText('希望日')).toBeNull()
    await user.click(screen.getByRole('button', { name: '送信する' }))
    expect(screen.getByLabelText('メッセージ')).toHaveAccessibleDescription(
      'メッセージを入力してください。',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts the prefilled contact with the chosen mode', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        { id: 't-1', receivedAt: '2026-09-13T00:00:00.000Z' },
        { status: 201 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const user = setup('buy')
    expect(screen.getByLabelText('お名前')).toHaveValue('利用者デモ')
    await user.type(screen.getByLabelText('メッセージ'), '現物を見たいです')
    await user.click(screen.getByRole('button', { name: '送信する' }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      '受け付けました',
    )
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
        .body as string,
    )
    expect(body).toMatchObject({
      mode: 'buy',
      name: '利用者デモ',
      email: 'user@example.com',
      message: '現物を見たいです',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/listings/apt-001/inquiries',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
