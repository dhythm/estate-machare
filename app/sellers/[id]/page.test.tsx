// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SellerPage from './page'
import { getListing } from '@/lib/server/listings'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'unauthenticated', data: null }),
  signOut: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  usePathname: () => '/sellers/demo-seller',
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))
vi.mock('@/lib/server/sellers', () => ({
  getSellerProfile: vi.fn(async (id: string) =>
    id === 'demo-seller'
      ? {
          id: 'demo-seller',
          name: '出品者デモ',
          rating: 4.5,
          reviewCount: 2,
          listings: [await getListing('trc-001'), await getListing('cmb-002')],
          reviews: [
            {
              id: 'rv-1',
              listingId: 'trc-001',
              sellerUserId: 'demo-seller',
              reviewerUserId: 'demo-user',
              sourceKind: 'lease',
              sourceId: 'r-1',
              rating: 4,
              comment: '対応が丁寧でした',
              createdAt: '2026-09-13T02:00:00.000Z',
            },
          ],
        }
      : undefined,
  ),
}))

describe('SellerPage', () => {
  it('shows the seller name, rating, live listings and reviews', async () => {
    render(await SellerPage({ params: Promise.resolve({ id: 'demo-seller' }) }))

    expect(
      screen.getByRole('heading', { level: 1, name: '出品者デモ' }),
    ).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
    const listings = screen.getByRole('region', { name: '出品中の農機具' })
    expect(within(listings).getAllByRole('link')).toHaveLength(2)
    expect(
      within(listings).getByRole('link', { name: /クボタ トラクター 45馬力/ }),
    ).toHaveAttribute('href', '/listings/trc-001')
    const reviews = screen.getByRole('region', { name: 'レビュー' })
    expect(within(reviews).getByText('対応が丁寧でした')).toBeInTheDocument()
    expect(
      within(reviews).getByRole('img', { name: '評価 4' }),
    ).toBeInTheDocument()
    expect(
      within(reviews).getByRole('link', { name: /クボタ トラクター 45馬力/ }),
    ).toHaveAttribute('href', '/listings/trc-001')
  })

  it('is not found for an unknown seller', async () => {
    await expect(
      SellerPage({ params: Promise.resolve({ id: 'nobody' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
