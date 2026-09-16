import { categories, layouts, zonings, type Layout, type Zoning } from '@/lib/data'
import { leaseTypes, type LeaseType } from '@/lib/lease'
import {
  asRecord,
  finish,
  invalidInput,
  readBoolean,
  readDecimal,
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

/** Categories without rooms or a completion year: a layout and a built year
 * are neither asked for nor kept. */
export const landCategories = ['土地'] as const

export function hasBuilding(category: string): boolean {
  return !(landCategories as readonly string[]).includes(category)
}

export const sellerKinds = ['個人', '宅建業者', '管理会社', '法人'] as const

export const maxDepositMonths = 12

const listingDeals = ['sale', 'rent'] as const

export type ListingSubmission = {
  name: string
  category: (typeof listingCategories)[number]
  zoning: Zoning
  layout?: Layout
  floorArea: number
  builtYear?: number
  nearestStation: string
  walkMinutes: number
  prefecture: string
  city: string
  deals: (typeof listingDeals)[number][]
  salePrice?: number
  rentPerMonth?: number
  depositMonths?: number
  keyMoneyMonths?: number
  leaseType?: LeaseType
  purchaseOption: boolean
  purchaseOptionCreditRate?: number
  purchaseOptionCreditCap?: number
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
  const source = asRecord(input)
  if (!source) return invalidInput
  const errors: FieldErrors = {}

  const deals = readDeals(errors, source)
  const canSell = deals.includes('sale')
  const canRent = deals.includes('rent')
  const purchaseOption = readBoolean(source, 'purchaseOption')
  if (purchaseOption && deals.length > 0 && !(canSell && canRent))
    errors.purchaseOption = '買取オプションには売買と賃貸の両方が必要です。'
  const category = requireChoice(
    errors,
    source,
    'category',
    'カテゴリ',
    listingCategories,
  ) as ListingSubmission['category']
  const withBuilding = category === undefined || hasBuilding(category)

  const value: ListingSubmission = {
    name: requireText(errors, source, 'name', '物件名', 80),
    category,
    zoning: requireChoice(
      errors,
      source,
      'zoning',
      '用途地域',
      zonings,
    ) as Zoning,
    layout: withBuilding
      ? (requireChoice(errors, source, 'layout', '間取り', layouts) as Layout)
      : undefined,
    floorArea: readDecimal(errors, source, 'floorArea', '専有面積', {
      min: 1,
      max: 100_000,
    }) as number,
    builtYear: readInteger(
      errors,
      source,
      'builtYear',
      '築年',
      { min: 1900, max: 2100 },
      withBuilding,
    ),
    nearestStation: requireText(
      errors,
      source,
      'nearestStation',
      '最寄駅',
      60,
    ),
    walkMinutes: readInteger(errors, source, 'walkMinutes', '駅徒歩分', {
      min: 0,
      max: 60,
    }) as number,
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
    rentPerMonth: readInteger(
      errors,
      source,
      'rentPerMonth',
      '月額賃料',
      { min: 1, max: 10_000_000 },
      canRent,
    ),
    depositMonths: readInteger(
      errors,
      source,
      'depositMonths',
      '敷金（月数）',
      { min: 0, max: maxDepositMonths },
      canRent,
    ),
    keyMoneyMonths: readInteger(
      errors,
      source,
      'keyMoneyMonths',
      '礼金（月数）',
      { min: 0, max: maxDepositMonths },
      canRent,
    ),
    leaseType: canRent
      ? (requireChoice(
          errors,
          source,
          'leaseType',
          '借家種別',
          leaseTypes,
        ) as LeaseType)
      : undefined,
    purchaseOption,
    purchaseOptionCreditRate: readInteger(
      errors,
      source,
      'purchaseOptionCreditRate',
      '充当率',
      { min: 1, max: 100 },
      purchaseOption,
    ),
    purchaseOptionCreditCap: readInteger(
      errors,
      source,
      'purchaseOptionCreditCap',
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
  if (!canSell) value.salePrice = undefined
  if (!canRent) {
    value.rentPerMonth = undefined
    value.depositMonths = undefined
    value.keyMoneyMonths = undefined
    value.leaseType = undefined
  }
  if (!withBuilding) {
    value.layout = undefined
    value.builtYear = undefined
  }
  if (!purchaseOption) {
    value.purchaseOptionCreditRate = undefined
    value.purchaseOptionCreditCap = undefined
  }

  return finish(errors, value)
}
