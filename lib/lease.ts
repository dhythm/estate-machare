/** Lease arithmetic shared by the listing page, forms, and services. */

export type DateRange = { startDate: string; endDate: string }

/**
 * Whole calendar months a lease covers. A term running to the day before its
 * anniversary is a whole month, so 4/1–3/31 is 12; a part month rounds up.
 * Returns 0 when the range is reversed.
 */
export function countLeaseMonths(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  const months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth()) +
    (end.getUTCDate() >= start.getUTCDate() ? 1 : 0)
  return months > 0 ? months : 0
}

/** Inclusive ranges overlap when neither ends before the other starts. */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate
}

export const leaseTypes = ['普通借家', '定期借家'] as const

export type LeaseType = (typeof leaseTypes)[number]

export const leaseStatuses = [
  'requested',
  'active',
  'converted',
  'completed',
  'cancelled',
] as const

export type LeaseStatus = (typeof leaseStatuses)[number]

export const leaseStatusLabels: Record<LeaseStatus, string> = {
  requested: '申込中',
  active: '入居中',
  converted: '購入へ切替',
  completed: '契約終了',
  cancelled: 'キャンセル',
}

/** Brokerage fee charged on move-in, in months of rent. */
export const brokerageFeeMonths = 1

export type InitialCostTerms = {
  rentPerMonth: number
  depositMonths?: number
  keyMoneyMonths?: number
}

export type InitialCost = {
  /** First month's rent, paid up front. */
  rent: number
  deposit: number
  keyMoney: number
  brokerageFee: number
  total: number
}

/** Move-in cost: first month's rent plus deposit, key money and brokerage. */
export function calculateInitialCost(terms: InitialCostTerms): InitialCost {
  const rent = terms.rentPerMonth
  const deposit = rent * (terms.depositMonths ?? 0)
  const keyMoney = rent * (terms.keyMoneyMonths ?? 0)
  const brokerageFee = rent * brokerageFeeMonths
  return {
    rent,
    deposit,
    keyMoney,
    brokerageFee,
    total: rent + deposit + keyMoney + brokerageFee,
  }
}

/** Months of deposit and key money typically asked for, by category. */
export const categoryInitialCostMonths: Record<
  string,
  { depositMonths: number; keyMoneyMonths: number }
> = {
  マンション: { depositMonths: 1, keyMoneyMonths: 1 },
  戸建: { depositMonths: 2, keyMoneyMonths: 1 },
  土地: { depositMonths: 3, keyMoneyMonths: 0 },
  事業用: { depositMonths: 6, keyMoneyMonths: 2 },
}

export const defaultInitialCostMonths = {
  depositMonths: 1,
  keyMoneyMonths: 1,
}

export function initialCostMonthsFor(category: string): {
  depositMonths: number
  keyMoneyMonths: number
} {
  return categoryInitialCostMonths[category] ?? defaultInitialCostMonths
}
