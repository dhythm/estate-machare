import { describe, expect, it } from 'vitest'
import { generateListings } from './generated-listings'
import { buildModes } from './listing-detail'

describe('property listings', () => {
  it('provides real estate specifications and monthly prices independently of daily rentals', () => {
    const listings = generateListings(10, 1)
    expect(listings.every((listing) => listing.property!.areaSqm > 0)).toBe(
      true,
    )
    expect(
      listings.every((listing) => listing.image.startsWith('/properties/')),
    ).toBe(true)
    const rental = listings.find((listing) => listing.deals.includes('rent'))!
    expect(rental.property?.monthlyRent).toBeGreaterThan(0)
    expect(rental.rentPerDay).toBeUndefined()
    expect(
      buildModes(rental).find((mode) => mode.id === 'rent')?.price,
    ).toContain('/月')
  })
})
