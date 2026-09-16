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

export type PropertyDetails = {
  areaSqm: number
  floorPlan: string
  builtYear?: number
  monthlyRent?: number
  access: string
}

export type Listing = {
  property?: PropertyDetails
  id: string
  name: string
  category: string
  maker: string
  year: number
  hours: number
  condition: '未使用に近い' | '目立った傷なし' | '使用感あり' | '要整備'
  prefecture: string
  city: string
  /** Thumbnail for lists: a small data URL or the category's default picture. */
  image: string
  /** Full-size data URLs, shown on the detail page only. */
  images?: string[]
  summary: string
  deals: DealType[]
  salePrice?: number
  rentPerDay?: number
  rentToOwn?: boolean
  /** Share of paid rent credited on purchase (percent) and its cap (yen). */
  rentToOwnCreditRate?: number
  rentToOwnCreditCap?: number
  seller: {
    name: string
    kind:
      | '個人オーナー'
      | '不動産会社'
      | '管理会社'
      | '法人'
      | '個人農家'
      | '農業法人'
      | '販売店'
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

export type TransportJob = {
  id: string
  item: string
  from: string
  to: string
  distanceKm: number
  weight: string
  desiredDate: string
  reward: number
  status: '募集中' | '調整中' | '運搬中' | '完了'
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
  '戸建て',
  '土地',
  'オフィス',
  '店舗',
] as const

export function formatYen(value: number): string {
  return '¥' + value.toLocaleString('ja-JP')
}

export type DealFilter = 'all' | 'sale' | 'rent' | 'rentToOwn'

export const listingSorts = [
  'newest',
  'priceAsc',
  'priceDesc',
  'rentAsc',
] as const

export type ListingSort = (typeof listingSorts)[number]

export const listingSortLabels: Record<ListingSort, string> = {
  newest: '新着順',
  priceAsc: '売買価格が安い順',
  priceDesc: '売買価格が高い順',
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
  /** Yen. Applies to the daily rate when `deal` is `rent`, otherwise to the sale price. */
  priceMin?: number
  priceMax?: number
  sort?: ListingSort
  /** Both dates (YYYY-MM-DD) narrow to rentable listings free over that span. */
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

const threadKinds = ['listingInquiry'] as const

/** Submission kinds that open a conversation between sender and target owner. */
export type ThreadKind = (typeof threadKinds)[number]

export const threadKindLabels: Record<ThreadKind, string> = {
  listingInquiry: '問い合わせ',
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
}

export type ListingPage = {
  items: Listing[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

const dealFilters = ['all', 'sale', 'rent', 'rentToOwn'] as const

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

export type ListingMode = 'buy' | 'rent' | 'rentToOwn'

export type ListingModeConfig = {
  id: ListingMode
  title: string
  price: string
  desc: string
  cta: string
  note?: string
}
