/** Purchase-option arithmetic: paid rent credited against the sale price. */

export type PurchaseOptionTerms = {
  rentPerMonth: number
  salePrice: number
  /** Share of paid rent credited against the price, in percent (1-100). */
  creditRate: number
  /** Optional cap on the credited amount, in yen. */
  creditCap?: number
}

export type PurchaseOptionEstimate = {
  months: number
  rentTotal: number
  credit: number
  purchasePrice: number
}

export function calculatePurchaseOption(
  terms: PurchaseOptionTerms,
  months: number,
): PurchaseOptionEstimate {
  const rentTotal = terms.rentPerMonth * months
  const share = Math.floor((rentTotal * terms.creditRate) / 100)
  const capped =
    terms.creditCap === undefined ? share : Math.min(share, terms.creditCap)
  const credit = Math.min(capped, terms.salePrice)
  return { months, rentTotal, credit, purchasePrice: terms.salePrice - credit }
}
