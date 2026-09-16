import { describe, expect, it } from 'vitest'
import { calculatePurchaseOption } from './purchase-option'

describe('calculatePurchaseOption', () => {
  const terms = {
    rentPerMonth: 180_000,
    salePrice: 48_000_000,
    creditRate: 50,
  }

  it('credits a share of the paid rent against the price', () => {
    expect(calculatePurchaseOption(terms, 12)).toEqual({
      months: 12,
      rentTotal: 2_160_000,
      credit: 1_080_000,
      purchasePrice: 46_920_000,
    })
  })

  it('caps the credit', () => {
    const capped = calculatePurchaseOption({ ...terms, creditCap: 500_000 }, 12)
    expect(capped.credit).toBe(500_000)
    expect(capped.purchasePrice).toBe(47_500_000)
  })

  it('never credits more than the price and rounds down to yen', () => {
    expect(
      calculatePurchaseOption(
        { rentPerMonth: 3, salePrice: 10, creditRate: 33 },
        1,
      ).credit,
    ).toBe(0)
    expect(
      calculatePurchaseOption(
        { rentPerMonth: 1_000_000, salePrice: 10, creditRate: 100 },
        1,
      ),
    ).toEqual({
      months: 1,
      rentTotal: 1_000_000,
      credit: 10,
      purchasePrice: 0,
    })
  })
})
