// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminQueue } from './admin-queue'
import type { Listing, PropertyRequest } from '@/lib/data'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const listing: Listing = {
  id: 'pending-listing',
  name: '審査中のマンション',
  category: 'マンション',
  zoning: '第一種住居地域',
  layout: '3LDK',
  floorArea: 74.2,
  builtYear: 2019,
  nearestStation: '小田急線 経堂駅',
  walkMinutes: 6,
  prefecture: '東京都',
  city: '世田谷区',
  image: '/properties/apartment.svg',
  summary: '審査中。',
  deals: ['sale'],
  salePrice: 32_000_000,
  seller: { name: '審査不動産', kind: '宅建業者', rating: 0, reviews: 0 },
  tags: [],
  moderationStatus: 'pending',
}

const request: PropertyRequest = {
  id: 'pending-request',
  title: '審査中の戸建',
  deal: 'rent',
  category: 'マンション',
  layout: '2LDK',
  prefecture: '東京都',
  city: '世田谷区',
  budget: 38_000,
  moveInDate: '2026-12-01',
  status: '募集中',
  moderationStatus: 'pending',
}

function setup(
  kind: 'listing' | 'propertyRequest',
  queue: { listings: Listing[]; propertyRequests: PropertyRequest[] } = {
    listings: [listing],
    propertyRequests: [request],
  },
) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AdminQueue kind={kind} initialQueue={queue} />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AdminQueue', () => {
  it('searches the selected queue without losing review actions', async () => {
    const user = setup('listing', {
      listings: [
        listing,
        {
          ...listing,
          id: 'other',
          name: '別のマンション',
          seller: { ...listing.seller, name: '別の不動産' },
        },
      ],
      propertyRequests: [request],
    })
    await user.type(
      screen.getByRole('searchbox', { name: '出品を検索' }),
      '審査不動産',
    )
    expect(screen.getByText('審査中のマンション')).toBeInTheDocument()
    expect(screen.queryByText('別のマンション')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '承認' })).toBeInTheDocument()
    await user.clear(screen.getByRole('searchbox', { name: '出品を検索' }))
    expect(screen.getByText('別のマンション')).toBeInTheDocument()
  })

  it('keeps the current filter and data when a refresh fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const user = setup('listing')
    await user.click(screen.getByRole('button', { name: '承認済み' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '一覧を更新できませんでした。',
    )
    expect(screen.getByRole('button', { name: 'すべて' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText('審査中のマンション')).toBeInTheDocument()
  })

  it('offers only the opposite decision once reviewed', () => {
    setup('listing', {
      listings: [
        {
          ...listing,
          id: 'ok',
          name: '承認済み品',
          moderationStatus: 'approved',
        },
        { ...listing, id: 'ng', name: '却下品', moderationStatus: 'rejected' },
      ],
      propertyRequests: [],
    })
    const approved = screen.getByText('承認済み品').closest('li')!
    expect(within(approved).queryByRole('button', { name: '承認' })).toBeNull()
    expect(
      within(approved).getByRole('button', { name: '却下' }),
    ).toBeInTheDocument()
    const rejected = screen.getByText('却下品').closest('li')!
    expect(
      within(rejected).getByRole('button', { name: '承認' }),
    ).toBeInTheDocument()
    expect(within(rejected).queryByRole('button', { name: '却下' })).toBeNull()
  })

  it('renders only the requested kind', () => {
    setup('listing')
    expect(screen.getByText('審査中のマンション')).toBeInTheDocument()
    expect(screen.queryByText('審査中の戸建')).toBeNull()
    expect(
      screen.getByRole('button', { name: '取り下げる' }),
    ).toBeInTheDocument()
  })

  it('approves a listing with an optional note', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return Response.json({ ...listing, moderationStatus: 'approved' })
      }
      return Response.json({ listings: [], propertyRequests: [request] })
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = setup('listing')
    const listingCard = screen.getByText('審査中のマンション').closest('li')
    if (!listingCard) throw new Error('listing card')
    await user.type(within(listingCard).getByLabelText('メモ'), '掲載可')
    await user.click(within(listingCard).getByRole('button', { name: '承認' }))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/queue',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(
      JSON.parse(
        (
          fetchMock.mock.calls.find(
            (call) =>
              (call as unknown as [string, RequestInit])[1]?.method === 'POST',
          ) as unknown as [string, RequestInit]
        )[1].body as string,
      ),
    ).toEqual({
      kind: 'listing',
      id: 'pending-listing',
      status: 'approved',
      note: '掲載可',
    })
    expect(await screen.findByText('該当なし')).toBeInTheDocument()
    expect(screen.queryByText('審査中のマンション')).not.toBeInTheDocument()
  })

  it('rejects a property request', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return Response.json({ ...request, moderationStatus: 'rejected' })
      }
      return Response.json({ listings: [listing], propertyRequests: [] })
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = setup('propertyRequest')
    const jobCard = screen.getByText('審査中の戸建').closest('li')
    if (!jobCard) throw new Error('request card')
    await user.click(within(jobCard).getByRole('button', { name: '却下' }))
    expect(
      JSON.parse(
        (
          fetchMock.mock.calls.find(
            (call) =>
              (call as unknown as [string, RequestInit])[1]?.method === 'POST',
          ) as unknown as [string, RequestInit]
        )[1].body as string,
      ),
    ).toMatchObject({
      kind: 'propertyRequest',
      id: 'pending-request',
      status: 'rejected',
    })
    expect(await screen.findByText('該当なし')).toBeInTheDocument()
  })
})
