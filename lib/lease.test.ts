import { describe, expect, it } from 'vitest'
import {
  calculateInitialCost,
  countLeaseMonths,
  initialCostMonthsFor,
  leaseStatusLabels,
  rangesOverlap,
} from './lease'

describe('countLeaseMonths', () => {
  it('counts a term running to the day before its anniversary', () => {
    expect(countLeaseMonths('2026-04-01', '2027-03-31')).toBe(12)
    expect(countLeaseMonths('2026-04-15', '2026-05-14')).toBe(1)
    expect(countLeaseMonths('2026-04-01', '2028-03-31')).toBe(24)
  })

  it('rounds a part month up and never returns less than one month', () => {
    expect(countLeaseMonths('2026-04-01', '2026-04-01')).toBe(1)
    expect(countLeaseMonths('2026-04-01', '2026-04-30')).toBe(1)
    expect(countLeaseMonths('2026-04-15', '2026-05-20')).toBe(2)
  })

  it('rejects reversed and unparsable ranges', () => {
    expect(countLeaseMonths('2026-05-01', '2026-04-01')).toBe(0)
    expect(countLeaseMonths('2026-04-01', 'not-a-date')).toBe(0)
  })
})

describe('rangesOverlap', () => {
  it('treats touching days as overlapping (inclusive ranges)', () => {
    const a = { startDate: '2026-04-01', endDate: '2027-03-31' }
    expect(
      rangesOverlap(a, { startDate: '2027-03-31', endDate: '2027-09-30' }),
    ).toBe(true)
    expect(
      rangesOverlap(a, { startDate: '2027-04-01', endDate: '2027-09-30' }),
    ).toBe(false)
    expect(
      rangesOverlap(a, { startDate: '2025-10-01', endDate: '2026-04-01' }),
    ).toBe(true)
    expect(
      rangesOverlap(a, { startDate: '2025-10-01', endDate: '2026-03-31' }),
    ).toBe(false)
  })
})

describe('calculateInitialCost', () => {
  it('adds the first month, deposit, key money and brokerage fee', () => {
    expect(
      calculateInitialCost({
        rentPerMonth: 120_000,
        depositMonths: 2,
        keyMoneyMonths: 1,
      }),
    ).toEqual({
      rent: 120_000,
      deposit: 240_000,
      keyMoney: 120_000,
      brokerageFee: 120_000,
      total: 600_000,
    })
  })

  it('treats missing deposit and key money as zero months', () => {
    expect(calculateInitialCost({ rentPerMonth: 90_000 })).toEqual({
      rent: 90_000,
      deposit: 0,
      keyMoney: 0,
      brokerageFee: 90_000,
      total: 180_000,
    })
  })
})

describe('initialCostMonthsFor', () => {
  it('knows the months asked for by category', () => {
    expect(initialCostMonthsFor('事業用')).toEqual({
      depositMonths: 6,
      keyMoneyMonths: 2,
    })
  })

  it('falls back for an unknown category', () => {
    expect(initialCostMonthsFor('別荘')).toEqual({
      depositMonths: 1,
      keyMoneyMonths: 1,
    })
  })
})

describe('leaseStatusLabels', () => {
  it('has a label for every status', () => {
    expect(leaseStatusLabels.requested).toBe('申込中')
    expect(leaseStatusLabels.active).toBe('入居中')
    expect(leaseStatusLabels.converted).toBe('購入へ切替')
  })
})
