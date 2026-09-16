// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ListingBrowser } from './listing-browser'
import type { Listing, ListingPage } from '@/lib/data'

const listing: Listing = {
  id: 'initial',
  name: '初期レジデンス',
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
  salePrice: 100000,
  seller: { name: '農家', kind: '個人', rating: 4, reviews: 1 },
  tags: [],
}

function pageOf(items: Listing[], page = 1, total = 30): ListingPage {
  return { items, total, page, pageSize: 12, pageCount: Math.ceil(total / 12) }
}

function setup(initial = pageOf([listing])) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <ListingBrowser
        initialState={{
          filter: { category: 'すべて', deal: 'all', keyword: '' },
          page: 1,
        }}
        initialPage={initial}
      />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

beforeEach(() => window.history.replaceState(null, '', '/listings'))
afterEach(() => vi.unstubAllGlobals())

describe('ListingBrowser', () => {
  it('renders the initial page with its total and page count', () => {
    vi.stubGlobal('fetch', vi.fn())
    setup()
    expect(
      screen.getByRole('heading', { name: '初期レジデンス' }),
    ).toBeVisible()
    expect(screen.getByText(/30件/)).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'ページ' }),
    ).toHaveTextContent('1 / 3')
  })

  it('moves to the next page and mirrors the state in the URL', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        pageOf([{ ...listing, id: 'second', name: '2ページ目' }], 2),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const user = setup()
    await user.click(screen.getByRole('button', { name: '次のページ' }))
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/listings?category=%E3%81%99%E3%81%B9%E3%81%A6&deal=all&page=2&pageSize=12',
        expect.anything(),
      ),
    )
    expect(
      await screen.findByRole('heading', { name: '2ページ目' }),
    ).toBeVisible()
    expect(window.location.search).toBe('?page=2')
  })

  it('searches by keyword and resets to the first page', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        pageOf([{ ...listing, id: 'hit', name: '検索結果' }], 1, 1),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const user = setup(pageOf([listing], 2))
    await user.type(
      screen.getByRole('searchbox', { name: 'キーワード' }),
      'クボタ{Enter}',
    )
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/listings?category=%E3%81%99%E3%81%B9%E3%81%A6&deal=all&page=1&pageSize=12&q=%E3%82%AF%E3%83%9C%E3%82%BF',
        expect.anything(),
      ),
    )
    expect(
      await screen.findByRole('heading', { name: '検索結果' }),
    ).toBeVisible()
    expect(window.location.search).toBe('?q=%E3%82%AF%E3%83%9C%E3%82%BF')
  })

  it('follows browser history navigation', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(pageOf([{ ...listing, id: 'p3', name: '3ページ目' }], 3)),
    )
    vi.stubGlobal('fetch', fetchMock)
    setup()
    window.history.replaceState(null, '', '/listings?page=3')
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(
      await screen.findByRole('heading', { name: '3ページ目' }),
    ).toBeVisible()
  })
})
