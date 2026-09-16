import type { LeaseType } from './lease'

type DealType = 'sale' | 'rent'

export const moderationStatuses = ['pending', 'approved', 'rejected'] as const

export type ModerationStatus = (typeof moderationStatuses)[number]

/**
 * Seeded rows omit a status and stay public. Create flows set `pending`.
 * A withdrawn row is never public, whatever its review state.
 */
export function isApproved(entity: {
  moderationStatus?: ModerationStatus
  withdrawnAt?: string
}): boolean {
  return (
    entity.withdrawnAt === undefined &&
    (entity.moderationStatus === undefined ||
      entity.moderationStatus === 'approved')
  )
}

export const zonings = [
  '第一種低層住居専用地域',
  '第二種低層住居専用地域',
  '第一種中高層住居専用地域',
  '第一種住居地域',
  '準住居地域',
  '近隣商業地域',
  '商業地域',
  '準工業地域',
] as const

export type Zoning = (typeof zonings)[number]

export const layouts = [
  '1R',
  '1K',
  '1DK',
  '1LDK',
  '2LDK',
  '3LDK',
  '4LDK以上',
] as const

export type Layout = (typeof layouts)[number]

export type Listing = {
  id: string
  name: string
  category: string
  /** Zoning the property sits in; also signals what may be built there. */
  zoning: Zoning
  /** Absent for land, which has no rooms. */
  layout?: Layout
  /** Exclusive floor area in square metres; site area for land. */
  floorArea: number
  /** Year the building was completed; absent for land. */
  builtYear?: number
  nearestStation: string
  /** Walking minutes from the nearest station. */
  walkMinutes: number
  prefecture: string
  city: string
  /** Thumbnail for lists: a small data URL or the category's default picture. */
  image: string
  /** Full-size data URLs, shown on the detail page only. */
  images?: string[]
  summary: string
  deals: DealType[]
  salePrice?: number
  rentPerMonth?: number
  /** Deposit and key money, in months of rent. */
  depositMonths?: number
  keyMoneyMonths?: number
  leaseType?: LeaseType
  /** The tenant may switch to a purchase, crediting the rent already paid. */
  purchaseOption?: boolean
  /** Share of paid rent credited on purchase (percent) and its cap (yen). */
  purchaseOptionCreditRate?: number
  purchaseOptionCreditCap?: number
  seller: {
    name: string
    kind: '個人' | '宅建業者' | '管理会社' | '法人'
    rating: number
    reviews: number
  }
  tags: string[]
  /** Id of the signed-in user who created the row; seeded rows may be unowned. */
  ownerUserId?: string
  createdAt?: string
  updatedAt?: string
  moderationStatus?: ModerationStatus
  moderationNote?: string
  moderatedAt?: string
  /** Set while the owner or an admin has taken the listing off the site. */
  withdrawnAt?: string
}

/** Matching progress of a request: open, negotiating, showing, agreed. */
type PropertyRequestStatus = '募集中' | '調整中' | '紹介中' | '成約'

/** A seeker's public "looking for" post that owners and agents answer. */
export type PropertyRequest = {
  id: string
  title: string
  /** Whether the seeker wants to buy or to rent. */
  deal: DealType
  category: string
  layout?: Layout
  prefecture: string
  city: string
  /** Upper limit, in yen: the sale price, or the monthly rent when renting. */
  budget: number
  /** Desired move-in or handover date. */
  moveInDate: string
  status: PropertyRequestStatus
  ownerUserId?: string
  createdAt?: string
  updatedAt?: string
  moderationStatus?: ModerationStatus
  moderationNote?: string
  moderatedAt?: string
}

export const categories = [
  'すべて',
  'マンション',
  '戸建',
  '土地',
  '事業用',
] as const

export function formatYen(value: number): string {
  return '¥' + value.toLocaleString('ja-JP')
}

export type DealFilter = 'all' | 'sale' | 'rent' | 'purchaseOption'

export const listingSorts = [
  'newest',
  'priceAsc',
  'priceDesc',
  'rentAsc',
] as const

export type ListingSort = (typeof listingSorts)[number]

export const listingSortLabels: Record<ListingSort, string> = {
  newest: '新着順',
  priceAsc: '販売価格が安い順',
  priceDesc: '販売価格が高い順',
  rentAsc: '月額賃料が安い順',
}

export function isListingSort(value: string): value is ListingSort {
  return (listingSorts as readonly string[]).includes(value)
}

export type ListingFilter = {
  category: string
  deal: DealFilter
  keyword?: string
  prefecture?: string
  layout?: Layout
  /** Yen. Applies to the monthly rent when `deal` is `rent`, otherwise to the sale price. */
  priceMin?: number
  priceMax?: number
  sort?: ListingSort
  /** Both dates (YYYY-MM-DD) narrow to lettable listings free over that span. */
  availableFrom?: string
  availableTo?: string
}

export type PageRequest = {
  page: number
  pageSize: number
}

export const threadStatuses = [
  'new',
  'in_progress',
  'agreed',
  'declined',
] as const

/** Progress of an inquiry or application thread; unset means `new`. */
export type ThreadStatus = (typeof threadStatuses)[number]

const threadKinds = [
  'listingInquiry',
  'requestProposal',
  'requestInquiry',
] as const

/** Submission kinds that open a conversation between sender and target owner. */
export type ThreadKind = (typeof threadKinds)[number]

export const threadKindLabels: Record<ThreadKind, string> = {
  listingInquiry: '問い合わせ',
  requestProposal: '提案',
  requestInquiry: '質問',
}

export function isThreadKind(kind: string): kind is ThreadKind {
  return (threadKinds as readonly string[]).includes(kind)
}

export const orderStatuses = [
  'requested',
  'accepted',
  'delivered',
  'completed',
  'cancelled',
] as const

export type OrderStatus = (typeof orderStatuses)[number]

export const orderStatusLabels: Record<OrderStatus, string> = {
  requested: '申込中',
  accepted: '承諾',
  delivered: '引き渡し済み',
  completed: '完了',
  cancelled: 'キャンセル',
}

export const threadStatusLabels: Record<ThreadStatus, string> = {
  new: '未対応',
  in_progress: '対応中',
  agreed: '成約',
  declined: '見送り',
}

export type ModerationQueueFilter = ModerationStatus | 'all'

export type ModerationQueue = {
  listings: Listing[]
  propertyRequests: PropertyRequest[]
}

export type ListingPage = {
  items: Listing[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

const dealFilters = ['all', 'sale', 'rent', 'purchaseOption'] as const

export const listingPageSize = 12

export const featuredListingCount = 6

export function isDealFilter(value: string): value is DealFilter {
  return (dealFilters as readonly string[]).includes(value)
}

export function isCategory(
  value: string,
): value is (typeof categories)[number] {
  return (categories as readonly string[]).includes(value)
}

export function isLayout(value: string): value is Layout {
  return (layouts as readonly string[]).includes(value)
}

/** Area in square metres, shown with one decimal only when it has one. */
export function formatArea(value: number): string {
  return `${Number(value.toFixed(2))}㎡`
}

/** Age of the building in whole years; "新築" in its first year. */
export function formatBuildingAge(builtYear: number, now: Date): string {
  const age = now.getFullYear() - builtYear
  return age <= 0 ? '新築' : `築${age}年`
}

export type ListingMode = 'buy' | 'rent' | 'purchaseOption'

export type ListingModeConfig = {
  id: ListingMode
  title: string
  price: string
  desc: string
  cta: string
  note?: string
}
