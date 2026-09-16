import { describe, expect, it } from 'vitest'
import { validateListingSubmission } from './listing-submission'

const valid = {
  name: 'シティタワー 世田谷区 3LDK',
  category: 'マンション',
  zoning: '第一種住居地域',
  layout: '3LDK',
  floorArea: 74.2,
  builtYear: 2019,
  nearestStation: '小田急線 経堂駅',
  walkMinutes: 6,
  prefecture: '東京都',
  city: '世田谷区',
  deals: ['sale', 'rent'],
  salePrice: '88,000,000',
  rentPerMonth: '268000',
  depositMonths: '2',
  keyMoneyMonths: '1',
  leaseType: '普通借家',
  purchaseOption: true,
  purchaseOptionCreditRate: '50',
  purchaseOptionCreditCap: '5000000',
  summary: '南向き角住戸。まず借りて住み心地を確かめられます。',
  sellerName: '中村不動産',
  sellerKind: '宅建業者',
  contactEmail: 'seller@example.com',
}

describe('validateListingSubmission', () => {
  it('accepts a complete submission and normalizes numbers', () => {
    const result = validateListingSubmission(valid)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toMatchObject({
      zoning: '第一種住居地域',
      layout: '3LDK',
      floorArea: 74.2,
      builtYear: 2019,
      walkMinutes: 6,
      salePrice: 88_000_000,
      rentPerMonth: 268_000,
      depositMonths: 2,
      keyMoneyMonths: 1,
      leaseType: '普通借家',
      purchaseOption: true,
      purchaseOptionCreditRate: 50,
      purchaseOptionCreditCap: 5_000_000,
      deals: ['sale', 'rent'],
    })
  })

  it('accepts data-url images within limits', () => {
    const png = 'data:image/png;base64,iVBORw0KGgo='
    const ok = validateListingSubmission({
      ...valid,
      images: [png, 'data:image/jpeg;base64,/9j/4AAQ'],
      thumbnail: png,
    })
    expect(ok.ok).toBe(true)
    if (ok.ok) {
      expect(ok.value.images).toHaveLength(2)
      expect(ok.value.thumbnail).toBe(png)
    }
    const none = validateListingSubmission(valid)
    expect(none.ok).toBe(true)
    if (none.ok) {
      expect(none.value.images).toEqual([])
      expect(none.value.thumbnail).toBeUndefined()
    }
    const bad = validateListingSubmission({
      ...valid,
      images: ['https://example.com/a.png'],
    })
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.errors).toHaveProperty('images')
    const tooMany = validateListingSubmission({
      ...valid,
      images: Array.from({ length: 6 }, () => png),
    })
    expect(tooMany.ok).toBe(false)
    const tooBig = validateListingSubmission({
      ...valid,
      images: [`data:image/png;base64,${'A'.repeat(600_001)}`],
    })
    expect(tooBig.ok).toBe(false)
  })

  it('requires the credit rate only for purchase-option and clears it otherwise', () => {
    const missingRate = validateListingSubmission({
      ...valid,
      purchaseOptionCreditRate: '',
    })
    expect(missingRate.ok).toBe(false)
    if (!missingRate.ok)
      expect(missingRate.errors).toHaveProperty('purchaseOptionCreditRate')

    const tooHigh = validateListingSubmission({
      ...valid,
      purchaseOptionCreditRate: '120',
    })
    expect(tooHigh.ok).toBe(false)

    const noCap = validateListingSubmission({
      ...valid,
      purchaseOptionCreditCap: '',
    })
    expect(noCap.ok).toBe(true)
    if (noCap.ok) expect(noCap.value.purchaseOptionCreditCap).toBeUndefined()

    const plain = validateListingSubmission({ ...valid, purchaseOption: false })
    expect(plain.ok).toBe(true)
    if (plain.ok) {
      expect(plain.value.purchaseOptionCreditRate).toBeUndefined()
      expect(plain.value.purchaseOptionCreditCap).toBeUndefined()
    }
  })

  it('requires prices for the selected deals only', () => {
    const rentOnly = validateListingSubmission({
      ...valid,
      deals: ['rent'],
      salePrice: '',
      purchaseOption: false,
    })
    expect(rentOnly.ok).toBe(true)
    if (rentOnly.ok) expect(rentOnly.value.salePrice).toBeUndefined()

    const saleOnly = validateListingSubmission({
      ...valid,
      deals: ['sale'],
      purchaseOption: false,
    })
    expect(saleOnly.ok).toBe(true)
    if (saleOnly.ok) {
      expect(saleOnly.value.rentPerMonth).toBeUndefined()
      expect(saleOnly.value.depositMonths).toBeUndefined()
      expect(saleOnly.value.leaseType).toBeUndefined()
    }

    const missingRent = validateListingSubmission({
      ...valid,
      deals: ['rent'],
      rentPerMonth: '',
    })
    expect(missingRent.ok).toBe(false)
    if (!missingRent.ok)
      expect(missingRent.errors).toHaveProperty('rentPerMonth')
  })

  it('reports every invalid field', () => {
    const result = validateListingSubmission({
      ...valid,
      name: '',
      category: '不明',
      walkMinutes: '90',
      deals: [],
      sellerName: '',
      sellerKind: '団体',
      contactEmail: 'not-an-email',
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(Object.keys(result.errors).sort()).toEqual([
      'category',
      'contactEmail',
      'deals',
      'name',
      'sellerKind',
      'sellerName',
      'walkMinutes',
    ])
  })

  it('asks for no layout or built year on land', () => {
    const land = validateListingSubmission({
      ...valid,
      category: '土地',
      deals: ['sale'],
      purchaseOption: false,
      layout: '',
      builtYear: '',
    })
    expect(land.ok).toBe(true)
    if (land.ok) {
      expect(land.value.layout).toBeUndefined()
      expect(land.value.builtYear).toBeUndefined()
    }
  })

  it('rejects purchase-option without both deals', () => {
    const result = validateListingSubmission({
      ...valid,
      deals: ['sale'],
      purchaseOption: true,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors).toHaveProperty('purchaseOption')
  })

  it('rejects non-object input', () => {
    expect(validateListingSubmission(null).ok).toBe(false)
    expect(validateListingSubmission('text').ok).toBe(false)
  })
})
