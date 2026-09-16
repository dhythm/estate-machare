import { describe, expect, it } from 'vitest'
import { validateListingSubmission } from './listing-submission'

const valid = {
  name: 'クボタ マンション 30馬力',
  category: 'マンション',
  maker: 'クボタ',
  year: '2018',
  hours: '500',
  condition: '目立った傷なし',
  prefecture: '新潟県',
  city: '長岡市',
  deals: ['sale', 'rent'],
  salePrice: '1500000',
  rentPerDay: '12000',
  rentToOwn: true,
  rentToOwnCreditRate: '50',
  rentToOwnCreditCap: '300000',
  summary: 'キャビン付き。まず借りて試せます。',
  sellerName: '中村ファーム',
  sellerKind: '不動産会社',
  contactEmail: 'seller@example.com',
}

describe('validateListingSubmission', () => {
  it('accepts a complete submission and normalizes numbers', () => {
    const result = validateListingSubmission(valid)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toMatchObject({
      year: 2018,
      hours: 500,
      salePrice: 1_500_000,
      rentPerDay: 12_000,
      rentToOwn: true,
      rentToOwnCreditRate: 50,
      rentToOwnCreditCap: 300_000,
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

  it('requires the credit rate only for rent-to-own and clears it otherwise', () => {
    const missingRate = validateListingSubmission({
      ...valid,
      rentToOwnCreditRate: '',
    })
    expect(missingRate.ok).toBe(false)
    if (!missingRate.ok)
      expect(missingRate.errors).toHaveProperty('rentToOwnCreditRate')

    const tooHigh = validateListingSubmission({
      ...valid,
      rentToOwnCreditRate: '120',
    })
    expect(tooHigh.ok).toBe(false)

    const noCap = validateListingSubmission({
      ...valid,
      rentToOwnCreditCap: '',
    })
    expect(noCap.ok).toBe(true)
    if (noCap.ok) expect(noCap.value.rentToOwnCreditCap).toBeUndefined()

    const plain = validateListingSubmission({ ...valid, rentToOwn: false })
    expect(plain.ok).toBe(true)
    if (plain.ok) {
      expect(plain.value.rentToOwnCreditRate).toBeUndefined()
      expect(plain.value.rentToOwnCreditCap).toBeUndefined()
    }
  })

  it('requires prices for the selected deals only', () => {
    const rentOnly = validateListingSubmission({
      ...valid,
      deals: ['rent'],
      salePrice: '',
      rentToOwn: false,
    })
    expect(rentOnly.ok).toBe(true)
    if (rentOnly.ok) expect(rentOnly.value.salePrice).toBeUndefined()

    const missingRent = validateListingSubmission({
      ...valid,
      deals: ['rent'],
      rentPerDay: '',
    })
    expect(missingRent.ok).toBe(false)
    if (!missingRent.ok) expect(missingRent.errors).toHaveProperty('rentPerDay')
  })

  it('reports every invalid field', () => {
    const result = validateListingSubmission({
      ...valid,
      name: '',
      category: '不明',
      year: '1800',
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
      'year',
    ])
  })

  it('rejects rent-to-own without both deals', () => {
    const result = validateListingSubmission({
      ...valid,
      deals: ['sale'],
      rentToOwn: true,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors).toHaveProperty('rentToOwn')
  })

  it('rejects non-object input', () => {
    expect(validateListingSubmission(null).ok).toBe(false)
    expect(validateListingSubmission('text').ok).toBe(false)
  })
})

describe('property submission', () => {
  it('keeps monthly rent separate from legacy daily pricing and supports decimal area', () => {
    const result = validateListingSubmission({
      ...valid,
      areaSqm: '68.5',
      builtYear: '2019',
      floorPlan: '2LDK',
      access: '駅 徒歩8分',
      monthlyRent: '168000',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.property).toEqual({
      areaSqm: 68.5,
      builtYear: 2019,
      floorPlan: '2LDK',
      access: '駅 徒歩8分',
      monthlyRent: 168000,
    })
    expect(result.value.rentPerDay).toBeUndefined()
    expect(result.value.rentToOwn).toBe(false)
  })
  it('rejects missing monthly rent and nonpositive area', () => {
    const result = validateListingSubmission({
      ...valid,
      areaSqm: '0',
      builtYear: '2019',
      floorPlan: '2LDK',
      access: '駅 徒歩8分',
      monthlyRent: '',
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toHaveProperty('areaSqm')
    expect(result.errors).toHaveProperty('monthlyRent')
  })
})

it('does not require a construction year for land and returns building errors under the visible field', () => {
  const property = {
    ...valid,
    areaSqm: '165',
    floorPlan: '土地',
    access: '駅 徒歩15分',
    monthlyRent: '95000',
    builtYear: '',
  }
  const land = validateListingSubmission({ ...property, category: '土地' })
  expect(land.ok).toBe(true)
  if (land.ok) expect(land.value.property?.builtYear).toBeUndefined()
  const building = validateListingSubmission({
    ...property,
    category: '戸建て',
  })
  expect(building.ok).toBe(false)
  if (!building.ok) {
    expect(building.errors).toHaveProperty('builtYear')
    expect(building.errors).not.toHaveProperty('year')
  }
})
