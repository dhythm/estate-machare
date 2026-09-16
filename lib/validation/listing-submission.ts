import { categories, type PropertyDetails } from '@/lib/data'
import {
  asRecord,
  finish,
  invalidInput,
  readBoolean,
  readInteger,
  requireChoice,
  requireEmail,
  requireText,
  type FieldErrors,
  type ValidationResult,
} from './shared'

export const listingCategories = categories.filter(
  (category) => category !== 'すべて',
)

export const listingConditions = [
  '未使用に近い',
  '目立った傷なし',
  '使用感あり',
  '要整備',
] as const

export const sellerKinds = [
  '個人オーナー',
  '不動産会社',
  '管理会社',
  '法人',
] as const

const listingDeals = ['sale', 'rent'] as const

export type ListingSubmission = {
  property?: PropertyDetails
  name: string
  category: (typeof listingCategories)[number]
  maker: string
  year: number
  hours: number
  condition: (typeof listingConditions)[number]
  prefecture: string
  city: string
  deals: (typeof listingDeals)[number][]
  salePrice?: number
  rentPerDay?: number
  rentToOwn: boolean
  rentToOwnCreditRate?: number
  rentToOwnCreditCap?: number
  /** Data URLs (jpeg / png / webp), largest side about 1200px. */
  images: string[]
  /** Small data URL of the first image for lists. */
  thumbnail?: string
  summary: string
  sellerName: string
  sellerKind: (typeof sellerKinds)[number]
  contactEmail: string
}

export const maxListingImages = 5
const maxImageLength = 600_000
const maxThumbnailLength = 120_000
const dataUrlPattern = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/

function isImageDataUrl(value: unknown, maxLength: number): value is string {
  return (
    typeof value === 'string' &&
    value.length <= maxLength &&
    dataUrlPattern.test(value)
  )
}

function readImages(
  errors: FieldErrors,
  source: Record<string, unknown>,
): string[] {
  const raw = source.images
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) {
    errors.images = '画像の形式が正しくありません。'
    return []
  }
  if (raw.length > maxListingImages) {
    errors.images = `画像は${maxListingImages}枚までです。`
    return []
  }
  if (!raw.every((item) => isImageDataUrl(item, maxImageLength))) {
    errors.images = '画像の形式またはサイズが正しくありません。'
    return []
  }
  return raw
}

function readThumbnail(
  errors: FieldErrors,
  source: Record<string, unknown>,
): string | undefined {
  const raw = source.thumbnail
  if (raw === undefined || raw === null || raw === '') return undefined
  if (!isImageDataUrl(raw, maxThumbnailLength)) {
    errors.thumbnail = 'サムネイルの形式が正しくありません。'
    return undefined
  }
  return raw
}

function readDeals(
  errors: FieldErrors,
  source: Record<string, unknown>,
): ListingSubmission['deals'] {
  const raw = source.deals
  const values = Array.isArray(raw) ? raw : []
  const deals = listingDeals.filter((deal) => values.includes(deal))
  if (deals.length === 0) errors.deals = '取引方法を1つ以上選択してください。'
  return deals
}

export function validateListingSubmission(
  input: unknown,
): ValidationResult<ListingSubmission> {
  const raw = asRecord(input)
  const isProperty = raw?.areaSqm !== undefined
  const source =
    raw && isProperty
      ? {
          ...raw,
          maker: raw.floorPlan,
          year: raw.category === '土地' ? 2000 : raw.builtYear,
          hours: 0,
          rentToOwn: false,
        }
      : raw
  if (!source) return invalidInput
  const errors: FieldErrors = {}

  const deals = readDeals(errors, source)
  const canSell = deals.includes('sale')
  const canRent = deals.includes('rent')
  const rentToOwn = readBoolean(source, 'rentToOwn')
  if (rentToOwn && deals.length > 0 && !(canSell && canRent))
    errors.rentToOwn = 'レンタル購入には販売とレンタルの両方が必要です。'

  const value: ListingSubmission = {
    name: requireText(errors, source, 'name', '物件名', 80),
    category: requireChoice(
      errors,
      source,
      'category',
      'カテゴリ',
      listingCategories,
    ) as ListingSubmission['category'],
    maker: requireText(errors, source, 'maker', '間取り', 40),
    year: readInteger(errors, source, 'year', '築年', {
      min: 1900,
      max: new Date().getFullYear() + 5,
    }) as number,
    hours: readInteger(errors, source, 'hours', '稼働時間', {
      min: 0,
      max: 100_000,
    }) as number,
    condition: requireChoice(
      errors,
      source,
      'condition',
      '状態',
      listingConditions,
    ) as ListingSubmission['condition'],
    prefecture: requireText(errors, source, 'prefecture', '都道府県', 10),
    city: requireText(errors, source, 'city', '市区町村', 40),
    deals,
    salePrice: readInteger(
      errors,
      source,
      'salePrice',
      '販売価格',
      { min: 1, max: 1_000_000_000 },
      canSell,
    ),
    rentPerDay: readInteger(
      errors,
      source,
      'rentPerDay',
      'レンタル料（1日）',
      { min: 1, max: 10_000_000 },
      canRent && !isProperty,
    ),
    rentToOwn,
    rentToOwnCreditRate: readInteger(
      errors,
      source,
      'rentToOwnCreditRate',
      '充当率',
      { min: 1, max: 100 },
      rentToOwn,
    ),
    rentToOwnCreditCap: readInteger(
      errors,
      source,
      'rentToOwnCreditCap',
      '充当上限',
      { min: 1, max: 1_000_000_000 },
      false,
    ),
    images: readImages(errors, source),
    thumbnail: readThumbnail(errors, source),
    summary: requireText(errors, source, 'summary', '説明', 1000),
    sellerName: requireText(errors, source, 'sellerName', '出品者名', 60),
    sellerKind: requireChoice(
      errors,
      source,
      'sellerKind',
      '出品者の区分',
      sellerKinds,
    ) as ListingSubmission['sellerKind'],
    contactEmail: requireEmail(errors, source, 'contactEmail'),
  }
  if (isProperty) {
    const areaSqm = Number(source.areaSqm)
    if (!Number.isFinite(areaSqm) || areaSqm <= 0 || areaSqm > 1000000)
      errors.areaSqm = '面積を正しく入力してください。'
    value.property = {
      areaSqm,
      floorPlan: requireText(errors, source, 'floorPlan', '間取り・区画', 40),
      builtYear: source.category === '土地' ? undefined : value.year,
      access: requireText(errors, source, 'access', '交通アクセス', 100),
      monthlyRent: readInteger(
        errors,
        source,
        'monthlyRent',
        '月額賃料',
        { min: 1, max: 10000000 },
        canRent,
      ),
    }
    if (!canRent) value.property.monthlyRent = undefined
    value.rentPerDay = undefined
  }
  if (!canSell) value.salePrice = undefined
  if (!canRent) value.rentPerDay = undefined
  if (!rentToOwn) {
    value.rentToOwnCreditRate = undefined
    value.rentToOwnCreditCap = undefined
  }

  if (isProperty && errors.year) {
    errors.builtYear = errors.year
    delete errors.year
  }
  if (isProperty && errors.maker) {
    errors.floorPlan = errors.maker
    delete errors.maker
  }
  return finish(errors, value)
}
