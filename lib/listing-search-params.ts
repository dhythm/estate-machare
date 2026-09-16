import {
  isCategory,
  isDealFilter,
  isLayout,
  isListingSort,
  type ListingFilter,
} from '@/lib/data'
import { prefectureNames } from '@/lib/prefectures'

export type ListingSearchState = {
  filter: ListingFilter & { keyword: string }
  page: number
}

type ParamSource =
  URLSearchParams | Record<string, string | string[] | undefined>

function readValue(source: ParamSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) {
    const values = source.getAll(key)
    return values.length === 1 ? values[0] : undefined
  }
  const value = source[key]
  return typeof value === 'string' ? value : undefined
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/

function readYen(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined
  const digits = value.replace(/[,，]/g, '')
  if (!/^\d+$/.test(digits)) return undefined
  const amount = Number(digits)
  return amount <= 1_000_000_000 ? amount : undefined
}

function readDate(value: string | undefined): string | undefined {
  return value && datePattern.test(value) && !Number.isNaN(Date.parse(value))
    ? value
    : undefined
}

/**
 * Optional refinements shared by the URL and the API. Invalid values are
 * dropped rather than rejected so a stale link still shows results.
 */
export function readListingRefinements(
  source: ParamSource,
): Omit<ListingFilter, 'category' | 'deal' | 'keyword'> {
  const prefecture = readValue(source, 'prefecture')
  const layout = readValue(source, 'layout')
  const sort = readValue(source, 'sort')
  const from = readDate(readValue(source, 'from'))
  const to = readDate(readValue(source, 'to'))
  const validRange = from !== undefined && to !== undefined && from <= to
  const refinements: Omit<ListingFilter, 'category' | 'deal' | 'keyword'> = {}
  if (prefecture && prefectureNames.includes(prefecture))
    refinements.prefecture = prefecture
  if (layout && isLayout(layout)) refinements.layout = layout
  const priceMin = readYen(readValue(source, 'priceMin'))
  const priceMax = readYen(readValue(source, 'priceMax'))
  if (priceMin !== undefined) refinements.priceMin = priceMin
  if (priceMax !== undefined) refinements.priceMax = priceMax
  if (sort && isListingSort(sort) && sort !== 'newest') refinements.sort = sort
  if (validRange) {
    refinements.availableFrom = from
    refinements.availableTo = to
  }
  return refinements
}

/** True when a refinement key is present but unusable (for the API's 400). */
export function hasInvalidRefinement(source: ParamSource): boolean {
  const prefecture = readValue(source, 'prefecture')
  const layout = readValue(source, 'layout')
  const sort = readValue(source, 'sort')
  const from = readValue(source, 'from')
  const to = readValue(source, 'to')
  const badPrice = (key: string) => {
    const value = readValue(source, key)
    return value !== undefined && value !== '' && readYen(value) === undefined
  }
  if (prefecture && !prefectureNames.includes(prefecture)) return true
  if (layout && !isLayout(layout)) return true
  if (sort && !isListingSort(sort)) return true
  if (badPrice('priceMin') || badPrice('priceMax')) return true
  if (
    (from || to) &&
    (readDate(from) === undefined || readDate(to) === undefined)
  )
    return true
  if (from && to && from > to) return true
  return false
}

export function parseListingSearchParams(
  source: ParamSource,
): ListingSearchState {
  const category = readValue(source, 'category') ?? ''
  const deal = readValue(source, 'deal') ?? ''
  const keyword = (readValue(source, 'q') ?? '').trim().slice(0, 100)
  const page = Number(readValue(source, 'page') ?? '1')
  return {
    filter: {
      category: isCategory(category) ? category : 'すべて',
      deal: isDealFilter(deal) ? deal : 'all',
      keyword,
      ...readListingRefinements(source),
    },
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  }
}

/** Query-string entries for the refinements, omitting defaults. */
export function refinementEntries(filter: ListingFilter): [string, string][] {
  const entries: [string, string][] = []
  if (filter.prefecture) entries.push(['prefecture', filter.prefecture])
  if (filter.layout) entries.push(['layout', filter.layout])
  if (filter.priceMin !== undefined)
    entries.push(['priceMin', String(filter.priceMin)])
  if (filter.priceMax !== undefined)
    entries.push(['priceMax', String(filter.priceMax)])
  if (filter.sort && filter.sort !== 'newest')
    entries.push(['sort', filter.sort])
  if (filter.availableFrom && filter.availableTo) {
    entries.push(['from', filter.availableFrom])
    entries.push(['to', filter.availableTo])
  }
  return entries
}

export function buildListingSearchParams(
  filter: ListingFilter & { keyword: string },
  page: number,
): string {
  const parameter = new URLSearchParams()
  if (filter.keyword) parameter.set('q', filter.keyword)
  if (filter.category !== 'すべて') parameter.set('category', filter.category)
  if (filter.deal !== 'all') parameter.set('deal', filter.deal)
  for (const [key, value] of refinementEntries(filter))
    parameter.set(key, value)
  if (page > 1) parameter.set('page', String(page))
  return parameter.toString()
}
