import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { listingQueryOptions } from './listings'

afterEach(() => vi.unstubAllGlobals())

const page = { page: 1, pageSize: 12 }

describe('listing query', () => {
  it('keeps separate cache entries for every search condition', () => {
    const base = listingQueryOptions({ category: 'すべて', deal: 'all' }, page)
    expect(base.queryKey).not.toEqual(
      listingQueryOptions({ category: 'マンション', deal: 'all' }, page)
        .queryKey,
    )
    expect(base.queryKey).not.toEqual(
      listingQueryOptions({ category: 'すべて', deal: 'sale' }, page).queryKey,
    )
    expect(base.queryKey).not.toEqual(
      listingQueryOptions(
        { category: 'すべて', deal: 'all', keyword: 'クボタ' },
        page,
      ).queryKey,
    )
    expect(base.queryKey).not.toEqual(
      listingQueryOptions(
        { category: 'すべて', deal: 'all' },
        { ...page, page: 2 },
      ).queryKey,
    )
  })

  it('includes refinements in the key and the URL', async () => {
    const options = listingQueryOptions(
      {
        category: 'すべて',
        deal: 'rent',
        prefecture: '新潟県',
        priceMax: 30_000,
        sort: 'rentAsc',
        availableFrom: '2026-10-01',
        availableTo: '2026-10-07',
      },
      page,
    )
    expect(options.queryKey).not.toEqual(
      listingQueryOptions({ category: 'すべて', deal: 'rent' }, page).queryKey,
    )
    const fetchMock = vi.fn<(input: string) => Promise<Response>>(async () =>
      Response.json({
        items: [],
        total: 0,
        page: 1,
        pageSize: 12,
        pageCount: 0,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    await options.queryFn!({ signal: new AbortController().signal } as never)
    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(url.searchParams.get('prefecture')).toBe('新潟県')
    expect(url.searchParams.get('priceMax')).toBe('30000')
    expect(url.searchParams.get('sort')).toBe('rentAsc')
    expect(url.searchParams.get('from')).toBe('2026-10-01')
    expect(url.searchParams.get('to')).toBe('2026-10-07')
    expect(url.searchParams.has('priceMin')).toBe(false)
  })

  it('builds the request URL and omits an empty keyword', async () => {
    const fetchMock = vi.fn<(input: string) => Promise<Response>>(async () =>
      Response.json({
        items: [],
        total: 0,
        page: 1,
        pageSize: 12,
        pageCount: 0,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const queryClient = new QueryClient()
    await queryClient.fetchQuery(
      listingQueryOptions(
        { category: 'すべて', deal: 'all', keyword: '' },
        page,
      ),
    )
    await queryClient.fetchQuery(
      listingQueryOptions(
        { category: '土地', deal: 'rent', keyword: 'DJI' },
        { page: 2, pageSize: 6 },
      ),
    )
    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/listings?category=%E3%81%99%E3%81%B9%E3%81%A6&deal=all&page=1&pageSize=12',
    )
    expect(fetchMock.mock.calls[1][0]).toBe(
      '/api/listings?category=%E5%9C%9F%E5%9C%B0&deal=rent&page=2&pageSize=6&q=DJI',
    )
    queryClient.clear()
  })

  it('aborts the network request when its query is cancelled', async () => {
    let requestSignal: AbortSignal | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn((_url, init: RequestInit) => {
        requestSignal = init.signal as AbortSignal
        return new Promise<Response>((_resolve, reject) => {
          requestSignal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        })
      }),
    )
    const queryClient = new QueryClient()
    const option = listingQueryOptions(
      { category: 'すべて', deal: 'all' },
      page,
    )
    const request = queryClient.fetchQuery(option).catch(() => undefined)
    await queryClient.cancelQueries({ queryKey: option.queryKey })
    await request
    expect(requestSignal?.aborted).toBe(true)
    queryClient.clear()
  })
})
