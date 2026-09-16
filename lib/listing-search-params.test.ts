import { describe, expect, it } from 'vitest'
import {
  buildListingSearchParams,
  parseListingSearchParams,
} from './listing-search-params'

describe('parseListingSearchParams', () => {
  it('falls back to defaults for missing or invalid values', () => {
    expect(parseListingSearchParams({})).toEqual({
      filter: { category: 'すべて', deal: 'all', keyword: '' },
      page: 1,
    })
    expect(
      parseListingSearchParams({
        category: '不明',
        deal: 'buy',
        page: '0',
        q: ['a', 'b'],
      }),
    ).toEqual({
      filter: { category: 'すべて', deal: 'all', keyword: '' },
      page: 1,
    })
  })

  it('reads valid values and trims keywords', () => {
    expect(
      parseListingSearchParams({
        category: '店舗',
        deal: 'rent',
        page: '3',
        q: ' 横浜 ',
      }),
    ).toEqual({
      filter: { category: '店舗', deal: 'rent', keyword: '横浜' },
      page: 3,
    })
  })

  it('accepts URLSearchParams', () => {
    expect(
      parseListingSearchParams(new URLSearchParams('deal=sale&page=2')),
    ).toEqual({
      filter: { category: 'すべて', deal: 'sale', keyword: '' },
      page: 2,
    })
  })
})

describe('refinements', () => {
  it('reads prefecture, price range, sort, and rental dates', () => {
    expect(
      parseListingSearchParams({
        prefecture: '新潟県',
        priceMin: '100000',
        priceMax: '2,000,000',
        sort: 'priceAsc',
        from: '2026-10-01',
        to: '2026-10-07',
      }).filter,
    ).toMatchObject({
      prefecture: '新潟県',
      priceMin: 100_000,
      priceMax: 2_000_000,
      sort: 'priceAsc',
      availableFrom: '2026-10-01',
      availableTo: '2026-10-07',
    })
  })

  it('drops invalid refinements', () => {
    const { filter } = parseListingSearchParams({
      prefecture: '不明',
      priceMin: 'abc',
      priceMax: '-1',
      sort: 'random',
      from: '2026-10-07',
      to: '2026-10-01',
    })
    expect(filter.prefecture).toBeUndefined()
    expect(filter.priceMin).toBeUndefined()
    expect(filter.priceMax).toBeUndefined()
    expect(filter.sort).toBeUndefined()
    expect(filter.availableFrom).toBeUndefined()
    expect(filter.availableTo).toBeUndefined()
  })

  it('round-trips refinements through the query string', () => {
    const search = buildListingSearchParams(
      {
        category: 'すべて',
        deal: 'rent',
        keyword: '',
        prefecture: '新潟県',
        priceMax: 30_000,
        sort: 'rentAsc',
        availableFrom: '2026-10-01',
        availableTo: '2026-10-07',
      },
      1,
    )
    expect(
      parseListingSearchParams(new URLSearchParams(search)).filter,
    ).toEqual({
      category: 'すべて',
      deal: 'rent',
      keyword: '',
      prefecture: '新潟県',
      priceMax: 30_000,
      sort: 'rentAsc',
      availableFrom: '2026-10-01',
      availableTo: '2026-10-07',
    })
  })
})

describe('buildListingSearchParams', () => {
  it('omits default values so URLs stay short', () => {
    expect(
      buildListingSearchParams(
        { category: 'すべて', deal: 'all', keyword: '' },
        1,
      ),
    ).toBe('')
    expect(
      buildListingSearchParams(
        { category: '店舗', deal: 'rent', keyword: '横浜' },
        3,
      ),
    ).toBe('q=%E6%A8%AA%E6%B5%9C&category=%E5%BA%97%E8%88%97&deal=rent&page=3')
  })
})
